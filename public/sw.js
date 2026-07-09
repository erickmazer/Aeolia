// Service worker mínimo do Aeolia — habilita instalação (PWA) e um fallback
// offline gracioso. Não cacheia dados dinâmicos (o app depende de rede/Supabase).
const CACHE = 'aeolia-v1'
const OFFLINE = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([OFFLINE, '/icon.svg'])).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)))
  }
})
