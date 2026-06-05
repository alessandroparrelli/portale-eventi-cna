import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

// Mappa path → titolo pagina
const PAGE_TITLES = {
  '/admin':            'Dashboard',
  '/admin/eventi':     'Gestione eventi',
  '/admin/iscritti':   'Iscritti',
  '/admin/email':      'Email',
  '/admin/checkin':    'Check-in',
  '/admin/statistiche':'Statistiche',
  '/admin/utenti':     'Utenti',
}

export default function AdminLayout() {
  const [sidebarWidth, setSidebarWidth]  = useState(240)
  const [mobileOpen,   setMobileOpen]    = useState(false)
  const [isMobile,     setIsMobile]      = useState(false)
  const location = useLocation()

  // Detect mobile
  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Track sidebar width (desktop only)
  useEffect(() => {
    if (isMobile) { setSidebarWidth(0); return }
    const observer = new ResizeObserver(entries => {
      for (const e of entries) setSidebarWidth(e.contentRect.width)
    })
    const sidebar = document.querySelector('aside')
    if (sidebar) observer.observe(sidebar)
    return () => observer.disconnect()
  }, [isMobile])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  // Titolo pagina corrente
  const pageTitle = PAGE_TITLES[location.pathname] || 'Portale eventi'

  return (
    <div style={s.root}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile}/>

      {/* ── HEADER a tutta larghezza ── */}
      <header style={{
        ...s.header,
        left:  isMobile ? 0 : `${sidebarWidth}px`,
        right: 0,
      }}>
        {/* Mobile: hamburger */}
        {isMobile && (
          <button onClick={() => setMobileOpen(true)} style={s.hamburger}>
            <Menu size={22}/>
          </button>
        )}

        {/* Logo CNA */}
        <img
          src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
          alt="CNA Roma"
          style={s.logo}
        />

        {/* Separatore verticale */}
        <div style={s.divider}/>

        {/* Titolo pagina */}
        <h1 style={s.pageTitle}>{pageTitle}</h1>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        ...s.main,
        marginLeft: isMobile ? '0' : `${sidebarWidth}px`,
        paddingTop: '88px', // altezza header
      }}>
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100vh',
    backgroundColor: '#F4F5F7',
    fontFamily: "'Inter', sans-serif",
  },
  // Header fisso a tutta larghezza (esclude sidebar su desktop)
  header: {
    position: 'fixed',
    top: 0,
    zIndex: 50,
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 28px',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    transition: 'left 0.2s ease',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#0A0A0A',
    display: 'flex',
    alignItems: 'center',
    padding: '6px',
    borderRadius: '6px',
    marginRight: '4px',
  },
  logo: {
    height: '36px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  divider: {
    width: '1px',
    height: '28px',
    backgroundColor: '#E5E7EB',
    flexShrink: 0,
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: '-0.04em',
    margin: 0,
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1,
  },
  main: {
    minHeight: '100vh',
    padding: '32px',
    transition: 'margin-left 0.2s ease',
  },
}
