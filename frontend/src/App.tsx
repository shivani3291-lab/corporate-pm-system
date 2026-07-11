import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Documents from './pages/Documents'
import Employees from './pages/Employees'
import Categories from './pages/Categories'
import Alerts from './pages/Alerts'

// Login is disabled for this public demo build — every route is open.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/employees" element={<Employees />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
