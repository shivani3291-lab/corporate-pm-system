import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { aiAPI } from '../../services/api'

interface TopbarProps {
  title: string
  subtitle?: string
}

type SearchHit = {
  title: string
  score: number
  id: number | null
  kind: string | null
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const searchSeq = useRef(0)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U'

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 280)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const q = debounced.trim()
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    const seq = ++searchSeq.current
    setSearching(true)
    setOpen(true)

    aiAPI
      .semanticSearch(q, 8)
      .then((r) => {
        if (seq !== searchSeq.current) return
        setResults(r.data.results || [])
      })
      .catch(() => {
        if (seq !== searchSeq.current) return
        setResults([])
      })
      .finally(() => {
        if (seq !== searchSeq.current) return
        setSearching(false)
      })
  }, [debounced])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const goHit = (hit: SearchHit) => {
    setOpen(false)
    setSearch('')
    setDebounced('')
    setResults([])
    if (hit.kind === 'task') navigate('/tasks')
    else navigate('/documents')
  }

  const showPanel = open && debounced.trim().length >= 2

  return (
    <div style={{
      height: '56px', minHeight: '56px',
      background: '#0d1526',
      borderBottom: '1px solid #1e2d45',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '16px',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '16px', fontWeight: 700,
          color: '#f0f4ff',
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '11px', color: '#b8c2d6', marginTop: '1px',fontWeight: 900 }}>
            {subtitle}
          </div>
        )}
      </div>

      <div
        ref={wrapRef}
        style={{ position: 'relative', width: 'min(360px, 42vw)' }}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#111827',
          border: `1px solid ${showPanel ? '#2a3f5f' : '#1e2d45'}`,
          borderRadius: '8px', padding: '7px 14px',
          gap: '8px',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ color: '#b8c2d6', fontSize: '14px' }}>⌕</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search projects, tasks, documents or ask a question…"
            aria-label="Semantic search"
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: '13px', color: '#f0f4ff',
              width: '100%',
            }}
          />
          {searching && (
            <span style={{ fontSize: '10px', color: '#7c3aed', flexShrink: 0 }}>…</span>
          )}
        </div>

        {showPanel && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '10px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            zIndex: 300,
            maxHeight: '320px',
            overflowY: 'auto',
          }}>
            {searching && results.length === 0 && (
              <div style={{ padding: '14px 16px', fontSize: '12px', color: '#b8c2d6' }}>
                Searching…
              </div>
            )}
            {!searching && results.length === 0 && (
              <div style={{ padding: '14px 16px', fontSize: '12px', color: '#b8c2d6' }}>
                No matches — try different wording.
              </div>
            )}
            {results.map((hit, i) => {
              const pct = Math.min(100, Math.max(0, Math.round(hit.score * 100)))
              const kindLabel = hit.kind === 'task' ? 'Task' : 'Doc'
              return (
                <button
                  key={`${hit.kind}-${hit.id}-${i}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goHit(hit)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    textAlign: 'left',
                    gap: '10px',
                    alignItems: 'flex-start',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #1a2438',
                    cursor: 'pointer',
                    color: '#f0f4ff',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#0d1526'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  <span style={{
                    fontSize: '9px', fontWeight: 700,
                    padding: '2px 6px', borderRadius: '4px',
                    flexShrink: 0,
                    background: hit.kind === 'task' ? 'rgba(0,212,255,0.12)' : 'rgba(124,58,237,0.15)',
                    color: hit.kind === 'task' ? '#00d4ff' : '#c4b5fd',
                  }}>{kindLabel}</span>
                  <span style={{
                    flex: 1,
                    fontSize: '12px',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>{hit.title}</span>
                  <span style={{
                    fontSize: '10px', color: '#b8c2d6',
                    flexShrink: 0,
                  }}>{pct}%</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '6px', padding: '7px 14px',
        background: '#111827',
        border: '1px solid #1e2d45',
        borderRadius: '8px',
        fontSize: '13px', color: '#c8d8f0',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ color: '#00d4ff', fontSize: '12px' }}>✦</span>
        {greeting()}, {user?.firstName}
      </div>

      <div style={{
        width: '34px', height: '34px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, color: '#fff',
        cursor: 'pointer', flexShrink: 0,
        border: '2px solid #1e2d45',
      }}>
        {initials}
      </div>
    </div>
  )
}
