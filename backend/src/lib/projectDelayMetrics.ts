import prisma from './prisma'

export type DelayMetrics = {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  daysUntilDeadline: number
  teamSize: number
}

export async function getProjectDelayMetrics(
  projectId: number,
): Promise<DelayMetrics | null> {
  const project = await prisma.project.findUnique({
    where: { ProjectID: projectId },
    include: { tasks: true, assignments: true },
  })
  if (!project) return null

  const now = new Date()
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter((t) => t.Status === 'Completed').length
  const overdueTasks = project.tasks.filter(
    (t) =>
      t.DueDate != null &&
      t.DueDate < now &&
      t.Status !== 'Completed',
  ).length
  const teamSize = project.assignments.length

  let daysUntilDeadline = 90
  if (project.EndDate) {
    daysUntilDeadline = Math.ceil(
      (project.EndDate.getTime() - now.getTime()) / 86_400_000,
    )
  }

  return {
    totalTasks,
    completedTasks: Math.min(completedTasks, Math.max(totalTasks, 0)),
    overdueTasks: Math.min(overdueTasks, Math.max(totalTasks, 0)),
    daysUntilDeadline,
    teamSize,
  }
}

/** When the Python AI service is unavailable. */
export function heuristicDelayRisk(m: DelayMetrics): {
  riskScore: number
  riskLevel: string
  reason: string
} {
  const total = Math.max(m.totalTasks, 1)
  const overdueR = m.overdueTasks / total
  const compR = m.completedTasks / total

  if (overdueR > 0.2 || (m.daysUntilDeadline < 14 && compR < 0.35 && m.totalTasks > 0)) {
    return {
      riskScore: 78,
      riskLevel: 'Likely Delayed',
      reason: 'Heuristic: overdue work or a tight deadline with low completion.',
    }
  }
  if (overdueR > 0.05 || (m.daysUntilDeadline < 45 && compR < 0.5)) {
    return {
      riskScore: 52,
      riskLevel: 'At Risk',
      reason: 'Heuristic: monitor schedule and task completion.',
    }
  }
  return {
    riskScore: 28,
    riskLevel: 'On Track',
    reason: 'Heuristic: no major schedule red flags from task data.',
  }
}
