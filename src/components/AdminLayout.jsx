import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [isMobile,     setIsMobile]     = useState(false)

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

  useEffect(() => {
    if (isMobile) { setSidebarWidth(0); return }
    const observer = new ResizeObserver(entries => {
      for (const e of entries) setSidebarWidth(Math.round(e.contentRect.width))
    })
    const sidebar = document.querySelector('aside')
    if (sidebar) observer.observe(sidebar)
    return () => observer.disconnect()
  }, [isMobile])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div style={s.root}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} isMobile={isMobile}/>

      {/* ── HEADER fisso full-width ── */}
      <header style={s.header}>
        {isMobile && (
          <button onClick={() => setMobileOpen(true)} style={s.hamburger} aria-label="Apri menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        <img
          src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
          alt="CNA Roma"
          style={{ ...s.logo, cursor: 'pointer' }}
          onClick={() => window.location.reload()}
          title="Ricarica pagina"
        />
        <div style={s.divider}/>
        <span style={s.pageTitle}>Eventi</span>
      </header>

      {/* ── MAIN ── */}
      <main style={{
        ...s.main,
        marginLeft: isMobile ? '0' : `${sidebarWidth}px`,
      }}>
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100vh',
    minHeight: '100dvh',
    backgroundColor: '#F4F5F7',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    position: 'fixed', top: 0, right: 0, left: 0, zIndex: 200,
    backgroundColor: '#FFFFFF',
    borderBottom: '1.5px solid #E5E7EB',
    minHeight: '56px',
    display: 'flex', alignItems: 'center', flexWrap: 'nowrap',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
    paddingBottom: '10px',
    gap: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    boxSizing: 'border-box',
  },
  hamburger: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#374151', display: 'flex', alignItems: 'center',
    padding: '6px', borderRadius: '6px', flexShrink: 0,
  },
  logo: { height: '34px', objectFit: 'contain', flexShrink: 0 },
  divider: { width: '1px', height: '20px', backgroundColor: '#E5E7EB', flexShrink: 0 },
  pageTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: '-0.04em',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  main: {
    minHeight: '100vh',
    minHeight: '100dvh',
    paddingTop: 'calc(76px + env(safe-area-inset-top, 0px) + 24px)',
    paddingBottom: '40px',
    paddingLeft: '32px',
    paddingRight: '32px',
    transition: 'margin-left 0.2s ease',
    boxSizing: 'border-box',
  },
}
