import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, CalendarDays, Users, Mail,
  QrCode, BarChart2, LogOut, ChevronRight, UserCog, X, User2,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const RUOLO_COLORS = { admin:'#003DA5', supervisore:'#D97706', utente:'#6B7280' }

export default function Sidebar({ mobileOpen, onMobileClose, isMobile: isMobileProp }) {
  const { user, signOut } = useAuth()
  const { ruolo, isAdmin } = useRole()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)

  const isMobile = isMobileProp ?? (typeof window !== 'undefined' && window.innerWidth < 768)

  const username    = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Admin'
  const displayName = username
  const initials    = displayName.charAt(0).toUpperCase()

  // Carica avatar dal profilo
  useEffect(() => {
    if (!user?.id) return
    supabase.from('admin_profiles').select('avatar_url,nome,cognome').eq('id', user.id).single()
      .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url) })
  }, [user])

  const navItems = [
    { to: '/admin',             label: 'Dashboard',    icon: LayoutDashboard, end: true },
    { to: '/admin/eventi',      label: 'Eventi',       icon: CalendarDays },
    { to: '/admin/iscritti',    label: 'Iscritti',     icon: Users },
    { to: '/admin/email',       label: 'Email',        icon: Mail },
    { to: '/admin/checkin',     label: 'Check-in',     icon: QrCode },
    { to: '/admin/statistiche', label: 'Statistiche',  icon: BarChart2 },
    ...(isAdmin ? [{ to: '/admin/utenti',  label: 'Utenti',  icon: UserCog }] : []),
    { to: '/admin/profilo',     label: 'Il mio profilo', icon: User2 },
  ]

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const handleNavClick = () => { if (onMobileClose) onMobileClose() }

  const show = !collapsed || isMobile

  return (
    <>
      {mobileOpen && (
        <div onClick={onMobileClose} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:99, display: isMobile ? 'block' : 'none' }}/>
      )}

      <aside style={{
        ...st.sidebar,
        width: collapsed ? '64px' : '240px',
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
      }}>

        {/* Top: collapse / close */}
        <div style={{ ...st.topBar, justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
          {isMobile && (
            <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
              alt="CNA Roma" style={{ height:'32px', objectFit:'contain' }}/>
          )}
          {isMobile
            ? <button onClick={onMobileClose} style={st.iconBtn}><X size={18}/></button>
            : <button onClick={() => setCollapsed(!collapsed)} style={st.iconBtn}>
                <ChevronRight size={16} style={{ transform: collapsed ? 'rotate(0)' : 'rotate(180deg)', transition:'transform .2s' }}/>
              </button>
          }
        </div>

        {/* ── CARD UTENTE — prima di tutto ── */}
        <NavLink to="/admin/profilo" onClick={handleNavClick}
          style={({ isActive }) => ({
            ...st.userCard,
            backgroundColor: isActive ? '#EEF3FF' : '#F8FAFF',
            borderColor: isActive ? '#C7D9F8' : '#E5E7EB',
            justifyContent: !show ? 'center' : 'flex-start',
          })}>
          {/* Avatar */}
          <div style={{ ...st.avatarWrap, backgroundColor: RUOLO_COLORS[ruolo] || '#003DA5' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
              : <span style={{ fontSize:'16px', fontWeight:'900', color:'#FFF' }}>{initials}</span>
            }
          </div>
          {show && (
            <div style={{ minWidth:0, flex:1 }}>
              <p style={st.uName}>{displayName}</p>
              <p style={{ ...st.uRole, color: RUOLO_COLORS[ruolo] || '#6B7280' }}>{ruolo}</p>
            </div>
          )}
        </NavLink>

        {/* ── NAVIGAZIONE ── */}
        <nav style={st.nav}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={handleNavClick}
              style={({ isActive }) => ({
                ...st.navLink,
                backgroundColor: isActive ? '#EEF3FF' : 'transparent',
                color:           isActive ? '#003DA5' : '#374151',
                fontWeight:      isActive ? '700' : '500',
                justifyContent:  !show ? 'center' : 'flex-start',
              })}
              title={!show ? label : undefined}>
              <Icon size={19} style={{ flexShrink:0, color:'inherit' }}/>
              {show && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* ── LOGOUT ── */}
        <div style={{ padding:'8px' }}>
          <button onClick={handleSignOut}
            style={{
              display:'flex', alignItems:'center', gap:'8px',
              padding:'10px 12px', width:'100%',
              background:'none', border:'1px solid #FECACA',
              borderRadius:'8px', cursor:'pointer',
              fontSize:'13px', fontFamily:"'Inter',sans-serif",
              color:'#DC2626', fontWeight:'700',
              justifyContent: !show ? 'center' : 'flex-start',
              transition:'background-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor='#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
            <LogOut size={17} style={{ flexShrink:0 }}/>
            {show && <span>Esci dall'app</span>}
          </button>
        </div>

        {/* padding fondo */}
        <div style={{ height:'8px' }}/>
      </aside>
    </>
  )
}

const st = {
  sidebar:    { height:'calc(100vh - 60px)', top:'60px', backgroundColor:'#FFFFFF', borderRight:'1px solid #E5E7EB', display:'flex', flexDirection:'column', position:'fixed', left:0, zIndex:100, transition:'width .2s ease, transform .25s ease', overflow:'hidden' },
  topBar:     { display:'flex', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #F3F4F6', gap:'8px' },
  iconBtn:    { background:'none', border:'1px solid #E5E7EB', borderRadius:'6px', cursor:'pointer', padding:'5px', color:'#6B7280', display:'flex', alignItems:'center', flexShrink:0 },
  userCard:   { display:'flex', alignItems:'center', gap:'10px', margin:'10px 8px 4px', padding:'12px', borderRadius:'10px', border:'1px solid #E5E7EB', textDecoration:'none', transition:'background-color .15s, border-color .15s', flexShrink:0 },
  avatarWrap: { width:'38px', height:'38px', borderRadius:'50%', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' },
  uName:      { fontSize:'13px', fontWeight:'700', color:'#0A0A0A', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-.01em' },
  uRole:      { fontSize:'11px', fontWeight:'600', margin:'1px 0 0', textTransform:'capitalize' },
  nav:        { flex:1, padding:'4px 8px', display:'flex', flexDirection:'column', gap:'1px', overflowY:'auto' },
  navLink:    { display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'6px', textDecoration:'none', fontSize:'13px', letterSpacing:'-.01em', transition:'background-color .15s', whiteSpace:'nowrap' },
}
