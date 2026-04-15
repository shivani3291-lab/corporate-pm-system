import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import { projectsAPI, tasksAPI, documentsAPI, employeesAPI } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

const taskChartData = [
  { month: 'Nov', completed: 28, pending: 18 },
  { month: 'Dec', completed: 35, pending: 22 },
  { month: 'Jan', completed: 22, pending: 30 },
  { month: 'Feb', completed: 42, pending: 25 },
  { month: 'Mar', completed: 38, pending: 20 },
  { month: 'Apr', completed: 45, pending: 15 },
]

function MetricCard({
  label, value, change, changeType, accent
}: {
  label: string
  value: string | number
  change: string
  changeType: 'up' | 'down'
  accent: string
}) {
  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1e2d45',
      borderRadius: '12px',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '2px', background: accent,
      }} />
      <div style={{
        fontSize: '11px', color: '#8b9ab3',
        textTransform: 'uppercase', letterSpacing: '1px',
        marginBottom: '10px', fontWeight: 600,
      }}>{label}</div>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '28px', fontWeight: 800,
        color: accent, marginBottom: '6px',
      }}>{value}</div>
      <div style={{
        fontSize: '11px',
        color: changeType === 'up' ? '#10b981' : '#ef4444',
        display: 'flex', alignItems: 'center', gap: '3px',
      }}>
        {changeType === 'up' ? '↑' : '↓'} {change}
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    High: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    Medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Low: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  }
  const c = colors[priority] || colors.Medium
  return (
    <span style={{
      fontSize: '10px', padding: '2px 8px',
      borderRadius: '4px', fontWeight: 600,
      background: c.bg, color: c.color,
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>{priority}</span>
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
      fontSize: '10px', padding: '3px 8px',
      borderRadius: '20px', fontWeight: 600,
      background: c.bg, color: c.color,
    }}>{status}</span>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(r => r.data),
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksAPI.getAll().then(r => r.data),
  })

  const { data: overdueTasks } = useQuery({
    queryKey: ['tasks-overdue'],
    queryFn: () => tasksAPI.getOverdue().then(r => r.data),
  })

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsAPI.getAll().then(r => r.data),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesAPI.getAll().then(r => r.data),
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric'
  })

  const activeProjects = projects?.filter((p: any) => p.Status === 'Active') || []
  const pendingTasks = tasks?.filter((t: any) => t.Status !== 'Completed') || []
  const recentTasks = tasks?.slice(0, 5) || []
  const recentProjects = projects?.slice(0, 4) || []

  const statusCounts = projects?.reduce((acc: any, p: any) => {
    acc[p.Status] = (acc[p.Status] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <Layout title="Dashboard" subtitle={today}>
      <div style={{ maxWidth: '1400px' }}>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '24px',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '22px', fontWeight: 800,
              color: '#f0f4ff', marginBottom: '4px',
            }}>
              {greeting()}, {user?.firstName} ✦
            </h1>
            <p style={{ fontSize: '13px', color: '#8b9ab3' }}>
              {overdueTasks?.length > 0
                ? `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} — let's get them done.`
                : 'Everything is on track. Great work!'}
            </p>
          </div>
          <button style={{
            background: '#00d4ff', color: '#0a0f1e',
            border: 'none', borderRadius: '10px',
            padding: '10px 20px', fontSize: '13px',
            fontWeight: 700, fontFamily: 'Syne, sans-serif',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '6px',
          }}>
            ⊕ New Project
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px', marginBottom: '24px',
        }}>
          <MetricCard
            label="Active Projects"
            value={activeProjects.length || projects?.length || 0}
            change="This month"
            changeType="up"
            accent="#00d4ff"
          />
          <MetricCard
            label="Total Tasks"
            value={tasks?.length || 0}
            change={`${overdueTasks?.length || 0} overdue`}
            changeType={overdueTasks?.length > 0 ? 'down' : 'up'}
            accent="#7c3aed"
          />
          <MetricCard
            label="Documents"
            value={documents?.length || 0}
            change="Stored securely"
            changeType="up"
            accent="#10b981"
          />
          <MetricCard
            label="Team Members"
            value={employees?.length || 0}
            change="In your workspace"
            changeType="up"
            accent="#f59e0b"
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '16px', marginBottom: '24px',
        }}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px', padding: '20px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '20px',
            }}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px', fontWeight: 700, color: '#f0f4ff',
              }}>Task completion</h3>
              <span style={{ fontSize: '11px', color: '#8b9ab3' }}>Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={taskChartData} barGap={4}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8b9ab3', fontSize: 11 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: '#0d1526',
                    border: '1px solid #1e2d45',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f0f4ff',
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="completed" fill="#00d4ff" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="pending" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              {[
                { color: '#00d4ff', label: 'Completed' },
                { color: '#7c3aed', label: 'Pending' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center',
                  gap: '6px', fontSize: '11px', color: '#8b9ab3',
                }}>
                  <div style={{
                    width: '8px', height: '8px',
                    borderRadius: '2px', background: item.color,
                  }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px', padding: '20px',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px', fontWeight: 700,
              color: '#f0f4ff', marginBottom: '16px',
            }}>Project status</h3>

            {Object.entries(statusCounts).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(statusCounts).map(([status, count]: any) => {
                  const total = projects?.length || 1
                  const pct = Math.round((count / total) * 100)
                  const colors: Record<string, string> = {
                    Active: '#00d4ff', Completed: '#10b981',
                    'In Progress': '#7c3aed', Pending: '#f59e0b',
                    'On Hold': '#6b7280',
                  }
                  const color = colors[status] || '#6b7280'
                  return (
                    <div key={status}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginBottom: '5px',
                      }}>
                        <span style={{ fontSize: '12px', color: '#c8d8f0' }}>{status}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color }}>{count}</span>
                      </div>
                      <div style={{
                        height: '4px', background: '#1e2d45',
                        borderRadius: '2px', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: color, borderRadius: '2px',
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#4a5568', textAlign: 'center', padding: '20px 0' }}>
                No projects yet
              </div>
            )}

            <div style={{
              marginTop: '20px', padding: '12px',
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: '8px',
            }}>
              <div style={{
                fontSize: '10px', color: '#8b9ab3',
                textTransform: 'uppercase', letterSpacing: '1px',
                marginBottom: '6px', fontWeight: 600,
              }}>AI Insight</div>
              <div style={{ fontSize: '12px', color: '#c8d8f0', lineHeight: 1.6 }}>
                ✦ {overdueTasks?.length > 0
                  ? `${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue. Review and reassign to stay on track.`
                  : 'All tasks are on schedule. Team velocity looks healthy.'}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px', padding: '20px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px',
            }}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px', fontWeight: 700, color: '#f0f4ff',
              }}>Recent tasks</h3>
              <span style={{ fontSize: '11px', color: '#00d4ff', cursor: 'pointer' }}>
                View all →
              </span>
            </div>

            {recentTasks.length > 0 ? (
              recentTasks.map((task: any) => (
                <div key={task.TaskID} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 0',
                  borderBottom: '1px solid #1e2d45',
                }}>
                  <div style={{
                    width: '18px', height: '18px',
                    borderRadius: '4px',
                    border: task.Status === 'Completed'
                      ? 'none' : '1px solid #2a3f5f',
                    background: task.Status === 'Completed'
                      ? '#10b981' : 'transparent',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                    fontSize: '10px', color: '#fff',
                  }}>
                    {task.Status === 'Completed' ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 500,
                      color: task.Status === 'Completed' ? '#4a5568' : '#f0f4ff',
                      textDecoration: task.Status === 'Completed' ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{task.TaskName}</div>
                    <div style={{ fontSize: '11px', color: '#8b9ab3', marginTop: '2px' }}>
                      {task.project?.ProjectName || 'No project'} ·{' '}
                      {task.DueDate
                        ? new Date(task.DueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'No due date'}
                    </div>
                  </div>
                  <PriorityBadge priority={task.Priority || 'Medium'} />
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: '#4a5568', textAlign: 'center', padding: '20px 0' }}>
                No tasks yet — create your first task
              </div>
            )}
          </div>

          <div style={{
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px', padding: '20px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px',
            }}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px', fontWeight: 700, color: '#f0f4ff',
              }}>Recent projects</h3>
              <span style={{ fontSize: '11px', color: '#00d4ff', cursor: 'pointer' }}>
                View all →
              </span>
            </div>

            {recentProjects.length > 0 ? (
              recentProjects.map((project: any) => (
                <div key={project.ProjectID} style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #1e2d45',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '6px',
                  }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 500, color: '#f0f4ff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: '200px',
                    }}>{project.ProjectName}</div>
                    <StatusBadge status={project.Status || 'Active'} />
                  </div>
                  <div style={{
                    fontSize: '11px', color: '#8b9ab3',
                    display: 'flex', gap: '12px',
                  }}>
                    <span>Client: {project.ClientName || 'Internal'}</span>
                    <span>Tasks: {project._count?.tasks || 0}</span>
                    <span>Docs: {project._count?.documents || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: '#4a5568', textAlign: 'center', padding: '20px 0' }}>
                No projects yet — create your first project
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}