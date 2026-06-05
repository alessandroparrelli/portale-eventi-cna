import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return }
    supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { setProfile(data); setLoading(false) })
  }, [user])

  const ruolo = profile?.ruolo ?? user?.user_metadata?.ruolo ?? 'utente'

  return {
    profile,
    loading,
    ruolo,
    isAdmin: ruolo === 'admin',
    isSupervisore: ruolo === 'supervisore',
    isUtente: ruolo === 'utente',
    canWrite: ruolo === 'admin' || ruolo === 'supervisore',
    canDelete: ruolo === 'admin',
    canManageUsers: ruolo === 'admin',
  }
}
