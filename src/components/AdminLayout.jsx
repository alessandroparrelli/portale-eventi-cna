import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'

const RUOLO_COLORS = { superadmin:'#7C3AED', admin:'#003DA5', supervisore:'#059669', utente:'#6B7280' }
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
        backgroundColor: isActive ? '#EEF3FF' : '#F4F5F7',
        border: '1px solid ' + (isActive ? '#C7D9F8' : '#E5E7EB'),
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background .15s',
        flexShrink: 0,
      })}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF3FF'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F4F5F7'}
    >
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg,${roleColor},#1a56db)`,
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
          <span style={{ fontSize:'13px', fontWeight:'700', color:'#fff', whiteSpace:'nowrap', lineHeight:1, fontFamily:"'Inter',sans-serif" }}>
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

        {/* Centro: logo + titolo */}
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
    background: '#FFFFFF',
    borderBottom: 'none',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
    paddingBottom: '10px',
    gap: '12px',
    boxShadow: '0 1px 0 #E5E7EB, 0 2px 8px rgba(0,0,0,0.06)',
    boxSizing: 'border-box',
  },
  hamburger: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#0A0A0A', display: 'flex', alignItems: 'center',
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
    color: '#0A0A0A',
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
