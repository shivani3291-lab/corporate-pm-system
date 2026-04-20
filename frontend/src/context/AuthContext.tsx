import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function readStoredAuth(): { token: string | null; user: User | null } {
  try {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (!savedToken || !savedUser) {
      return { token: null, user: null }
    }
    const user = JSON.parse(savedUser) as User
    if (!user?.id || !user?.email) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { token: null, user: null }
    }
    return { token: savedToken, user }
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ token, user }, setAuth] = useState(() => readStoredAuth())

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setAuth({ token: newToken, user: newUser })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuth({ token: null, user: null })
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}