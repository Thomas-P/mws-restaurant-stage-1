interface ExtendableEvent extends Event {
    waitUntil(fn: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
    clientId: string;
    request: Request;

    respondWith(response: Promise<Response> | Response): Promise<Response>;
}

const CACHE_VERSION = 1;
const CURRENT_CACHES = {
    prefetch: 'prefetch-cache-v' + CACHE_VERSION
};
self.addEventListener('install', (event: ExtendableEvent) => {
    const CACHE_NAME = CURRENT_CACHES.prefetch;
    const urlsToCache = [
        '/',
        '/index.html',
        '/restaurant.html',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/css/styles.css',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
    ];


    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            }).catch((err) => console.error('Error on Caching files: ', err))
    );
});


self.addEventListener('activate', function (event: ExtendableEvent) {
    const expectedCacheNames = Object.keys(CURRENT_CACHES).map(function (key) {
        return CURRENT_CACHES[key];
    });
    const clearCaches = async () => {
        const cacheNames = await caches.keys();
        const toDelete = cacheNames
            .filter((cacheName) => expectedCacheNames.indexOf(cacheName) === -1)
            .map((cacheName) => caches.delete(cacheName));
        return await Promise.all(toDelete);
    };
    event.waitUntil(clearCaches());
});

self.addEventListener('fetch', (event: FetchEvent) => {

    event.respondWith(
        caches
            .match(event.request)
            .then(function (response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function (response) {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        if (event.request.method == 'GET') {
                            caches.open(CURRENT_CACHES.prefetch)
                                .then(function (cache) {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    }
                );
            })
    );
});