import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function AdminLayout() {
  const [sidebarWidth,  setSidebarWidth]  = useState(240)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [isMobile,      setIsMobile]      = useState(false)

  // Detect mobile
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Track sidebar width for desktop margin
  useEffect(() => {
    if (isMobile) { setSidebarWidth(0); return }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) setSidebarWidth(entry.contentRect.width)
    })
    const sidebar = document.querySelector('aside')
    if (sidebar) observer.observe(sidebar)
    return () => observer.disconnect()
  }, [isMobile])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div style={s.root}>
      {/* Sidebar — desktop fisso, mobile drawer */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile}/>

      {/* Mobile top bar */}
      {isMobile && (
        <div style={s.mobileBar}>
          <button onClick={() => setMobileOpen(true)} style={s.hamburger}>
            <Menu size={22}/>
          </button>
          <img
            src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
            alt="CNA Roma" style={s.mobilelogo}
          />
          <div style={{ width:'40px' }}/>{/* spacer per centrare logo */}
        </div>
      )}

      {/* Main content */}
      <main style={{
        ...s.main,
        marginLeft:  isMobile ? '0'   : `${sidebarWidth}px`,
        paddingTop:  isMobile ? '76px': '32px',
        padding:     isMobile ? '76px 16px 24px' : '32px',
      }}>
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  root: {
    minHeight:'100vh', backgroundColor:'#F4F5F7',
    fontFamily:"'Inter',sans-serif",
  },
  // Mobile top bar (hamburger + logo)
  mobileBar: {
    position:'fixed', top:0, left:0, right:0, zIndex:98,
    backgroundColor:'#FFFFFF', borderBottom:'2px solid #003DA5',
    height:'60px', display:'flex', alignItems:'center',
    justifyContent:'space-between', padding:'0 16px',
  },
  hamburger: {
    background:'none', border:'none', cursor:'pointer',
    color:'#0A0A0A', display:'flex', alignItems:'center',
    padding:'8px', borderRadius:'6px',
  },
  mobilelogo: { height:'36px', objectFit:'contain' },
  main: {
    transition:'margin-left 0.2s ease',
    minHeight:'100vh',
    padding:'32px',
    // Mobile: spazio per la top bar
    '@media(maxWidth:768px)': { paddingTop:'76px', padding:'76px 16px 24px' },
  },
}
