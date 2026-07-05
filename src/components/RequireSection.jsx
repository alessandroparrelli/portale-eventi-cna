import { Navigate } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

const LIVELLI = { nessuno: 0, visualizza: 1, gestisci: 2 }

export default function RequireSection({ sezione, min = 'visualizza', children }) {
  const { loading, permessi } = useRole()

  // Se sta ancora caricando MA abbiamo già i permessi, mostra il children
  // invece di tornare null (che causerebbe il remount del children)
  const livello = LIVELLI[permessi?.[sezione]] ?? 0
  const hasAccess = livello >= LIVELLI[min]

  // Solo durante il PRIMO caricamento (permessi vuoti) mostriamo null
  const isFirstLoad = loading && Object.keys(permessi).length === 0

  if (isFirstLoad) return null
  if (!hasAccess && !loading) return <Navigate to="/admin" replace />
  return children
}
