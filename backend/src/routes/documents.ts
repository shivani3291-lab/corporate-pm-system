import { Router, Response } from 'express'
import multer from 'multer'
import { BlobServiceClient } from '@azure/storage-blob'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { aiServiceBase } from '../lib/aiServiceUrl'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse')

const router = Router()

// Multer — keep files in memory before uploading to blob
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
})

// Helper: get or create blob container
async function getContainer() {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!conn) throw new Error('AZURE_STORAGE_CONNECTION_STRING not set')
  const svc = BlobServiceClient.fromConnectionString(conn)
  const container = svc.getContainerClient('documents')
  await container.createIfNotExists()
  return container
}

// ── LIST ─────────────────────────────────────────────────────────
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

// ── UPLOAD (POST with multipart/form-data) ───────────────────────
router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      projectId, categoryId, documentTitle,
      versionNumber, createdBy
    } = req.body

    const parsedProjectId = parseInt(projectId)
    if (!parsedProjectId || isNaN(parsedProjectId)) {
      return res.status(400).json({ error: 'Project is required' })
    }

    let fileName: string | null = null
    let fileUrl: string | null = null
    let fileLocationId: number | null = null

    // If a file was uploaded, push it to Azure Blob Storage
    if (req.file) {
      const container = await getContainer()
      const blobName = `${Date.now()}-${req.file.originalname}`
      const blockBlob = container.getBlockBlobClient(blobName)
      await blockBlob.uploadData(req.file.buffer, {
        blobHTTPHeaders: {
          blobContentType: req.file.mimetype,
        },
      })
      fileName = req.file.originalname
      fileUrl = blockBlob.url

      // Create FileLocation record
      const loc = await prisma.fileLocation.create({
        data: {
          FilePath: fileUrl,
          LocationType: 'azure-blob',
          Notes: req.file.originalname,
        },
      })
      fileLocationId = loc.FileLocationID
    }

    let assignedCategoryId = categoryId ? parseInt(categoryId) : null

    // Auto-classify with AI if no category selected
    if (!assignedCategoryId) {
      try {
        // Build classification text: title + PDF content (first 800 chars)
        let classifyText = documentTitle

        if (req.file && req.file.mimetype === 'application/pdf') {
          try {
            const pdfData = await pdfParse(req.file.buffer)
            const content = (pdfData.text || '').replace(/\s+/g, ' ').trim()
            if (content.length > 0) {
              // Use first 800 chars of PDF content for classification
              classifyText = `${documentTitle}. ${content.substring(0, 800)}`
            }
          } catch {
            // PDF parsing failed — use title only
          }
        }

        const r = await fetch(`${aiServiceBase()}/classify-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: classifyText }),
        })
        if (r.ok) {
          const data = (await r.json()) as { category: string; confidence: number }
          const predicted = data.category.trim().toLowerCase()
          
          // Find matching category
          const allCategories = await prisma.category.findMany()
          const match = allCategories.find(
            (c) =>
              c.CategoryName.toLowerCase() === predicted ||
              c.CategoryName.toLowerCase().includes(predicted) ||
              predicted.includes(c.CategoryName.toLowerCase()),
          )
          if (match) assignedCategoryId = match.CategoryID
        }
      } catch {
        // AI service unavailable — proceed without category
      }
    }

    const document = await prisma.document.create({
      data: {
        ProjectID: parsedProjectId,
        CategoryID: assignedCategoryId,
        DocumentTitle: documentTitle,
        FileName: fileName || documentTitle,
        VersionNumber: versionNumber || 'v1',
        FileLocationID: fileLocationId,
        CreatedDate: new Date(),
        UpdatedDate: new Date(),
        CreatedBy: createdBy || 'System',
      },
      include: {
        category: true,
        project: { select: { ProjectID: true, ProjectName: true } },
        fileLocation: true,
      }
    })

    res.status(201).json(document)
  } catch (error) {
    console.error('Document upload error:', error)
    res.status(500).json({ error: 'Failed to create document' })
  }
})

// ── DOWNLOAD ─────────────────────────────────────────────────────
router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { DocumentID: parseInt(req.params.id as string) },
      include: { fileLocation: true },
    })

    if (!doc?.fileLocation?.FilePath) {
      return res.status(404).json({ error: 'No file attached to this document' })
    }

    // Redirect to the blob URL (or stream it)
    res.redirect(doc.fileLocation.FilePath)
  } catch (error) {
    res.status(500).json({ error: 'Failed to download document' })
  }
})

// ── UPDATE ───────────────────────────────────────────────────────
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

// ── DELETE ───────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { DocumentID: parseInt(req.params.id as string) },
      include: { fileLocation: true },
    })

    // Delete blob if exists
    if (doc?.fileLocation?.FilePath && process.env.AZURE_STORAGE_CONNECTION_STRING) {
      try {
        const svc = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
        const container = svc.getContainerClient('documents')
        const blobName = doc.fileLocation.FilePath.split('/').pop()
        if (blobName) {
          await container.getBlockBlobClient(blobName).deleteIfExists()
        }
      } catch {
        // blob deletion is best-effort
      }
    }

    // Delete FileLocation if exists
    if (doc?.FileLocationID) {
      await prisma.fileLocation.delete({ where: { FileLocationID: doc.FileLocationID } }).catch(() => {})
    }

    await prisma.document.delete({
      where: { DocumentID: parseInt(req.params.id as string) }
    })
    res.json({ message: 'Document deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

export default router
