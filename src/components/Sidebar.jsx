import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import {
  LayoutDashboard, CalendarDays, Users, Mail,
  QrCode, BarChart2, LogOut, ChevronRight, UserCog, X, User2,
} from 'lucide-react'
import { useState } from 'react'

export default function Sidebar({ mobileOpen, onMobileClose, isMobile: isMobileProp }) {
  const { user, signOut } = useAuth()
  const { ruolo, isAdmin } = useRole()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { to: '/admin',             label: 'Dashboard',   icon: LayoutDashboard, end: true },
    { to: '/admin/eventi',      label: 'Eventi',      icon: CalendarDays },
    { to: '/admin/iscritti',    label: 'Iscritti',    icon: Users },
    { to: '/admin/email',       label: 'Email',       icon: Mail },
    { to: '/admin/checkin',     label: 'Check-in',    icon: QrCode },
    { to: '/admin/statistiche', label: 'Statistiche', icon: BarChart2 },
    ...(isAdmin ? [{ to: '/admin/utenti', label: 'Utenti', icon: UserCog }] : []),
    { to: '/admin/profilo', label: '👤 Profilo', icon: User2 },
  ]

  const RUOLO_COLORS = { admin:'#003DA5', supervisore:'#D97706', utente:'#6B7280' }
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Admin'
  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const isMobile = isMobileProp ?? (typeof window !== 'undefined' && window.innerWidth < 768)

  function handleNavClick() {
    if (onMobileClose) onMobileClose()
  }

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)',
            zIndex:99, display: isMobile ? 'block' : 'none'
          }}
        />
      )}

      <aside style={{
        ...st.sidebar,
        width: collapsed ? '64px' : '240px',
        // Mobile: drawer
        transform: isMobile
          ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)')
          : 'translateX(0)',
      }}>

        {/* Header sidebar: logo solo su mobile drawer, pulsante collapse su desktop */}
        <div style={{ ...st.logoArea, justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
          {isMobile && (
            <img
              src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
              alt="CNA Roma" style={{ height:'36px', objectFit:'contain' }}
            />
          )}
          {isMobile ? (
            <button onClick={onMobileClose} style={st.collapseBtn}><X size={18}/></button>
          ) : (
            <button onClick={() => setCollapsed(!collapsed)} style={st.collapseBtn}>
              <ChevronRight size={16} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition:'transform 0.2s' }}/>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={st.nav}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={handleNavClick}
              style={({ isActive }) => ({
                ...st.navLink,
                backgroundColor: isActive ? '#EEF3FF' : 'transparent',
                color:           isActive ? '#003DA5' : '#0A0A0A',
                fontWeight:      isActive ? '700' : '500',
                justifyContent:  collapsed && !isMobile ? 'center' : 'flex-start',
              })}
              title={collapsed && !isMobile ? label : undefined}>
              <Icon size={20} style={{ flexShrink:0, color:'inherit' }}/>
              {(!collapsed || isMobile) && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div style={st.bottomArea}>
          {(!collapsed || isMobile) && (
            <div style={st.userInfo}>
              <div style={{ ...st.avatar, backgroundColor: RUOLO_COLORS[ruolo] || '#003DA5' }}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={st.userName}>{username}</p>
                <p style={{ ...st.userRole, color: RUOLO_COLORS[ruolo] || '#6B7280' }}>{ruolo}</p>
              </div>
            </div>
          )}
          <button onClick={handleSignOut}
            style={{
              display:'flex', alignItems:'center', gap:'8px',
              padding:'11px 12px', width:'100%',
              background:'none',
              border:'1px solid #FECACA',
              borderRadius:'6px',
              cursor:'pointer',
              fontSize:'14px',
              fontFamily:"'Inter',sans-serif",
              color:'#DC2626',
              fontWeight:'700',
              justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              transition:'background-color .15s',
            }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor='#FEF2F2'}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}
          >
            <LogOut size={18} style={{ flexShrink:0 }}/>
            {(!collapsed || isMobile) && <span>Esci dall'app</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

const st = {
  sidebar:    {
    height:'100vh', backgroundColor:'#FFFFFF', borderRight:'1px solid #E5E7EB',
    display:'flex', flexDirection:'column',
    position:'fixed', top:0, left:0, zIndex:100,
    transition:'width 0.2s ease, transform 0.25s ease',
    overflow:'hidden',
  },
  logoArea:   { display:'flex', alignItems:'center', padding:'16px', borderBottom:'1px solid #E5E7EB', minHeight:'72px', gap:'8px' },
  logo:       { height:'40px', objectFit:'contain', flex:1, minWidth:0 },
  collapseBtn:{ background:'none', border:'1px solid #E5E7EB', borderRadius:'6px', cursor:'pointer', padding:'6px', color:'#6B7280', display:'flex', alignItems:'center', flexShrink:0 },
  nav:        { flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:'2px', overflowY:'auto' },
  navLink:    { display:'flex', alignItems:'center', gap:'10px', padding:'11px 12px', borderRadius:'6px', textDecoration:'none', fontSize:'14px', letterSpacing:'-0.01em', transition:'background-color 0.15s', whiteSpace:'nowrap' },
  bottomArea: { padding:'12px 8px', borderTop:'1px solid #E5E7EB', display:'flex', flexDirection:'column', gap:'8px' },
  userInfo:   { display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', overflow:'hidden' },
  avatar:     { width:'34px', height:'34px', borderRadius:'50%', color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', flexShrink:0 },
  userName:   { fontSize:'13px', fontWeight:'600', color:'#0A0A0A', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userRole:   { fontSize:'11px', margin:0, fontWeight:'600', textTransform:'capitalize' },
  logoutBtn:  { display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontFamily:"'Inter',sans-serif", color:'#DC2626', fontWeight:'600', borderRadius:'6px', width:'100%' },
}
