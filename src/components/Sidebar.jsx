import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

const RUOLO_COLORS = { superadmin:'#5B5FEF', admin:'#5B5FEF', supervisore:'#7C4DFF', utente:'#6B7280' }
const RUOLO_LABELS = { superadmin:'Super Admin', admin:'Admin', supervisore:'Supervisore', utente:'Utente' }

// Colori voce attiva (accent) invariati — solo inattivo diventa nero
const ICON_INACTIVE = '#111111'
const TEXT_INACTIVE = '#111111'

const icons = {
  social: (col='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  dashboard: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  calendar: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  users: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  ),
  qr: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M17 21v-1"/><path d="M21 14v3"/>
    </svg>
  ),
  chart: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  activity: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  mail: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
    </svg>
  ),
  sms: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="9" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="15" y1="10" x2="15" y2="10"/>
    </svg>
  ),
  landing: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  ),
  usercog: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/>
      <circle cx="19" cy="19" r="2"/><path d="M19 15v1M19 21v1M15.27 16.27l.73.73M22 18h1M15 18h1M15.27 21.73l.73-.73M22 21.73l-.73-.73"/>
    </svg>
  ),
  user2: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  logout: (c='#DC2626') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  globe: (c=ICON_INACTIVE) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  close: (c='#6B7280') => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

