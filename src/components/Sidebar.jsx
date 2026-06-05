import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Mail,
  QrCode,
  BarChart2,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/eventi', label: 'Eventi', icon: CalendarDays },
  { to: '/admin/iscritti', label: 'Iscritti', icon: Users },
  { to: '/admin/email', label: 'Email', icon: Mail },
  { to: '/admin/checkin', label: 'Check-in', icon: QrCode },
  { to: '/admin/statistiche', label: 'Statistiche', icon: BarChart2 },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Admin'

  return (
    <aside style={{ ...styles.sidebar, width: collapsed ? '64px' : '240px' }}>
      {/* Logo area */}
      <div style={styles.logoArea}>
        {!collapsed && (
          <img
            src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
            alt="CNA Roma"
            style={styles.logo}
          />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ ...styles.collapseBtn, marginLeft: collapsed ? 'auto' : 'auto' }}
          title={collapsed ? 'Espandi menu' : 'Comprimi menu'}
        >
          <ChevronRight
            size={16}
            style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}
          />
        </button>
      </div>

      {/* Nav items */}
      <nav style={styles.nav}>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              ...styles.navLink,
              backgroundColor: isActive ? '#EEF3FF' : 'transparent',
              color: isActive ? '#003DA5' : '#0A0A0A',
              fontWeight: isActive ? '700' : '400',
              justifyContent: collapsed ? 'center' : 'flex-start',
            })}
            title={collapsed ? label : undefined}
          >
            <Icon size={20} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={styles.navLabel}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={styles.bottomArea}>
        {!collapsed && (
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={styles.userName}>{username}</p>
              <p style={styles.userRole}>Amministratore</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          style={{ ...styles.logoutBtn, justifyContent: collapsed ? 'center' : 'flex-start' }}
          title="Esci"
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Esci</span>}
        </button>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    height: '100vh',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    transition: 'width 0.2s ease',
    overflow: 'hidden',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 16px',
    borderBottom: '1px solid #E5E7EB',
    minHeight: '80px',
    gap: '8px',
  },
  logo: {
    height: '40px',
    objectFit: 'contain',
    flex: 1,
    minWidth: 0,
  },
  collapseBtn: {
    background: 'none',
    border: '1px solid #E5E7EB',
    borderRadius: '4px',
    cursor: 'pointer',
    padding: '4px',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '14px',
    letterSpacing: '-0.01em',
    transition: 'background-color 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  },
  navLabel: {
    overflow: 'hidden',
  },
  bottomArea: {
    padding: '12px 8px',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    overflow: 'hidden',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#003DA5',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0A0A0A',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '11px',
    color: '#6B7280',
    margin: 0,
    fontWeight: '500',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    color: '#DC2626',
    fontWeight: '500',
    borderRadius: '4px',
    width: '100%',
    transition: 'background-color 0.15s',
  },
}
