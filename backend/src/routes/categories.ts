import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

const DEFAULT_CATEGORIES = [
  { name: 'Requirements', desc: 'Business and technical requirements' },
  { name: 'Design', desc: 'System design, architecture, and UI/UX' },
  { name: 'Development', desc: 'Code, APIs, installation, and technical docs' },
  { name: 'Testing', desc: 'Test plans, QA reports, and test cases' },
  { name: 'Business', desc: 'Proposals, contracts, meetings, and reports' },
  { name: 'Documentation', desc: 'User guides, manuals, and knowledge base' },
]

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let categories = await prisma.category.findMany({
      include: { _count: { select: { documents: true } } }
    })

    // Seed defaults if empty
    if (categories.length === 0) {
      for (const c of DEFAULT_CATEGORIES) {
        await prisma.category.create({
          data: { CategoryName: c.name, Description: c.desc },
        })
      }
      categories = await prisma.category.findMany({
        include: { _count: { select: { documents: true } } }
      })
    }

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