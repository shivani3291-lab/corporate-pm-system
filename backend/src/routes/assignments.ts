import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { authorize } from '../middleware/authorize'

const router = Router()

// List all assignments (optionally filter by projectId or employeeId)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, employeeId } = req.query
    const assignments = await prisma.projectAssignment.findMany({
      where: {
        ...(projectId && { ProjectID: parseInt(projectId as string) }),
        ...(employeeId && { EmployeeID: parseInt(employeeId as string) }),
      },
      include: {
        employee: { select: { EmployeeID: true, FirstName: true, LastName: true, Role: true } },
        project: { select: { ProjectID: true, ProjectName: true } },
      },
      orderBy: { AssignmentID: 'desc' },
    })
    res.json(assignments)
  } catch {
    res.status(500).json({ error: 'Failed to fetch assignments' })
  }
})

// Assign employee to project
router.post('/', authenticate, authorize('Admin', 'Manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, projectId, roleInProject } = req.body

    if (!employeeId || !projectId) {
      return res.status(400).json({ error: 'employeeId and projectId are required' })
    }

    const existing = await prisma.projectAssignment.findFirst({
      where: { EmployeeID: employeeId, ProjectID: projectId },
    })
    if (existing) {
      return res.status(400).json({ error: 'Employee already assigned to this project' })
    }

    const assignment = await prisma.projectAssignment.create({
      data: {
        EmployeeID: employeeId,
        ProjectID: projectId,
        RoleInProject: roleInProject || 'Member',
      },
      include: {
        employee: { select: { EmployeeID: true, FirstName: true, LastName: true, Role: true } },
        project: { select: { ProjectID: true, ProjectName: true } },
      },
    })
    res.status(201).json(assignment)
  } catch {
    res.status(500).json({ error: 'Failed to assign employee' })
  }
})

// Update assignment role
router.put('/:id', authenticate, authorize('Admin', 'Manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { roleInProject } = req.body
    const assignment = await prisma.projectAssignment.update({
      where: { AssignmentID: parseInt(req.params.id as string) },
      data: { RoleInProject: roleInProject },
      include: {
        employee: { select: { EmployeeID: true, FirstName: true, LastName: true, Role: true } },
        project: { select: { ProjectID: true, ProjectName: true } },
      },
    })
    res.json(assignment)
  } catch {
    res.status(500).json({ error: 'Failed to update assignment' })
  }
})

// Remove assignment
router.delete('/:id', authenticate, authorize('Admin', 'Manager'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.projectAssignment.delete({
      where: { AssignmentID: parseInt(req.params.id as string) },
    })
    res.json({ message: 'Assignment removed' })
  } catch {
    res.status(500).json({ error: 'Failed to remove assignment' })
  }
})

export default router
