import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, CalendarDays, Users, Mail,
  QrCode, BarChart2, LogOut, UserCog, X, User2, Activity,
  ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const RUOLO_COLORS  = { superadmin: '#003DA5', admin: '#003DA5', supervisore: '#D97706', utente: '#6B7280' }
const RUOLO_LABELS  = { superadmin: 'Super Admin', admin: 'Admin', supervisore: 'Supervisore', utente: 'Utente' }

const NAV_GROUPS = [
  {
    label: 'Gestione',
    items: [
      { to: '/admin',             label: 'Dashboard',    icon: LayoutDashboard, end: true },
      { to: '/admin/eventi',      label: 'Eventi',       icon: CalendarDays },
      { to: '/admin/iscritti',    label: 'Iscritti',     icon: Users },
      { to: '/admin/checkin',     label: 'Check-in',     icon: QrCode },
    ],
  },
  {
    label: 'Analisi',
    items: [
      { to: '/admin/statistiche', label: 'Statistiche',  icon: BarChart2 },
      { to: '/admin/log',         label: 'Log attività', icon: Activity },
    ],
  },
  {
    label: 'Comunicazioni',
    items: [
      { to: '/admin/email', label: 'Email', icon: Mail },
    ],
  },
]

export default function Sidebar({ mobileOpen, onMobileClose, isMobile }) {
  const { user, signOut } = useAuth()
  const { ruolo, isAdmin } = useRole()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (!user?.id) return
    supabase.from('admin_profiles')
      .select('avatar_url, nome, cognome, username')
      .eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
        const n = [data?.nome, data?.cognome].filter(Boolean).join(' ')
        setDisplayName(n || data?.username || user?.email?.split('@')[0] || 'Admin')
      })
  }, [user])

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const adminItems = isAdmin ? [{ to: '/admin/utenti', label: 'Utenti', icon: UserCog }] : []
  const profileItem = { to: '/admin/profilo', label: 'Profilo', icon: User2 }

  const allGroups = [
    ...NAV_GROUPS,
    ...(adminItems.length ? [{ label: 'Amministrazione', items: adminItems }] : []),
  ]

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const handleNavClick = () => { if (onMobileClose) onMobileClose() }

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && isMobile && (
        <div
          onClick={onMobileClose}
          style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.4)', zIndex:99, backdropFilter:'blur(2px)' }}
        />
      )}

      <aside style={{
        ...st.sidebar,
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
      }}>

        {/* Close mobile */}
        {isMobile && (
          <div style={st.mobileTop}>
            <img
              src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
              alt="CNA Roma" style={{ height: '28px', objectFit: 'contain' }}
            />
            <button onClick={onMobileClose} style={st.closeBtn}><X size={18}/></button>
          </div>
        )}

        {/* ── USER CARD ── */}
        <NavLink to="/admin/profilo" onClick={handleNavClick} style={({ isActive }) => ({
          ...st.userCard,
          borderColor: isActive ? '#BFDBFE' : 'transparent',
          backgroundColor: isActive ? '#EFF6FF' : '#F8FAFD',
        })}>
          <div style={{
            ...st.avatar,
            background: `linear-gradient(135deg, ${RUOLO_COLORS[ruolo] || '#003DA5'}, #1a56db)`,
          }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
              : <span style={{ fontSize:'14px', fontWeight:'800', color:'#fff', letterSpacing:'-0.02em' }}>{initials}</span>
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={st.userName}>{displayName}</p>
            <span style={{ ...st.roleBadge, backgroundColor: (RUOLO_COLORS[ruolo]||'#6B7280') + '18', color: RUOLO_COLORS[ruolo] || '#6B7280' }}>
              {RUOLO_LABELS[ruolo] || ruolo}
            </span>
          </div>
          <ChevronRight size={14} style={{ color:'#9CA3AF', flexShrink:0 }}/>
        </NavLink>

        {/* ── NAVIGAZIONE RAGGRUPPATA ── */}
        <nav style={st.nav}>
          {allGroups.map(group => (
            <div key={group.label} style={st.group}>
              <p style={st.groupLabel}>{group.label}</p>
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={handleNavClick}
                  style={({ isActive }) => ({
                    ...st.navLink,
                    backgroundColor: isActive ? '#EEF3FF' : 'transparent',
                    color:           isActive ? '#003DA5' : '#4B5563',
                  })}>
                  {({ isActive }) => (
                    <>
                      <div style={{
                        ...st.iconWrap,
                        background: isActive
                          ? 'linear-gradient(135deg,#003DA5,#1a56db)'
                          : 'transparent',
                      }}>
                        <Icon size={16} style={{ color: isActive ? '#fff' : '#6B7280', flexShrink:0 }}/>
                      </div>
                      <span style={{ fontSize:'13px', fontWeight: isActive ? '700' : '500', letterSpacing:'-0.01em' }}>{label}</span>
                      {isActive && <div style={st.activeDot}/>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Profilo separato in fondo al nav */}
          <div style={{ ...st.group, marginTop:'auto', paddingTop:'8px', borderTop:'1px solid #F3F4F6' }}>
            <NavLink to={profileItem.to} onClick={handleNavClick}
              style={({ isActive }) => ({
                ...st.navLink,
                backgroundColor: isActive ? '#EEF3FF' : 'transparent',
                color:           isActive ? '#003DA5' : '#4B5563',
              })}>
              {({ isActive }) => (
                <>
                  <div style={{
                    ...st.iconWrap,
                    background: isActive ? 'linear-gradient(135deg,#003DA5,#1a56db)' : 'transparent',
                  }}>
                    <User2 size={16} style={{ color: isActive ? '#fff' : '#6B7280' }}/>
                  </div>
                  <span style={{ fontSize:'13px', fontWeight: isActive ? '700' : '500', letterSpacing:'-0.01em' }}>Profilo</span>
                  {isActive && <div style={st.activeDot}/>}
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* ── LOGOUT ── */}
        <div style={st.logoutWrap}>
          <button onClick={handleSignOut} style={st.logoutBtn}
            onMouseEnter={e => e.currentTarget.style.backgroundColor='#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
            <LogOut size={15} style={{ flexShrink:0 }}/>
            <span>Esci</span>
          </button>
        </div>

      </aside>
    </>
  )
}

const st = {
  sidebar: {
    width: '220px',
    height: 'calc(100vh - 56px)',
    top: '56px',
    position: 'fixed',
    left: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform .22s cubic-bezier(.4,0,.2,1)',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  mobileTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px 8px', borderBottom: '1px solid #F3F4F6', flexShrink: 0,
  },
  closeBtn: {
    background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px',
    cursor: 'pointer', padding: '5px', color: '#6B7280', display: 'flex', alignItems: 'center',
  },
  userCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    margin: '10px 10px 4px', padding: '10px 12px',
    borderRadius: '10px', border: '1px solid transparent',
    textDecoration: 'none', transition: 'all .15s', flexShrink: 0,
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  userName: {
    fontSize: '13px', fontWeight: '700', color: '#0A0A0A',
    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
  },
  roleBadge: {
    display: 'inline-block', fontSize: '10px', fontWeight: '700',
    padding: '1px 7px', borderRadius: '20px', textTransform: 'capitalize',
  },
  nav: {
    flex: 1, padding: '6px 10px 4px', display: 'flex',
    flexDirection: 'column', gap: '0', overflowY: 'auto',
  },
  group: { marginBottom: '4px' },
  groupLabel: {
    fontSize: '10px', fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    margin: '10px 0 3px 4px', padding: 0,
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: '9px',
    padding: '7px 10px', borderRadius: '8px',
    textDecoration: 'none', transition: 'background-color .12s',
    position: 'relative', minHeight: '34px',
  },
  iconWrap: {
    width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background .15s',
  },
  activeDot: {
    position: 'absolute', right: '10px', width: '5px', height: '5px',
    borderRadius: '50%', backgroundColor: '#003DA5',
  },
  logoutWrap: { padding: '8px 10px 12px', flexShrink: 0 },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '9px 12px', width: '100%',
    background: 'none', border: '1px solid #FECACA',
    borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontFamily: "'Inter', sans-serif",
    color: '#DC2626', fontWeight: '700',
    transition: 'background-color .12s',
  },
}
