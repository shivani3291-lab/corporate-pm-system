import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'

const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body

    const existing = await prisma.employee.findUnique({
      where: { Email: email }
    })
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const employee = await prisma.employee.create({
      data: {
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Password: hashedPassword,
        Role: role || 'Staff',
      }
    })

    const token = jwt.sign(
      { id: employee.EmployeeID, email: employee.Email, role: employee.Role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Registered successfully',
      token,
      user: {
        id: employee.EmployeeID,
        firstName: employee.FirstName,
        lastName: employee.LastName,
        email: employee.Email,
        role: employee.Role,
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const employee = await prisma.employee.findUnique({
      where: { Email: email }
    })
    if (!employee) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValid = await bcrypt.compare(password, employee.Password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: employee.EmployeeID, email: employee.Email, role: employee.Role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: employee.EmployeeID,
        firstName: employee.FirstName,
        lastName: employee.LastName,
        email: employee.Email,
        role: employee.Role,
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Login failed' })
  }
})

export default router