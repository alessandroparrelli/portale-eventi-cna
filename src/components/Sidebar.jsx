import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

const RUOLO_COLORS = { superadmin:'#9F1239', admin:'#E11D48', supervisore:'#BE123C', utente:'#6B7280' }
const RUOLO_LABELS = { superadmin:'Super Admin', admin:'Admin', supervisore:'Supervisore', utente:'Utente' }

// ── SVG icons inline colorate ──────────────────────────────────────
const SvgIcon = ({ d, color='#6B7280', size=17, viewBox='0 0 24 24', fill='none', extra=null }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <path d={d}/>{extra}
  </svg>
)

const icons = {
  social: (col='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  dashboard: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  calendar: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  users: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  ),
  qr: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M17 21v-1"/><path d="M21 14v3"/>
    </svg>
  ),
  chart: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  activity: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  mail: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
    </svg>
  ),
  sms: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="9" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="15" y1="10" x2="15" y2="10"/>
    </svg>
  ),
  landing: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  ),
  usercog: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/>
      <circle cx="19" cy="19" r="2"/><path d="M19 15v1M19 21v1M15.27 16.27l.73.73M22 18h1M15 18h1M15.27 21.73l.73-.73M22 21.73l-.73-.73"/>
    </svg>
  ),
  user2: (c='#6B7280') => (
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
  analytics: (c='#6B7280') => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  globe: (c='#6B7280') => (
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
  chevron: (c='#9CA3AF') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
}

function HoverNavLink({ to, end, onClick, activeColor, iconKey, label, activeDot, iconWrap, navLink }) {
  const [hovered, setHovered] = useState(false)
  return (
    <NavLink to={to} end={end} onClick={onClick}
      style={({ isActive }) => ({
        ...navLink,
        backgroundColor: isActive ? activeColor + '18' : hovered ? activeColor + '12' : 'transparent',
        color: isActive ? activeColor : hovered ? activeColor : '#4B5563',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {({ isActive }) => (
        <>
          <div style={{
            ...iconWrap,
            backgroundColor: isActive ? activeColor : hovered ? activeColor + '28' : activeColor + '18',
          }}>
            {icons[iconKey]?.(isActive || hovered ? (isActive ? '#fff' : activeColor) : activeColor)}
          </div>
          <span className="nav-label" style={{ fontSize:'13px', fontWeight: isActive ? '700' : hovered ? '600' : '500', letterSpacing:'-0.01em', flex:1 }}>{label}</span>
          {isActive && <div style={{ ...activeDot, backgroundColor: activeColor }}/>}
        </>
      )}
    </NavLink>
  )
}

const NAV_GROUPS = [
  {
    label: 'Gestione', color: '#E11D48',
    items: [
      { to:'/admin',             label:'Dashboard',    iconKey:'dashboard', end:true,  activeColor:'#E11D48', sezione:'dashboard' },
      { to:'/admin/eventi',      label:'Eventi',       iconKey:'calendar',             activeColor:'#E11D48', sezione:'eventi' },
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
      { to:'/admin/social',      label:'Social',       iconKey:'social',               activeColor:'#E1306C', sezione:'social' },
      { to:'/admin/calendario',  label:'Calendario',          iconKey:'globe',          activeColor:'#059669', sezione:'calendario' },
    ],
  },
  {
    label: 'Amministrazione', color: '#7C3AED',
    items: [
      { to:'/admin/utenti',      label:'Utenti',       iconKey:'usercog',              activeColor:'#7C3AED', sezione:'utenti' },
      { to:'/admin/ruoli',       label:'Ruoli',        iconKey:'usercog',              activeColor:'#7C3AED', sezione:'ruoli' },
      { to:'/admin/profilo',     label:'Profilo',      iconKey:'user2',                activeColor:'#E11D48', sezione:'profilo' },
    ],
  },
]

export default function Sidebar({ mobileOpen, onMobileClose, isMobile }) {
  const { user, signOut } = useAuth()
  const { ruolo, canView } = useRole()
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [displayName, setDisplayName] = useState('')

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

  return (
    <>
      {mobileOpen && isMobile && (
        <div
          onClick={onMobileClose}
          style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.4)', zIndex:99, backdropFilter:'blur(2px)' }}
        />
      )}

      <aside style={{
        ...st.sidebar,
        // Mobile: drawer overlay fullscreen, sempre position:fixed (necessario
        // per coprire tutto lo schermo indipendentemente dallo scroll).
        // Desktop: sticky, resta affiancata al contenuto nel flusso normale
        // (NON fixed — evita i bug iOS documentati in IOS_FIXED_HEADER_BUG.md).
        position: isMobile ? 'fixed' : 'sticky',
        top: isMobile ? 0 : 0,
        height: isMobile ? '100vh' : '100vh',
        maxHeight: isMobile ? '100dvh' : '100dvh',
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      }}>

        {isMobile && (
          <div style={st.mobileTop}>
            <img
              src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
              alt="CNA Roma" style={{ height:'28px', objectFit:'contain' }}
            />
            <button onClick={onMobileClose} style={st.closeBtn}>{icons.close()}</button>
          </div>
        )}



        {/* NAVIGAZIONE */}
        <nav style={st.nav}>

          {allGroups.map(group => (
            <div key={group.label} style={{ ...st.group, borderRadius:'8px', overflow:'hidden' }}>
              <p style={{
                ...st.groupLabel,
                color: group.color,
                background: group.color + '10',
                margin:'8px 0 2px',
                padding:'4px 8px',
                borderRadius:'6px',
                display:'flex', alignItems:'center', gap:'6px',
              }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: group.color, flexShrink:0, display:'inline-block' }}/>
                {group.label}
              </p>
              {group.items.map(({ to, label, iconKey, end, activeColor, external }) => (
                external ? (
                  <a key={to} href={to} target="_blank" rel="noopener noreferrer" onClick={handleNavClick}
                    style={{ ...st.navLink, color:'#4B5563', textDecoration:'none' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor='#F3F4F6'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                    <div style={st.iconWrap}>
                      {icons[iconKey]?.('#9CA3AF')}
                    </div>
                    <span className="nav-label" style={{ fontSize:'13px', fontWeight:'500', letterSpacing:'-0.01em', flex:1 }}>{label}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                ) : (
                <HoverNavLink key={to} to={to} end={end} onClick={handleNavClick}
                  activeColor={activeColor} iconKey={iconKey} label={label}
                  activeDot={st.activeDot} iconWrap={st.iconWrap} navLink={st.navLink} />
                )
              ))}
              {group.label === 'Amministrazione' && (
                <button
                  onClick={() => signOut()}
                  style={st.logoutBtn}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor='#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                  {icons.logout()}
                  <span className="logout-label">Esci dall'app</span>
                </button>
              )}
            </div>
          ))}

        </nav>

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
    backgroundColor:'#FFFFFF', borderRight:'1px solid #E5E7EB',
    display:'flex', flexDirection:'column',
    transition:'transform .22s cubic-bezier(.4,0,.2,1)',
    overflowY:'auto', overflowX:'hidden',
  },
  mobileTop: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'12px 14px 8px', borderBottom:'1px solid #F3F4F6', flexShrink:0,
  },
  closeBtn: {
    background:'none', border:'1px solid #E5E7EB', borderRadius:'6px',
    cursor:'pointer', padding:'5px', display:'flex', alignItems:'center',
  },
  userCard: {
    display:'flex', alignItems:'center', gap:'10px',
    margin:'10px 10px 4px', padding:'10px 12px',
    borderRadius:'10px', border:'1px solid transparent',
    textDecoration:'none', transition:'all .15s', flexShrink:0,
  },
  avatar: {
    width:'36px', height:'36px', borderRadius:'50%', flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
  },
  userName: {
    fontSize:'13px', fontWeight:'700', color:'#0A0A0A',
    margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em',
  },
  roleBadge: {
    display:'inline-block', fontSize:'10px', fontWeight:'700',
    padding:'1px 7px', borderRadius:'20px', textTransform:'capitalize',
  },
  nav: {
    flex:1, padding:'6px 10px 4px', display:'flex',
    flexDirection:'column', gap:0, overflowY:'auto',
  },
  group: { marginBottom:'4px' },
  groupLabel: {
    fontSize:'10px', fontWeight:'700', color:'#9CA3AF',
    textTransform:'uppercase', letterSpacing:'0.07em',
    margin:'10px 0 3px 4px', padding:0,
  },
  navLink: {
    display:'flex', alignItems:'center', gap:'9px',
    padding:'7px 10px', borderRadius:'8px',
    textDecoration:'none', transition:'background-color .12s',
    position:'relative', minHeight:'34px',
  },
  iconWrap: {
    width:'26px', height:'26px', borderRadius:'6px', flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'background .15s',
  },
  activeDot: {
    width:'5px', height:'5px', borderRadius:'50%',
  },
  bottomWrap: {
    flexShrink: 0,
    borderTop: '1px solid #F3F4F6',
    padding: '8px 10px 0',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  logoutBtn: {
    display:'flex', alignItems:'center', gap:'9px',
    padding:'7px 10px', width:'100%',
    background:'none', border:'none',
    borderRadius:'8px', cursor:'pointer',
    fontSize:'13px', fontFamily:"'Outfit',sans-serif",
    color:'#DC2626', fontWeight:'600',
    transition:'background-color .12s',
    textAlign:'left', minHeight:'34px',
  },
  sidebarFooter: {
    display:'flex', alignItems:'center', gap:'8px',
    padding:'10px 10px 14px',
    borderTop:'1px solid #F3F4F6',
    marginTop:'4px',
  },
  sidebarFooterText: {
    fontSize:'9px', color:'#C4C4C0', lineHeight:'1.4',
    fontFamily:"'Outfit',sans-serif", fontWeight:'500',
  },
}
