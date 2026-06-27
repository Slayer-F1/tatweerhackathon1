/* Service worker — offline-first app shell for Najm Al Qua'a.
 * Cache-first for the local shell (so it opens with no signal at the desert site);
 * network-first (with cache fallback) is handled in api.js via localStorage for live data.
 */
const CACHE = "najm-shell-v1";
const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/lib/suncalc.js",
  "./js/config.js",
  "./js/hosts-data.js",
  "./js/i18n.js",
  "./js/astro.js",
  "./js/api.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache the live weather API — api.js manages that cache in localStorage.
  if (url.hostname.includes("open-meteo") || url.hostname.includes("sunrise-sunset")) return;
  // Cache-first for same-origin shell assets.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html")))
    );
  }
});
