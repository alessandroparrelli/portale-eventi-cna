import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

const RUOLO_COLORS = { superadmin:'#003DA5', admin:'#003DA5', supervisore:'#D97706', utente:'#6B7280' }
const RUOLO_LABELS = { superadmin:'Super Admin', admin:'Admin', supervisore:'Supervisore', utente:'Utente' }

// ── SVG icons inline colorate ──────────────────────────────────────
const SvgIcon = ({ d, color='#6B7280', size=17, viewBox='0 0 24 24', fill='none', extra=null }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <path d={d}/>{extra}
  </svg>
)

const icons = {
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

const NAV_GROUPS = [
  {
    label: 'Gestione',
    items: [
      { to:'/admin',             label:'Dashboard',    iconKey:'dashboard', end:true,  activeColor:'#003DA5' },
      { to:'/admin/eventi',      label:'Eventi',       iconKey:'calendar',             activeColor:'#003DA5' },
      { to:'/admin/iscritti',    label:'Iscritti',     iconKey:'users',                activeColor:'#059669' },
      { to:'/admin/checkin',     label:'Check-in',     iconKey:'qr',                   activeColor:'#7C3AED' },
    ],
  },
  {
    label: 'Analisi',
    items: [
      { to:'/admin/statistiche', label:'Statistiche',  iconKey:'chart',                activeColor:'#D97706' },
      { to:'/admin/log',         label:'Log attività', iconKey:'activity',             activeColor:'#0891B2' },
    ],
  },
  {
    label: 'Comunicazioni',
    items: [
      { to:'/admin/email',       label:'Email',        iconKey:'mail',                 activeColor:'#E85D24' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to:'/admin/landing',     label:'Landing Page', iconKey:'landing',              activeColor:'#0891B2' },
    ],
  },
]

export default function Sidebar({ mobileOpen, onMobileClose, isMobile }) {
  const { user, signOut } = useAuth()
  const { ruolo, isAdmin } = useRole()
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
    ? displayName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
    : '?'

  const allGroups = [
    ...NAV_GROUPS,
    ...(isAdmin ? [{
      label: 'Amministrazione',
      items: [{ to:'/admin/utenti', label:'Utenti', iconKey:'usercog', activeColor:'#7C3AED' }],
    }] : []),
  ]

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
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
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

        {/* USER CARD */}
        <NavLink to="/admin/profilo" onClick={handleNavClick} style={({ isActive }) => ({
          ...st.userCard,
          borderColor: isActive ? '#BFDBFE' : 'transparent',
          backgroundColor: isActive ? '#EFF6FF' : '#F8FAFD',
        })}>
          <div style={{
            ...st.avatar,
            background:`linear-gradient(135deg,${RUOLO_COLORS[ruolo]||'#003DA5'},#1a56db)`,
          }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
              : <span style={{ fontSize:'13px', fontWeight:'800', color:'#fff', letterSpacing:'-0.02em' }}>{initials}</span>
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={st.userName}>{displayName}</p>
            <span style={{ ...st.roleBadge, backgroundColor:(RUOLO_COLORS[ruolo]||'#6B7280')+'18', color:RUOLO_COLORS[ruolo]||'#6B7280' }}>
              {RUOLO_LABELS[ruolo]||ruolo}
            </span>
          </div>
          {icons.chevron()}
        </NavLink>

        {/* NAVIGAZIONE */}
        <nav style={st.nav}>
          {allGroups.map(group => (
            <div key={group.label} style={st.group}>
              <p style={st.groupLabel}>{group.label}</p>
              {group.items.map(({ to, label, iconKey, end, activeColor }) => (
                <NavLink key={to} to={to} end={end} onClick={handleNavClick}
                  style={({ isActive }) => ({
                    ...st.navLink,
                    backgroundColor: isActive ? activeColor + '12' : 'transparent',
                    color: isActive ? activeColor : '#4B5563',
                  })}>
                  {({ isActive }) => (
                    <>
                      <div style={{
                        ...st.iconWrap,
                        backgroundColor: isActive ? activeColor : 'transparent',
                      }}>
                        {icons[iconKey]?.(isActive ? '#fff' : '#9CA3AF')}
                      </div>
                      <span className="nav-label" style={{ fontSize:'13px', fontWeight: isActive ? '700' : '500', letterSpacing:'-0.01em', flex:1 }}>{label}</span>
                      {isActive && <div style={{ ...st.activeDot, backgroundColor: activeColor }}/>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Profilo */}
          <div style={{ ...st.group, marginTop:'auto', paddingTop:'8px', borderTop:'1px solid #F3F4F6' }}>
            <NavLink to="/admin/profilo" onClick={handleNavClick}
              style={({ isActive }) => ({
                ...st.navLink,
                backgroundColor: isActive ? '#003DA512' : 'transparent',
                color: isActive ? '#003DA5' : '#4B5563',
              })}>
              {({ isActive }) => (
                <>
                  <div style={{ ...st.iconWrap, backgroundColor: isActive ? '#003DA5' : 'transparent' }}>
                    {icons.user2(isActive ? '#fff' : '#9CA3AF')}
                  </div>
                  <span style={{ fontSize:'13px', fontWeight: isActive ? '700' : '500', letterSpacing:'-0.01em', flex:1 }}>Profilo</span>
                  {isActive && <div style={{ ...st.activeDot, backgroundColor:'#003DA5' }}/>}
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* LOGOUT */}
        <div style={st.logoutWrap}>
          <button
            onClick={() => signOut()}
            style={st.logoutBtn}
            onMouseEnter={e => e.currentTarget.style.backgroundColor='#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
            {icons.logout()}
            <span className="logout-label">Esci dall'app</span>
          </button>
        </div>

      </aside>
    </>
  )
}

const st = {
  sidebar: {
    width:'220px', height:'calc(100vh - 56px)', top:'56px',
    position:'fixed', left:0, zIndex:100,
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
  logoutWrap: { padding:'8px 10px 12px', flexShrink:0 },
  logoutBtn: {
    display:'flex', alignItems:'center', gap:'8px',
    padding:'9px 12px', width:'100%',
    background:'none', border:'1px solid #FECACA',
    borderRadius:'8px', cursor:'pointer',
    fontSize:'13px', fontFamily:"'Inter',sans-serif",
    color:'#DC2626', fontWeight:'700',
    transition:'background-color .12s',
  },
}
