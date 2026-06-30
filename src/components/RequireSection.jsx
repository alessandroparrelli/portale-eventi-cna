import { Navigate } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

const LIVELLI = { nessuno: 0, visualizza: 1, gestisci: 2 }

/**
 * Blocca l'accesso a una route admin in base al permesso dell'utente sulla
 * sezione indicata. min='visualizza' (default) basta per le pagine di sola
 * lettura, min='gestisci' va usato sugli editor a schermo intero.
 */
export default function RequireSection({ sezione, min = 'visualizza', children }) {
  const { loading, permessi } = useRole()
  if (loading) return null
  const livello = LIVELLI[permessi?.[sezione]] ?? 0
  if (livello < LIVELLI[min]) return <Navigate to="/admin" replace />
  return children
}
