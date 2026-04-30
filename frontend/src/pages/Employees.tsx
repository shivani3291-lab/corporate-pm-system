import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import { employeesAPI, assignmentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Admin: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    Manager: { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' },
    'Project Manager': { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' },
    Developer: { bg: 'rgba(0,212,255,0.1)', color: '#00d4ff' },
    Analyst: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    Staff: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  }
  const c = colors[role] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' }
  return (
    <span style={{
      fontSize: '11px', padding: '3px 10px',
      borderRadius: '20px', fontWeight: 600,
      background: c.bg, color: c.color,
    }}>{role}</span>
  )
}

function EmployeeDetailModal({ employee, onClose }: { employee: any; onClose: () => void }) {
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments-employee', employee.EmployeeID],
    queryFn: () => assignmentsAPI.getAll({ employeeId: employee.EmployeeID }).then((r) => r.data),
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#111827', border: '1px solid #1e2d45',
        borderRadius: '16px', padding: '28px', maxWidth: '520px', width: '100%',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#f0f4ff' }}>
            Employee Profile
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#b8c2d6', fontSize: '22px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {`${employee.FirstName?.[0] || ''}${employee.LastName?.[0] || ''}`.toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>
              {employee.FirstName} {employee.LastName}
            </div>
            <RoleBadge role={employee.Role || 'Staff'} />
          </div>
        </div>

        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', background: '#0d1526', border: '1px solid #1e2d45' }}>
          <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '4px' }}>Email</div>
          <div style={{ fontSize: '13px', color: '#f0f4ff' }}>{employee.Email}</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Project Assignments ({assignments.length})
          </div>
          {assignments.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#4a5568', padding: '16px', textAlign: 'center', background: '#0d1526', borderRadius: '8px', border: '1px solid #1e2d45' }}>
              No project assignments
            </div>
          ) : (
            assignments.map((a: any) => (
              <div key={a.AssignmentID} style={{
                padding: '12px', marginBottom: '6px', borderRadius: '8px',
                background: '#0d1526', border: '1px solid #1e2d45',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4ff', marginBottom: '4px' }}>
                  {a.project?.ProjectName || 'Unknown Project'}
                </div>
                <div style={{ fontSize: '11px', color: '#b8c2d6' }}>
                  Role: {a.RoleInProject || 'Member'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function Employees() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [editEmployee, setEditEmployee] = useState<any>(null)
  const isAdmin = user?.role === 'Admin' || user?.role === 'Manager'

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesAPI.getAll().then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => employeesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee updated')
      setEditEmployee(null)
    },
    onError: () => toast.error('Failed to update employee'),
  })

  const initials = (first: string, last: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()

  const avatarColor = (name: string) => {
    const colors = [
      'linear-gradient(135deg, #7c3aed, #00d4ff)',
      'linear-gradient(135deg, #10b981, #3b82f6)',
      'linear-gradient(135deg, #f59e0b, #ef4444)',
      'linear-gradient(135deg, #ec4899, #7c3aed)',
      'linear-gradient(135deg, #00d4ff, #10b981)',
    ]
    return colors[name.charCodeAt(0) % colors.length]
  }

  return (
    <Layout title="Employees" subtitle={`${employees.length} team members`}>
      <div style={{ maxWidth: '1400px' }}>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />
            ))
          ) : employees.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center', padding: '60px',
              background: '#111827', border: '1px solid #1e2d45',
              borderRadius: '12px', color: '#4a5568', fontSize: '13px',
            }}>
              No employees found
            </div>
          ) : (
            employees.map((emp: any) => (
              <div
                key={emp.EmployeeID}
                style={{
                  background: '#111827',
                  border: '1px solid #1e2d45',
                  borderRadius: '12px', padding: '20px',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#2a3f5f'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#1e2d45'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '14px', marginBottom: '16px',
                }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '50%',
                    background: avatarColor(emp.FirstName),
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '15px',
                    fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {initials(emp.FirstName, emp.LastName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: '15px', fontWeight: 700,
                      color: '#f0f4ff', marginBottom: '4px',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {emp.FirstName} {emp.LastName}
                    </div>
                    <RoleBadge role={emp.Role || 'Staff'} />
                  </div>
                </div>

                <div style={{
                  padding: '12px 0',
                  borderTop: '1px solid #1e2d45',
                }}>
                  <div style={{
                    fontSize: '12px', color: '#b8c2d6',
                    display: 'flex', alignItems: 'center',
                    gap: '6px', marginBottom: '8px',
                  }}>
                    <span style={{ color: '#4a5568' }}>◎</span>
                    {emp.Email}
                  </div>
                  <div style={{
                    fontSize: '12px', color: '#b8c2d6',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ color: '#4a5568' }}>◈</span>
                    {emp.assignments?.length || 0} project{emp.assignments?.length !== 1 ? 's' : ''} assigned
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => setSelectedEmployee(emp)}
                    style={{
                      flex: 1, padding: '7px',
                      background: 'rgba(0,212,255,0.06)',
                      border: '1px solid rgba(0,212,255,0.15)',
                      borderRadius: '7px', color: '#00d4ff',
                      fontSize: '12px', cursor: 'pointer',
                    }}
                  >View Profile</button>
                  {isAdmin && (
                    <button
                      onClick={() => setEditEmployee(emp)}
                      style={{
                        flex: 1, padding: '7px',
                        background: 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(124,58,237,0.15)',
                        borderRadius: '7px', color: '#a78bfa',
                        fontSize: '12px', cursor: 'pointer',
                      }}
                    >Edit Role</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedEmployee && (
        <EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      )}

      {/* Edit Role Modal */}
      {editEmployee && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditEmployee(null) }}
        >
          <div style={{
            background: '#111827', border: '1px solid #1e2d45',
            borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: '#f0f4ff' }}>
                Edit Employee Role
              </h3>
              <button onClick={() => setEditEmployee(null)} style={{ background: 'none', border: 'none', color: '#b8c2d6', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ fontSize: '13px', color: '#f0f4ff', marginBottom: '12px' }}>
              {editEmployee.FirstName} {editEmployee.LastName}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b8c2d6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
              <select
                id="editRole"
                defaultValue={editEmployee.Role || 'Staff'}
                style={{
                  width: '100%', padding: '10px 12px',
                  background: '#0d1526', border: '1px solid #1e2d45',
                  borderRadius: '8px', outline: 'none', fontSize: '13px', color: '#f0f4ff',
                }}
              >
                {['Admin', 'Manager', 'Developer', 'Analyst', 'Staff'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditEmployee(null)} style={{
                padding: '10px 20px', background: 'transparent',
                border: '1px solid #1e2d45', borderRadius: '8px',
                color: '#b8c2d6', fontSize: '13px', cursor: 'pointer',
              }}>Cancel</button>
              <button
                onClick={() => {
                  const select = document.getElementById('editRole') as HTMLSelectElement
                  updateMutation.mutate({
                    id: editEmployee.EmployeeID,
                    data: {
                      firstName: editEmployee.FirstName,
                      lastName: editEmployee.LastName,
                      email: editEmployee.Email,
                      role: select.value,
                    },
                  })
                }}
                disabled={updateMutation.isPending}
                style={{
                  padding: '10px 20px',
                  background: updateMutation.isPending ? '#1e2d45' : '#00d4ff',
                  border: 'none', borderRadius: '8px',
                  color: updateMutation.isPending ? '#b8c2d6' : '#0a0f1e',
                  fontSize: '13px', fontWeight: 700, cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
                  fontFamily: 'Syne, sans-serif',
                }}
              >{updateMutation.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
