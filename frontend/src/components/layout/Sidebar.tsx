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
      background: '#0d1526',
      borderRight: '1px solid #1e2d45',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid #1e2d45',
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '16px', fontWeight: 800,
          color: '#00d4ff',
          letterSpacing: '0.5px',
        }}>CorpPM</div>
        <div style={{
          fontSize: '10px', color: '#8b9ab3',
          marginTop: '2px', letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>Project Management</div>
      </div>

      <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
        {sections.map(section => (
          <div key={section}>
            <div style={{
              fontSize: '10px',
              color: '#8b9ab3',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding: '10px 10px 6px',
              marginTop: section === 'Resources' ? '8px' : '0',
              fontWeight: 600,
            }}>{section}</div>
            {navItems
              .filter(item => item.section === section)
              .map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    marginBottom: '2px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#00d4ff' : '#c8d8f0',
                    background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
                    borderLeft: isActive
                      ? '2px solid #00d4ff'
                      : '2px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  })}
                >
                  <span style={{
                    fontSize: '15px',
                    width: '18px',
                    textAlign: 'center',
                  }}>
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
        borderTop: '1px solid #1e2d45',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 10px', borderRadius: '8px',
          background: '#111827',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px', fontWeight: 500,
              color: '#f0f4ff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '10px', color: '#8b9ab3' }}>
              {user?.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none', border: 'none',
              color: '#8b9ab3', fontSize: '16px',
              cursor: 'pointer', padding: '2px',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8b9ab3')}
          >⏻</button>
        </div>
      </div>
    </div>
  )
}