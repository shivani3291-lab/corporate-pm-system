import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { tasksAPI, projectsAPI } from '../services/api'
import toast from 'react-hot-toast'

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    High: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    Medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Low: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  }
  const c = colors[priority] || colors.Medium
  return (
    <span style={{
      fontSize: '10px', padding: '3px 8px',
      borderRadius: '4px', fontWeight: 600,
      background: c.bg, color: c.color,
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>{priority}</span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Completed: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    'In Progress': { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' },
    Pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    'On Hold': { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  }
  const c = colors[status] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' }
  return (
    <span style={{
      fontSize: '10px', padding: '3px 8px',
      borderRadius: '4px', fontWeight: 600,
      background: c.bg, color: c.color,
    }}>{status}</span>
  )
}

function TaskModal({
  onClose, onSubmit, initial, loading, projects
}: {
  onClose: () => void
  onSubmit: (data: any) => void
  initial?: any
  loading: boolean
  projects: any[]
}) {
  const [form, setForm] = useState({
    projectId: initial?.ProjectID || '',
    taskName: initial?.TaskName || '',
    description: initial?.Description || '',
    dueDate: initial?.DueDate?.split('T')[0] || '',
    status: initial?.Status || 'Pending',
    priority: initial?.Priority || 'Medium',
  })

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
          }}>{initial ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: '#8b9ab3', fontSize: '20px', cursor: 'pointer',
          }}>×</button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 600,
            color: '#8b9ab3', marginBottom: '6px',
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
            <option value="">Select a project</option>
            {projects.map((p: any) => (
              <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
            ))}
          </select>
        </div>

        {[
          { label: 'Task Name', key: 'taskName', type: 'text' },
          { label: 'Due Date', key: 'dueDate', type: 'date' },
        ].map(({ label, key, type }) => (
          <div key={key} style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: 600,
              color: '#8b9ab3', marginBottom: '6px',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
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

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '12px', marginBottom: '24px',
        }}>
          {[
            { label: 'Status', key: 'status', options: ['Pending', 'In Progress', 'Completed', 'On Hold'] },
            { label: 'Priority', key: 'priority', options: ['Low', 'Medium', 'High'] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: 600,
                color: '#8b9ab3', marginBottom: '6px',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>{label}</label>
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
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
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
          >{loading ? 'Saving...' : 'Save Task'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksAPI.getAll().then(r => r.data),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully')
      setShowModal(false)
    },
    onError: () => toast.error('Failed to create task'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      tasksAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated')
      setEditTask(null)
    },
    onError: () => toast.error('Failed to update task'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasksAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })

  const filtered = tasks.filter((t: any) => {
    const statusOk = statusFilter === 'All' || t.Status === statusFilter
    const priorityOk = priorityFilter === 'All' || t.Priority === priorityFilter
    return statusOk && priorityOk
  })

  const isOverdue = (task: any) =>
    task.DueDate && new Date(task.DueDate) < new Date() && task.Status !== 'Completed'

  const handleSubmit = (data: any) => {
    const formatted = {
      ...data,
      projectId: parseInt(data.projectId),
    }
    if (editTask) {
      updateMutation.mutate({ id: editTask.TaskID, data: formatted })
    } else {
      createMutation.mutate(formatted)
    }
  }

  return (
    <Layout title="Tasks" subtitle={`${tasks.length} total tasks`}>
      <div style={{ maxWidth: '1400px' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'Pending', 'In Progress', 'Completed', 'On Hold'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '5px 12px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  border: statusFilter === s ? 'none' : '1px solid #1e2d45',
                  background: statusFilter === s ? '#00d4ff' : 'transparent',
                  color: statusFilter === s ? '#0a0f1e' : '#8b9ab3',
                }}>{s}</button>
              ))}
            </div>
            <div style={{
              width: '1px', background: '#1e2d45', margin: '0 4px',
            }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'High', 'Medium', 'Low'].map(p => (
                <button key={p} onClick={() => setPriorityFilter(p)} style={{
                  padding: '5px 12px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  border: priorityFilter === p ? 'none' : '1px solid #1e2d45',
                  background: priorityFilter === p ? '#7c3aed' : 'transparent',
                  color: priorityFilter === p ? '#fff' : '#8b9ab3',
                }}>{p}</button>
              ))}
            </div>
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
          >⊕ New Task</button>
        </div>

        <div style={{
          background: '#111827',
          border: '1px solid #1e2d45',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
            padding: '12px 20px',
            borderBottom: '1px solid #1e2d45',
            fontSize: '11px', fontWeight: 600,
            color: '#8b9ab3', textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <span>Task</span>
            <span>Project</span>
            <span>Due Date</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1e2d45',
              }}>
                <div className="skeleton" style={{ height: '16px', width: '60%' }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{
              padding: '60px 20px', textAlign: 'center',
              color: '#4a5568', fontSize: '13px',
            }}>
              No tasks found — create your first task
            </div>
          ) : (
            filtered.map((task: any) => (
              <div
                key={task.TaskID}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                  padding: '14px 20px',
                  borderBottom: '1px solid #1e2d45',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                  background: isOverdue(task) ? 'rgba(239,68,68,0.03)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = isOverdue(task) ? 'rgba(239,68,68,0.06)' : '#0d1526')}
                onMouseLeave={e => (e.currentTarget.style.background = isOverdue(task) ? 'rgba(239,68,68,0.03)' : 'transparent')}
              >
                <div>
                  <div style={{
                    fontSize: '13px', fontWeight: 500,
                    color: task.Status === 'Completed' ? '#4a5568' : '#f0f4ff',
                    textDecoration: task.Status === 'Completed' ? 'line-through' : 'none',
                    marginBottom: '2px',
                  }}>{task.TaskName}</div>
                  {isOverdue(task) && (
                    <span style={{
                      fontSize: '10px', color: '#ef4444',
                      background: 'rgba(239,68,68,0.1)',
                      padding: '1px 6px', borderRadius: '4px',
                    }}>Overdue</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#8b9ab3' }}>
                  {task.project?.ProjectName || '—'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: isOverdue(task) ? '#ef4444' : '#8b9ab3',
                }}>
                  {task.DueDate
                    ? new Date(task.DueDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })
                    : '—'}
                </div>
                <div><PriorityBadge priority={task.Priority || 'Medium'} /></div>
                <div><StatusBadge status={task.Status || 'Pending'} /></div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setEditTask(task)}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(0,212,255,0.06)',
                      border: '1px solid rgba(0,212,255,0.15)',
                      borderRadius: '6px', color: '#00d4ff',
                      fontSize: '11px', cursor: 'pointer',
                    }}
                  >Edit</button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${task.TaskName}"?`)) {
                        deleteMutation.mutate(task.TaskID)
                      }
                    }}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: '6px', color: '#ef4444',
                      fontSize: '11px', cursor: 'pointer',
                    }}
                  >Del</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {(showModal || editTask) && (
        <TaskModal
          onClose={() => { setShowModal(false); setEditTask(null) }}
          onSubmit={handleSubmit}
          initial={editTask}
          loading={createMutation.isPending || updateMutation.isPending}
          projects={projects}
        />
      )}
    </Layout>
  )
}