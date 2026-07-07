import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logAttivita, resetActivityLogCache } from '../lib/activityLog'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,           setUser]           = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null)
        setSessionExpired(true)
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
        setSessionExpired(false)
      } else {
        setUser(session?.user ?? null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (emailOrUsername, password) => {
    let email = (emailOrUsername || '').trim()

    // username → risolvi email
    if (!email.includes('@')) {
      const { data: resolvedEmail, error: rpcError } = await supabase
        .rpc('get_email_by_username', { p_username: email })
      if (rpcError || !resolvedEmail) {
        return { data: null, error: { message: 'Username non trovato. Prova con la tua email.' } }
      }
      email = resolvedEmail
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { data: null, error }
    }

    // Successo: aspetta che la sessione sia salvata, poi naviga
    await new Promise(r => setTimeout(r, 300))
    if (data?.user?.id) {
      logAttivita('login')
      supabase.from('admin_profiles').update({ ultimo_accesso: new Date().toISOString() }).eq('id', data.user.id)
    }
    window.location.href = '/admin'
    return { data, error: null }
  }

  const signOut = async () => {
    await logAttivita('logout')
    resetActivityLogCache()
    await supabase.auth.signOut()
    await new Promise(r => setTimeout(r, 150))
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, sessionExpired }}>
      {sessionExpired && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
          backgroundColor: '#DC2626', color: '#fff',
          padding: '12px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', fontFamily: "'Inter',sans-serif",
          fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
        }}>
          <span>⚠️ Sessione scaduta — le modifiche non vengono salvate. Fai login di nuovo.</span>
          <button
            onClick={() => { window.location.href = '/login' }}
            style={{ padding: '6px 16px', backgroundColor: '#fff', color: '#DC2626', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: '13px' }}>
            Login →
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
