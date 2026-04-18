import prisma from '../lib/prisma'
import {
  analyzeProjectHealthForProject,
  persistProjectHealthResult,
} from '../lib/projectHealthAnalysis'

/**
 * Nightly job (Feature 5): run delay + alerts + escalation pipeline per active project,
 * persist alerts and update task priorities.
 */
export async function runPredictiveAlertsJob(): Promise<void> {
  const projects = await prisma.project.findMany({
    where: { Status: { not: 'Completed' } },
    select: { ProjectID: true },
  })

  console.log(
    `[predictive-alerts] Scanning ${projects.length} non-completed project(s)`,
  )

  for (const p of projects) {
    try {
      const result = await analyzeProjectHealthForProject(p.ProjectID)
      if (!result) continue
      await persistProjectHealthResult(p.ProjectID, result)
    } catch (err) {
      console.error(`[predictive-alerts] Project ${p.ProjectID}`, err)
    }
  }

  console.log('[predictive-alerts] Finished')
}
