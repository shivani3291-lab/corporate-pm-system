import { useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { tasksAPI, projectsAPI } from '../services/api'
import toast from 'react-hot-toast'

const STATUS_OPTS = ['Pending', 'In Progress', 'Completed', 'On Hold'] as const
const PRIORITY_OPTS = ['Low', 'Medium', 'High'] as const

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
          }}>{initial ? 'Manage task' : 'New task'}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: '#b8c2d6', fontSize: '20px', cursor: 'pointer',
          }}>×</button>
        </div>

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
              color: '#b8c2d6', marginBottom: '6px',
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

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '12px', marginBottom: '24px',
        }}>
          {[
            { label: 'Status', key: 'status', options: STATUS_OPTS },
            { label: 'Priority', key: 'priority', options: PRIORITY_OPTS },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: 600,
                color: '#b8c2d6', marginBottom: '6px',
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
          >{loading ? 'Saving...' : 'Save task'}</button>
        </div>
      </div>
    </div>
  )
}

function taskAiHint(task: any, overdue: boolean): string | null {
  if (task.Status === 'Completed') return null
  if (overdue) return 'This task is overdue — reassign or escalate?'
  if (!task.DueDate) return null
  const due = new Date(task.DueDate).getTime()
  const days = Math.ceil((due - Date.now()) / 86400000)
  if (days >= 0 && days <= 3)
    return 'This task may miss deadline — reassign or reprioritize?'
  return null
}

