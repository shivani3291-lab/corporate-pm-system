import type { CSSProperties } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSidebar } from '../../context/SidebarContext'
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
  const { collapsed, toggle, isMobile, mobileNavOpen, closeMobileNav } = useSidebar()

  const handleLogout = () => {
    closeMobileNav()
    logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U'

  const w = collapsed ? 72 : 220
  /** On small screens the drawer always shows full labels (ignores desktop “collapsed”). */
  const narrow = !isMobile && collapsed

  const panelStyle: CSSProperties = isMobile
    ? {
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 220,
        width: 'min(288px, 88vw)',
        height: '100vh',
        background: 'linear-gradient(180deg, #0d1526 0%, #0a0f1e 100%)',
        borderRight: '1px solid #1e2d45',
        display: 'flex',
        flexDirection: 'column',
        transform: mobileNavOpen ? 'translateX(0)' : 'translateX(-105%)',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        boxShadow: mobileNavOpen ? '12px 0 40px rgba(0,0,0,0.55)' : 'none',
        flexShrink: 0,
      }
    : {
        width: `${w}px`,
        minWidth: `${w}px`,
        background: 'linear-gradient(180deg, #0d1526 0%, #0a0f1e 100%)',
        borderRight: '1px solid #1e2d45',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.22s ease, min-width 0.22s ease',
        flexShrink: 0,
      }

  return (
    <>
      {isMobile && mobileNavOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileNav}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 210,
            border: 'none',
            padding: 0,
            margin: 0,
            background: 'rgba(0,0,0,0.55)',
            cursor: 'pointer',
          }}
        />
      )}
      <div
        style={
          isMobile
            ? { width: 0, flexShrink: 0, position: 'relative', zIndex: 0 }
            : { flexShrink: 0 }
        }
      >
        <div style={panelStyle}>
      <div style={{
        padding: narrow ? '16px 12px' : '20px 16px 12px',
        borderBottom: '1px solid #1e2d45',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: narrow ? 'center' : 'space-between',
          gap: '8px',
        }}>
          {!narrow && (
            <div>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '16px', fontWeight: 800,
                color: '#00d4ff',
                letterSpacing: '0.5px',
              }}>CorpPM</div>
              <div style={{
                fontSize: '10px', color: '#b8c2d6',
                marginTop: '2px', letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}>Project Management</div>
            </div>
          )}
          {narrow && (
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '18px', fontWeight: 800,
              color: '#00d4ff',
            }}>C</div>
          )}
        </div>
        {!isMobile && (
        <button
          type="button"
          onClick={toggle}
          title={narrow ? 'Expand navigation' : 'Collapse navigation'}
          style={{
            marginTop: narrow ? '12px' : '14px',
            width: '100%',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #1e2d45',
            background: '#111827',
            color: '#b8c2d6',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.15s',
          }}
        >
          {narrow ? '»' : '« Collapse'}
        </button>
        )}
        {isMobile && (
          <button
            type="button"
            onClick={closeMobileNav}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #1e2d45',
              background: '#111827',
              color: '#b8c2d6',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Close menu
          </button>
        )}
      </div>

      <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
        {sections.map(section => (
          <div key={section}>
            {!narrow && (
              <div style={{
                fontSize: '10px',
                color: '#6b7280',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                padding: '10px 10px 6px',
                marginTop: section === 'Resources' ? '8px' : '0',
                fontWeight: 600,
              }}>{section}</div>
            )}
            {navItems
              .filter(item => item.section === section)
              .map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={narrow ? item.label : undefined}
                  onClick={() => isMobile && closeMobileNav()}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: narrow ? 'center' : 'flex-start',
                    gap: '10px',
                    padding: narrow ? '10px 8px' : '9px 10px',
                    borderRadius: '8px',
                    marginBottom: '2px',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#00d4ff' : '#c8d8f0',
                    background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
                    borderLeft: isActive && !narrow
                      ? '3px solid #00d4ff'
                      : '3px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(0,212,255,0.15)' : 'none',
                  })}
                >
                  <span style={{
                    fontSize: '15px',
                    width: '22px',
                    textAlign: 'center',
                  }}>
                    {item.icon}
                  </span>
                  {!narrow && item.label}
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
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px',
          borderRadius: '8px',
          background: '#111827',
          justifyContent: narrow ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>{initials}</div>
          {!narrow && (
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
              <div style={{ fontSize: '10px', color: '#b8c2d6' }}>
                {user?.role}
              </div>
            </div>
          )}
          {!narrow && (
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: 'none', border: 'none',
                color: '#b8c2d6', fontSize: '16px',
                cursor: 'pointer', padding: '2px',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#b8c2d6')}
            >⏻</button>
          )}
        </div>
      </div>
        </div>
      </div>
    </>
  )
}
