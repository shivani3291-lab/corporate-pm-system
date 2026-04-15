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

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U'

  return (
    <div style={{
      height: '56px', minHeight: '56px',
      background: '#0d1526',
      borderBottom: '1px solid #1e2d45',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '16px',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '16px', fontWeight: 700,
          color: '#f0f4ff',
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '11px', color: '#8b9ab3', marginTop: '1px' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#111827',
        border: '1px solid #1e2d45',
        borderRadius: '8px', padding: '7px 14px',
        gap: '8px', width: '240px',
        transition: 'border-color 0.2s',
      }}
        onFocus={() => {}}
      >
        <span style={{ color: '#8b9ab3', fontSize: '14px' }}>⌕</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects, tasks..."
          style={{
            background: 'none', border: 'none', outline: 'none',
            fontSize: '13px', color: '#f0f4ff',
            width: '100%',
          }}
        />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '6px', padding: '7px 14px',
        background: '#111827',
        border: '1px solid #1e2d45',
        borderRadius: '8px',
        fontSize: '13px', color: '#c8d8f0',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ color: '#00d4ff', fontSize: '12px' }}>✦</span>
        {greeting()}, {user?.firstName}
      </div>

      <div style={{
        width: '34px', height: '34px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, color: '#fff',
        cursor: 'pointer', flexShrink: 0,
        border: '2px solid #1e2d45',
      }}>
        {initials}
      </div>
    </div>
  )
}