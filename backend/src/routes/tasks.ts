import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, status } = req.query
    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId && { ProjectID: parseInt(projectId as string) }),
        ...(status && { Status: status as string }),
      },
      include: { project: { select: { ProjectID: true, ProjectName: true } } },
      orderBy: { DueDate: 'asc' }
    })
    res.json(tasks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

router.get('/overdue', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        DueDate: { lt: new Date() },
        Status: { not: 'Completed' }
      },
      include: { project: { select: { ProjectID: true, ProjectName: true } } },
      orderBy: { DueDate: 'asc' }
    })
    res.json(overdueTasks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue tasks' })
  }
})

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, taskName, description, dueDate, status, priority } = req.body
    const task = await prisma.task.create({
      data: {
        ProjectID: projectId,
        TaskName: taskName,
        Description: description,
        DueDate: dueDate ? new Date(dueDate) : null,
        Status: status || 'Pending',
        Priority: priority || 'Medium',
      }
    })
    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' })
  }
})

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { taskName, description, dueDate, status, priority } = req.body
    const data: Record<string, unknown> = {}
    if (taskName !== undefined) data.TaskName = taskName
    if (description !== undefined) data.Description = description
    if (dueDate !== undefined) data.DueDate = dueDate ? new Date(dueDate as string) : null
    if (status !== undefined) data.Status = status
    if (priority !== undefined) data.Priority = priority
    const task = await prisma.task.update({
      where: { TaskID: parseInt(req.params.id as string) },
      data,
    })
    res.json(task)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' })
  }
})

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.task.delete({
      where: { TaskID: parseInt(req.params.id as string) }
    })
    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

export default router