import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'

const RUOLO_COLORS = { superadmin:'#5B5FEF', admin:'#5B5FEF', supervisore:'#7C4DFF', utente:'#6B7280' }
const RUOLO_LABELS = { superadmin:'Super Admin', admin:'Admin', supervisore:'Supervisore', utente:'Utente' }

function VerifiedBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink:0 }}>
      <path fill="#1D9BF0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/>
      <path fill="#fff" d="M9.5 16.5L5.5 12.5l1.41-1.41L9.5 13.67l7.59-7.59L18.5 7.5z"/>
    </svg>
  )
}

function UserBox() {
  const { user } = useAuth()
  const { ruolo } = useRole()
  const [avatarUrl,    setAvatarUrl]    = useState(null)
  const [displayName,  setDisplayName]  = useState('')

  useEffect(() => {
    if (!user?.id) return
    supabase.from('admin_profiles')
      .select('avatar_url, nome, username')
      .eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
        setDisplayName(data?.nome || data?.username || user?.email?.split('@')[0] || 'Admin')
      })
  }, [user])

  const initial    = displayName ? displayName[0].toUpperCase() : '?'
  const isVerified = ruolo === 'admin' || ruolo === 'superadmin' || ruolo === 'supervisore'
  const roleColor  = RUOLO_COLORS[ruolo] || '#6B7280'
  const roleLabel  = RUOLO_LABELS[ruolo] || ruolo

  return (
    <NavLink
      to="/admin/profilo"
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '5px 12px 5px 5px',
        borderRadius: '40px',
        backgroundColor: isActive ? '#EEEFFD' : '#F7F8FC',
        border: '1px solid ' + (isActive ? '#5B5FEF30' : '#E8ECF4'),
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background .15s',
        flexShrink: 0,
      })}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEEFFD'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F7F8FC'}
    >
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg,${roleColor},#5B5FEF)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {avatarUrl
          ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <span style={{ fontSize:'12px', fontWeight:'800', color:'#fff' }}>{initial}</span>
        }
      </div>

      {/* Nome + badge */}
      <div style={{ display:'flex', flexDirection:'column', gap:'1px', minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <span style={{ fontSize:'13px', fontWeight:'700', color:'#111827', whiteSpace:'nowrap', lineHeight:1, fontFamily:"'Inter',sans-serif" }}>
            {displayName}
          </span>
          {isVerified && <VerifiedBadge />}
        </div>
        <span style={{
          fontSize: '10px', fontWeight: '600', color: '#6B7280',
          lineHeight: 1, fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap',
        }}>
          {roleLabel}
        </span>
      </div>
    </NavLink>
  )
}

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

        {/* Centro: wordmark cnaeventi */}
        <div className="admin-header-center" style={{ display:'flex', alignItems:'center', gap:0 }}>
          <div style={s.titleBlock} onClick={() => window.location.reload()} title="Ricarica pagina" role="button" tabIndex={0} style={{ ...s.titleBlock, cursor:'pointer' }}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ht" x1="4" y1="4" x2="36" y2="13" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#003DA5"/>
                  <stop offset="100%" stopColor="#1a5abf"/>
                </linearGradient>
                <linearGradient id="hl" x1="4" y1="13" x2="20" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#5B5FEF"/>
                  <stop offset="100%" stopColor="#4338CA"/>
                </linearGradient>
                <linearGradient id="hr" x1="36" y1="13" x2="20" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7C4DFF"/>
                  <stop offset="100%" stopColor="#5B5FEF"/>
                </linearGradient>
              </defs>
              <polygon points="20,4 36,13 20,22 4,13" fill="url(#ht)"/>
              <polygon points="4,13 20,22 20,36 4,27" fill="url(#hl)"/>
              <polygon points="36,13 20,22 20,36 36,27" fill="url(#hr)"/>
            </svg>
            <span style={s.pageTitle}>
              <span style={{ color:'#111111' }}>cna</span>
              <span style={{ color:'#5B5FEF' }}>eventi</span>
            </span>
          </div>
        </div>

        {/* Destra: box utente */}
        <div className="admin-header-right" style={{ display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
          <UserBox />
        </div>
      </header>

      <div style={s.body}>
        <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} isMobile={isMobile}/>
        <main style={s.main}>
          <Outlet />
        </main>
      </div>

      {/* Footer full-width */}
      <footer style={s.footer}>
        <img
          src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
          alt="CNA Roma" style={{ height:'14px', objectFit:'contain', flexShrink:0, opacity:0.45 }}
        />
        <span style={s.footerText}>
          cnaeventi © 2026, software di gestione marketing ed eventi sviluppato da CNA di Roma
        </span>
      </footer>
    </div>
  )
}

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    backgroundColor: 'var(--bg-app)',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 200,
    background: '#FFFFFF',
    borderBottom: '1px solid #E8ECF4',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
    paddingBottom: '10px',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    boxSizing: 'border-box',
  },
  hamburger: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#374151', display: 'flex', alignItems: 'center',
    padding: '6px', borderRadius: '20px', flexShrink: 0,
  },
  titleBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '0px',
    alignSelf: 'center',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#111111',
    letterSpacing: '-0.05em',
    fontFamily: "'Inter', sans-serif",
    fontVariationSettings: "'wght' 900",
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
  footer: {
    flexShrink: 0,
    position: 'sticky',
    bottom: 0,
    zIndex: 200,
    background: '#FFFFFF',
    borderTop: '1px solid #F0F0EC',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 24px',
    boxSizing: 'border-box',
  },
  footerText: {
    fontSize: '10px',
    color: '#D8D8D4',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '400',
    lineHeight: 1.4,
  },
}
