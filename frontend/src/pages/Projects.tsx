import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { projectsAPI } from '../services/api'
import toast from 'react-hot-toast'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Active: { bg: 'rgba(0,212,255,0.1)', color: '#00d4ff' },
    Completed: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    'In Progress': { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' },
    Pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    'On Hold': { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  }
  const c = colors[status] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' }
  return (
    <span style={{
      fontSize: '11px', padding: '3px 10px',
      borderRadius: '20px', fontWeight: 600,
      background: c.bg, color: c.color,
    }}>{status}</span>
  )
}

interface ProjectFormData {
  projectName: string
  clientName: string
  description: string
  startDate: string
  endDate: string
  status: string
}

function ProjectModal({
  onClose, onSubmit, initial, loading
}: {
  onClose: () => void
  onSubmit: (data: ProjectFormData) => void
  initial?: any
  loading: boolean
}) {
  const [form, setForm] = useState<ProjectFormData>({
    projectName: initial?.ProjectName || '',
    clientName: initial?.ClientName || '',
    description: initial?.Description || '',
    startDate: initial?.StartDate?.split('T')[0] || '',
    endDate: initial?.EndDate?.split('T')[0] || '',
    status: initial?.Status || 'Active',
  })

  const field = (label: string, key: keyof ProjectFormData, type = 'text') => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', fontSize: '11px', fontWeight: 600,
        color: '#8b9ab3', marginBottom: '6px',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        style={{
          width: '100%', padding: '10px 12px',
          background: '#0d1526', border: '1px solid #1e2d45',
          borderRadius: '8px', outline: 'none',
          fontSize: '13px', color: '#f0f4ff',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#00d4ff'}
        onBlur={e => e.target.style.borderColor = '#1e2d45'}
      />
    </div>
  )

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
          }}>{initial ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: '#8b9ab3', fontSize: '20px', cursor: 'pointer',
          }}>×</button>
        </div>

        {field('Project Name', 'projectName')}
        {field('Client Name', 'clientName')}

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 600,
            color: '#8b9ab3', marginBottom: '6px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            style={{
              width: '100%', padding: '10px 12px',
              background: '#0d1526', border: '1px solid #1e2d45',
              borderRadius: '8px', outline: 'none',
              fontSize: '13px', color: '#f0f4ff',
              resize: 'vertical', fontFamily: 'DM Sans, sans-serif',
            }}
            onFocus={e => e.target.style.borderColor = '#00d4ff'}
            onBlur={e => e.target.style.borderColor = '#1e2d45'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {field('Start Date', 'startDate', 'date')}
          {field('End Date', 'endDate', 'date')}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 600,
            color: '#8b9ab3', marginBottom: '6px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>Status</label>
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            style={{
              width: '100%', padding: '10px 12px',
              background: '#0d1526', border: '1px solid #1e2d45',
              borderRadius: '8px', outline: 'none',
              fontSize: '13px', color: '#f0f4ff',
            }}
          >
            {['Active', 'In Progress', 'Completed', 'On Hold', 'Pending'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', background: 'transparent',
            border: '1px solid #1e2d45', borderRadius: '8px',
            color: '#8b9ab3', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#1e2d45' : '#00d4ff',
              border: 'none', borderRadius: '8px',
              color: loading ? '#8b9ab3' : '#0a0f1e',
              fontSize: '13px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Syne, sans-serif',
            }}
          >{loading ? 'Saving...' : 'Save Project'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<any>(null)
  const [filter, setFilter] = useState('All')

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => projectsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created successfully')
      setShowModal(false)
    },
    onError: () => toast.error('Failed to create project'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      projectsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project updated successfully')
      setEditProject(null)
    },
    onError: () => toast.error('Failed to update project'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
    },
    onError: () => toast.error('Failed to delete project'),
  })

  const statuses = ['All', 'Active', 'In Progress', 'Completed', 'On Hold', 'Pending']

  const filtered = filter === 'All'
    ? projects
    : projects.filter((p: any) => p.Status === filter)

  const handleSubmit = (data: ProjectFormData) => {
    if (editProject) {
      updateMutation.mutate({ id: editProject.ProjectID, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Layout title="Projects" subtitle={`${projects.length} total projects`}>
      <div style={{ maxWidth: '1400px' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: '6px 14px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  border: filter === s ? 'none' : '1px solid #1e2d45',
                  background: filter === s ? '#00d4ff' : 'transparent',
                  color: filter === s ? '#0a0f1e' : '#8b9ab3',
                  transition: 'all 0.15s',
                }}
              >{s}</button>
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
          >⊕ New Project</button>
        </div>

        {isLoading ? (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#111827', border: '1px solid #1e2d45',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>◈</div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '16px', color: '#f0f4ff', marginBottom: '8px',
            }}>No projects found</div>
            <div style={{ fontSize: '13px', color: '#8b9ab3', marginBottom: '20px' }}>
              {filter === 'All' ? 'Create your first project to get started' : `No projects with status "${filter}"`}
            </div>
            {filter === 'All' && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: '#00d4ff', color: '#0a0f1e',
                  border: 'none', borderRadius: '8px',
                  padding: '10px 20px', fontSize: '13px',
                  fontWeight: 700, cursor: 'pointer',
                }}
              >Create Project</button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {filtered.map((project: any) => (
              <div
                key={project.ProjectID}
                style={{
                  background: '#111827',
                  border: '1px solid #1e2d45',
                  borderRadius: '12px', padding: '20px',
                  transition: 'border-color 0.2s, transform 0.2s',
                  cursor: 'pointer',
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
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: '10px',
                }}>
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '15px', fontWeight: 700,
                    color: '#f0f4ff', flex: 1, marginRight: '10px',
                  }}>{project.ProjectName}</h3>
                  <StatusBadge status={project.Status || 'Active'} />
                </div>

                {project.ClientName && (
                  <div style={{
                    fontSize: '12px', color: '#8b9ab3', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    ◎ {project.ClientName}
                  </div>
                )}

                {project.Description && (
                  <p style={{
                    fontSize: '12px', color: '#8b9ab3',
                    lineHeight: 1.6, marginBottom: '14px',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>{project.Description}</p>
                )}

                <div style={{
                  display: 'flex', gap: '16px',
                  padding: '10px 0',
                  borderTop: '1px solid #1e2d45',
                  borderBottom: '1px solid #1e2d45',
                  marginBottom: '14px',
                }}>
                  {[
                    { label: 'Tasks', value: project._count?.tasks || 0 },
                    { label: 'Docs', value: project._count?.documents || 0 },
                    { label: 'Members', value: project.assignments?.length || 0 },
                  ].map(stat => (
                    <div key={stat.label} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: '16px', fontWeight: 700, color: '#00d4ff',
                      }}>{stat.value}</div>
                      <div style={{ fontSize: '10px', color: '#8b9ab3' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {project.StartDate && (
                  <div style={{
                    fontSize: '11px', color: '#8b9ab3',
                    marginBottom: '14px',
                  }}>
                    Started: {new Date(project.StartDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                    {project.EndDate && ` → ${new Date(project.EndDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}`}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setEditProject(project)}
                    style={{
                      flex: 1, padding: '7px',
                      background: 'rgba(0,212,255,0.06)',
                      border: '1px solid rgba(0,212,255,0.15)',
                      borderRadius: '7px', color: '#00d4ff',
                      fontSize: '12px', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.06)')}
                  >Edit</button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${project.ProjectName}"?`)) {
                        deleteMutation.mutate(project.ProjectID)
                      }
                    }}
                    style={{
                      flex: 1, padding: '7px',
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: '7px', color: '#ef4444',
                      fontSize: '12px', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                  >Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showModal || editProject) && (
        <ProjectModal
          onClose={() => { setShowModal(false); setEditProject(null) }}
          onSubmit={handleSubmit}
          initial={editProject}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </Layout>
  )
}