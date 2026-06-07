import { supabase } from './supabase'

const EDGE = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/admin-users'

async function call(action, body = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(EDGE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({ action, ...body }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Errore ${res.status}`)
  return data
}

export const adminApi = {
  // Profilo personale (qualsiasi utente)
  updateMyProfile: (nome, cognome, username) =>
    call('update_my_profile', { nome, cognome, username }),
  changeMyPassword: (password) =>
    call('change_my_password', { password }),

  // Gestione utenti (solo admin)
  createUser: (email, password, username, ruolo) =>
    call('create', { email, password, username, ruolo }),
  updateUser: (user_id, data) =>
    call('update', { user_id, ...data }),
  deleteUser: (user_id) =>
    call('delete', { user_id }),
}
