/**
 * useSocial — legge social_config da Supabase una volta sola, casha in modulo.
 * Restituisce { links, loading } dove links è l'array ordinato per 'ordine'.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

let _cache = null
let _promise = null

export function useSocial() {
  const [links, setLinks] = useState(_cache || [])
  const [loading, setLoading] = useState(!_cache)

  useEffect(() => {
    if (_cache) { setLinks(_cache); setLoading(false); return }
    if (!_promise) {
      _promise = supabase
        .from('social_config')
        .select('*')
        .order('ordine', { ascending: true })
        .then(({ data }) => {
          _cache = data || []
          return _cache
        })
    }
    _promise.then(data => { setLinks(data); setLoading(false) })
  }, [])

  // Invalida cache dopo un salvataggio
  function invalidate() { _cache = null; _promise = null }

  return { links, loading, invalidate }
}
