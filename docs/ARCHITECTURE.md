# Architecture

Najm Al Qua'a is a **static, client-only web app**. No backend, no build step, no API keys.

## Data flow

```
                 ┌─────────────────────────────────────────────┐
                 │                index.html                    │
                 │   (loads vendored SunCalc + app scripts)     │
                 └───────────────────┬─────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                             ▼
  js/config.js               js/i18n.js                    js/hosts-data.js
  (site coords, weights,     (EN/AR strings,               (curated demo hosts,
   bands — the ONE file       RTL direction)                data-driven directory)
   you change to replicate)
        │
        ▼
  js/api.js  ──fetch──►  Open-Meteo /v1/forecast  (cloud_cover, visibility; no key, CORS)
        │   └─ caches last payload in localStorage (offline-first)
        ▼
  js/astro.js  ──uses──►  SunCalc (vendored, MIT)
        │                  • astronomical-dark window (sun < −18°)   [offline]
        │                  • moon illumination + altitude over night [offline]
        │   combines:  0.50·clear-sky + 0.30·moon-darkness
        │              + 0.10·dark-window + 0.10·air-clarity  →  0–100 score
        ▼
  js/app.js  ──renders──►  5 views (Tonight, 7 Nights, Hosts, Get there, About)
        │                  language toggle (EN/AR + RTL), booking-request modal
        ▼
  sw.js  ──caches──►  app shell for offline use at the desert site
```

## The scoring engine (`js/astro.js`)

For each night `N` (anchored at 8pm local, for the next 7 nights):

1. **Dark window** — `SunCalc.getTimes()` gives astronomical dusk that evening and astronomical dawn the next morning. Window length feeds the `dark-window` component (6h+ = full marks). Computed locally → works offline.
2. **Moon** — `getMoonIllumination().fraction` (0 = new, 1 = full). We sample `getMoonPosition().altitude` across the window to get the fraction of the window the moon is *up*. **Effective moonlight = illumination × fraction-up** — a bright moon that has set does not penalise the score. Computed locally → works offline.
3. **Cloud & visibility** — from the (cached) Open-Meteo payload, averaged over the dark-window hours. Times are converted from the site's wall-clock to absolute instants using the payload's `utc_offset_seconds`, so the score is correct regardless of the **viewer's** timezone.
4. **Combine** → weighted sum → 0–100 → verdict band (Excellent / Good / Fair / Poor / Skip). If cloud data is unavailable (offline, no cache), the score falls back to moon + dark-window only and is flagged as an estimate.

## Why static / offline-first

Al Qua'a has **no facilities and weak signal**. A server-dependent app would fail exactly where it's used. Keeping moon/twilight math local (SunCalc) means the core works at the dunes; the live weather layer degrades gracefully to cached data.

## Replication

Change `js/config.js` `site` coordinates → the whole app re-targets a new community. See README §6.
