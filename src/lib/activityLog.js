import { supabase } from './supabase'

// Cache geo per la sessione — una sola chiamata a ip-api per tutta la sessione
let _geoCache = null
let _geoPromise = null

async function getGeo() {
  if (_geoCache) return _geoCache
  if (_geoPromise) return _geoPromise
  _geoPromise = fetch('http://ip-api.com/json/?fields=status,query,country,regionName,city', { signal: AbortSignal.timeout(2000) })
    .then(r => r.json())
    .then(d => {
      if (d.status === 'success') {
        _geoCache = { ip: d.query, citta: d.city, regione: d.regionName, paese: d.country }
      } else {
        _geoCache = {}
      }
      return _geoCache
    })
    .catch(() => { _geoCache = {}; return {} })
  return _geoPromise
}

function parseUA() {
  const ua = navigator.userAgent
  // Dispositivo
  let dispositivo = 'Desktop'
  if (/iPad/i.test(ua)) dispositivo = 'Tablet'
  else if (/Mobi|Android|iPhone/i.test(ua)) dispositivo = 'Mobile'
  // Browser
  let browser = 'Altro'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera'
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome'
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  // OS
  let os = ''
  if (/Windows NT/i.test(ua)) os = 'Windows'
  else if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua) && !/Android/i.test(ua)) os = 'Linux'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS'
  return { dispositivo, browser, os }
}

/**
 * Registra un'azione nel log attività.
 * Raccoglie automaticamente: IP, città, browser, tipo dispositivo, OS.
 */
export async function logAttivita(azione, { dettagli, eventoId, eventoTitolo } = {}) {
  try {
    const [geo, ua] = await Promise.all([getGeo(), Promise.resolve(parseUA())])
    const metadata = { ...geo, ...ua }
    await supabase.rpc('log_activity', {
      p_azione:        azione,
      p_dettagli:      dettagli ?? {},
      p_evento_id:     eventoId ?? null,
      p_evento_titolo: eventoTitolo ?? null,
      p_metadata:      metadata,
    })
  } catch (e) {
    console.warn('Log attività non riuscito:', e)
  }
}

export function resetActivityLogCache() {}
