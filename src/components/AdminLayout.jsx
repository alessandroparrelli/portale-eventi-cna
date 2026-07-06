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
      <header style={s.header} className="admin-header">
        {/* Mobile: hamburger a sinistra */}
        {isMobile && (
          <button onClick={() => setMobileOpen(true)} style={s.hamburger} aria-label="Apri menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}

        {/* Centro: logo + titolo affiancato */}
        <div className="admin-header-center">
          <img
            src="https://customer31551.img.musvc2.net/static/31551/images/1/CNARoma%20NEGATIVO%20COLORE%20SOLO%20ROMA.png"
            alt="CNA Roma"
            className="admin-header-logo"
            style={{ cursor: 'pointer', objectFit: 'contain', flexShrink: 0 }}
            onClick={() => window.location.reload()}
            title="Ricarica pagina"
          />
          <div style={s.titleBlock}>
            <span style={s.pageTitle}>Eventi</span>
          </div>
        </div>

        {/* Destra: placeholder per bilanciamento (desktop) */}
        <div className="admin-header-right" />
      </header>

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
    minHeight: '100dvh',
    backgroundColor: '#F4F5F7',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    flexShrink: 0,
    background: 'linear-gradient(120deg, #001B4D 0%, #003DA5 60%, #2E7BE0 100%)',
    borderBottom: 'none',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
    paddingBottom: '10px',
    gap: '12px',
    boxShadow: '0 3px 14px rgba(0,20,60,0.22)',
    boxSizing: 'border-box',
  },
  hamburger: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#FFFFFF', display: 'flex', alignItems: 'center',
    padding: '6px', borderRadius: '6px', flexShrink: 0,
  },
  titleBlock: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '14px',
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
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
