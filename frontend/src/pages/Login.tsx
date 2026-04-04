import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.login({ email, password })
      login(res.data.token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.firstName}!`)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '10%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      <div style={{
        width: '100%', maxWidth: '420px',
        margin: '0 20px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--accent-cyan-dim)',
            border: '1px solid rgba(0,212,255,0.2)',
            marginBottom: '16px',
            fontSize: '22px',
          }}>⬡</div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '26px', fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '6px',
          }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Sign in to your workspace
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 500,
                color: 'var(--text-secondary)', marginBottom: '8px',
                letterSpacing: '0.5px',
              }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="shivani@company.com"
                style={{
                  width: '100%', padding: '11px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px', outline: 'none',
                  fontSize: '14px', color: 'var(--text-primary)',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 500,
                color: 'var(--text-secondary)', marginBottom: '8px',
                letterSpacing: '0.5px',
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '11px 40px 11px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px', outline: 'none',
                    fontSize: '14px', color: 'var(--text-primary)',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', fontSize: '14px',
                    cursor: 'pointer', padding: '0',
                  }}
                >{showPassword ? '◡' : '◠'}</button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? 'var(--border)' : 'var(--accent-cyan)',
                color: loading ? 'var(--text-muted)' : '#0a0f1e',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 700,
                fontFamily: 'Syne, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.3px',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div style={{
            marginTop: '24px', paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <a href="/register" style={{
                color: 'var(--accent-cyan)',
                fontWeight: 500, textDecoration: 'none',
              }}>Create one</a>
            </p>
          </div>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '11px', color: 'var(--text-muted)',
        }}>
          Corporate Project Management System
        </p>
      </div>
    </div>
  )
}