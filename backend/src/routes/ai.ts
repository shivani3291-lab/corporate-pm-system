import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { aiServiceBase } from '../lib/aiServiceUrl'
import {
  analyzeProjectHealthForProject,
  persistProjectHealthResult,
} from '../lib/projectHealthAnalysis'
import {
  getProjectDelayMetrics,
  heuristicDelayRisk,
  type DelayMetrics,
} from '../lib/projectDelayMetrics'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

async function fetchPredictDelayFromAi(metrics: DelayMetrics): Promise<{
  riskScore: number
  riskLevel: string
  reason: string
} | null> {
  const r = await fetch(`${aiServiceBase()}/predict-delay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics),
    signal: AbortSignal.timeout(30_000),
  })
  if (!r.ok) return null
  return (await r.json()) as {
    riskScore: number
    riskLevel: string
    reason: string
  }
}

type SearchHit = {
  title: string
  score: number
  id: number | null
  kind: string | null
}

type CorpusItem = { id: number; kind: 'document' | 'task'; title: string }

/** Substring match, or every query word appears in the title (order-free). */
function titleMatchesQuery(title: string, query: string): boolean {
  const t = title.toLowerCase()
  const q = query.trim().toLowerCase()
  if (!q) return false
  if (t.includes(q)) return true
  const words = q.split(/\s+/).filter((w) => w.length > 0)
  if (words.length <= 1) return false
  return words.every((w) => t.includes(w))
}

function keywordHits(query: string, items: CorpusItem[], limit: number): SearchHit[] {
  const out: SearchHit[] = []
  const seen = new Set<string>()
  for (const it of items) {
    if (!titleMatchesQuery(it.title, query)) continue
    const key = `${it.kind}:${it.id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      title: it.title,
      score: 1,
      id: it.id,
      kind: it.kind,
    })
    if (out.length >= limit) break
  }
  return out
}

function mergeHits(keyword: SearchHit[], semantic: SearchHit[], limit: number): SearchHit[] {
  const seen = new Set<string>()
  const out: SearchHit[] = []

  const push = (h: SearchHit) => {
    if (h.id == null || h.kind == null) return
    const key = `${h.kind}:${h.id}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(h)
  }

  for (const h of keyword) {
    if (out.length >= limit) return out
    push(h)
  }
  for (const h of semantic) {
    if (out.length >= limit) return out
    push(h)
  }
  return out
}

router.post('/search', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { query, limit: rawLimit } = req.body as { query?: string; limit?: number }
    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'query is required' })
      return
    }

    const limit = Math.min(Math.max(Number(rawLimit) || 8, 1), 50)
    const q = query.trim()

    const [documents, tasks] = await Promise.all([
      prisma.document.findMany({
        select: { DocumentID: true, DocumentTitle: true },
      }),
      prisma.task.findMany({
        select: { TaskID: true, TaskName: true },
      }),
    ])

    const items: CorpusItem[] = [
      ...documents
        .filter((d) => (d.DocumentTitle || '').trim())
        .map((d) => ({
          id: d.DocumentID,
          kind: 'document' as const,
          title: d.DocumentTitle as string,
        })),
      ...tasks
        .filter((t) => (t.TaskName || '').trim())
        .map((t) => ({
          id: t.TaskID,
          kind: 'task' as const,
          title: t.TaskName as string,
        })),
    ]

    const kw = keywordHits(q, items, limit)

    let semantic: SearchHit[] = []
    const url = `${aiServiceBase()}/search`

    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          limit,
          items,
        }),
        signal: AbortSignal.timeout(60_000),
      })
      if (r.ok) {
        const data = (await r.json()) as { results: SearchHit[] }
        semantic = data.results || []
      }
    } catch {
      // AI offline, slow model load, or timeout — keyword matches still return
    }

    res.json({ results: mergeHits(kw, semantic, limit) })
  } catch {
    res.status(500).json({ error: 'Search failed' })
  }
})

router.post('/classify-document', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body as { title?: string }
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'title is required' })
      return
    }

    const url = `${aiServiceBase()}/classify-document`

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() }),
    })

    if (!r.ok) {
      const detail = await r.text()
      res.status(502).json({ error: 'AI service error', detail })
      return
    }

    const data = (await r.json()) as { category: string; confidence: number }
    res.json(data)
  } catch {
    res.status(503).json({ error: 'AI service unavailable' })
  }
})

router.post('/predict-delay', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.body as { projectId?: number }
    if (projectId == null || Number.isNaN(Number(projectId))) {
      res.status(400).json({ error: 'projectId is required' })
      return
    }
    const id = Number(projectId)
    const metrics = await getProjectDelayMetrics(id)
    if (!metrics) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    try {
      const ai = await fetchPredictDelayFromAi(metrics)
      if (ai) {
        res.json({ projectId: id, ...ai })
        return
      }
    } catch {
      // fall through to heuristic
    }
    res.json({ projectId: id, ...heuristicDelayRisk(metrics) })
  } catch {
    res.status(500).json({ error: 'Delay prediction failed' })
  }
})

router.post('/predict-delay-batch', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectIds } = req.body as { projectIds?: unknown }
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      res.status(400).json({ error: 'projectIds is required' })
      return
    }
    const ids = [
      ...new Set(
        projectIds
          .map((x) => Number(x))
          .filter((n) => !Number.isNaN(n)),
      ),
    ].slice(0, 100)

    const results: Array<{
      projectId: number
      riskScore: number
      riskLevel: string
      reason: string
    }> = []

    for (const projectId of ids) {
      const metrics = await getProjectDelayMetrics(projectId)
      if (!metrics) continue
      try {
        const ai = await fetchPredictDelayFromAi(metrics)
        if (ai) {
          results.push({ projectId, ...ai })
          continue
        }
      } catch {
        // heuristic below
      }
      results.push({ projectId, ...heuristicDelayRisk(metrics) })
    }

    res.json({ results })
  } catch {
    res.status(500).json({ error: 'Batch delay prediction failed' })
  }
})

router.post('/analyze-project-health', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, persist } = req.body as {
      projectId?: number
      persist?: boolean
    }

    if (projectId == null || Number.isNaN(Number(projectId))) {
      res.status(400).json({ error: 'projectId is required' })
      return
    }
    const id = Number(projectId)
    const result = await analyzeProjectHealthForProject(id)
    if (!result) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    if (persist) {
      await persistProjectHealthResult(id, result)
    }
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Health analysis failed' })
  }
})

export default router
