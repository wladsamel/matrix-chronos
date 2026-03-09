const CACHE_NAME = 'matrix-chronos-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/pwa-192x192.png',
    '/pwa-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).catch(err => {
            console.log("Offline cache skipped to prevent install block.");
            return Promise.resolve();
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
