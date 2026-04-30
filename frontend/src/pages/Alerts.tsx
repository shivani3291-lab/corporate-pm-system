import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { alertsAPI } from '../services/api'

type AlertFilter = 'All' | 'Critical' | 'Warning' | 'Notice'

export default function Alerts() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<AlertFilter>('All')

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['predictive-alerts'],
    queryFn: () => alertsAPI.getAll().then((r) => r.data),
  })

  const filtered = filter === 'All'
    ? alerts
    : alerts.filter((a) => a.Severity === filter)

  const severityCounts = {
    Critical: alerts.filter((a) => a.Severity === 'Critical').length,
    Warning: alerts.filter((a) => a.Severity === 'Warning').length,
    Notice: alerts.filter((a) => a.Severity === 'Notice').length,
  }

  return (
    <Layout title="Alerts" subtitle={`${alerts.length} predictive alerts · ${severityCounts.Critical} critical`}>
      <div style={{ maxWidth: '1400px' }}>

        {/* Severity summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Critical',
              count: severityCounts.Critical,
              color: '#ef4444',
              bg: 'rgba(239,68,68,0.08)',
              border: 'rgba(239,68,68,0.25)',
            },
            {
              label: 'Warning',
              count: severityCounts.Warning,
              color: '#f59e0b',
              bg: 'rgba(245,158,11,0.08)',
              border: 'rgba(245,158,11,0.25)',
            },
            {
              label: 'Notice',
              count: severityCounts.Notice,
              color: '#00d4ff',
              bg: 'rgba(0,212,255,0.06)',
              border: 'rgba(0,212,255,0.2)',
            },
          ].map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => setFilter(card.label as AlertFilter)}
              style={{
                background: `linear-gradient(135deg, ${card.bg} 0%, #111827 40%)`,
                border: `1px solid ${filter === card.label ? card.color : card.border}`,
                borderRadius: '12px',
                padding: '18px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: card.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                {card.label}
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800, color: card.color }}>
                {card.count}
              </div>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap',
        }}>
          {(['All', 'Critical', 'Warning', 'Notice'] as AlertFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                border: filter === f ? 'none' : '1px solid #1e2d45',
                background: filter === f ? '#00d4ff' : 'transparent',
                color: filter === f ? '#0a0f1e' : '#b8c2d6',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['predictive-alerts'] })}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid #1e2d45',
              background: 'transparent',
              color: '#b8c2d6',
              transition: 'all 0.15s',
            }}
          >
            Refresh
          </button>
        </div>

        {/* Alert list */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✦</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', color: '#f0f4ff', marginBottom: '8px' }}>
              No alerts found
            </div>
            <div style={{ fontSize: '13px', color: '#b8c2d6' }}>
              {filter === 'All'
                ? 'Alerts are generated by the nightly predictive analysis pipeline.'
                : `No ${filter.toLowerCase()} alerts at this time.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((alert) => {
              const isCritical = alert.Severity === 'Critical'
              const isWarning = alert.Severity === 'Warning'

              return (
                <div
                  key={alert.AlertID}
                  style={{
                    padding: '18px',
                    background: isCritical
                      ? 'rgba(239,68,68,0.08)'
                      : isWarning
                        ? 'rgba(245,158,11,0.06)'
                        : '#111827',
                    borderRadius: '12px',
                    border: `1px solid ${
                      isCritical ? 'rgba(239,68,68,0.35)' : isWarning ? 'rgba(245,158,11,0.3)' : '#1e2d45'
                    }`,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: isCritical
                            ? 'rgba(239,68,68,0.25)'
                            : isWarning
                              ? 'rgba(245,158,11,0.25)'
                              : 'rgba(0,212,255,0.12)',
                          color: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#b8c2d6',
                        }}>
                          {alert.Severity}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4ff' }}>
                          {alert.project?.ProjectName || `Project #${alert.ProjectID}`}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#7c3aed', marginBottom: '6px' }}>
                        {alert.AlertType}
                        {alert.TaskID != null ? ` · Task #${alert.TaskID}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', color: '#4a5568', whiteSpace: 'nowrap' }}>
                      {new Date(alert.CreatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {alert.Message && (
                    <div style={{ fontSize: '13px', color: '#c8d8f0', lineHeight: 1.6 }}>
                      {alert.Message}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
