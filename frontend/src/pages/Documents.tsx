import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { documentsAPI, projectsAPI, categoriesAPI, aiAPI } from '../services/api'
import toast from 'react-hot-toast'
import api from '../services/api'

function FileIcon({ fileName }: { fileName: string }) {
  const ext = fileName?.split('.').pop()?.toLowerCase() || ''
  const icons: Record<string, { icon: string; color: string }> = {
    pdf: { icon: '⬡', color: '#ef4444' },
    doc: { icon: '◈', color: '#3b82f6' },
    docx: { icon: '◈', color: '#3b82f6' },
    xls: { icon: '▦', color: '#10b981' },
    xlsx: { icon: '▦', color: '#10b981' },
    ppt: { icon: '◇', color: '#f59e0b' },
    pptx: { icon: '◇', color: '#f59e0b' },
    png: { icon: '◉', color: '#7c3aed' },
    jpg: { icon: '◉', color: '#7c3aed' },
    txt: { icon: '◫', color: '#b8c2d6' },
  }
  const { icon, color } = icons[ext] || { icon: '◬', color: '#b8c2d6' }
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '10px',
      background: `${color}18`,
      border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '18px',
      color, flexShrink: 0,
    }}>{icon}</div>
  )
}

function DocumentModal({
  onClose, onSubmit, initial, loading, projects, categories, onCategoryCreated
}: {
  onClose: () => void
  onSubmit: (data: any, file: File | null) => void
  initial?: any
  loading: boolean
  projects: any[]
  categories: any[]
  onCategoryCreated: () => void
}) {
  const [form, setForm] = useState({
    projectId: initial?.ProjectID || '',
    categoryId: initial?.CategoryID || '',
    documentTitle: initial?.DocumentTitle || '',
    fileName: initial?.FileName || '',
    versionNumber: initial?.VersionNumber || 'v1',
    createdBy: initial?.CreatedBy || '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiSuggestedCategoryName, setAiSuggestedCategoryName] = useState<string | null>(null)

  const handleCreateCategory = async (name: string) => {
    if (!name.trim()) {
      toast.error('Enter a category name')
      return
    }
    setCreatingCategory(true)
    try {
      const res = await api.post('/categories', {
        categoryName: name.trim(),
        description: '',
      })
      toast.success(`Category "${name.trim()}" created`)
      onCategoryCreated()
      setForm(prev => ({ ...prev, categoryId: String(res.data.CategoryID) }))
      setShowNewCategory(false)
      setNewCategoryName('')
      setAiSuggestion(null)
    } catch {
      toast.error('Failed to create category')
    } finally {
      setCreatingCategory(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111827', border: '1px solid #1e2d45',
        borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '24px',
        }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '18px', fontWeight: 700, color: '#f0f4ff',
          }}>{initial ? 'Edit Document' : 'New Document'}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: '#b8c2d6', fontSize: '20px', cursor: 'pointer',
          }}>×</button>
        </div>

        {/* Project Select */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 600,
            color: '#b8c2d6', marginBottom: '6px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>Project</label>
          <select
            value={form.projectId}
            onChange={e => setForm({ ...form, projectId: e.target.value })}
            style={{
              width: '100%', padding: '10px 12px',
              background: '#0d1526', border: '1px solid #1e2d45',
              borderRadius: '8px', outline: 'none',
              fontSize: '13px', color: '#f0f4ff',
            }}
          >
            <option value="">Select Project</option>
            {projects.map((p: any) => (
              <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
            ))}
          </select>
        </div>

        {/* Category Select */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '6px', gap: '8px',
          }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: 600,
              color: '#b8c2d6',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>Category</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                disabled={suggestLoading || !String(form.documentTitle || '').trim()}
                onClick={async () => {
                  const title = String(form.documentTitle || '').trim()
                  if (!title) {
                    toast.error('Enter a document title first')
                    return
                  }
                  setSuggestLoading(true)
                  try {
                    const { data } = await aiAPI.classifyDocument(title)
                    const predicted = data.category.trim()
                    const confidence = Math.round(data.confidence * 100)

                    // Store AI suggestion for feedback tracking
                    setAiSuggestedCategoryName(predicted)

                    // Check if category exists
                    const existing = categories.find(
                      (c: any) => c.CategoryName.toLowerCase() === predicted.toLowerCase()
                    )

                    if (existing) {
                      setForm(prev => ({ ...prev, categoryId: String(existing.CategoryID) }))
                      toast.success(`Category: ${existing.CategoryName} (${confidence}% confidence)`)
                      setAiSuggestion(null)
                    } else {
                      // Category doesn't exist — offer to create it
                      setAiSuggestion(predicted)
                      setNewCategoryName(predicted)
                      setShowNewCategory(true)
                      toast(`AI suggests "${predicted}" (${confidence}%) — click Create to add it`, { icon: '✨' })
                    }
                  } catch {
                    toast.error('AI service unavailable')
                  } finally {
                    setSuggestLoading(false)
                  }
                }}
                style={{
                  padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                  fontFamily: 'Syne, sans-serif',
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(124, 58, 237, 0.35)',
                  borderRadius: '6px', color: '#c4b5fd',
                  cursor: suggestLoading || !String(form.documentTitle || '').trim()
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: suggestLoading || !String(form.documentTitle || '').trim() ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {suggestLoading ? '…' : '✨ AI Suggest'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory(true)
                  setNewCategoryName('')
                  setAiSuggestion(null)
                }}
                style={{
                  padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                  fontFamily: 'Syne, sans-serif',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  borderRadius: '6px', color: '#00d4ff',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Custom
              </button>
            </div>
          </div>

          {/* Category Dropdown */}
          <select
            value={form.categoryId}
            onChange={e => setForm({ ...form, categoryId: e.target.value })}
            style={{
              width: '100%', padding: '10px 12px',
              background: '#0d1526', border: '1px solid #1e2d45',
              borderRadius: '8px', outline: 'none',
              fontSize: '13px', color: '#f0f4ff',
            }}
          >
            <option value="">Select Category</option>
            {categories.map((c: any) => (
              <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
            ))}
          </select>

          {/* AI Suggestion Banner */}
          {aiSuggestion && !form.categoryId && (
            <div style={{
              marginTop: '8px', padding: '10px 12px',
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '12px', color: '#c4b5fd' }}>
                ✨ AI suggests: <strong>{aiSuggestion}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleCreateCategory(aiSuggestion)}
                disabled={creatingCategory}
                style={{
                  padding: '4px 12px', fontSize: '11px', fontWeight: 600,
                  background: '#7c3aed', border: 'none',
                  borderRadius: '6px', color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {creatingCategory ? 'Creating...' : 'Create & Select'}
              </button>
            </div>
          )}

          {/* New Category Input */}
          {showNewCategory && !aiSuggestion && (
            <div style={{
              marginTop: '8px', display: 'flex', gap: '8px',
            }}>
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateCategory(newCategoryName)
                  }
                }}
                style={{
                  flex: 1, padding: '8px 12px',
                  background: '#0d1526', border: '1px solid #1e2d45',
                  borderRadius: '8px', outline: 'none',
                  fontSize: '13px', color: '#f0f4ff',
                }}
                onFocus={e => e.target.style.borderColor = '#00d4ff'}
                onBlur={e => e.target.style.borderColor = '#1e2d45'}
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleCreateCategory(newCategoryName)}
                disabled={creatingCategory || !newCategoryName.trim()}
                style={{
                  padding: '8px 14px', fontSize: '12px', fontWeight: 600,
                  background: newCategoryName.trim() ? '#00d4ff' : '#1e2d45',
                  border: 'none', borderRadius: '8px',
                  color: newCategoryName.trim() ? '#0a0f1e' : '#6b7280',
                  cursor: newCategoryName.trim() ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                {creatingCategory ? '...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowNewCategory(false); setNewCategoryName('') }}
                style={{
                  padding: '8px 10px', fontSize: '12px',
                  background: 'transparent', border: '1px solid #1e2d45',
                  borderRadius: '8px', color: '#b8c2d6',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* File Upload */}
        {!initial && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: 600,
              color: '#b8c2d6', marginBottom: '6px',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>Upload File</label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '20px',
              background: '#0d1526', border: '2px dashed #1e2d45',
              borderRadius: '10px', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#00d4ff' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = '#1e2d45' }}
              onDrop={e => {
                e.preventDefault()
                e.currentTarget.style.borderColor = '#1e2d45'
                const file = e.dataTransfer.files[0]
                if (file) {
                  setSelectedFile(file)
                  if (!form.documentTitle) setForm(prev => ({ ...prev, documentTitle: file.name.replace(/\.[^.]+$/, '') }))
                  if (!form.fileName) setForm(prev => ({ ...prev, fileName: file.name }))
                }
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2a3f5f'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1e2d45'}
            >
              {selectedFile ? (
                <>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
                  <div style={{ fontSize: '13px', color: '#f0f4ff', fontWeight: 500 }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '11px', color: '#b8c2d6', marginTop: '4px' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                    style={{
                      marginTop: '8px', fontSize: '11px',
                      color: '#ef4444', background: 'none',
                      border: 'none', cursor: 'pointer',
                    }}
                  >Remove file</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📂</div>
                  <div style={{ fontSize: '13px', color: '#b8c2d6' }}>
                    Click to browse or drag & drop
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    PDF, DOCX, XLSX, PNG, JPG — max 25 MB
                  </div>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.csv"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0] || null
                  setSelectedFile(file)
                  if (file) {
                    if (!form.documentTitle) setForm(prev => ({ ...prev, documentTitle: file.name.replace(/\.[^.]+$/, '') }))
                    if (!form.fileName) setForm(prev => ({ ...prev, fileName: file.name }))
                  }
                }}
              />
            </label>
          </div>
        )}

        {/* Text Fields */}
        {[
          { label: 'Document Title', key: 'documentTitle' },
          { label: 'Version Number', key: 'versionNumber', placeholder: 'e.g. v1' },
          { label: 'Created By', key: 'createdBy' },
        ].map(({ label, key, placeholder }) => (
          <div key={key} style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: 600,
              color: '#b8c2d6', marginBottom: '6px',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{label}</label>
            <input
              type="text"
              value={form[key as keyof typeof form]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              style={{
                width: '100%', padding: '10px 12px',
                background: '#0d1526', border: '1px solid #1e2d45',
                borderRadius: '8px', outline: 'none',
                fontSize: '13px', color: '#f0f4ff',
              }}
              onFocus={e => e.target.style.borderColor = '#00d4ff'}
              onBlur={e => e.target.style.borderColor = '#1e2d45'}
            />
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', background: 'transparent',
            border: '1px solid #1e2d45', borderRadius: '8px',
            color: '#b8c2d6', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={async () => {
              if (!form.projectId) {
                toast.error('Please select a project')
                return
              }
              if (!form.documentTitle.trim()) {
                toast.error('Please enter a document title')
                return
              }

              // If user overrode AI suggestion, send feedback to train the model
              if (aiSuggestedCategoryName && form.categoryId) {
                const selectedCat = categories.find(
                  (c: any) => String(c.CategoryID) === String(form.categoryId)
                )
                if (selectedCat && selectedCat.CategoryName.toLowerCase() !== aiSuggestedCategoryName.toLowerCase()) {
                  aiAPI.classifyFeedback(form.documentTitle, selectedCat.CategoryName).catch(() => {})
                }
              }

              onSubmit(form, selectedFile)
            }}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#1e2d45' : '#00d4ff',
              border: 'none', borderRadius: '8px',
              color: loading ? '#b8c2d6' : '#0a0f1e',
              fontSize: '13px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Syne, sans-serif',
            }}
          >{loading ? 'Uploading...' : 'Save Document'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Documents() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editDoc, setEditDoc] = useState<any>(null)
  const [filter, setFilter] = useState('All')

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsAPI.getAll().then(r => r.data),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(r => r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => documentsAPI.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document added successfully')
      setShowModal(false)
    },
    onError: () => toast.error('Failed to add document'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      documentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document updated')
      setEditDoc(null)
    },
    onError: () => toast.error('Failed to update document'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document deleted')
    },
    onError: () => toast.error('Failed to delete document'),
  })

  const categoryNames = ['All', ...categories.map((c: any) => c.CategoryName)]

  const filtered = filter === 'All'
    ? documents
    : documents.filter((d: any) => d.category?.CategoryName === filter)

  const handleSubmit = (data: any, file: File | null) => {
    if (editDoc) {
      const formatted = {
        documentTitle: data.documentTitle,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        versionNumber: data.versionNumber,
      }
      updateMutation.mutate({ id: editDoc.DocumentID, data: formatted })
    } else {
      const fd = new FormData()
      fd.append('projectId', data.projectId)
      if (data.categoryId) fd.append('categoryId', data.categoryId)
      fd.append('documentTitle', data.documentTitle)
      fd.append('versionNumber', data.versionNumber || 'v1')
      fd.append('createdBy', data.createdBy || 'System')
      if (file) fd.append('file', file)
      createMutation.mutate(fd)
    }
  }

  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  return (
    <Layout title="Documents" subtitle={`${documents.length} documents stored`}>
      <div style={{ maxWidth: '1400px' }}>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categoryNames.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                padding: '5px 12px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                border: filter === c ? 'none' : '1px solid #1e2d45',
                background: filter === c ? '#00d4ff' : 'transparent',
                color: filter === c ? '#0a0f1e' : '#b8c2d6',
              }}>{c}</button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#00d4ff', color: '#0a0f1e',
              border: 'none', borderRadius: '10px',
              padding: '10px 20px', fontSize: '13px',
              fontWeight: 700, fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
            }}
          >⊕ Add Document</button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px',
            background: '#111827', border: '1px solid #1e2d45',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>▦</div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '16px', color: '#f0f4ff', marginBottom: '8px',
            }}>No documents found</div>
            <div style={{ fontSize: '13px', color: '#b8c2d6', marginBottom: '20px' }}>
              Add your first document to get started
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: '#00d4ff', color: '#0a0f1e',
                border: 'none', borderRadius: '8px',
                padding: '10px 20px', fontSize: '13px',
                fontWeight: 700, cursor: 'pointer',
              }}
            >Add Document</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
            {filtered.map((doc: any) => (
              <div
                key={doc.DocumentID}
                style={{
                  background: '#111827',
                  border: '1px solid #1e2d45',
                  borderRadius: '12px', padding: '18px',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#2a3f5f'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#1e2d45'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  display: 'flex', gap: '12px',
                  alignItems: 'flex-start', marginBottom: '12px',
                }}>
                  <FileIcon fileName={doc.FileName || ''} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: 600,
                      color: '#f0f4ff', marginBottom: '3px',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{doc.DocumentTitle}</div>
                    <div style={{ fontSize: '11px', color: '#b8c2d6' }}>
                      {doc.FileName || 'No file name'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px',
                    borderRadius: '4px', fontWeight: 600,
                    background: 'rgba(0,212,255,0.1)',
                    color: '#00d4ff', flexShrink: 0,
                  }}>{doc.VersionNumber || 'v1'}</span>
                </div>

                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '5px',
                  marginBottom: '14px',
                }}>
                  {[
                    { label: 'Project', value: doc.project?.ProjectName },
                    { label: 'Category', value: doc.category?.CategoryName || '—' },
                    { label: 'Created by', value: doc.CreatedBy },
                    {
                      label: 'Updated',
                      value: doc.UpdatedDate
                        ? new Date(doc.UpdatedDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })
                        : null
                    },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '12px',
                    }}>
                      <span style={{ color: '#6b7280' }}>{label}</span>
                      <span style={{ color: '#b8c2d6' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex', gap: '6px',
                  borderTop: '1px solid #1e2d45',
                  paddingTop: '12px',
                }}>
                  {doc.fileLocation?.FilePath && (
                    <a
                      href={doc.fileLocation.FilePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, textAlign: 'center',
                        padding: '7px 10px', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 500,
                        background: 'rgba(16,185,129,0.1)',
                        color: '#10b981', textDecoration: 'none',
                        border: '1px solid rgba(16,185,129,0.2)',
                        cursor: 'pointer',
                      }}
                    >↓ Download</a>
                  )}
                  <button
                    onClick={() => setEditDoc(doc)}
                    style={{
                      flex: 1, padding: '7px 10px',
                      borderRadius: '8px', fontSize: '12px',
                      fontWeight: 500, background: 'rgba(0,212,255,0.1)',
                      color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)',
                      cursor: 'pointer',
                    }}
                  >Edit</button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this document?')) deleteMutation.mutate(doc.DocumentID)
                    }}
                    style={{
                      flex: 1, padding: '7px 10px',
                      borderRadius: '8px', fontSize: '12px',
                      fontWeight: 500, background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
                      cursor: 'pointer',
                    }}
                  >Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showModal || editDoc) && (
        <DocumentModal
          onClose={() => { setShowModal(false); setEditDoc(null) }}
          onSubmit={handleSubmit}
          initial={editDoc}
          loading={createMutation.isPending || updateMutation.isPending}
          projects={projects}
          categories={categories}
          onCategoryCreated={refreshCategories}
        />
      )}
    </Layout>
  )
}
