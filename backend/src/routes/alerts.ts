import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await prisma.projectAlert.findMany({
      take: 100,
      orderBy: { CreatedAt: 'desc' },
      include: {
        project: { select: { ProjectID: true, ProjectName: true } },
      },
    })
    res.json(rows)
  } catch {
    res.status(500).json({ error: 'Failed to load alerts' })
  }
})

export default router
