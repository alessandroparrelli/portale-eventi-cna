import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistenza sessione nel localStorage
    persistSession: true,
    // Refresh automatico del token prima della scadenza
    autoRefreshToken: true,
    // Detecta la sessione dalla URL (per OAuth flows)
    detectSessionInUrl: true,
  },
})

// ── Refresh proattivo ────────────────────────────────────────────────
// Supabase JS v2 fa autoRefreshToken ma solo se la finestra è attiva.
// Quando la pagina è in background per ore e poi torna attiva,
// il token può essere scaduto. Questo listener lo rinnova appena
// la pagina torna in focus.
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Rinnova se mancano meno di 5 minuti alla scadenza
          const expiresAt = session.expires_at * 1000
          const minsLeft  = (expiresAt - Date.now()) / 60000
          if (minsLeft < 5) {
            supabase.auth.refreshSession().catch(() => {})
          }
        }
      })
    }
  })
}

// ── Helper: ottieni sempre un JWT fresco ─────────────────────────────
// Usa questo invece di getSession() direttamente nei componenti
// che passano il Bearer token alle Edge Functions.
export async function getFreshJwt() {
  // Prima prova la sessione corrente
  let { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  // Se il token scade entro 60 secondi, forza il refresh
  const expiresAt = session.expires_at * 1000
  if (expiresAt - Date.now() < 60000) {
    const { data } = await supabase.auth.refreshSession()
    session = data.session
  }

  return session?.access_token ?? null
}
