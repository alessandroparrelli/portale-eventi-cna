import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const LIVELLI = { nessuno: 0, visualizza: 1, gestisci: 2 }

export function useRole() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [permessi, setPermessi] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setProfile(null); setPermessi({}); setLoading(false); return }
    let active = true
    setLoading(true)
    Promise.all([
      supabase.from('admin_profiles').select('*').eq('id', user.id).single(),
      supabase.rpc('get_my_permessi'),
    ]).then(([{ data: prof }, { data: perm }]) => {
      if (!active) return
      setProfile(prof || null)
      setPermessi(perm || {})
      setLoading(false)
    })
    return () => { active = false }
  }, [user])

  const ruolo = profile?.ruolo ?? user?.user_metadata?.ruolo ?? 'utente'

  function livelloOf(sezione) {
    return LIVELLI[permessi?.[sezione]] ?? 0
  }
  function canView(sezione) { return livelloOf(sezione) >= LIVELLI.visualizza }
  function canManage(sezione) { return livelloOf(sezione) >= LIVELLI.gestisci }

  return {
    profile,
    permessi,
    loading,
    ruolo,
    // Flag legacy mantenuti per compatibilità — riflettono comunque il ruolo,
    // non più gli unici usati per i permessi (ora granulari per sezione).
    isAdmin: ruolo === 'admin',
    isSupervisore: ruolo === 'supervisore',
    isUtente: ruolo === 'utente',
    canDelete: ruolo === 'admin',
    // Permessi granulari per sezione — usare questi nelle pagine
    canView,
    canManage,
  }
}
