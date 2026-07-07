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
  // Forza sempre un refresh — garantisce token fresco per le Edge Functions
  // refreshSession() usa il refresh token (valido 7gg) per ottenere un nuovo access token
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
  if (!refreshError && refreshed?.session?.access_token) {
    return refreshed.session.access_token
  }
  // Fallback: usa sessione corrente se il refresh fallisce (es. già aggiornato di recente)
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}
