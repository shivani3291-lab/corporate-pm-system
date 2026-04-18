import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import {
  projectsAPI,
  tasksAPI,
  documentsAPI,
  employeesAPI,
  alertsAPI,
  aiAPI,
} from '../services/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

const taskChartData = [
  { month: 'Nov', completed: 28, pending: 18 },
  { month: 'Dec', completed: 35, pending: 22 },
  { month: 'Jan', completed: 22, pending: 30 },
  { month: 'Feb', completed: 42, pending: 25 },
  { month: 'Mar', completed: 38, pending: 20 },
  { month: 'Apr', completed: 45, pending: 15 },
]

type KpiKey = 'projects' | 'tasks' | 'documents' | 'team' | null

function MetricCard({
  label,
  value,
  change,
  changeType,
  accent,
  icon,
  onClick,
}: {
  label: string
  value: string | number
  change: string
  changeType: 'up' | 'down'
  accent: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'linear-gradient(145deg, #111827 0%, #0d1526 100%)',
        border: '1px solid #1e2d45',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.45)'
        e.currentTarget.style.borderColor = accent
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = '#1e2d45'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: accent,
        }}
      />
      <div style={{ fontSize: '18px', marginBottom: '8px', opacity: 0.95 }}>{icon}</div>
      <div
        style={{
          fontSize: '11px',
          color: '#b8c2d6',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '10px',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '28px',
          fontWeight: 800,
          color: accent,
          marginBottom: '6px',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: changeType === 'up' ? '#10b981' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
        }}
      >
        {changeType === 'up' ? '↑' : '↓'} {change}
      </div>
      <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '8px' }}>
        Click for breakdown
      </div>
    </button>
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
    <span
      style={{
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '4px',
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {priority}
    </span>
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
    <span
      style={{
        fontSize: '10px',
        padding: '3px 8px',
        borderRadius: '20px',
        fontWeight: 600,
        background: c.bg,
        color: c.color,
      }}
    >
      {status}
    </span>
  )
}

