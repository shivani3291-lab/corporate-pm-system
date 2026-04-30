import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import { projectsAPI, tasksAPI, documentsAPI, employeesAPI, alertsAPI } from '../services/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildChartData(tasks: any[] | undefined) {
  if (!tasks || tasks.length === 0) {
    return monthNames.map((m) => ({ month: m, completed: 0, pending: 0 }))
  }
  const now = new Date()
  const map: Record<string, { completed: number; pending: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    map[`${d.getFullYear()}-${d.getMonth()}`] = { completed: 0, pending: 0 }
  }
  for (const t of tasks) {
    const date = t.DueDate ? new Date(t.DueDate) : null
    if (!date) continue
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (!map[key]) continue
    if (t.Status === 'Completed') map[key].completed++
    else map[key].pending++
  }
  return Object.entries(map).map(([key, val]) => {
    const [, idx] = key.split('-')
    return { month: monthNames[Number(idx)], ...val }
  })
}

function Stat({ label, value, color, onClick }: { label: string; value: number; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#0d1526',
        border: '1px solid #1e2d45',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e2d45' }}
    >
      <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800, color }}>
        {value}
      </div>
    </button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

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

  const taskChartData = useMemo(() => buildChartData(tasks), [tasks])
  const recentTasks = tasks?.slice(0, 5) || []
  const pendingCount = tasks?.filter((t: any) => t.Status !== 'Completed').length || 0
  const completedCount = tasks?.filter((t: any) => t.Status === 'Completed').length || 0
  const criticalAlerts = predictiveAlerts.filter((a: any) => a.Severity === 'Critical').length

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <Layout title="Dashboard" subtitle="Where Projects Meet Predictive Intelligence">
      <div style={{ maxWidth: '1200px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>
            {greeting}, {user?.firstName}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {overdueTasks?.length > 0
              ? `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue — needs attention`
              : 'Everything is on track'}
          </p>
        </div>

        {/* KPI Row */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Projects" value={projects?.length || 0} color="#00d4ff" onClick={() => navigate('/projects')} />
          <Stat label="Active Tasks" value={pendingCount} color="#7c3aed" onClick={() => navigate('/tasks')} />
          <Stat label="Completed" value={completedCount} color="#10b981" onClick={() => navigate('/tasks')} />
          <Stat label="Team" value={employees?.length || 0} color="#f59e0b" onClick={() => navigate('/employees')} />
        </div>

        {/* Chart + Status Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">

          {/* Chart */}
          <div style={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: '#f0f4ff' }}>
                Task Overview
              </h3>
              <span style={{ fontSize: '11px', color: '#4a5568' }}>Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskChartData} barGap={2}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#4a5568', fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px', color: '#f0f4ff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="completed" fill="#00d4ff" radius={[3, 3, 0, 0]} maxBarSize={16} name="Completed" />
                <Bar dataKey="pending" fill="#7c3aed" radius={[3, 3, 0, 0]} maxBarSize={16} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              {[
                { color: '#00d4ff', label: 'Completed' },
                { color: '#7c3aed', label: 'Pending' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6b7280' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Project Status Breakdown */}
          <div style={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: '#f0f4ff', marginBottom: '20px' }}>
              Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(() => {
                const counts: Record<string, number> = {}
                for (const p of projects || []) {
                  const s = p.Status || 'Active'
                  counts[s] = (counts[s] || 0) + 1
                }
                const colors: Record<string, string> = {
                  Active: '#00d4ff',
                  Completed: '#10b981',
                  'In Progress': '#7c3aed',
                  Pending: '#f59e0b',
                  'On Hold': '#6b7280',
                }
                const total = projects?.length || 1
                return Object.entries(counts).map(([status, count]) => {
                  const pct = Math.round((count / total) * 100)
                  const color = colors[status] || '#6b7280'
                  return (
                    <div key={status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#b8c2d6' }}>{status}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color }}>{count}</span>
                      </div>
                      <div style={{ height: '3px', background: '#1e2d45', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })
              })()}
              {(!projects || projects.length === 0) && (
                <div style={{ fontSize: '12px', color: '#4a5568', textAlign: 'center', padding: '20px 0' }}>
                  No projects yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Recent Tasks + Alerts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">

          {/* Recent Tasks */}
          <div style={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: '#f0f4ff' }}>
                Recent Tasks
              </h3>
              <button onClick={() => navigate('/tasks')} style={{ fontSize: '12px', color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                View all →
              </button>
            </div>
            {recentTasks.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#4a5568', padding: '20px 0', textAlign: 'center' }}>
                No tasks yet
              </div>
            ) : (
              <div>
                {recentTasks.map((task: any) => (
                  <div
                    key={task.TaskID}
                    onClick={() => navigate('/tasks')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 0', borderBottom: '1px solid #1a2438',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.03)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                      background: task.Status === 'Completed' ? '#10b981' : 'transparent',
                      border: task.Status === 'Completed' ? 'none' : '1px solid #2a3f5f',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', color: '#fff',
                    }}>
                      {task.Status === 'Completed' ? '✓' : ''}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: 500,
                        color: task.Status === 'Completed' ? '#4a5568' : '#e2e8f0',
                        textDecoration: task.Status === 'Completed' ? 'line-through' : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {task.TaskName}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {task.DueDate
                        ? new Date(task.DueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : ''}
                    </div>
                    <span style={{
                      fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600,
                      background:
                        task.Priority === 'High' ? 'rgba(239,68,68,0.12)' :
                        task.Priority === 'Low' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                      color:
                        task.Priority === 'High' ? '#ef4444' :
                        task.Priority === 'Low' ? '#10b981' : '#f59e0b',
                    }}>
                      {task.Priority || 'Medium'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Alerts */}
          <div style={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: '#f0f4ff' }}>
                Alerts
              </h3>
              <button onClick={() => navigate('/alerts')} style={{ fontSize: '12px', color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                View all →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: overdueTasks?.length > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)', border: `1px solid ${overdueTasks?.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}` }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Overdue Tasks</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: overdueTasks?.length > 0 ? '#ef4444' : '#10b981' }}>
                  {overdueTasks?.length || 0}
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: criticalAlerts > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)', border: `1px solid ${criticalAlerts > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}` }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Critical Alerts</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: criticalAlerts > 0 ? '#f59e0b' : '#10b981' }}>
                  {criticalAlerts}
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Documents</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: '#00d4ff' }}>
                  {documents?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
