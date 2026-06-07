import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'


export default function AdminLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [isMobile,     setIsMobile]     = useState(false)

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

  useEffect(() => {
    if (isMobile) { setSidebarWidth(0); return }
    const observer = new ResizeObserver(entries => {
      for (const e of entries) setSidebarWidth(e.contentRect.width)
    })
    const sidebar = document.querySelector('aside')
    if (sidebar) observer.observe(sidebar)
    return () => observer.disconnect()
  }, [isMobile])

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const pageTitle = 'Events'

  return (
    <div style={s.root}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} isMobile={isMobile}/>

      {/* ── UNICO HEADER fisso a tutta larghezza ── */}
      <header style={{ ...s.header, left: isMobile ? 0 : `${sidebarWidth}px` }}>
        {isMobile && (
          <button onClick={() => setMobileOpen(true)} style={s.hamburger}>
            <Menu size={24}/>
          </button>
        )}
        <img
          src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
          alt="CNA Roma"
          style={s.logo}
        />
        <div style={s.divider}/>
        <h1 style={s.pageTitle}>{pageTitle}</h1>
      </header>

      <main style={{
        ...s.main,
        marginLeft:  isMobile ? '0' : `${sidebarWidth}px`,
        paddingTop:  isMobile ? '76px' : '88px',
        padding:     isMobile ? '76px 14px 24px' : '88px 32px 32px',
      }}>
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  root: { minHeight:'100vh', backgroundColor:'#F4F5F7', fontFamily:"'Inter',sans-serif" },
  header: {
    position:'fixed', top:0, right:0, zIndex:50,
    backgroundColor:'#FFFFFF', borderBottom:'2px solid #003DA5',
    height:'72px', display:'flex', alignItems:'center',
    padding:'0 28px', gap:'18px',
    boxShadow:'0 2px 8px rgba(0,61,165,.08)',
    transition:'left 0.2s ease',
  },
  hamburger: {
    background:'none', border:'none', cursor:'pointer',
    color:'#0A0A0A', display:'flex', alignItems:'center',
    padding:'6px', borderRadius:'6px', marginRight:'4px', flexShrink:0,
  },
  logo:     { height:'48px', objectFit:'contain', flexShrink:0 },
  divider:  { width:'1.5px', height:'32px', backgroundColor:'#E5E7EB', flexShrink:0 },
  pageTitle:{
    fontSize:'26px', fontWeight:'900', color:'#0A0A0A',
    letterSpacing:'-0.04em', margin:0,
    fontFamily:"'Inter',sans-serif", lineHeight:1, whiteSpace:'nowrap',
  },
  main: { minHeight:'100vh', transition:'margin-left 0.2s ease' },
}