function KpiModal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#111827',
          border: '1px solid #1e2d45',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '440px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: '#f0f4ff',
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#b8c2d6',
              fontSize: '22px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [kpiModal, setKpiModal] = useState<KpiKey>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then((r) => r.data),
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksAPI.getAll().then((r) => r.data),
  })

  const { data: overdueTasks } = useQuery({
    queryKey: ['tasks-overdue'],
    queryFn: () => tasksAPI.getOverdue().then((r) => r.data),
  })

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsAPI.getAll().then((r) => r.data),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesAPI.getAll().then((r) => r.data),
  })

  const { data: predictiveAlerts = [] } = useQuery({
    queryKey: ['predictive-alerts'],
    queryFn: () => alertsAPI.getAll().then((r) => r.data),
  })

  const projectIds = useMemo(
    () => (projects as any[] | undefined)?.map((p) => p.ProjectID as number) ?? [],
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

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now)

  const istHours = Number(parts.find((p) => p.type === 'hour')?.value)

  const greeting = () => {
    const h = istHours
    if (h >= 0 && h < 5) return 'Good night'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now)

  const activeProjects =
    projects?.filter((p: any) => p.Status === 'Active') || []
  const pendingTasks = tasks?.filter((t: any) => t.Status !== 'Completed') || []
  const recentTasks = tasks?.slice(0, 5) || []
  const recentProjects = projects?.slice(0, 4) || []

  const statusCounts =
    projects?.reduce((acc: any, p: any) => {
      acc[p.Status] = (acc[p.Status] || 0) + 1
      return acc
    }, {}) || {}

  const taskByStatus = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of tasks || []) {
      const s = t.Status || 'Pending'
      m[s] = (m[s] || 0) + 1
    }
    return m
  }, [tasks])

  const atRiskProjects = useMemo(() => {
    if (!projects) return []
    return (projects as any[]).filter((p) => {
      const d = delayByProject[p.ProjectID]
      return d && d.riskLevel !== 'On Track'
    })
  }, [projects, delayByProject])

  const chartAiSummary =
    (overdueTasks?.length || 0) > 0
      ? `Completion velocity is mixed: ${overdueTasks?.length} overdue item(s) require attention.`
      : 'Completion trend is stable — maintain current velocity.'

  const greetingMessage = () => {
    const name = user?.firstName || 'there'
    return `${greeting()}, ${name}. You're doing great — keep the momentum going.`
  }

  return (
    <Layout
      title="Operational Overview"
      subtitle="Where Projects Meet Predictive Intelligence"
    >
      <div style={{ maxWidth: '1400px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '6px',
                letterSpacing: '0.5px',
              }}
            >
              {today}
            </p>
            <h1
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '22px',
                fontWeight: 700,
                color: '#f0f4ff',
                marginBottom: '6px',
              }}
            >
              {greetingMessage()}
            </h1>
            <p style={{ fontSize: '13px', color: '#b8c2d6', maxWidth: '560px' }}>
              {overdueTasks?.length > 0
                ? `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} — prioritize remediation to protect delivery dates.`
                : 'All tracked tasks are current. Portfolio health is within expected range.'}
            </p>
          </div>
        </div>

        {/* Daily Brief */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, #111827 40%)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '10px',
              }}
            >
              Daily brief · Attention
            </div>
            <div style={{ fontSize: '13px', color: '#f0f4ff', marginBottom: '8px' }}>
              <strong>{overdueTasks?.length || 0}</strong> overdue task
              {(overdueTasks?.length || 0) !== 1 ? 's' : ''}
            </div>
            {(overdueTasks?.length || 0) === 0 ? (
              <div style={{ fontSize: '12px', color: '#b8c2d6' }}>
                No overdue tasks. Create one or review upcoming deadlines.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                style={{
                  marginTop: '8px',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                View Details
              </button>
            )}
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, #111827 40%)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#f59e0b',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '10px',
              }}
            >
              At-risk projects
            </div>
            <div style={{ fontSize: '13px', color: '#f0f4ff', marginBottom: '8px' }}>
              <strong>{atRiskProjects.length}</strong> project
              {atRiskProjects.length !== 1 ? 's' : ''} flagged by delay model
            </div>
            {atRiskProjects.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#b8c2d6' }}>
                No schedule risk signals. Monitor tasks as milestones approach.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/projects')}
                style={{
                  marginTop: '8px',
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#fcd34d',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                View Details
              </button>
            )}
          </div>
        </div>

        {/* Insights */}
        <div
          style={{
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#7c3aed',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}
          >
            Intelligence insights
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#c8d8f0', fontSize: '13px', lineHeight: 1.7 }}>
            <li>
              {predictiveAlerts.length > 0
                ? `${predictiveAlerts.length} predictive alert(s) stored — review recommendations below.`
                : 'Run health analysis to populate proactive alerts.'}
            </li>
            <li>
              {Object.keys(taskByStatus).length
                ? `Task mix: ${Object.entries(taskByStatus)
                    .map(([k, v]) => `${k} (${v})`)
                    .join(', ')}.`
                : 'Add tasks to unlock workload intelligence.'}
            </li>
          </ul>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <MetricCard
            icon="◈"
            label="Active projects"
            value={activeProjects.length || projects?.length || 0}
            change="This period"
            changeType="up"
            accent="#00d4ff"
            onClick={() => setKpiModal('projects')}
          />
          <MetricCard
            icon="◇"
            label="Total tasks"
            value={tasks?.length || 0}
            change={`${overdueTasks?.length || 0} overdue`}
            changeType={overdueTasks?.length > 0 ? 'down' : 'up'}
            accent="#7c3aed"
            onClick={() => setKpiModal('tasks')}
          />
          <MetricCard
            icon="▦"
            label="Documents"
            value={documents?.length || 0}
            change="Securely stored and indexed"
            changeType="up"
            accent="#10b981"
            onClick={() => setKpiModal('documents')}
          />
          <MetricCard
            icon="◉"
            label="Team members"
            value={employees?.length || 0}
            change="In your workspace"
            changeType="up"
            accent="#f59e0b"
            onClick={() => setKpiModal('team')}
          />
        </div>

        {kpiModal && (
          <KpiModal
            title={
              kpiModal === 'projects'
                ? 'Active projects'
                : kpiModal === 'tasks'
                  ? 'Tasks'
                  : kpiModal === 'documents'
                    ? 'Documents'
                    : 'Team members'
            }
            onClose={() => setKpiModal(null)}
          >
            {kpiModal === 'tasks' && (
              <div style={{ fontSize: '13px', color: '#c8d8f0' }}>
                <p style={{ marginBottom: '12px' }}>
                  Breakdown by status:{' '}
                  {Object.entries(taskByStatus).map(([k, v]) => (
                    <span key={k} style={{ display: 'inline-block', marginRight: '10px' }}>
                      {k}: <strong>{v}</strong>
                    </span>
                  ))}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setKpiModal(null)
                    navigate('/tasks')
                  }}
                  style={{
                    background: '#00d4ff',
                    color: '#0a0f1e',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Details
                </button>
              </div>
            )}
            {kpiModal === 'projects' && (
              <div style={{ fontSize: '13px', color: '#c8d8f0' }}>
                {Object.entries(statusCounts).map(([s, c]: any) => (
                  <div key={s} style={{ marginBottom: '8px' }}>
                    {s}: <strong>{c}</strong>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setKpiModal(null)
                    navigate('/projects')
                  }}
                  style={{
                    marginTop: '12px',
                    background: '#00d4ff',
                    color: '#0a0f1e',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Details
                </button>
              </div>
            )}
            {kpiModal === 'documents' && (
              <div style={{ fontSize: '13px', color: '#c8d8f0' }}>
                <p>{documents?.length || 0} documents securely stored and indexed.</p>
                <button
                  type="button"
                  onClick={() => {
                    setKpiModal(null)
                    navigate('/documents')
                  }}
                  style={{
                    marginTop: '12px',
                    background: '#00d4ff',
                    color: '#0a0f1e',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Details
                </button>
              </div>
            )}
            {kpiModal === 'team' && (
              <div style={{ fontSize: '13px', color: '#c8d8f0' }}>
                <p>{employees?.length || 0} employees in directory.</p>
                <button
                  type="button"
                  onClick={() => {
                    setKpiModal(null)
                    navigate('/employees')
                  }}
                  style={{
                    marginTop: '12px',
                    background: '#00d4ff',
                    color: '#0a0f1e',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Details
                </button>
              </div>
            )}
          </KpiModal>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(145deg, #111827 0%, #0d1526 100%)',
              border: '1px solid #1e2d45',
              borderRadius: '12px',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#f0f4ff',
                }}
              >
                Task completion
              </h3>
              <span style={{ fontSize: '11px', color: '#b8c2d6' }}>Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={taskChartData} barGap={4}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#b8c2d6', fontSize: 11 }}
                />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const c = payload.find((p) => p.dataKey === 'completed')?.value
                    const pnd = payload.find((p) => p.dataKey === 'pending')?.value
                    return (
                      <div
                        style={{
                          background: '#0d1526',
                          border: '1px solid #1e2d45',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: '#f0f4ff',
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: '6px' }}>{label}</div>
                        <div>Completed: {c}</div>
                        <div>Pending: {pnd}</div>
                        <div style={{ marginTop: '6px', color: '#b8c2d6', fontSize: '11px' }}>
                          Insight: {Number(c) > Number(pnd) ? 'Throughput exceeds backlog.' : 'Backlog elevated — review capacity.'}
                        </div>
                      </div>
                    )
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
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#b8c2d6',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: item.color,
                    }}
                  />
                  {item.label}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '14px',
                padding: '10px 12px',
                background: 'rgba(124,58,237,0.06)',
                borderRadius: '8px',
                border: '1px solid rgba(124,58,237,0.15)',
                fontSize: '12px',
                color: '#c4b5fd',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: '#a78bfa' }}>AI-generated summary:</strong> {chartAiSummary}
            </div>
          </div>

          <div
            style={{
              background: '#111827',
              border: '1px solid #1e2d45',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h3
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: '#f0f4ff',
                marginBottom: '16px',
              }}
            >
              Project status
            </h3>

            {Object.entries(statusCounts).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(statusCounts).map(([status, count]: any) => {
                  const total = projects?.length || 1
                  const pct = Math.round((count / total) * 100)
                  const colors: Record<string, string> = {
                    Active: '#00d4ff',
                    Completed: '#10b981',
                    'In Progress': '#7c3aed',
                    Pending: '#f59e0b',
                    'On Hold': '#6b7280',
                  }
                  const color = colors[status] || '#6b7280'
                  return (
                    <div key={status}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '5px',
                        }}
                      >
                        <span style={{ fontSize: '12px', color: '#c8d8f0' }}>{status}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color }}>{count}</span>
                      </div>
                      <div
                        style={{
                          height: '4px',
                          background: '#1e2d45',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: color,
                            borderRadius: '2px',
                            transition: 'width 0.8s ease',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div
                style={{
                  fontSize: '13px',
                  color: '#4a5568',
                  textAlign: 'center',
                  padding: '20px 0',
                }}
              >
                No projects yet. Create one or get suggestions from the team.
              </div>
            )}

            <div
              style={{
                marginTop: '20px',
                padding: '12px',
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.1)',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#b8c2d6',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                AI insight
              </div>
              <div style={{ fontSize: '12px', color: '#c8d8f0', lineHeight: 1.6 }}>
                ✦{' '}
                {overdueTasks?.length > 0
                  ? `${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue. Review and reassign to stay on track.`
                  : 'All tasks are on schedule. Team velocity looks healthy.'}
              </div>
            </div>
          </div>
        </div>

        {/* Predictive alerts — dominant */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(239,68,68,0.06) 0%, #111827 24%)',
            border: '2px solid rgba(245,158,11,0.35)',
            borderRadius: '14px',
            padding: '22px',
            marginBottom: '24px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#f0f4ff',
                  marginBottom: '4px',
                }}
              >
                Predictive alerts
              </h3>
              <span style={{ fontSize: '11px', color: '#f59e0b' }}>
                Nightly pipeline · delay risk · severity · escalation
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#0a0f1e',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              View Recommendations
            </button>
          </div>
          {predictiveAlerts.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#b8c2d6', padding: '8px 0' }}>
              No stored alerts yet. The job runs on schedule (default: daily), or trigger analysis from the API.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '280px',
                overflowY: 'auto',
              }}
            >
              {predictiveAlerts.slice(0, 20).map((a) => {
                const isCrit = a.Severity === 'Critical'
                const isWarn = a.Severity === 'Warning'
                return (
                  <div
                    key={a.AlertID}
                    style={{
                      padding: '14px',
                      background: isCrit
                        ? 'rgba(239,68,68,0.12)'
                        : isWarn
                          ? 'rgba(245,158,11,0.1)'
                          : '#0d1526',
                      borderRadius: '10px',
                      border: `1px solid ${
                        isCrit ? 'rgba(239,68,68,0.45)' : isWarn ? 'rgba(245,158,11,0.4)' : '#1e2d45'
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#f0f4ff',
                        }}
                      >
                        {a.project?.ProjectName || `Project #${a.ProjectID}`}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: isCrit
                            ? 'rgba(239,68,68,0.25)'
                            : isWarn
                              ? 'rgba(245,158,11,0.25)'
                              : 'rgba(0,212,255,0.12)',
                          color: isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#b8c2d6',
                        }}
                      >
                        {a.Severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#7c3aed', marginBottom: '4px' }}>
                      {a.AlertType}
                      {a.TaskID != null ? ` · Task #${a.TaskID}` : ''}
                    </div>
                    {a.Message && (
                      <div style={{ fontSize: '12px', color: '#c8d8f0', lineHeight: 1.5 }}>
                        {a.Message}
                      </div>
                    )}
                    <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '6px' }}>
                      {new Date(a.CreatedAt).toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <div
            style={{
              background: '#111827',
              border: '1px solid #1e2d45',
              borderRadius: '12px',
              padding: '20px',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a3f5f')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2d45')}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#f0f4ff',
                }}
              >
                Recent tasks
              </h3>
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                style={{
                  fontSize: '11px',
                  color: '#00d4ff',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                View Details →
              </button>
            </div>

            {recentTasks.length > 0 ? (
              recentTasks.map((task: any) => (
                <div
                  key={task.TaskID}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/tasks')}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/tasks')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom: '1px solid #1e2d45',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border:
                        task.Status === 'Completed' ? 'none' : '1px solid #2a3f5f',
                      background:
                        task.Status === 'Completed' ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '10px',
                      color: '#fff',
                    }}
                  >
                    {task.Status === 'Completed' ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: task.Status === 'Completed' ? '#4a5568' : '#f0f4ff',
                        textDecoration:
                          task.Status === 'Completed' ? 'line-through' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.TaskName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#b8c2d6', marginTop: '2px' }}>
                      {task.project?.ProjectName || 'No project'} ·{' '}
                      {task.DueDate
                        ? new Date(task.DueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No due date'}
                    </div>
                  </div>
                  <PriorityBadge priority={task.Priority || 'Medium'} />
                </div>
              ))
            ) : (
              <div
                style={{
                  fontSize: '13px',
                  color: '#4a5568',
                  textAlign: 'center',
                  padding: '20px 0',
                }}
              >
                No tasks yet. Create one or get suggestions.
              </div>
            )}
          </div>

          <div
            style={{
              background: '#111827',
              border: '1px solid #1e2d45',
              borderRadius: '12px',
              padding: '20px',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a3f5f')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2d45')}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#f0f4ff',
                }}
              >
                Recent projects
              </h3>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                style={{
                  fontSize: '11px',
                  color: '#00d4ff',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                View Details →
              </button>
            </div>

            {recentProjects.length > 0 ? (
              recentProjects.map((project: any) => (
                <div
                  key={project.ProjectID}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/projects')}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/projects')}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #1e2d45',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#f0f4ff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                      }}
                    >
                      {project.ProjectName}
                    </div>
                    <StatusBadge status={project.Status || 'Active'} />
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#b8c2d6',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <span>Client: {project.ClientName || 'Internal'}</span>
                    <span>Tasks: {project._count?.tasks || 0}</span>
                    <span>Docs: {project._count?.documents || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  fontSize: '13px',
                  color: '#4a5568',
                  textAlign: 'center',
                  padding: '20px 0',
                }}
              >
                No projects yet. Create one or get suggestions.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
