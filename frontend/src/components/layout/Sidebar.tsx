import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/dashboard', icon: '⬡', label: 'Dashboard', section: 'Main' },
  { path: '/projects', icon: '◈', label: 'Projects', section: 'Main' },
  { path: '/tasks', icon: '◇', label: 'Tasks', section: 'Main' },
  { path: '/documents', icon: '▦', label: 'Documents', section: 'Resources' },
  { path: '/employees', icon: '◉', label: 'Employees', section: 'Resources' },
  { path: '/categories', icon: '◫', label: 'Categories', section: 'Resources' },
]

const sections = ['Main', 'Resources']

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U'

  return (
    <div style={{
      width: '220px', minWidth: '220px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '16px', fontWeight: 800,
          color: 'var(--accent-cyan)',
          letterSpacing: '0.5px',
        }}>CorpPM</div>
        <div style={{
          fontSize: '10px', color: 'var(--text-muted)',
          marginTop: '2px', letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>Project Management</div>
      </div>

      <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
        {sections.map(section => (
          <div key={section}>
            <div style={{
              fontSize: '9px', color: 'var(--text-muted)',
              letterSpacing: '1.5px', textTransform: 'uppercase',
              padding: '8px 8px 4px', marginTop: section === 'Resources' ? '8px' : '0',
            }}>{section}</div>
            {navItems
              .filter(item => item.section === section)
              .map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    marginBottom: '2px',
                    fontSize: '13px',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--accent-cyan-dim)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  })}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    if (!el.style.borderLeftColor.includes('0,212')) {
                      el.style.background = 'var(--bg-card)'
                      el.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    if (!el.style.borderLeftColor.includes('0,212')) {
                      el.style.background = 'transparent'
                      el.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <span style={{ fontSize: '14px', width: '16px', textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 10px', borderRadius: '8px',
          background: 'var(--bg-card)',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {user?.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: '14px',
              cursor: 'pointer', padding: '2px',
              flexShrink: 0,
            }}
          >⏻</button>
        </div>
      </div>
    </div>
  )
}