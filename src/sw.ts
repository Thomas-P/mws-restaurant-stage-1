interface ExtendableEvent extends Event {
    waitUntil(fn: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
    clientId: string;
    request: Request;

    respondWith(response: Promise<Response> | Response): Promise<Response>;
}

const CACHE_VERSION = 2;
const CURRENT_CACHES = {
    prefetch: 'prefetch-cache-v' + CACHE_VERSION
};
const CACHE_NAME = CURRENT_CACHES.prefetch;
const expectedCacheNames = Object
    .keys(CURRENT_CACHES)
    .map(function (key) {
        return CURRENT_CACHES[key];
    });

const urlsToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/review.html',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/js/review.js',
    '/css/styles.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
];
const addCache = async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('Opened cache');
    try {
        return await cache.addAll(urlsToCache);
    } catch (e) {
        console.error('Error on Caching files: ', e);
    }
};

const clearCaches = async () => {
    const cacheNames = await caches.keys();
    const toDelete = cacheNames
        .filter((cacheName) => expectedCacheNames.indexOf(cacheName) === -1)
        .map((cacheName) => caches.delete(cacheName));
    return await Promise.all(toDelete);
};


self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(addCache());
});


self.addEventListener('activate', function (event: ExtendableEvent) {
    event.waitUntil(clearCaches());
});

self.addEventListener('fetch', async (event: FetchEvent) => {
    const fetchOrDeliver = async () => {
        const request = event.request;
        let response = await caches.match(event.request);
        if (!response) {
            return response;
        } else {
            return (await fetch(request));
        }
    };


    event.respondWith(caches.match(event.request)
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
                        caches.open(CACHE_NAME)
                            .then(function (cache) {
                                cache.put(event.request, responseToCache);
                            });
                    }
                    return response;
                }
            );
        }));
});