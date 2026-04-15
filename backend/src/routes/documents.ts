import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, categoryId } = req.query
    const documents = await prisma.document.findMany({
      where: {
        ...(projectId && { ProjectID: parseInt(projectId as string) }),
        ...(categoryId && { CategoryID: parseInt(categoryId as string) }),
      },
      include: {
        category: true,
        project: { select: { ProjectID: true, ProjectName: true } },
        fileLocation: true,
      },
      orderBy: { UpdatedDate: 'desc' }
    })
    res.json(documents)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      projectId, categoryId, documentTitle,
      fileName, versionNumber, createdBy
    } = req.body

    const document = await prisma.document.create({
      data: {
        ProjectID: projectId,
        CategoryID: categoryId || null,
        DocumentTitle: documentTitle,
        FileName: fileName,
        VersionNumber: versionNumber || 'v1',
        CreatedDate: new Date(),
        UpdatedDate: new Date(),
        CreatedBy: createdBy,
      }
    })
    res.status(201).json(document)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document' })
  }
})

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { documentTitle, categoryId, versionNumber } = req.body
    const document = await prisma.document.update({
      where: { DocumentID: parseInt(req.params.id as string) },
      data: {
        DocumentTitle: documentTitle,
        CategoryID: categoryId,
        VersionNumber: versionNumber,
        UpdatedDate: new Date(),
      }
    })
    res.json(document)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' })
  }
})

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.document.delete({
      where: { DocumentID: parseInt(req.params.id as string) }
    })
    res.json({ message: 'Document deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

export default router