import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const MOBILE_QUERY = '(max-width: 768px)'

type SidebarCtx = {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (v: boolean) => void
  isMobile: boolean
  mobileNavOpen: boolean
  openMobileNav: () => void
  closeMobileNav: () => void
  toggleMobileNav: () => void
}

const SidebarContext = createContext<SidebarCtx | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const toggle = useCallback(() => setCollapsed((c) => !c), [])
  const openMobileNav = useCallback(() => setMobileNavOpen(true), [])
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const toggleMobileNav = useCallback(() => setMobileNavOpen((o) => !o), [])

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const sync = () => {
      setIsMobile(mq.matches)
      if (!mq.matches) setMobileNavOpen(false)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const value = useMemo(
    () => ({
      collapsed,
      toggle,
      setCollapsed,
      isMobile,
      mobileNavOpen,
      openMobileNav,
      closeMobileNav,
      toggleMobileNav,
    }),
    [collapsed, toggle, isMobile, mobileNavOpen, openMobileNav, closeMobileNav, toggleMobileNav],
  )
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
