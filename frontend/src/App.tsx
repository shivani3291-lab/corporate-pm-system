import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Documents from './pages/Documents'
import Employees from './pages/Employees'
import Categories from './pages/Categories'
import Layout from './components/layout/Layout'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute><Projects /></ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute><Tasks /></ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute><Documents /></ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute><Employees /></ProtectedRoute>
      } />

      <Route path="/categories" element={
        <ProtectedRoute><Categories /></ProtectedRoute>
      } />
    </Routes>
  )
}