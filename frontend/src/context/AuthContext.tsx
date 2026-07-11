import { createContext, useContext } from 'react'
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
  isAuthenticated: boolean
}

// Login is disabled for this public demo build — the app always runs as this
// demo Admin user so the project is directly browsable without credentials.
const DEMO_USER: User = {
  id: 1,
  firstName: 'Demo',
  lastName: 'Admin',
  email: 'demo@echelon.dev',
  role: 'Admin',
}
const DEMO_TOKEN = 'demo-mode'

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider
      value={{ user: DEMO_USER, token: DEMO_TOKEN, isAuthenticated: true }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
