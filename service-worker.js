'use strict';

const CACHE_VERSION = 'v4';
const CACHE_PREFIX = 'taskflow';

const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',

  './css/variables.css',
  './css/style.css',
  './css/responsive.css',

  './js/storage.js',
  './js/tasks.js',
  './js/ui.js',
  './js/app.js',

  './site.webmanifest',

  './favicon.ico',
  './favicon-96x96.png',
  './apple-touch-icon.png',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png'
];

const APP_SHELL_CACHE_OPTIONS = {
  cache: 'reload'
};

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isGETRequest(request) {
  return request.method === 'GET';
}

function isCacheableResponse(response) {
  return (
    response &&
    (response.ok || response.type === 'opaque')
  );
}

function shouldBypassCache(request) {
  const url = new URL(request.url);

  if (!isSameOrigin(request)) {
    return true;
  }

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/admin/')
  ) {
    return true;
  }

  if (
    request.cache === 'no-store' ||
    request.headers.get('cache-control')?.includes('no-store')
  ) {
    return true;
  }

  return false;
}

async function precacheAppShell() {
  const cache = await caches.open(STATIC_CACHE);

  await cache.addAll(
    APP_SHELL.map(url => new Request(
      url,
      APP_SHELL_CACHE_OPTIONS
    ))
  );
}

async function removeOldCaches() {
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames
      .filter(name =>
        name.startsWith(`${CACHE_PREFIX}-`) &&
        name !== STATIC_CACHE &&
        name !== RUNTIME_CACHE
      )
      .map(name => caches.delete(name))
  );
}

async function getFromCache(request) {
  return caches.match(request);
}

async function saveToRuntimeCache(
  request,
  response
) {
  if (!isCacheableResponse(response)) {
    return;
  }

  const cache = await caches.open(RUNTIME_CACHE);

  await cache.put(
    request,
    response.clone()
  );
}

async function cacheFirst(request) {
  const cached = await getFromCache(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (isCacheableResponse(response)) {
    await saveToRuntimeCache(
      request,
      response
    );
  }

  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);

    if (isCacheableResponse(response)) {
      await saveToRuntimeCache(
        request,
        response
      );
    }

    return response;
  } catch {
    const cached = await getFromCache(request);

    if (cached) {
      return cached;
    }

    throw new Error(
      'Network request failed'
    );
  }
}

async function handleNavigation(request) {
  try {
    const response = await fetch(
      request,
      {
        cache: 'no-cache'
      }
    );

    if (response.ok) {
      const cache = await caches.open(
        STATIC_CACHE
      );

      await cache.put(
        './index.html',
        response.clone()
      );
    }

    return response;
  } catch {
    const cached = await caches.match(
      './index.html'
    );

    if (cached) {
      return cached;
    }

    return new Response(
      `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
          >
          <title>TaskFlow</title>
        </head>
        <body>
          <h1>TaskFlow</h1>
          <p>You are currently offline.</p>
        </body>
      </html>`,
      {
        status: 503,
        headers: {
          'Content-Type':
            'text/html; charset=utf-8'
        }
      }
    );
  }
}

self.addEventListener(
  'install',
  event => {
    event.waitUntil(
      precacheAppShell()
        .then(() => self.skipWaiting())
    );
  }
);

self.addEventListener(
  'activate',
  event => {
    event.waitUntil(
      removeOldCaches()
        .then(() => self.clients.claim())
        .then(() =>
          self.clients.matchAll({
            type: 'window'
          })
        )
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_ACTIVATED',
              version: CACHE_VERSION
            });
          });
        })
    );
  }
);

self.addEventListener(
  'fetch',
  event => {
    const request = event.request;

    if (!isGETRequest(request)) {
      return;
    }

    if (isNavigationRequest(request)) {
      event.respondWith(
        handleNavigation(request)
      );

      return;
    }

    if (shouldBypassCache(request)) {
      event.respondWith(
        fetch(request)
      );

      return;
    }

    if (isSameOrigin(request)) {
      event.respondWith(
        cacheFirst(request)
          .catch(() =>
            fetch(request)
          )
      );

      return;
    }

    event.respondWith(
      fetch(request)
        .catch(() =>
          getFromCache(request)
        )
    );
  }
);

self.addEventListener(
  'message',
  event => {
    if (!event.data) {
      return;
    }

    if (
      event.data.type ===
      'SKIP_WAITING'
    ) {
      self.skipWaiting();
    }

    if (
      event.data.type ===
      'CLEAR_RUNTIME_CACHE'
    ) {
      event.waitUntil(
        caches.delete(RUNTIME_CACHE)
      );
    }

    if (
      event.data.type ===
      'CLEAR_ALL_CACHES'
    ) {
      event.waitUntil(
        caches.keys()
          .then(names =>
            Promise.all(
              names
                .filter(name =>
                  name.startsWith(
                    `${CACHE_PREFIX}-`
                  )
                )
                .map(name =>
                  caches.delete(name)
                )
            )
          )
      );
    }
  }
);
