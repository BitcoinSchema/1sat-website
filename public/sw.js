const CACHE_NAME = "v0.01";
const urlsToCache = ["1satlogo.png", "manifest.json"];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching...");
        cache.addAll(urlsToCache);
      })
      .then(() => {
        self.skipWaiting();
      })
  );
});
self.addEventListener("activate", (event) => {
  console.log("Activated.");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
// self.addEventListener('fetch', e => {
//     e.respondWith(caches.match(e.request).then(
//       cached => cached || fetch(e.request))
//     );
// });
self.addEventListener("fetch", function (event) {
  // check if the request is for any UTXO fetch API
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/v1/bsv/main/address/") &&
    url.pathname.endsWith("/unspent")
  ) {
    console.log("UTXO fetch API request:", event.request.url);

    // network first, then cache
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(event.request);
      })
    );
  } else {
    console.log("Responding w cache:", event.request.url);

    // Cache first, then network for all other requests
    event.respondWith(
      caches.match(event.request).then(function (response) {
        return response || fetch(event.request);
      })
    );
  }
});
