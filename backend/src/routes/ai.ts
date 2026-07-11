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

// ── Classify Feedback (learn from user corrections) ──────────────
router.post('/classify-feedback', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category } = req.body as { title?: string; category?: string }
    if (!title || !category) {
      res.status(400).json({ error: 'title and category are required' })
      return
    }

    const url = `${aiServiceBase()}/classify-feedback`
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), category: category.trim() }),
    })

    if (!r.ok) {
      res.status(502).json({ error: 'AI service error' })
      return
    }

    const data = await r.json()
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

router.post('/auto-prioritize', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, projectRiskScore } = req.body as {
      projectId?: number
      projectRiskScore?: number
    }

    if (projectId == null || Number.isNaN(Number(projectId))) {
      res.status(400).json({ error: 'projectId is required' })
      return
    }

    const id = Number(projectId)
    const tasks = await prisma.task.findMany({
      where: { ProjectID: id },
    })

    if (tasks.length === 0) {
      res.json({ projectId: id, recommendations: [] })
      return
    }

    const taskPayloads = tasks.map((t) => ({
      taskId: t.TaskID,
      dueDate: t.DueDate ? t.DueDate.toISOString() : null,
      priority: t.Priority,
      status: t.Status,
      isMilestone: false,
      dependencyCount: 0,
      hoursEstimated: 8,
    }))

    let risk = Number(projectRiskScore)
    if (Number.isNaN(risk) || risk < 0 || risk > 100) {
      const metrics = await getProjectDelayMetrics(id)
      if (metrics) {
        try {
          const ai = await fetchPredictDelayFromAi(metrics)
          risk = ai?.riskScore ?? 50
        } catch {
          risk = heuristicDelayRisk(metrics).riskScore
        }
      } else {
        risk = 50
      }
    }

    try {
      const url = `${aiServiceBase()}/auto-prioritize`
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, projectRiskScore: risk, tasks: taskPayloads }),
        signal: AbortSignal.timeout(30_000),
      })
      if (r.ok) {
        const data = (await r.json()) as { projectId: number; recommendations: any[] }
        res.json(data)
        return
      }
    } catch {
      // fallback below
    }

    // Heuristic fallback if AI service is unavailable
    const now = new Date()
    const recommendations = tasks
      .filter((t) => t.Status !== 'Completed')
      .map((t) => {
        const days = t.DueDate ? Math.ceil((t.DueDate.getTime() - now.getTime()) / 86400000) : 90
        let rec = 'Medium'
        if (days < 0 || risk > 75) rec = 'High'
        else if (days < 21 || risk > 50) rec = 'Medium'
        else rec = 'Low'
        return {
          taskId: t.TaskID,
          currentPriority: t.Priority || 'Medium',
          recommendedPriority: rec,
          confidence: 0.7,
          reason: days < 0 ? `Overdue by ${Math.abs(days)} day(s).` : `Due in ${days} day(s).`,
        }
      })

    res.json({ projectId: id, recommendations })
  } catch {
    res.status(500).json({ error: 'Auto-prioritization failed' })
  }
})

// ── Tiny RAG chat + observability ─────────────────────────────

type RagCorpusItem = { id: number; kind: 'project' | 'task' | 'document' | 'alert'; title: string; text: string }

/** Builds the RAG retrieval corpus from what's actually stored: project/task
 * descriptions, document titles (documents have no persisted body text —
 * PDF content is only parsed transiently at upload-time for classification),
 * and predictive alerts. Note: retrieval only surfaces the top-k most similar
 * chunks, so "how many alerts" style count questions stay unreliable even
 * with alerts included — RAG isn't a substitute for a real aggregate query. */
async function buildRagCorpus(): Promise<RagCorpusItem[]> {
  const [projects, tasks, documents, alerts] = await Promise.all([
    prisma.project.findMany({
      select: { ProjectID: true, ProjectName: true, Description: true, ClientName: true, Status: true },
    }),
    prisma.task.findMany({
      select: { TaskID: true, TaskName: true, Description: true, Status: true, Priority: true },
    }),
    prisma.document.findMany({
      select: { DocumentID: true, DocumentTitle: true, category: { select: { CategoryName: true } } },
    }),
    prisma.projectAlert.findMany({
      select: {
        AlertID: true, AlertType: true, Severity: true, Message: true,
        project: { select: { ProjectName: true } },
      },
    }),
  ])

  const corpus: RagCorpusItem[] = []

  for (const p of projects) {
    corpus.push({
      id: p.ProjectID,
      kind: 'project',
      title: p.ProjectName,
      text: [
        p.ProjectName,
        p.Description,
        p.ClientName && `Client: ${p.ClientName}.`,
        p.Status && `Status: ${p.Status}.`,
      ].filter(Boolean).join(' '),
    })
  }
  for (const t of tasks) {
    corpus.push({
      id: t.TaskID,
      kind: 'task',
      title: t.TaskName,
      text: [
        t.TaskName,
        t.Description,
        t.Status && `Status: ${t.Status}.`,
        t.Priority && `Priority: ${t.Priority}.`,
      ].filter(Boolean).join(' '),
    })
  }
  for (const d of documents) {
    corpus.push({
      id: d.DocumentID,
      kind: 'document',
      title: d.DocumentTitle,
      text: [d.DocumentTitle, d.category?.CategoryName && `Category: ${d.category.CategoryName}.`]
        .filter(Boolean).join(' '),
    })
  }
  for (const a of alerts) {
    const title = `${a.AlertType} alert (${a.Severity})`
    corpus.push({
      id: a.AlertID,
      kind: 'alert',
      title,
      text: [
        title,
        a.project?.ProjectName && `Project: ${a.project.ProjectName}.`,
        a.Message,
      ].filter(Boolean).join(' '),
    })
  }
  return corpus
}

