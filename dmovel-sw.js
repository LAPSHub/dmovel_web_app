'use strict';

const SCOPE = new URL(self.registration.scope);
const BUILD_RELEASE = 'f69574dcbcd9ce2e5bcc0736ffc5df5825513e1c';
const RELEASE = new URL(self.location.href).searchParams.get('release') || BUILD_RELEASE;
const VALID_RELEASE = /^[0-9a-f]{40}$/i.test(RELEASE);
const CACHE_PREFIX = 'dmovel-v1:';
const CACHE_NAME = `${CACHE_PREFIX}${VALID_RELEASE ? RELEASE : 'app-shell'}`;
const READY_KEY = scoped(VALID_RELEASE ? `releases/${RELEASE}/.offline-ready` : '.offline-ready');

const CORE_APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'flutter_bootstrap.js',
  'favicon.png',
  'assets/logo_dmovel.png',
  'icons/Icon-192.png',
  'icons/Icon-512.png',
  'icons/Icon-maskable-192.png',
  'icons/Icon-maskable-512.png',
  'offline.html'
];

function scoped(path) {
  return new URL(path, SCOPE).toString();
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function cacheVerifiedAsset(cache, asset) {
  const url = new URL(asset.url, SCOPE);
  url.searchParams.set('release', RELEASE);
  const response = await fetch(url, {cache: 'reload'});
  if (!response.ok) throw new Error(`Offline asset ${asset.url}: ${response.status}`);
  const bytes = await response.clone().arrayBuffer();
  if (Number(asset.size) !== bytes.byteLength) {
    throw new Error(`Offline asset size mismatch: ${asset.url}`);
  }
  if (asset.sha256 && await sha256Hex(bytes) !== asset.sha256) {
    throw new Error(`Offline asset hash mismatch: ${asset.url}`);
  }
  await cache.put(new Request(new URL(asset.url, SCOPE)), response);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    let manifestLoaded = false;
    if (VALID_RELEASE) {
      try {
        const manifestUrl = scoped(`releases/${RELEASE}/offline-manifest.json?release=${RELEASE}`);
        const response = await fetch(manifestUrl, {cache: 'reload'});
        if (response.ok) {
          const manifest = await response.json();
          if (manifest.schema === 1 && manifest.git_sha === RELEASE && Array.isArray(manifest.assets)) {
            for (const asset of manifest.assets) {
              await cacheVerifiedAsset(cache, asset);
            }
            manifestLoaded = true;
          }
        }
      } catch (err) {
        console.warn('[SW] Offline manifest failed, falling back to core app shell', err);
      }
    }
    if (!manifestLoaded) {
      for (const assetPath of CORE_APP_SHELL) {
        try {
          const res = await fetch(scoped(assetPath), {cache: 'reload'});
          if (res.ok) {
            await cache.put(new Request(scoped(assetPath)), res);
          }
        } catch (_) {}
      }
    }
    await cache.put(READY_KEY, new Response(RELEASE));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([RELEASE, VALID_RELEASE ? RELEASE : 'app-shell']);
    try {
      const response = await fetch(scoped(`release-history.txt?release=${RELEASE}`), {cache: 'no-store'});
      if (response.ok) {
        (await response.text()).split(/\r?\n/).filter(Boolean).slice(0, 3)
          .filter((value) => /^[0-9a-f]{40}$/i.test(value)).forEach((value) => keep.add(value));
      }
    } catch (_) {}
    for (const name of await caches.keys()) {
      if (name.startsWith(CACHE_PREFIX) && !keep.has(name.slice(CACHE_PREFIX.length))) {
        await caches.delete(name);
      }
    }
    await self.clients.claim();
  })());
});

async function readyCache() {
  const cache = await caches.open(CACHE_NAME);
  return await cache.match(READY_KEY) ? cache : null;
}

async function networkFirst(request, fallbackPath) {
  try {
    const response = await fetch(request, {cache: 'no-store'});
    if (response.ok) return response;
  } catch (_) {}
  const cache = await readyCache();
  return cache && cache.match(scoped(fallbackPath));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;

  const relative = url.pathname.slice(SCOPE.pathname.length);
  if (relative === 'version.json') {
    event.respondWith(networkFirst(request, `releases/${RELEASE}/version.json`));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await readyCache();
      return (cache && await cache.match(scoped('index.html'))) ||
        await networkFirst(request, 'offline.html');
    })());
    return;
  }
  if (relative.startsWith('releases/')) {
    event.respondWith((async () => {
      const cache = await readyCache();
      const cached = cache && await cache.match(new URL(url.pathname, SCOPE.origin));
      if (cached) return cached;
      return fetch(request);
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await readyCache();
    return (cache && await cache.match(new URL(url.pathname, SCOPE.origin))) || fetch(request);
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'GET_STATUS') {
    event.waitUntil((async () => {
      const cache = await readyCache();
      event.source?.postMessage({type: 'DMOVEL_SW_STATUS', release: RELEASE, ready: Boolean(cache)});
    })());
  }
});
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="18812e41-9b0d-5a3d-a4b5-b5cae999d3b8")}catch(e){}}();
//# debugId=18812e41-9b0d-5a3d-a4b5-b5cae999d3b8
