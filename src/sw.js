var CACHE_VERSION = 4;
var CURRENT_CACHES = {
    prefetch: 'prefetch-cache-v' + CACHE_VERSION
};
self.addEventListener('install', function (event) {
    var CACHE_NAME = CURRENT_CACHES.prefetch;
    var urlsToCache = [
        '/',
        '/index.html',
        '/restaurantLocal.html',
        '/ts/dbhelper.js',
        '/ts/main.ts',
        '/ts/restaurant_info.ts',
        '/sass/normalize.sass',
        '/sass/styles.sass',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.sass',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
    ];
    event.waitUntil(caches.open(CACHE_NAME)
        .then(function (cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
    }));
});
self.addEventListener('activate', function (event) {
    var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function (key) {
        return CURRENT_CACHES[key];
    });
    event.waitUntil(caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.map(function (cacheName) {
            if (expectedCacheNames.indexOf(cacheName) === -1) {
                return caches["delete"](cacheName);
            }
        }));
    }));
});
self.addEventListener('fetch', function (event) {
    event.respondWith(caches
        .match(event.request)
        .then(function (response) {
        // Cache hit - return response
        if (response) {
            return response;
        }
        var fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(function (response) {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            var responseToCache = response.clone();
            caches.open(CURRENT_CACHES.prefetch)
                .then(function (cache) {
                cache.put(event.request, responseToCache);
            });
            return response;
        });
    }));
});
//# sourceMappingURL=sw.js.map