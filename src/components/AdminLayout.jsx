import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(240)

  // Listen for sidebar collapse via resize observer on the aside element
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setSidebarWidth(entry.contentRect.width)
      }
    })
    const sidebar = document.querySelector('aside')
    if (sidebar) observer.observe(sidebar)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={styles.root}>
      <Sidebar />
      <main style={{ ...styles.main, marginLeft: `${sidebarWidth}px` }}>
        <Outlet />
      </main>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    backgroundColor: '#F4F5F7',
    fontFamily: "'Inter', sans-serif",
  },
  main: {
    transition: 'margin-left 0.2s ease',
    minHeight: '100vh',
    padding: '32px',
  },
}
