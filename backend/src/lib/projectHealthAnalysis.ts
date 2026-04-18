import prisma from './prisma'
import { aiServiceBase } from './aiServiceUrl'
import {
  getProjectDelayMetrics,
  heuristicDelayRisk,
} from './projectDelayMetrics'

export type AnalyzeHealthResult = {
  projectId: number
  riskLevel: string
  riskScore: number
  alerts: Array<{ type: string; severity: string; message: string }>
  escalatedTasks: Array<{
    taskId: number
    fromPriority: string
    toPriority: string
    reason: string
  }>
}

export async function buildHealthPayloadFromDb(
  projectId: number,
): Promise<{
  projectId: number
  tasks: Array<{
    taskId: number
    status: string | null
    dueDate: string | null
    priority: string | null
    taskName: string
  }>
  daysUntilDeadline: number
  teamSize: number
} | null> {
  const project = await prisma.project.findUnique({
    where: { ProjectID: projectId },
    include: { tasks: true, assignments: true },
  })
  if (!project) return null

  const daysUntilDeadline = project.EndDate
    ? Math.ceil(
        (project.EndDate.getTime() - Date.now()) / 86_400_000,
      )
    : 90

  const tasks = project.tasks.map((t) => ({
    taskId: t.TaskID,
    status: t.Status,
    dueDate: t.DueDate ? t.DueDate.toISOString() : null,
    priority: t.Priority,
    taskName: t.TaskName,
  }))

  return {
    projectId: project.ProjectID,
    tasks,
    daysUntilDeadline,
    teamSize: Math.max(1, project.assignments.length),
  }
}

export async function fetchAnalyzeProjectHealthFromAi(
  payload: Record<string, unknown>,
): Promise<AnalyzeHealthResult | null> {
  try {
    const r = await fetch(`${aiServiceBase()}/analyze-project-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120_000),
    })
    if (!r.ok) return null
    return (await r.json()) as AnalyzeHealthResult
  } catch {
    return null
  }
}

/** When AI is offline: delay heuristic only (no task escalations). */
export async function heuristicProjectHealth(
  projectId: number,
): Promise<AnalyzeHealthResult | null> {
  const metrics = await getProjectDelayMetrics(projectId)
  if (!metrics) return null
  const h = heuristicDelayRisk(metrics)
  const sev =
    h.riskLevel === 'Likely Delayed'
      ? 'Critical'
      : h.riskLevel === 'At Risk'
        ? 'Warning'
        : 'Notice'
  return {
    projectId,
    riskLevel: h.riskLevel,
    riskScore: h.riskScore,
    alerts: [
      {
        type: 'ProjectAtRisk',
        severity: sev,
        message: h.reason,
      },
    ],
    escalatedTasks: [],
  }
}

export async function analyzeProjectHealthForProject(
  projectId: number,
): Promise<AnalyzeHealthResult | null> {
  const payload = await buildHealthPayloadFromDb(projectId)
  if (!payload) return null
  const ai = await fetchAnalyzeProjectHealthFromAi(payload as unknown as Record<string, unknown>)
  if (ai) return ai
  return heuristicProjectHealth(projectId)
}

export async function persistProjectHealthResult(
  projectId: number,
  result: AnalyzeHealthResult,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const a of result.alerts) {
      await tx.projectAlert.create({
        data: {
          ProjectID: projectId,
          AlertType: a.type,
          Severity: a.severity,
          Message: a.message,
        },
      })
    }
    for (const e of result.escalatedTasks) {
      await tx.task.updateMany({
        where: { TaskID: e.taskId, ProjectID: projectId },
        data: { Priority: e.toPriority },
      })
      await tx.projectAlert.create({
        data: {
          ProjectID: projectId,
          AlertType: 'TaskEscalated',
          Severity: 'Notice',
          Message: `Task priority ${e.fromPriority} → ${e.toPriority}: ${e.reason}`,
          TaskID: e.taskId,
        },
      })
    }
  })
}
