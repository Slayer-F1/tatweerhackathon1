# 🌌 Najm Al Qua'a — *Best Stargazing Tonight*

> **A zero-install, offline-first, bilingual (EN / العربية) web app that scores *tonight's* stargazing conditions at Al Qua'a from live, no-API-key data — then connects visitors to local camel-farm hosts.**
> It turns the UAE's darkest sky and its camel-farming families into one bookable source of rural income, and tells you exactly which night is worth the drive.

**Tatweer Hackathon · Challenge 5 (Free choice) · Built for Al Qua'a, Al Ain, UAE**

🔗 **Live app:** https://slayer-f1.github.io/tatweerhackathon1/
🎬 **Demo video (≈2 min):** _‹add link here›_
📍 **Default site pin:** Al Qua'a "Milky Way Spot" — 23.6046°N, 54.7503°E

---

## 1. The problem (Challenge 5)

**99% of UAE residents cannot see the Milky Way from their homes.** The country is among the most light-polluted on earth ([Falchi et al., *New World Atlas of Artificial Night Sky Brightness*, 2016](https://www.mediaoffice.abudhabi/en/infrastructure/department-of-municipalities-and-transport-launches-abu-dhabi-dark-sky-policy/)).

Yet ~90 minutes from Abu Dhabi sits **Al Qua'a**, described by the [Associated Press (May 2026)](https://phys.org/news/2026-05-arab-emirates-darkest-reveals-rare.html) as *"one of the darkest spots remaining in the Emirates"* — the place locals call the *Milky Way Spot*. Around it live the **camel-farming families of the Al Ain region** (~254,000 camels in Al Ain alone — [Gulf News](https://gulfnews.com/uae/how-abu-dhabi-nurtures-camels-a-thriving-heritage-1.103234048)), whose income is **seasonal and volatile**.

Two real, local problems collide here:

1. **Visitors waste trips.** Stargazing only works on a *clear, moon-free* night. Today there is **no place-based tool** that tells you whether *tonight* (or which night this week) is actually worth the 100+ km desert drive to Al Qua'a.
2. **Farming families miss the upside.** A world-class natural asset (the dark sky) sits right next to families who could host visitors — but there is **no booking layer** connecting them. Abu Dhabi's own *Visit Al Ain* farm campaign still lists overnight farm stays as ["upcoming"](https://visitalain.ae/en/campaign/discover-rural-getaways-at-al-ains-farms), with no live booking.

**Najm Al Qua'a solves both with one product.**

---

## 2. Who it's for

| Audience | Their situation | What Najm gives them |
|---|---|---|
| **Stargazers & astro-tourists** (UAE residents, GCC, international) | Want to see the Milky Way but can't tell which night is clear & dark | A live 0–100 **"Best Stargazing Tonight"** score + a 7-night forecast |
| **Camel-farming families of Al Qua'a / Al Ain** *(the impact beneficiary)* | Volatile farm income; a natural asset on their doorstep they can't monetize | A **host directory + booking-request** channel that routes visitor income to them |
| **Institutions** (Dubai Astronomy Group, DCT Abu Dhabi) | Promoting dark-sky tourism & the [2024 Abu Dhabi Dark Sky Policy](https://www.dmt.gov.ae/-/media/Project/DMT/DMT/E-Library/05-23/Abu-Dhabi-Dark-Sky-Policy_Version-10.pdf) | A ready, replicable platform for any dark site they steward |

---

## 3. The solution & its impact

Najm is a **single static web app** with five parts:

1. **🌙 "Best Stargazing Tonight" engine** — a deterministic 0–100 score for the Al Qua'a pin, combining **live cloud cover**, **moon illumination** (weighted by how long the moon is actually above the horizon) and the **true astronomical-dark window**, with a plain-language verdict and the best viewing time.
2. **📅 7-night forecast** — the same score for the next 7 nights, so you pick the optimal night to travel and book. The best night is flagged.
3. **🏕️ Camel-farm host directory** — curated local hosts offering stargazing + camel experiences + farm stays, with a **complete booking-request happy path** that hands off to the host via WhatsApp/email (intentionally *not* a transactional marketplace — see [§8 limitations](#8-honest-limitations)).
4. **🧭 "Get there"** — coordinates, drive context, dark-sky rating, best season, a what-to-bring desert checklist, and a Google Maps link.
5. **🌐 Bilingual EN/العربية with full RTL**, and **offline-first** operation for the weak-signal desert.

### Why it matters — the impact, with evidence

Dark skies are a **proven rural economic engine**, not a nice-to-have:

| Place | What dark-sky tourism produced | Source |
|---|---|---|
| **Northumberland, UK** | **~£25M/year** to the local economy & **~450 jobs**; 63% of visitors came *specifically* for the dark skies | [UK Parliament evidence](https://committees.parliament.uk/writtenevidence/125041/html/) |
| **Utah, USA** | **~$5.8B over 10 years** & **10,000+ jobs** | [AstronEra](https://astronera.org/darksky/research/tourism) |
| **NamibRand, Namibia** | Africa's first Gold-tier reserve — **fully self-funded by low-volume tourism**, zero government money | [NamibRand](https://www.namibrand.com/conservation.html) |

Najm channels this kind of value **directly to farming families** instead of to a global platform that extracts a [20% experience commission](https://ethicalunicorn.com/fairbnb-coop-the-sustainable-ethical-alternative-to-airbnb/). And the model is **already legal and real**: paid camel-farm agritourism exists in the UAE today, and Abu Dhabi's **ADAFSA Decision No. 5 of 2025 permits 145 economic activities on farms — including agritourism and holiday homes** ([source](https://www.mediaoffice.abudhabi/en/government-affairs/mansour-bin-zayed-issues-decision-approving-74-new-economic-activities-on-agricultural-land/)).

It also rides a **policy tailwind**: Abu Dhabi's Tourism Strategy 2030 targets **39.3M visitors & AED 90B tourism GDP**, and the emirate launched the **region-first Dark Sky Policy** in 2024.

---

## 4. How it works (and how to verify it)

The score is a **transparent, reproducible function** — not a black box. Anyone can reproduce its inputs:

```
score = 0.50·clear-sky  +  0.30·moon-darkness  +  0.10·dark-window  +  0.10·air-clarity
```

| Input | Source | No key? | Offline? |
|---|---|---|---|
| Cloud cover % & visibility | **Open-Meteo** `/v1/forecast` | ✅ | cached |
| Moon illumination & moon altitude over the night | **SunCalc** (MIT, client-side) | ✅ | ✅ fully local |
| Astronomical-dark window (sun < −18°) | **SunCalc**, cross-checked vs **sunrise-sunset.org** | ✅ | ✅ fully local |

**Reproduce the live inputs yourself** (these are the falsifiable claims — see [`docs/VERIFY.md`](docs/VERIFY.md)):

```bash
# Cloud cover & visibility for the Al Qua'a pin (lower cloud = better):
curl "https://api.open-meteo.com/v1/forecast?latitude=23.6046&longitude=54.7503&hourly=cloud_cover,visibility&timezone=Asia%2FDubai"

# The true-dark window (astronomical twilight begin/end):
curl "https://api.sunrise-sunset.org/json?lat=23.6046&lng=54.7503&formatted=0"
```

> ✅ Both endpoints were live-tested returning HTTP 200 with no key during development. The app's displayed dark window (e.g. **20:40–04:10 GST**) matches `astronomical_twilight_end` → `astronomical_twilight_begin` from the second call.

Full data flow in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 5. Run it / deploy it

**It's a static site — no build, no backend, no keys.**

```bash
# Run locally (any static server works):
python -m http.server 8848
#   then open http://localhost:8848

# or:  npx serve .
```

**Deploy free** (pick one):
- **GitHub Pages:** push to GitHub → Settings → Pages → deploy from `main` / root. (A workflow is included at `.github/workflows/pages.yml`.)
- **Vercel / Netlify:** "Import project" → framework = *None* → deploy. Zero config.

**Verify it works end-to-end:**
1. The **Tonight** score loads from live data within ~1s.
2. **7 Nights** shows 7 scored nights with a flagged best night.
3. **Stay with a host** → *Request a night* → fill → get a ready-to-send WhatsApp message (complete happy path).
4. Toggle **العربية** → the whole UI flips to Arabic + RTL.
5. **Offline test:** open DevTools → Network → *Offline*, reload — the app shell, moon math and last-cached conditions still render with a "last updated" label.

---

## 6. Scalability — replicate to any community

The engine is **coordinate-parameterized**. To launch Najm for **any** dark community on earth — Sir Bani Yas, Jebel Jais, Razeen, AlUla, or a village you've never heard of — **change one file**, [`js/config.js`](js/config.js):

```js
site: { lat: 23.6046, lng: 54.7503, timezone: "Asia/Dubai", name_en: "Al Qua'a Milky Way Spot", … }
```

The host directory is data-driven ([`js/hosts-data.js`](js/hosts-data.js)). Everything else — scoring, UI, offline cache, bilingual layout — adapts automatically. Astro-tourism is **~$1–2B today growing double-digit (≈11–15% CAGR)** and concentrated in North America/Europe, leaving **MENA as open white space** ([market reports](https://www.equentis.com/blog/astrotourism-a-multi-billion-dollar-opportunity-in-the-night-sky/)) — and **no UAE site is DarkSky-certified yet** ([DarkSky](https://darksky.org/news/alula-manara-and-algharameel-nature-reserves-officially-named-as-saudi-arabias-and-gccs-first-ever-dark-sky-park-in-boost-to-astronomy-and-astrotourism-ambitions/)), a regional first-mover gap.

---

## 7. Feasibility — built for a rural setting

- **~Zero running cost & maintenance:** static hosting (free tier), no server, no database, no API keys, no secrets.
- **Low-bandwidth & offline-first:** a service worker caches the app shell; the last weather payload is cached in `localStorage`; **all moon & dark-window math runs locally** via SunCalc — so the core works at the site with no signal.
- **Resilient by design:** if the live API is down during a demo or at the dunes, the app falls back to cached conditions with an honest "last updated" timestamp and an estimate flag.

---

## 8. Honest limitations (falsifiability, stated openly)

We deliberately **do not** fake precision:

- **No live Bortle/SQM (sky-brightness) number.** No free, no-key sky-brightness API exists (`lightpollutionmap.info` returns HTTP 403 on hotlink). The dark-sky rating in the app is a **hard-coded, sourced qualitative value** ("among the darkest in the UAE"), not a live measurement. A field SQM reading would make this exact.
- **Hosts are clearly-labelled samples.** They are marked *"sample · onboarding pending."* The booking flow captures real intent and hands off to a host, but **payments/auth/real onboarding are intentionally out of scope** (see roadmap) — a real two-sided marketplace needs real supply we won't fake.
- **Coordinate transparency.** The "Milky Way Spot" pin (23.6046°N, 54.7503°E) is the widely-cited tourist pin; it sits just north of the Tropic of Cancer. We use one agreed, configurable coordinate and cite the *"darkest spot in the UAE"* reputation rather than asserting an un-measured Bortle class.
- **Market-size figures are ranges** from differing vendor reports; we lean on the hard-documented Northumberland and NamibRand numbers.

Stating these is the point of **criterion 6**: every claim we make is checkable.

---

## 9. Community validation _(team: complete before submission)_

We built a 5-question script for real Al Qua'a / Al Ain residents and visitors. **Paste real responses here** before you submit — even 3–5 quotes move criterion 6 from "asserted" to "validated." Template + script: [`docs/VALIDATION.md`](docs/VALIDATION.md).

> _Example to replace:_ "I drove 2 hours to Al Qua'a on a cloudy night and saw nothing — I'd have checked an app first." — _‹real respondent›_

---

## 10. Roadmap (beyond the weekend)

- Real host onboarding with Emirates ID / ADAFSA farm-license verification.
- Optional **AI trip planner** (Claude API) for personalized itineraries — the deterministic planner already works with zero keys; this is an upgrade, not a dependency.
- SMS/WhatsApp alerts: "Tonight scores 90 — book now."
- Partner pilot with the Dubai Astronomy Group (who already run Al Qua'a excursions) and DCT Abu Dhabi.
- Field SQM readings to publish a measured dark-sky rating.

---

## 11. Repo map

```
index.html              App shell (loads everything; no framework)
css/styles.css          Night-sky theme, responsive, RTL-aware
js/config.js            ⭐ Single source of truth — change this to replicate
js/i18n.js              EN/AR strings + RTL
js/astro.js             The scoring engine (deterministic, documented)
js/api.js               Open-Meteo fetch + offline localStorage cache
js/hosts-data.js        Curated demo hosts (data-driven)
js/app.js               UI: 5 views, language toggle, booking flow
js/lib/suncalc.js       Vendored SunCalc (MIT) — offline moon/twilight math
sw.js                   Service worker (offline app shell)
manifest.webmanifest    PWA manifest
docs/VERIFY.md          Reproduce every live claim (falsifiability)
docs/ARCHITECTURE.md    Data flow + scoring math
docs/VALIDATION.md      Community-validation script + template
docs/DEMO_SCRIPT.md     2-minute demo / pitch script
```

---

## 12. How this maps to the judging criteria

| # | Criterion | Where it's evidenced in this repo |
|---|---|---|
| **1** | **Impact & value** | §3: new income for camel-farming families; cited Northumberland £25M/450 jobs, Utah $5.8B, NamibRand self-funding |
| **2** | **Relevance to challenge** | §1–3: fuses Al Qua'a's two signature assets (darkest UAE sky + camel farms); every feature tied to the site |
| **3** | **Feasibility (cost/maintenance, rural)** | §7: static, no backend/keys, ~zero cost, offline-first for weak signal |
| **4** | **Readiness (complete, working)** | §5: live score on load, full booking happy path, bilingual + offline — all working, deployed at a public URL |
| **5** | **Scalability / replication** | §6: one-file (`config.js`) coordinate swap; data-driven hosts; cited MENA white space |
| **6** | **Falsifiability & evidence** | §4 + §8 + `docs/VERIFY.md`: reproducible `curl` commands, cited facts, openly-stated limitations |
| **7** | **Repo documentation** | This README + `docs/` (verify, architecture, validation, demo) + inline code comments |
| **8** | **Live demo** *(final only)* | `docs/DEMO_SCRIPT.md`: score on real data → AR/RTL → offline → booking |

---

## License

[MIT](LICENSE). SunCalc © Vladimir Agafonkin (MIT). Map links © OpenStreetMap contributors.

> _Built for the Tatweer Hackathon — solutions for rural communities. Al Qua'a, Al Ain, UAE._
