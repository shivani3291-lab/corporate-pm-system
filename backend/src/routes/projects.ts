import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        assignments: {
          include: { employee: { select: { EmployeeID: true, FirstName: true, LastName: true, Role: true } } }
        },
        _count: { select: { tasks: true, documents: true } }
      }
    })
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { ProjectID: parseInt(req.params.id as string) },
      include: {
        tasks: true,
        documents: { include: { category: true } },
        assignments: {
          include: { employee: { select: { EmployeeID: true, FirstName: true, LastName: true, Role: true } } }
        }
      }
    })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectName, clientName, description, startDate, endDate, status } = req.body
    const project = await prisma.project.create({
      data: {
        ProjectName: projectName,
        ClientName: clientName,
        Description: description,
        StartDate: startDate ? new Date(startDate) : null,
        EndDate: endDate ? new Date(endDate) : null,
        Status: status || 'Active',
      }
    })
    res.status(201).json(project)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' })
  }
})

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectName, clientName, description, startDate, endDate, status } = req.body
    const project = await prisma.project.update({
      where: { ProjectID: parseInt(req.params.id as string) },
      data: {
        ProjectName: projectName,
        ClientName: clientName,
        Description: description,
        StartDate: startDate ? new Date(startDate) : null,
        EndDate: endDate ? new Date(endDate) : null,
        Status: status,
      }
    })
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' })
  }
})

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.project.delete({
      where: { ProjectID: parseInt(req.params.id as string) }
    })
    res.json({ message: 'Project deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

export default router