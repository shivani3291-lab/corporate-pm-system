import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/layout/Layout'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout title="Dashboard" subtitle="Welcome to your workspace">
            <div style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', fontSize: '20px' }}>
              Dashboard coming next ✦
            </div>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <Layout title="Projects">
            <div style={{ color: 'var(--text-primary)' }}>Projects coming next...</div>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute>
          <Layout title="Tasks">
            <div style={{ color: 'var(--text-primary)' }}>Tasks coming next...</div>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute>
          <Layout title="Documents">
            <div style={{ color: 'var(--text-primary)' }}>Documents coming next...</div>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute>
          <Layout title="Employees">
            <div style={{ color: 'var(--text-primary)' }}>Employees coming next...</div>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/categories" element={
        <ProtectedRoute>
          <Layout title="Categories">
            <div style={{ color: 'var(--text-primary)' }}>Categories coming next...</div>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}