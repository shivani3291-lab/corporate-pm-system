import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { documents: true } } }
    })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { categoryName, description } = req.body
    const category = await prisma.category.create({
      data: { CategoryName: categoryName, Description: description }
    })
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' })
  }
})

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.category.delete({
      where: { CategoryID: parseInt(req.params.id as string) }
    })
    res.json({ message: 'Category deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

export default router