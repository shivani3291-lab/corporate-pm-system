import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface TopbarProps {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div style={{
      height: '56px', minHeight: '56px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '16px',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '15px', fontWeight: 700,
          color: 'var(--text-primary)',
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px', padding: '6px 12px',
        gap: '8px', width: '220px',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>⌕</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            background: 'none', border: 'none', outline: 'none',
            fontSize: '13px', color: 'var(--text-primary)',
            width: '100%',
          }}
        />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '8px', padding: '6px 12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        fontSize: '12px', color: 'var(--text-secondary)',
      }}>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '11px' }}>✦</span>
        {greeting()}, {user?.firstName}
      </div>

      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700, color: '#fff',
        cursor: 'pointer',
      }}>
        {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
      </div>
    </div>
  )
}