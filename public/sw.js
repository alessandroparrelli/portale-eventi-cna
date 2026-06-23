// Service Worker per offline check-in — portale-eventi-cna
const CACHE_NAME = 'cna-checkin-v1'
const CHECKIN_CACHE = 'cna-checkin-data-v1'

// Asset statici da pre-cachare
const STATIC_ASSETS = [
  '/admin/checkin',
  '/manifest.json',
]

// ── Install ──────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== CHECKIN_CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Solo richieste same-origin e GET
  if (event.request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // API Supabase → network-first, fallback cache
  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(event.request))
    return
  }

  // Pagina check-in → cache-first
  if (url.pathname.startsWith('/admin/checkin')) {
    event.respondWith(cacheFirst(event.request))
    return
  }
})

// ── Strategie ────────────────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CHECKIN_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' }, status: 503
    })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('<h1>Offline</h1><p>Connettiti per accedere al check-in.</p>', {
      headers: { 'Content-Type': 'text/html' }, status: 503
    })
  }
}

// ── Background sync per check-in offline ─────────────────────────
// Quando torna online, riprova i check-in pendenti
self.addEventListener('sync', event => {
  if (event.tag === 'checkin-sync') {
    event.waitUntil(syncPendingCheckins())
  }
})

async function syncPendingCheckins() {
  const cache = await caches.open(CHECKIN_CACHE)
  const keys = await cache.keys()
  const pending = keys.filter(k => k.url.includes('pending-checkin'))
  // Il frontend gestisce la logica; questo è il punto di estensione
  console.log('[SW] Sync: pending checkins', pending.length)
}
