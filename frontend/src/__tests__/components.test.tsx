import { describe, it, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext'
import { SidebarProvider } from '../context/SidebarContext'

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeQc()}>
      <MemoryRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------

describe('Login page', () => {
  beforeEach(() => localStorageMock.clear())

  it('renders login form', async () => {
    const Login = (await import('../pages/Login')).default
    render(<Wrapper><Login /></Wrapper>)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('has register link', async () => {
    const Login = (await import('../pages/Login')).default
    render(<Wrapper><Login /></Wrapper>)
    expect(screen.getByText('Create one')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Register page
// ---------------------------------------------------------------------------

describe('Register page', () => {
  beforeEach(() => localStorageMock.clear())

  it('renders register form', async () => {
    const Register = (await import('../pages/Register')).default
    render(<Wrapper><Register /></Wrapper>)
    expect(screen.getByText('Create an account')).toBeInTheDocument()
    expect(screen.getByText('First name')).toBeInTheDocument()
    expect(screen.getByText('Last name')).toBeInTheDocument()
  })

  it('has sign-in link', async () => {
    const Register = (await import('../pages/Register')).default
    render(<Wrapper><Register /></Wrapper>)
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

describe('Sidebar', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock.setItem('token', 't')
    localStorageMock.setItem('user', JSON.stringify({ id: 1, firstName: 'T', lastName: 'U', email: 't@t.com', role: 'Admin' }))
  })

  it('renders navigation items', async () => {
    const Sidebar = (await import('../components/layout/Sidebar')).default
    render(
      <QueryClientProvider client={makeQc()}>
        <MemoryRouter>
          <AuthProvider>
            <SidebarProvider><Sidebar /></SidebarProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
  })

  it('renders brand name', async () => {
    const Sidebar = (await import('../components/layout/Sidebar')).default
    render(
      <QueryClientProvider client={makeQc()}>
        <MemoryRouter>
          <AuthProvider>
            <SidebarProvider><Sidebar /></SidebarProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.getByText('Echelon')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// API service
// ---------------------------------------------------------------------------

describe('API service', () => {
  it('exports all API objects', async () => {
    const api = await import('../services/api')
    expect(api.authAPI).toBeDefined()
    expect(api.projectsAPI).toBeDefined()
    expect(api.tasksAPI).toBeDefined()
    expect(api.documentsAPI).toBeDefined()
    expect(api.employeesAPI).toBeDefined()
    expect(api.categoriesAPI).toBeDefined()
    expect(api.alertsAPI).toBeDefined()
    expect(api.assignmentsAPI).toBeDefined()
    expect(api.aiAPI).toBeDefined()
  })

  it('authAPI has login and register', async () => {
    const { authAPI } = await import('../services/api')
    expect(typeof authAPI.login).toBe('function')
    expect(typeof authAPI.register).toBe('function')
  })

  it('aiAPI has all AI methods', async () => {
    const { aiAPI } = await import('../services/api')
    expect(typeof aiAPI.classifyDocument).toBe('function')
    expect(typeof aiAPI.semanticSearch).toBe('function')
    expect(typeof aiAPI.predictDelayBatch).toBe('function')
    expect(typeof aiAPI.analyzeProjectHealth).toBe('function')
    expect(typeof aiAPI.autoPrioritize).toBe('function')
  })

  it('assignmentsAPI has CRUD methods', async () => {
    const { assignmentsAPI } = await import('../services/api')
    expect(typeof assignmentsAPI.getAll).toBe('function')
    expect(typeof assignmentsAPI.create).toBe('function')
    expect(typeof assignmentsAPI.update).toBe('function')
    expect(typeof assignmentsAPI.delete).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// SidebarContext
// ---------------------------------------------------------------------------

describe('SidebarContext', () => {
  it('provides collapsed=false by default', async () => {
    const { useSidebar, SidebarProvider } = await import('../context/SidebarContext')

    function Comp() {
      const { collapsed } = useSidebar()
      return <div data-testid="c">{collapsed ? 'yes' : 'no'}</div>
    }

    render(
      <Wrapper>
        <SidebarProvider><Comp /></SidebarProvider>
      </Wrapper>,
    )
    expect(screen.getByTestId('c')).toHaveTextContent('no')
  })
})
