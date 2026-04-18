import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { projectsAPI, aiAPI, tasksAPI } from '../services/api'
import toast from 'react-hot-toast'

function DelayRiskBadge({
  risk,
}: {
  risk: { riskScore: number; riskLevel: string; reason: string }
}) {
  const colors: Record<string, { bg: string; color: string }> = {
    'On Track': { bg: 'rgba(16,185,129,0.14)', color: '#10b981' },
    'At Risk': { bg: 'rgba(245,158,11,0.14)', color: '#f59e0b' },
    'Likely Delayed': { bg: 'rgba(239,68,68,0.14)', color: '#ef4444' },
  }
  const c = colors[risk.riskLevel] || {
    bg: 'rgba(107,114,128,0.14)',
    color: '#9ca3af',
  }
  const explain =
    risk.riskLevel !== 'On Track'
      ? `${risk.riskScore}% risk — ${risk.reason.slice(0, 72)}${risk.reason.length > 72 ? '…' : ''}`
      : `On track (${risk.riskScore}% residual risk)`
  return (
    <div style={{ maxWidth: '100%' }}>
      <span
        title={risk.reason}
        style={{
          fontSize: '10px',
          padding: '3px 8px',
          borderRadius: '20px',
          fontWeight: 600,
          background: c.bg,
          color: c.color,
          cursor: 'help',
          display: 'inline-block',
          wordBreak: 'break-word',   
          whiteSpace: 'normal',      
          textAlign: 'center',       
        }}
      >
        Schedule: {risk.riskLevel}
      </span>
      <div
        style={{
        fontSize: '9px',
        color: '#b8c2d6',
        marginTop: '4px',
        lineHeight: 1.35,
        wordBreak: 'break-word',   // ← add
        whiteSpace: 'normal',      // ← add
        textAlign: 'right',        // ← add
        maxWidth: '160px',         // ← add
      }}
      >
        {explain}
      </div>
    </div>
  )
}

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
      whiteSpace: 'nowrap',        
      display: 'inline-block',     
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
        color: '#b8c2d6', marginBottom: '6px',
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
          }}>{initial ? 'Manage project' : 'New project'}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: '#b8c2d6', fontSize: '20px', cursor: 'pointer',
          }}>×</button>
        </div>

        {field('Project Name', 'projectName')}
        {field('Client Name', 'clientName')}

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 600,
            color: '#b8c2d6', marginBottom: '6px',
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
            color: '#b8c2d6', marginBottom: '6px',
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
          >{loading ? 'Saving...' : 'Save Project'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<any>(null)
  const [filter, setFilter] = useState('All')

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(r => r.data),
  })

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksAPI.getAll().then((r) => r.data),
  })

  const taskStatsByProject = useMemo(() => {
    const m: Record<number, { total: number; completed: number }> = {}
    for (const t of allTasks as any[]) {
      const pid = t.ProjectID
      if (!m[pid]) m[pid] = { total: 0, completed: 0 }
      m[pid].total++
      if (t.Status === 'Completed') m[pid].completed++
    }
    return m
  }, [allTasks])

  const projectIds = useMemo(
    () => (projects as any[]).map((p) => p.ProjectID as number),
    [projects],
  )
  const projectIdsKey = useMemo(
    () => [...projectIds].sort((a, b) => a - b).join(','),
    [projectIds],
  )

  const { data: delayByProject = {} } = useQuery({
    queryKey: ['project-delays', projectIdsKey],
    queryFn: async () => {
      const r = await aiAPI.predictDelayBatch(projectIds)
      const map: Record<
        number,
        { riskScore: number; riskLevel: string; reason: string }
      > = {}
      for (const row of r.data.results) {
        map[row.projectId] = {
          riskScore: row.riskScore,
          riskLevel: row.riskLevel,
          reason: row.reason,
        }
      }
      return map
    },
    enabled: projectIds.length > 0,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => projectsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project-delays'] })
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
      queryClient.invalidateQueries({ queryKey: ['project-delays'] })
      toast.success('Project updated successfully')
      setEditProject(null)
    },
    onError: () => toast.error('Failed to update project'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project-delays'] })
      toast.success('Project deleted')
    },
    onError: () => toast.error('Failed to delete project'),
  })

  const statuses = ['All', 'Active', 'In Progress', 'Completed', 'On Hold', 'Pending']

  const filtered = filter === 'All'
    ? projects
    : projects.filter((p: any) => p.Status === filter)

  const riskSort = (level: string | undefined) =>
    level === 'Likely Delayed' ? 0 : level === 'At Risk' ? 1 : 2

  const sortedFiltered = useMemo(() => {
    const arr = [...(filtered as any[])]
    arr.sort((a, b) => {
      const da = delayByProject[a.ProjectID]
      const db = delayByProject[b.ProjectID]
      const ra = da ? riskSort(da.riskLevel) : 3
      const rb = db ? riskSort(db.riskLevel) : 3
      if (ra !== rb) return ra - rb
      return String(a.ProjectName).localeCompare(String(b.ProjectName))
    })
    return arr
  }, [filtered, delayByProject])

  const handleSubmit = (data: ProjectFormData) => {
    if (editProject) {
      updateMutation.mutate({ id: editProject.ProjectID, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Layout title="Projects" subtitle={`${projects.length} initiatives · higher schedule risk shown first`}>
      <div style={{ maxWidth: '1400px' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minWidth: 0,  }}>
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: '6px 14px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  border: filter === s ? 'none' : '1px solid #1e2d45',
                  background: filter === s ? '#00d4ff' : 'transparent',
                  color: filter === s ? '#0a0f1e' : '#b8c2d6',
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
            <div style={{ fontSize: '13px', color: '#b8c2d6', marginBottom: '20px' }}>
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
            {sortedFiltered.map((project: any) => {
              const risk = delayByProject[project.ProjectID]
              const highRisk =
                risk?.riskLevel === 'Likely Delayed' || risk?.riskLevel === 'At Risk'
              const stats = taskStatsByProject[project.ProjectID]
              const pct =
                stats && stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0
              const end = project.EndDate ? new Date(project.EndDate) : null
              const daysLeft = end
                ? Math.ceil((end.getTime() - Date.now()) / 86400000)
                : null
              return (
              <div
                key={project.ProjectID}
                style={{
                  background: 'linear-gradient(145deg, #111827 0%, #0d1526 100%)',
                  border: highRisk
                    ? '1px solid rgba(239,68,68,0.45)'
                    : '1px solid #1e2d45',
                  borderRadius: '12px', padding: '20px',
                  transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                  boxShadow: highRisk ? '0 0 24px rgba(239,68,68,0.12)' : 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = highRisk ? 'rgba(248,113,113,0.55)' : '#2a3f5f'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = highRisk ? 'rgba(239,68,68,0.45)' : '#1e2d45'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: '10px', gap: '8px',
                }}>
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '15px', fontWeight: 700,
                    color: '#f0f4ff', flex: 1, marginRight: '10px', minWidth: 0, wordBreak: 'break-word',
                  }}>{project.ProjectName}</h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '6px',
                    flexShrink: 1,
                    maxWidth: '55%', 
                    minWidth: 0, 
                  }}>
                    <StatusBadge status={project.Status || 'Active'} />
                    {delayByProject[project.ProjectID] && (
                      <DelayRiskBadge risk={delayByProject[project.ProjectID]} />
                    )}
                  </div>
                </div>

                {project.ClientName && (
                  <div style={{
                    fontSize: '12px', color: '#b8c2d6', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    ◎ {project.ClientName}
                  </div>
                )}

                {project.Description && (
                  <p style={{
                    fontSize: '12px', color: '#b8c2d6',
                    lineHeight: 1.6, marginBottom: '12px',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>{project.Description}</p>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#b8c2d6', marginBottom: '4px' }}>
                    <span>Progress</span>
                    <span>{pct}% complete</span>
                  </div>
                  <div style={{ height: '6px', background: '#1e2d45', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {daysLeft !== null && (
                  <div style={{ fontSize: '11px', color: daysLeft < 14 ? '#f59e0b' : '#b8c2d6', marginBottom: '12px' }}>
                    {daysLeft < 0
                      ? `Deadline passed ${Math.abs(daysLeft)}d ago`
                      : `Deadline in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                  </div>
                )}

                {project.assignments?.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {project.assignments.slice(0, 5).map((a: any) => {
                      const fn = a.employee?.FirstName || '?'
                      const ln = a.employee?.LastName || ''
                      const ini = `${fn[0] || ''}${ln[0] || ''}`.toUpperCase()
                      return (
                        <div
                          key={a.AssignmentID}
                          title={`${fn} ${ln}`}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#fff',
                            border: '2px solid #1e2d45',
                          }}
                        >{ini}</div>
                      )
                    })}
                  </div>
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
                      <div style={{ fontSize: '10px', color: '#b8c2d6' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {project.StartDate && (
                  <div style={{
                    fontSize: '11px', color: '#b8c2d6',
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/tasks?projectId=${project.ProjectID}`)}
                    style={{
                      width: '100%',
                      padding: '9px',
                      background: '#00d4ff',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#0a0f1e',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    View Details
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditProject(project) }}
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
                    >Manage</button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Remove "${project.ProjectName}"?`)) {
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
                    >Remove</button>
                  </div>
                </div>
              </div>
            )})}
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