function HoverNavLink({ to, end, onClick, activeColor, iconKey, label, activeDot, iconWrap, navLink, collapsed }) {
  const [hovered, setHovered] = useState(false)
  return (
    <NavLink to={to} end={end} onClick={onClick}
      title={collapsed ? label : undefined}
      style={({ isActive }) => ({
        ...navLink,
        backgroundColor: isActive ? activeColor + '15' : hovered ? '#F3F4F6' : 'transparent',
        color: isActive ? activeColor : TEXT_INACTIVE,
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {({ isActive }) => (
        <>
          <div style={{
            ...iconWrap,
            backgroundColor: isActive ? activeColor : hovered ? '#E8ECF4' : '#F3F4F6',
          }}>
            {icons[iconKey]?.(isActive ? '#fff' : ICON_INACTIVE)}
          </div>
          {!collapsed && (
            <>
              <span className="nav-label" style={{ fontSize:'13px', fontWeight: isActive ? '700' : '500', letterSpacing:'-0.01em', flex:1 }}>{label}</span>
              {isActive && <div style={{ ...activeDot, backgroundColor: activeColor }}/>}
            </>
          )}
        </>
      )}
    </NavLink>
  )
}

const NAV_GROUPS = [
  {
    label: 'Gestione', color: '#5B5FEF',
    items: [
      { to:'/admin',             label:'Dashboard',    iconKey:'dashboard', end:true,  activeColor:'#5B5FEF', sezione:'dashboard' },
      { to:'/admin/eventi',      label:'Eventi',       iconKey:'calendar',             activeColor:'#5B5FEF', sezione:'eventi' },
      { to:'/admin/iscritti',    label:'Iscritti',     iconKey:'users',                activeColor:'#059669', sezione:'iscritti' },
      { to:'/admin/checkin',     label:'Check-in',     iconKey:'qr',                   activeColor:'#7C3AED', sezione:'checkin' },
    ],
  },
  {
    label: 'Analisi', color: '#D97706',
    items: [
      { to:'/admin/statistiche', label:'Statistiche',  iconKey:'chart',                activeColor:'#D97706', sezione:'statistiche' },
      { to:'/admin/log',         label:'Log attività', iconKey:'activity',             activeColor:'#0891B2', sezione:'log' },
    ],
  },
  {
    label: 'Comunicazioni', color: '#E85D24',
    items: [
      { to:'/admin/email',       label:'Email',        iconKey:'mail',                 activeColor:'#E85D24', sezione:'email' },
      { to:'/admin/sms',         label:'SMS',          iconKey:'sms',                  activeColor:'#059669', sezione:'sms' },
    ],
  },
  {
    label: 'Marketing', color: '#059669',
    items: [
      { to:'/admin/landing',     label:'Landing Page', iconKey:'landing',              activeColor:'#0891B2', sezione:'landing' },
      { to:'/admin/social',      label:'Social',       iconKey:'social',               activeColor:'#E1306C', sezione:'sociale' },
      { to:'/admin/calendario',  label:'Calendario',   iconKey:'globe',                activeColor:'#059669', sezione:'calendario' },
    ],
  },
  {
    label: 'Amministrazione', color: '#7C3AED',
    items: [
      { to:'/admin/utenti',      label:'Utenti',       iconKey:'usercog',              activeColor:'#7C3AED', sezione:'utenti' },
      { to:'/admin/ruoli',       label:'Ruoli',        iconKey:'usercog',              activeColor:'#7C3AED', sezione:'ruoli' },
      { to:'/admin/profilo',     label:'Profilo',      iconKey:'user2',                activeColor:'#5B5FEF', sezione:'profilo' },
    ],
  },
]

export default function Sidebar({ mobileOpen, onMobileClose, isMobile }) {
  const { user, signOut } = useAuth()
  const { ruolo, canView } = useRole()
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === '1' } catch { return false }
  })

  const toggleCollapse = () => {
    setCollapsed(v => {
      const next = !v
      try { localStorage.setItem('sidebar-collapsed', next ? '1' : '0') } catch {}
      return next
    })
  }

  useEffect(() => {
    if (!user?.id) return
    supabase.from('admin_profiles')
      .select('avatar_url, nome, cognome, username')
      .eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
        const n = data?.nome || data?.username || user?.email?.split('@')[0] || 'Admin'
        setDisplayName(n)
      })
  }, [user])

  const initials = displayName ? displayName[0].toUpperCase() : '?'
  const isVerified = ruolo === 'admin' || ruolo === 'superadmin' || ruolo === 'supervisore'

  const allGroups = NAV_GROUPS
    .map(group => ({ ...group, items: group.items.filter(it => canView(it.sezione)) }))
    .filter(group => group.items.length > 0)

  const handleNavClick = () => { if (onMobileClose) onMobileClose() }

  const isCollapsed = !isMobile && collapsed

  return (
    <>
      {/* Overlay sfondo mobile */}
      {mobileOpen && isMobile && (
        <div
          onClick={onMobileClose}
          style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.4)', zIndex:99, backdropFilter:'blur(2px)' }}
        />
      )}

      <aside style={{
        ...st.sidebar,
        width: isCollapsed ? '56px' : '220px',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        height: '100vh',
        maxHeight: '100dvh',
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        // Su mobile: sidebar occupa tutta l'altezza, sopra l'header
        zIndex: isMobile ? 200 : 100,
      }}>

        {/* Header mobile: wordmark cnaeventi + tasto chiudi */}
        {isMobile && (
          <div style={st.mobileTop}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sm-ht" x1="4" y1="4" x2="36" y2="13" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#003DA5"/><stop offset="100%" stopColor="#1a5abf"/>
                  </linearGradient>
                  <linearGradient id="sm-hl" x1="4" y1="13" x2="20" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#5B5FEF"/><stop offset="100%" stopColor="#4338CA"/>
                  </linearGradient>
                  <linearGradient id="sm-hr" x1="36" y1="13" x2="20" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#7C4DFF"/><stop offset="100%" stopColor="#5B5FEF"/>
                  </linearGradient>
                </defs>
                <polygon points="20,4 36,13 20,22 4,13" fill="url(#sm-ht)"/>
                <polygon points="4,13 20,22 20,36 4,27" fill="url(#sm-hl)"/>
                <polygon points="36,13 20,22 20,36 36,27" fill="url(#sm-hr)"/>
              </svg>
              <span style={{ fontFamily:"'Inter',sans-serif", fontWeight:900, fontSize:22, letterSpacing:'-0.04em', lineHeight:1 }}>
                <span style={{ color:'#111111' }}>cna</span>
                <span style={{ color:'#5B5FEF' }}>eventi</span>
              </span>
            </div>
            <button onClick={onMobileClose} style={st.closeBtn}>{icons.close()}</button>
          </div>
        )}

        {/* Toggle collassa — solo desktop */}
        {!isMobile && (
          <div style={{ display:'flex', justifyContent: isCollapsed ? 'center' : 'flex-end', padding: isCollapsed ? '10px 0' : '10px 10px 0', flexShrink:0 }}>
            <button
              onClick={toggleCollapse}
              title={isCollapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
              style={{ background:'none', border:'1px solid #E8ECF4', borderRadius:'20px', cursor:'pointer', padding:'5px 6px', display:'flex', alignItems:'center', color:'#9CA3AF', transition:'color .15s, background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor='#F3F4F6'; e.currentTarget.style.color='#374151' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor='transparent'; e.currentTarget.style.color='#9CA3AF' }}
            >
              {isCollapsed ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
              )}
            </button>
          </div>
        )}

        {/* NAVIGAZIONE */}
        <nav style={{ ...st.nav, padding: isCollapsed ? '6px 6px 4px' : '6px 10px 4px' }}>

          {allGroups.map(group => (
            <div key={group.label} style={{ ...st.group }}>
              {!isCollapsed && (
                <p style={{
                  ...st.groupLabel,
                  margin:'8px 0 2px',
                  padding:'4px 8px',
                  borderRadius:'20px',
                  display:'flex', alignItems:'center', gap:'6px',
                  background:'linear-gradient(90deg, #EEF0FD 0%, #F3F0FF 100%)',
                  color:'#111111',
                }}>
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#5B5FEF', flexShrink:0, display:'inline-block' }}/>
                  {group.label}
                </p>
              )}
              {isCollapsed && <div style={{ height:'8px' }}/>}
              {group.items.map(({ to, label, iconKey, end, activeColor }) => (
                <HoverNavLink key={to} to={to} end={end} onClick={handleNavClick}
                  activeColor={activeColor} iconKey={iconKey} label={label}
                  activeDot={st.activeDot} iconWrap={st.iconWrap}
                  navLink={{ ...st.navLink, justifyContent: isCollapsed ? 'center' : undefined, padding: isCollapsed ? '7px' : '7px 10px' }}
                  collapsed={isCollapsed}
                />
              ))}
            </div>
          ))}

        </nav>

        {/* Bottone Esci */}
        <div style={{ padding:'6px 10px 8px', flexShrink:0 }}>
          <div style={{ height:'1px', background:'#F3F4F6', marginBottom:'6px' }}/>
          <button
            onClick={() => signOut()}
            title={isCollapsed ? 'Esci' : undefined}
            style={{ ...st.logoutBtn, justifyContent: isCollapsed ? 'center' : undefined, padding: isCollapsed ? '7px' : '7px 10px' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor='#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
            {icons.logout()}
            {!isCollapsed && <span className="logout-label">Esci dall'app</span>}
          </button>
        </div>

      </aside>
    </>
  )
}

const st = {
  sidebar: {
    width:'220px', flexShrink:0,
    position:'sticky', top:0, alignSelf:'flex-start',
    height:'100vh', maxHeight:'100dvh',
    zIndex:100,
    backgroundColor:'#FFFFFF', borderRight:'1px solid #E8ECF4',
    display:'flex', flexDirection:'column',
    transition:'transform .22s cubic-bezier(.4,0,.2,1), width .2s cubic-bezier(.4,0,.2,1)',
    overflowY:'auto', overflowX:'hidden',
  },
  mobileTop: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'14px 14px 10px', borderBottom:'1px solid #F3F4F6', flexShrink:0,
  },
  closeBtn: {
    background:'none', border:'1px solid #E8ECF4', borderRadius:'20px',
    cursor:'pointer', padding:'6px', display:'flex', alignItems:'center',
  },
  nav: {
    flex:1, padding:'6px 10px 4px', display:'flex',
    flexDirection:'column', gap:0, overflowY:'auto',
  },
  group: { marginBottom:'4px' },
  groupLabel: {
    fontSize:'10px', fontWeight:'700',
    textTransform:'uppercase', letterSpacing:'0.07em',
    margin:'10px 0 3px 4px', padding:0,
  },
  navLink: {
    display:'flex', alignItems:'center', gap:'9px',
    padding:'7px 10px', borderRadius:'16px',
    textDecoration:'none', transition:'background-color .12s',
    position:'relative', minHeight:'34px',
  },
  iconWrap: {
    width:'26px', height:'26px', borderRadius:'20px', flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'background .15s',
  },
  activeDot: {
    width:'5px', height:'5px', borderRadius:'50%',
  },
  logoutBtn: {
    display:'flex', alignItems:'center', gap:'9px',
    padding:'7px 10px', width:'100%',
    background:'none', border:'none',
    borderRadius:'20px', cursor:'pointer',
    fontSize:'13px', fontFamily:"'Inter',sans-serif",
    color:'#DC2626', fontWeight:'600',
    transition:'background-color .12s',
    textAlign:'left', minHeight:'34px',
  },
}
