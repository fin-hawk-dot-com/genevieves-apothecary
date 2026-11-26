import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

function walk(dir, baseDir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, baseDir, out);
    } else if (entry.name !== 'sw.js' && !entry.name.endsWith('.map')) {
      const rel = './' + path.relative(baseDir, full).replace(/\\/g, '/');
      out.push(rel);
    }
  }
  return out;
}

const allFiles = walk(distDir, distDir).sort();
const coreShell = ['./', ...allFiles.filter((f) => f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.webmanifest'))];
const mediaAssets = allFiles.filter((f) => !coreShell.includes(f));

const swSource = `const CACHE_NAME = 'genevieves-apothecary-offline-v15';
const CORE_SHELL = ${JSON.stringify(coreShell, null, 2)};
const GAME_ASSETS = ${JSON.stringify(mediaAssets, null, 2)};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(
          GAME_ASSETS.map(async (url) => {
            try {
              const hit = await cache.match(url, { ignoreSearch: true });
              if (!hit) await cache.add(url);
            } catch (_) {}
          })
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(event.request, { ignoreSearch: true })
            .then((r) => r || caches.match('./index.html', { ignoreSearch: true }) || caches.match('./', { ignoreSearch: true }))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
`;

fs.writeFileSync(path.join(distDir, 'sw.js'), swSource, 'utf8');
console.log('[inject-sw-manifest] Precached ' + coreShell.length + ' core shell bundles + ' + mediaAssets.length + ' media assets in dist/sw.js');
