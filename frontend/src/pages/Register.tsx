import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      })
      login(res.data.token, res.data.user)
      toast.success(`Welcome, ${res.data.user.firstName}!`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      toast.error(msg || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const shellStyle = {
    minHeight: '100vh' as const,
    background: 'var(--bg-primary)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }

  return (
    <div style={shellStyle}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
          backgroundSize: '40px 40px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '18%',
          right: '12%',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'var(--accent-cyan-dim)',
              border: '1px solid rgba(0,212,255,0.2)',
              marginBottom: '16px',
              fontSize: '22px',
            }}
          >
            +
          </div>
          <h1
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '6px',
            }}
          >
            Create an account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Register to explore the demo workspace
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-[18px] grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    letterSpacing: '0.5px',
                  }}
                >
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="Ada"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    outline: 'none',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    letterSpacing: '0.5px',
                  }}
                >
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  placeholder="Lovelace"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    outline: 'none',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  letterSpacing: '0.5px',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  outline: 'none',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  letterSpacing: '0.5px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    outline: 'none',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '0',
                  }}
                >
                  {showPassword ? '◡' : '◠'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  letterSpacing: '0.5px',
                }}
              >
                Confirm password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat password"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  outline: 'none',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? 'var(--border)' : 'var(--accent-cyan)',
                color: loading ? 'var(--text-muted)' : '#0a0f1e',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'Syne, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.3px',
              }}
            >
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <div
            style={{
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: 'var(--accent-cyan)',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '18px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          New accounts use the Staff role for safe demo access.
        </p>
      </div>
    </div>
  )
}
