import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSidebar } from '../../context/SidebarContext'
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
  const { isMobile, toggleMobileNav } = useSidebar()
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
    <div
      className="topbar-responsive flex min-h-[52px] flex-wrap items-center gap-3 border-b border-[#1e2d45] bg-[#0d1526] px-3 py-2 md:min-h-14 md:gap-4 md:px-6 md:py-0"
      style={{
        rowGap: '10px',
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        {isMobile && (
          <button
            type="button"
            aria-label="Open menu"
            onClick={toggleMobileNav}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#1e2d45] bg-[#111827] text-[18px] text-[#b8c2d6] md:hidden"
          >
            ☰
          </button>
        )}
        <div className="min-w-0 flex-1">
        <div
          className="truncate font-[Syne,sans-serif] text-sm font-bold text-[#f0f4ff] md:text-base"
        >{title}</div>
        {subtitle && (
          <div className="mt-0.5 truncate text-[10px] font-black text-[#b8c2d6] sm:text-[11px]">
            {subtitle}
          </div>
        )}
        </div>
      </div>

      <div
        ref={wrapRef}
        className="order-last w-full min-w-0 md:order-none md:w-[min(360px,42vw)]"
        style={{ position: 'relative' }}
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
            placeholder="Search…"
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

      <div className="hidden max-w-[200px] items-center gap-1.5 rounded-lg border border-[#1e2d45] bg-[#111827] px-3 py-1.5 text-[13px] text-[#c8d8f0] sm:flex sm:truncate sm:whitespace-nowrap">
        <span className="shrink-0 text-[#00d4ff]">✦</span>
        <span className="truncate">
          {greeting()}, {user?.firstName}
        </span>
      </div>

      <div
        className="ml-auto flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-2 border-[#1e2d45] text-[12px] font-bold text-white md:ml-0"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
        }}
      >
        {initials}
      </div>
    </div>
  )
}
