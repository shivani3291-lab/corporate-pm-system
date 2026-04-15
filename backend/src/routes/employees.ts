import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        EmployeeID: true,
        FirstName: true,
        LastName: true,
        Email: true,
        Role: true,
      }
    })
    res.json(employees)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' })
  }
})

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { EmployeeID: parseInt(req.params.id as string) },
      select: {
        EmployeeID: true,
        FirstName: true,
        LastName: true,
        Email: true,
        Role: true,
        assignments: {
          include: { project: true }
        }
      }
    })
    if (!employee) return res.status(404).json({ error: 'Employee not found' })
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' })
  }
})

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, role } = req.body
    const employee = await prisma.employee.update({
      where: { EmployeeID: parseInt(req.params.id as string) },
      data: {
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Role: role,
      },
      select: {
        EmployeeID: true,
        FirstName: true,
        LastName: true,
        Email: true,
        Role: true,
      }
    })
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' })
  }
})

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.employee.delete({
      where: { EmployeeID: parseInt(req.params.id as string) }
    })
    res.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' })
  }
})

export default router