type RagChatAiResponse = {
  answer: string
  retrieved_chunks: Array<{ id: number | null; kind: string | null; title: string; text: string; score: number }>
  prompt: string
  prompt_version: string
  model: string
  tokens_in: number
  tokens_out: number
  cost_usd: number
  retrieval_ms: number
  llm_ms: number
  total_ms: number
  groundedness: string
  retrieval_quality: string
  hallucination_risk: boolean
  answer_relevance: string
}

router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { question, topK } = req.body as { question?: string; topK?: number }
    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'question is required' })
      return
    }

    const corpus = await buildRagCorpus()
    if (corpus.length === 0) {
      res.status(400).json({ error: 'No projects, tasks, or documents to answer from yet' })
      return
    }

    let data: RagChatAiResponse
    try {
      const r = await fetch(`${aiServiceBase()}/rag/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          corpus,
          top_k: Math.min(Math.max(Number(topK) || 5, 1), 20),
        }),
        signal: AbortSignal.timeout(60_000),
      })

      if (!r.ok) {
        const detail = await r.text()
        res.status(502).json({ error: 'AI service error', detail })
        return
      }
      data = (await r.json()) as RagChatAiResponse
    } catch {
      res.status(503).json({ error: 'AI service unavailable' })
      return
    }

    let trace
    try {
      trace = await prisma.aiTrace.create({
        data: {
          Question: question.trim(),
          Answer: data.answer,
          Prompt: data.prompt,
          PromptVersion: data.prompt_version,
          Model: data.model,
          RetrievedChunks: JSON.stringify(data.retrieved_chunks),
          RetrievalMs: data.retrieval_ms,
          LlmMs: data.llm_ms,
          TotalMs: data.total_ms,
          TokensIn: data.tokens_in,
          TokensOut: data.tokens_out,
          CostUsd: data.cost_usd,
          Groundedness: data.groundedness,
          RetrievalQuality: data.retrieval_quality,
          HallucinationRisk: data.hallucination_risk,
          AnswerRelevance: data.answer_relevance,
        },
      })
    } catch (err) {
      res.status(500).json({ error: 'Got an answer but failed to save the trace', detail: String(err) })
      return
    }

    res.json({
      answer: data.answer,
      traceId: trace.TraceID,
      groundedness: data.groundedness,
      retrievalQuality: data.retrieval_quality,
      hallucinationRisk: data.hallucination_risk,
      answerRelevance: data.answer_relevance,
    })
  } catch {
    res.status(500).json({ error: 'Failed to build the RAG corpus from the database' })
  }
})

// Pure data update — no ai-service call. There's no computation to delegate
// for recording a thumbs up/down, so this stays backend-only (consistent
// with the AI service having no DB access anywhere else in this app).
router.post('/chat/feedback', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { traceId, feedback } = req.body as { traceId?: number; feedback?: string }
    const id = Number(traceId)
    if (!id || Number.isNaN(id)) {
      res.status(400).json({ error: 'traceId is required' })
      return
    }
    if (feedback !== 'thumbs_up' && feedback !== 'thumbs_down') {
      res.status(400).json({ error: 'feedback must be thumbs_up or thumbs_down' })
      return
    }
    const trace = await prisma.aiTrace.update({
      where: { TraceID: id },
      data: { UserFeedback: feedback },
    })
    res.json({ traceId: trace.TraceID, userFeedback: trace.UserFeedback })
  } catch {
    res.status(500).json({ error: 'Failed to record feedback' })
  }
})

router.get('/traces', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { badOnly, minLatencyMs, maxLatencyMs, startDate, endDate } = req.query as {
      badOnly?: string
      minLatencyMs?: string
      maxLatencyMs?: string
      startDate?: string
      endDate?: string
    }

    const where: Record<string, unknown> = {}
    if (badOnly === 'true') {
      where.OR = [
        { Groundedness: 'low' },
        { RetrievalQuality: 'low' },
        { HallucinationRisk: true },
        { UserFeedback: 'thumbs_down' },
      ]
    }
    if (minLatencyMs || maxLatencyMs) {
      where.TotalMs = {
        ...(minLatencyMs && { gte: parseInt(minLatencyMs, 10) }),
        ...(maxLatencyMs && { lte: parseInt(maxLatencyMs, 10) }),
      }
    }
    if (startDate || endDate) {
      where.CreatedAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      }
    }

    const traces = await prisma.aiTrace.findMany({
      where,
      orderBy: { CreatedAt: 'desc' },
      take: 200,
      select: {
        TraceID: true,
        Question: true,
        Model: true,
        TotalMs: true,
        RetrievalMs: true,
        LlmMs: true,
        CostUsd: true,
        Groundedness: true,
        RetrievalQuality: true,
        HallucinationRisk: true,
        AnswerRelevance: true,
        UserFeedback: true,
        CreatedAt: true,
      },
    })
    res.json(traces)
  } catch {
    res.status(500).json({ error: 'Failed to load traces' })
  }
})

router.get('/traces/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10)
    const trace = await prisma.aiTrace.findUnique({ where: { TraceID: id } })
    if (!trace) {
      res.status(404).json({ error: 'Trace not found' })
      return
    }
    res.json({
      ...trace,
      RetrievedChunks: JSON.parse(trace.RetrievedChunks),
    })
  } catch {
    res.status(500).json({ error: 'Failed to load trace' })
  }
})

export default router
