import { useQuery } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { employeesAPI } from '../services/api'

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

export default function Employees() {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesAPI.getAll().then(r => r.data),
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
                    fontSize: '12px', color: '#8b9ab3',
                    display: 'flex', alignItems: 'center',
                    gap: '6px', marginBottom: '8px',
                  }}>
                    <span style={{ color: '#4a5568' }}>◎</span>
                    {emp.Email}
                  </div>
                  <div style={{
                    fontSize: '12px', color: '#8b9ab3',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ color: '#4a5568' }}>◈</span>
                    {emp.assignments?.length || 0} project{emp.assignments?.length !== 1 ? 's' : ''} assigned
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}