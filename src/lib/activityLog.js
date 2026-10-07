import { supabase } from './supabase'

// Cache geo per la sessione - una sola chiamata a ip-api per tutta la sessione
let _geoCache = null
let _geoPromise = null

async function getGeo() {
  if (_geoCache) return _geoCache
  if (_geoPromise) return _geoPromise
  // HTTPS obbligatorio: la vecchia chiamata http://ip-api.com veniva bloccata (mixed content)
  _geoPromise = fetch('https://get.geojs.io/v1/ip/geo.json', { signal: AbortSignal.timeout(2000) })
    .then(r => r.json())
    .then(d => {
      _geoCache = d && d.ip ? { ip: d.ip, citta: d.city, regione: d.region, paese: d.country } : {}
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

const QUEUE_KEY = 'cnaeventi_log_queue'
const LAST_KEY  = 'cnaeventi_log_last'
const ACCESSO_GAP_MS = 30 * 60 * 1000

function readQ() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] } }
function writeQ(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-200))) } catch {} }
function markActivity() { try { localStorage.setItem(LAST_KEY, String(Date.now())) } catch {} }

async function sendRpc(args) {
  const { error } = await supabase.rpc('log_activity', args)
  if (error) throw error
}

/**
 * Registra un'azione nel log attivita.
 * Raccoglie automaticamente: IP, citta, browser, tipo dispositivo, OS.
 * Se l'invio fallisce (rete, sessione) l'azione resta in coda e viene ritentata.
 */
export async function logAttivita(azione, { dettagli, eventoId, eventoTitolo } = {}) {
  markActivity()
  const ua = parseUA()
  let geo = {}
  try { geo = await Promise.race([getGeo(), new Promise(r => setTimeout(() => r({}), 1500))]) } catch {}
  const args = {
    p_azione:        azione,
    p_dettagli:      { ...(dettagli ?? {}), ...(navigator.onLine === false ? { offline: true } : {}) },
    p_evento_id:     eventoId ?? null,
    p_evento_titolo: eventoTitolo ?? null,
    p_metadata:      { ...geo, ...ua, at_client: new Date().toISOString() },
  }
  try {
    await sendRpc(args)
    flushLogQueue()
  } catch (e) {
    console.warn('Log attivita non riuscito, messo in coda:', e?.message || e)
    writeQ([...readQ(), args])
  }
}

let _flushing = false
export async function flushLogQueue() {
  if (_flushing) return
  const q = readQ()
  if (!q.length) return
  _flushing = true
  const rimasti = []
  for (const args of q) {
    try { await sendRpc({ ...args, p_dettagli: { ...args.p_dettagli, da_coda: true } }) }
    catch { rimasti.push(args) }
  }
  writeQ(rimasti)
  _flushing = false
}

/**
 * Registra un "accesso" quando l'app viene aperta o ripresa con una sessione gia attiva
 * (es. iPhone/PWA che restano loggati per giorni senza mai rifare il login).
 * Al massimo una volta ogni 30 minuti di inattivita.
 */
export function registraAccessoSeServe() {
  let last = 0
  try { last = Number(localStorage.getItem(LAST_KEY) || 0) } catch {}
  if (Date.now() - last < ACCESSO_GAP_MS) { flushLogQueue(); return }
  logAttivita('accesso', { dettagli: { pagina: location.pathname } })
}

export function resetActivityLogCache() { try { localStorage.removeItem(LAST_KEY) } catch {} }
