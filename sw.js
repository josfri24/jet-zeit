/* Jet-Zeit – Offline-Speicher (Service Worker)
   Mit Internet: immer die neueste Version laden (und für offline merken).
   Ohne Internet: die zuletzt geladene Version verwenden.
   Für Updates genügt es, die neue index.html hochzuladen – diese Datei bleibt unverändert. */
const CACHE = 'jetzeit-app';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
      const res = await fetch(r, { cache: 'no-store', signal: ctl.signal }); clearTimeout(t);
      if (res.ok) { c.put(r, res.clone()); if (r.mode === 'navigate') c.put('./index.html', res.clone()); }
      return res;
    } catch (err) {
      const m = await c.match(r, { ignoreSearch: true }) || (r.mode === 'navigate' ? await c.match('./index.html') : null);
      if (m) return m;
      throw err;
    }
  })());
});
