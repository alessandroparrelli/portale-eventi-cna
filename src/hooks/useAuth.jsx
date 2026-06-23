import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (emailOrUsername, password) => {
    let email = emailOrUsername.trim()

    if (!email.includes('@')) {
      const { data: resolvedEmail, error: rpcError } = await supabase
        .rpc('get_email_by_username', { p_username: email })
      if (rpcError || !resolvedEmail) {
        return { data: null, error: { message: 'Username non trovato' } }
      }
      email = resolvedEmail
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      // Forza reload completo — garantisce che tutto lo stato venga reinizializzato
      window.location.replace('/admin')
    }
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // Forza reload completo — evita race condition con ProtectedRoute
    window.location.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
