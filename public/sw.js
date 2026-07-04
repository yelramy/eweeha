// Kill-switch service worker.
//
// An earlier build of this site registered a service worker at /sw.js that is
// still active in visitors' browsers, serving stale cached pages and assets
// (old branding, old theme, old JS). Browsers periodically re-fetch this file,
// so shipping this self-destructing worker makes every returning visitor's
// browser wipe those caches, unregister the worker, and reload with fresh
// content. Keep this file deployed permanently.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      const windowClients = await self.clients.matchAll({ type: 'window' })
      windowClients.forEach((client) => client.navigate(client.url))
    })()
  )
})
