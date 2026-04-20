import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { documentsAPI, projectsAPI, categoriesAPI, aiAPI } from '../services/api'
import toast from 'react-hot-toast'

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

function matchPredictedCategory(
  predicted: string,
  categories: { CategoryID: number; CategoryName: string }[],
) {
  const p = predicted.trim().toLowerCase()
  const exact = categories.find((c) => c.CategoryName.toLowerCase() === p)
  if (exact) return exact
  return categories.find(
    (c) =>
      c.CategoryName.toLowerCase().includes(p) ||
      p.includes(c.CategoryName.toLowerCase()),
  )
}

function DocumentModal({
  onClose, onSubmit, initial, loading, projects, categories
}: {
  onClose: () => void
  onSubmit: (data: any) => void
  initial?: any
  loading: boolean
  projects: any[]
  categories: any[]
}) {
  const [form, setForm] = useState({
    projectId: initial?.ProjectID || '',
    categoryId: initial?.CategoryID || '',
    documentTitle: initial?.DocumentTitle || '',
    fileName: initial?.FileName || '',
    versionNumber: initial?.VersionNumber || 'v1',
    createdBy: initial?.CreatedBy || '',
  })
  const [suggestLoading, setSuggestLoading] = useState(false)

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

        {[
          { label: 'Project', key: 'projectId', type: 'select', options: projects.map((p: any) => ({ value: p.ProjectID, label: p.ProjectName })) },
          { label: 'Category', key: 'categoryId', type: 'select', options: categories.map((c: any) => ({ value: c.CategoryID, label: c.CategoryName })) },
        ].map(({ label, key, options }) => (
          <div key={key} style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '6px', gap: '8px',
            }}>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: 600,
                color: '#b8c2d6',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>{label}</label>
              {key === 'categoryId' && (
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
                      const match = matchPredictedCategory(data.category, categories)
                      if (match) {
                        setForm((prev) => ({
                          ...prev,
                          categoryId: String(match.CategoryID),
                        }))
                        toast.success(
                          `Category: ${match.CategoryName} (${Math.round(data.confidence * 100)}% confidence)`,
                        )
                      } else {
                        toast.error(
                          `Model suggests "${data.category}" — add a matching category or pick manually.`,
                        )
                      }
                    } catch {
                      toast.error('AI suggestion failed (is the AI service running?)')
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
                  {suggestLoading ? '…' : 'AI suggest'}
                </button>
              )}
            </div>
            <select
              value={form[key as keyof typeof form]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              style={{
                width: '100%', padding: '10px 12px',
                background: '#0d1526', border: '1px solid #1e2d45',
                borderRadius: '8px', outline: 'none',
                fontSize: '13px', color: '#f0f4ff',
              }}
            >
              <option value="">Select {label}</option>
              {options.map((o: any) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}

        {[
          { label: 'Document Title', key: 'documentTitle' },
          { label: 'File Name', key: 'fileName', placeholder: 'e.g. report_v1.pdf' },
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

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', background: 'transparent',
            border: '1px solid #1e2d45', borderRadius: '8px',
            color: '#b8c2d6', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={() => onSubmit(form)}
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
          >{loading ? 'Saving...' : 'Save Document'}</button>
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
    mutationFn: (data: any) => documentsAPI.create(data),
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

  const handleSubmit = (data: any) => {
    const formatted = {
      ...data,
      projectId: parseInt(data.projectId),
      categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
    }
    if (editDoc) {
      updateMutation.mutate({ id: editDoc.DocumentID, data: formatted })
    } else {
      createMutation.mutate(formatted)
    }
  }

  return (
    <Layout title="Documents" subtitle={`${documents.length} documents stored`}>
      <div style={{ maxWidth: '1400px' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categoryNames.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                padding: '5px 14px', borderRadius: '20px',
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
                    { label: 'Category', value: doc.category?.CategoryName },
                    { label: 'Created by', value: doc.CreatedBy },
                    {
                      label: 'Updated',
                      value: doc.UpdatedDate
                        ? new Date(doc.UpdatedDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })
                        : null
                    },
                  ].filter(item => item.value).map(item => (
                    <div key={item.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '11px',
                    }}>
                      <span style={{ color: '#4a5568' }}>{item.label}</span>
                      <span style={{ color: '#b8c2d6' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setEditDoc(doc)}
                    style={{
                      flex: 1, padding: '7px',
                      background: 'rgba(0,212,255,0.06)',
                      border: '1px solid rgba(0,212,255,0.15)',
                      borderRadius: '7px', color: '#00d4ff',
                      fontSize: '12px', cursor: 'pointer',
                    }}
                  >Edit</button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${doc.DocumentTitle}"?`)) {
                        deleteMutation.mutate(doc.DocumentID)
                      }
                    }}
                    style={{
                      flex: 1, padding: '7px',
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: '7px', color: '#ef4444',
                      fontSize: '12px', cursor: 'pointer',
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
        />
      )}
    </Layout>
  )
}