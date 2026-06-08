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

    // Se non contiene @ è un username → risolvi la email da admin_profiles
    if (!email.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('email')
        .eq('username', email)
        .eq('attivo', true)
        .maybeSingle()

      if (profileError || !profile) {
        return { data: null, error: { message: 'Username non trovato' } }
      }
      email = profile.email
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
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
