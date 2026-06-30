import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile,   setIsMobile]   = useState(false)

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

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div style={s.root}>
      {/* ── HEADER: nel flusso normale del documento, NON position:fixed.
          Questo evita ogni bug noto di iOS Safari/PWA legato a fixed
          positioning + safe-area + viewport dinamico. Vedi
          docs/IOS_FIXED_HEADER_BUG.md per la storia completa. ── */}
      <header style={s.header} className="admin-header">
        {isMobile && (
          <button onClick={() => setMobileOpen(true)} style={s.hamburger} aria-label="Apri menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        <div className="admin-header-logo-wrap">
          <img
            src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
            alt="CNA Roma"
            className="admin-header-logo"
            style={{ ...s.logo, cursor: 'pointer' }}
            onClick={() => window.location.reload()}
            title="Ricarica pagina"
          />
        </div>
        <div className="admin-header-meta" style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <div style={s.divider}/>
          <span style={s.pageTitle}>Eventi</span>
        </div>
      </header>

      {/* ── CORPO: sidebar (desktop) + contenuto, sotto l'header nel flusso normale ── */}
      <div style={s.body}>
        <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} isMobile={isMobile}/>

        <main style={s.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    minHeight: '100dvh',
    backgroundColor: '#F4F5F7',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderBottom: '1.5px solid #E5E7EB',
    display: 'flex', alignItems: 'center', flexWrap: 'nowrap',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
    paddingBottom: '12px',
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
  body: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: '24px 32px 40px',
    boxSizing: 'border-box',
  },
}
