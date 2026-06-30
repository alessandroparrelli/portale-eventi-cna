import { supabase } from './supabase'

/**
 * Registra un'azione nel log attività (tabella activity_log), tramite la
 * funzione RPC log_activity (SECURITY DEFINER — risolve username/nome
 * lato database, evitando query aggiuntive lato client).
 * Non blocca né interrompe il flusso chiamante in caso di errore: il logging
 * è un effetto collaterale, non deve mai far fallire l'azione principale.
 *
 * @param {string} azione - chiave azione (es. 'evento_creato', 'login', ...)
 * @param {object} [opts]
 * @param {object} [opts.dettagli] - payload jsonb libero con info aggiuntive
 * @param {string} [opts.eventoId]
 * @param {string} [opts.eventoTitolo]
 */
export async function logAttivita(azione, { dettagli, eventoId, eventoTitolo } = {}) {
  try {
    await supabase.rpc('log_activity', {
      p_azione: azione,
      p_dettagli: dettagli ?? {},
      p_evento_id: eventoId ?? null,
      p_evento_titolo: eventoTitolo ?? null,
    })
  } catch (e) {
    console.warn('Log attività non riuscito:', e)
  }
}

/** Mantenuto per compatibilità con eventuali import esistenti — non più necessario (nessuna cache client-side). */
export function resetActivityLogCache() {}
