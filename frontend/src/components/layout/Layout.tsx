import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface LayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      <Sidebar />
      <div style={{
        flex: 1, display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <Topbar title={title} subtitle={subtitle} />
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '24px',
        }}
          className="page-enter"
        >
          {children}
        </main>
      </div>
    </div>
  )
}