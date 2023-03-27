const CACHE_NAME = 'v0.01';
const urlsToCache = [
  '1satlogo.png',
  'manifest.json'
]
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching...')
        cache.addAll(urlsToCache)
      }).then(() => {
        self.skipWaiting();
      })
  )
})
self.addEventListener('activate', event => {
  console.log('Activated.')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    })
  )
})
self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(
      cached => cached || fetch(e.request))
    );
});