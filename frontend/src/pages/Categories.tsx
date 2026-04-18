import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { categoriesAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Categories() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => categoriesAPI.create({ categoryName: name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created')
      setName(''); setDescription(''); setShowForm(false)
    },
    onError: () => toast.error('Failed to create category'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
    },
    onError: () => toast.error('Failed to delete category'),
  })

  const icons = ['◈', '◇', '▦', '◉', '◫', '⬡', '◬', '◎']
  const accents = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#b8c2d6']

  return (
    <Layout title="Categories" subtitle="Document classification groups">
      <div style={{ maxWidth: '1400px' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '24px',
        }}>
          <div style={{ fontSize: '13px', color: '#b8c2d6' }}>
            {categories.length} categories defined
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: '#00d4ff', color: '#0a0f1e',
              border: 'none', borderRadius: '10px',
              padding: '10px 20px', fontSize: '13px',
              fontWeight: 700, fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
            }}
          >⊕ New Category</button>
        </div>

        {showForm && (
          <div style={{
            background: '#111827', border: '1px solid #00d4ff',
            borderRadius: '12px', padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '15px', fontWeight: 700,
              color: '#f0f4ff', marginBottom: '16px',
            }}>Create new category</h3>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 2fr',
              gap: '12px', marginBottom: '16px',
            }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: 600,
                  color: '#b8c2d6', marginBottom: '6px',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>Category Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Technical"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#0d1526', border: '1px solid #1e2d45',
                    borderRadius: '8px', outline: 'none',
                    fontSize: '13px', color: '#f0f4ff',
                  }}
                  onFocus={e => e.target.style.borderColor = '#00d4ff'}
                  onBlur={e => e.target.style.borderColor = '#1e2d45'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: 600,
                  color: '#b8c2d6', marginBottom: '6px',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>Description</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of this category"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#0d1526', border: '1px solid #1e2d45',
                    borderRadius: '8px', outline: 'none',
                    fontSize: '13px', color: '#f0f4ff',
                  }}
                  onFocus={e => e.target.style.borderColor = '#00d4ff'}
                  onBlur={e => e.target.style.borderColor = '#1e2d45'}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowForm(false); setName(''); setDescription('') }}
                style={{
                  padding: '9px 18px', background: 'transparent',
                  border: '1px solid #1e2d45', borderRadius: '8px',
                  color: '#b8c2d6', fontSize: '13px', cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!name || createMutation.isPending}
                style={{
                  padding: '9px 18px',
                  background: !name ? '#1e2d45' : '#00d4ff',
                  border: 'none', borderRadius: '8px',
                  color: !name ? '#b8c2d6' : '#0a0f1e',
                  fontSize: '13px', fontWeight: 700,
                  cursor: !name ? 'not-allowed' : 'pointer',
                  fontFamily: 'Syne, sans-serif',
                }}
              >{createMutation.isPending ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px',
            background: '#111827', border: '1px solid #1e2d45',
            borderRadius: '12px', color: '#4a5568', fontSize: '13px',
          }}>
            No categories yet — create your first one
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {categories.map((cat: any, idx: number) => {
              const accent = accents[idx % accents.length]
              const icon = icons[idx % icons.length]
              return (
                <div
                  key={cat.CategoryID}
                  style={{
                    background: '#111827',
                    border: '1px solid #1e2d45',
                    borderRadius: '12px', padding: '20px',
                    transition: 'border-color 0.2s, transform 0.2s',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = accent
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#1e2d45'
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '2px', background: accent,
                  }} />

                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: `${accent}18`,
                    border: `1px solid ${accent}30`,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '16px',
                    color: accent, marginBottom: '12px',
                  }}>{icon}</div>

                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '14px', fontWeight: 700,
                    color: '#f0f4ff', marginBottom: '4px',
                  }}>{cat.CategoryName}</div>

                  {cat.Description && (
                    <div style={{
                      fontSize: '11px', color: '#b8c2d6',
                      lineHeight: 1.5, marginBottom: '12px',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>{cat.Description}</div>
                  )}

                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginTop: '12px',
                    paddingTop: '12px', borderTop: '1px solid #1e2d45',
                  }}>
                    <span style={{ fontSize: '11px', color: '#b8c2d6' }}>
                      {cat._count?.documents || 0} documents
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${cat.CategoryName}"?`)) {
                          deleteMutation.mutate(cat.CategoryID)
                        }
                      }}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: '6px', color: '#ef4444',
                        fontSize: '11px', cursor: 'pointer',
                      }}
                    >Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}