export default function Tasks() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const projectIdParam = searchParams.get('projectId')
  const projectIdFilter = projectIdParam ? parseInt(projectIdParam, 10) : undefined
  const projectIdValid = projectIdFilter !== undefined && !Number.isNaN(projectIdFilter)

  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectIdValid ? projectIdFilter : 'all'],
    queryFn: () =>
      tasksAPI
        .getAll(projectIdValid ? { projectId: projectIdFilter } : undefined)
        .then((r) => r.data),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(r => r.data),
  })

  const filteredProject = useMemo(() => {
    if (!projectIdValid) return null
    return (projects as any[]).find((p) => p.ProjectID === projectIdFilter) || null
  }, [projects, projectIdValid, projectIdFilter])

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully')
      setShowModal(false)
    },
    onError: () => toast.error('Failed to create task'),
  })

  const patchTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      tasksAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => toast.error('Failed to update task'),
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
      toast.success('Task removed')
    },
    onError: () => toast.error('Failed to remove task'),
  })

  const filtered = useMemo(() => {
    return (tasks as any[]).filter((t) => {
      const statusOk = statusFilter === 'All' || t.Status === statusFilter
      const priorityOk = priorityFilter === 'All' || t.Priority === priorityFilter
      return statusOk && priorityOk
    })
  }, [tasks, statusFilter, priorityFilter])

  const isOverdue = useCallback(
    (task: any) =>
      Boolean(
        task.DueDate &&
          new Date(task.DueDate) < new Date() &&
          task.Status !== 'Completed',
      ),
    [],
  )

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allFilteredIds = filtered.map((t: any) => t.TaskID as number)
  const allSelected =
    filtered.length > 0 && allFilteredIds.every((id) => selected.has(id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allFilteredIds))
    }
  }

  const clearProjectFilter = () => {
    searchParams.delete('projectId')
    setSearchParams(searchParams, { replace: true })
  }

  const applyBulk = async (patch: { status?: string; priority?: string }) => {
    const ids = [...selected]
    if (ids.length === 0) return
    try {
      await Promise.all(ids.map((id) => tasksAPI.update(id, patch)))
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Updated ${ids.length} task${ids.length === 1 ? '' : 's'}`)
      setSelected(new Set())
    } catch {
      toast.error('Bulk update failed')
    }
  }

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

  const subtitle = projectIdValid && filteredProject
    ? `${tasks.length} tasks · ${filteredProject.ProjectName}`
    : `${tasks.length} total tasks`

  return (
    <Layout title="Tasks" subtitle={subtitle}>
      <div style={{ maxWidth: '1400px' }}>

        {projectIdValid && filteredProject && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'rgba(0,212,255,0.06)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#e2e8f0',
          }}>
            <span>
              Showing tasks for <strong style={{ color: '#00d4ff' }}>{filteredProject.ProjectName}</strong>
            </span>
            <button
              type="button"
              onClick={clearProjectFilter}
              style={{
                background: 'transparent',
                border: '1px solid #1e2d45',
                borderRadius: '8px',
                color: '#b8c2d6',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Show all tasks
            </button>
          </div>
        )}

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
                  color: statusFilter === s ? '#0a0f1e' : '#b8c2d6',
                  transition: 'background 0.15s, border-color 0.15s',
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
                  color: priorityFilter === p ? '#fff' : '#b8c2d6',
                  transition: 'background 0.15s',
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

        {selected.size > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#0d1526',
            border: '1px solid #1e2d45',
            borderRadius: '10px',
          }}>
            <span style={{ fontSize: '13px', color: '#f0f4ff', fontWeight: 600 }}>
              {selected.size} selected
            </span>
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value
                e.target.selectedIndex = 0
                if (v) applyBulk({ status: v })
              }}
              style={{
                padding: '8px 10px',
                background: '#111827',
                border: '1px solid #1e2d45',
                borderRadius: '8px',
                color: '#f0f4ff',
                fontSize: '12px',
              }}
            >
              <option value="">Set status…</option>
              {STATUS_OPTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value
                e.target.selectedIndex = 0
                if (v) applyBulk({ priority: v })
              }}
              style={{
                padding: '8px 10px',
                background: '#111827',
                border: '1px solid #1e2d45',
                borderRadius: '8px',
                color: '#f0f4ff',
                fontSize: '12px',
              }}
            >
              <option value="">Set priority…</option>
              {PRIORITY_OPTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: '1px solid #1e2d45',
                borderRadius: '8px',
                color: '#b8c2d6',
                padding: '8px 14px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Clear selection
            </button>
          </div>
        )}

        <div style={{
          background: '#111827',
          border: '1px solid #1e2d45',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 2fr 1fr 1fr 1fr 1fr 110px',
            padding: '12px 20px',
            borderBottom: '1px solid #1e2d45',
            fontSize: '11px', fontWeight: 600,
            color: '#b8c2d6', textTransform: 'uppercase',
            letterSpacing: '0.5px',
            alignItems: 'center',
            gap: '8px',
          }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              style={{ cursor: 'pointer' }}
              title="Select visible"
            />
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
              color: '#b8c2d6', fontSize: '13px',
            }}>
              No tasks yet. Create one or get suggestions.
            </div>
          ) : (
            filtered.map((task: any) => {
              const overdue = isOverdue(task)
              const hint = taskAiHint(task, overdue)
              const rowBg = overdue
                ? 'linear-gradient(90deg, rgba(127,29,29,0.35) 0%, rgba(239,68,68,0.08) 12%, transparent 55%)'
                : 'transparent'
              return (
              <div
                key={task.TaskID}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 2fr 1fr 1fr 1fr 1fr 110px',
                  padding: '14px 20px',
                  borderBottom: '1px solid #1e2d45',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.15s, box-shadow 0.15s',
                  background: rowBg,
                  boxShadow: overdue ? 'inset 3px 0 0 #ef4444' : 'none',
                }}
                onMouseEnter={e => {
                  if (!overdue) e.currentTarget.style.background = '#0d1526'
                  else e.currentTarget.style.background =
                    'linear-gradient(90deg, rgba(127,29,29,0.45) 0%, rgba(239,68,68,0.12) 14%, rgba(239,68,68,0.04) 100%)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = rowBg
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(task.TaskID)}
                  onChange={() => toggleSelect(task.TaskID)}
                  style={{ cursor: 'pointer' }}
                />
                <div>
                  <div style={{
                    fontSize: '13px', fontWeight: 500,
                    color: task.Status === 'Completed' ? '#4a5568' : '#f0f4ff',
                    textDecoration: task.Status === 'Completed' ? 'line-through' : 'none',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}>
                    {overdue && <span style={{ color: '#fca5a5', fontSize: '14px' }} aria-hidden>⚠</span>}
                    <span>{task.TaskName}</span>
                  </div>
                  {overdue && (
                    <span style={{
                      fontSize: '10px', color: '#fecaca',
                      background: 'rgba(239,68,68,0.2)',
                      padding: '2px 8px', borderRadius: '4px',
                      fontWeight: 600,
                    }}>Overdue</span>
                  )}
                  {hint && (
                    <div style={{
                      fontSize: '10px',
                      color: '#a5b4fc',
                      marginTop: '6px',
                      lineHeight: 1.4,
                      maxWidth: '420px',
                    }}>
                      {hint}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#b8c2d6' }}>
                  {task.project?.ProjectName || '—'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: overdue ? '#fca5a5' : '#b8c2d6',
                  fontWeight: overdue ? 600 : 400,
                }}>
                  {task.DueDate
                    ? new Date(task.DueDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })
                    : '—'}
                </div>
                <div>
                  <select
                    value={task.Priority || 'Medium'}
                    onChange={(e) =>
                      patchTaskMutation.mutate({
                        id: task.TaskID,
                        data: { priority: e.target.value },
                      })
                    }
                    style={{
                      padding: '6px 8px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: '1px solid #1e2d45',
                      background: '#0d1526',
                      color: '#f0f4ff',
                      cursor: 'pointer',
                      maxWidth: '100%',
                    }}
                  >
                    {PRIORITY_OPTS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={task.Status || 'Pending'}
                    onChange={(e) =>
                      patchTaskMutation.mutate({
                        id: task.TaskID,
                        data: { status: e.target.value },
                      })
                    }
                    style={{
                      padding: '6px 8px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: '1px solid #1e2d45',
                      background: '#0d1526',
                      color: '#f0f4ff',
                      cursor: 'pointer',
                      maxWidth: '100%',
                    }}
                  >
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setEditTask(task)}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(0,212,255,0.06)',
                      border: '1px solid rgba(0,212,255,0.15)',
                      borderRadius: '6px', color: '#00d4ff',
                      fontSize: '11px', cursor: 'pointer',
                    }}
                  >Manage</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove "${task.TaskName}"?`)) {
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
                  >Remove</button>
                </div>
              </div>
            )})
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
