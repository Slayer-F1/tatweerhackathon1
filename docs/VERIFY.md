# Verify every claim (Falsifiability — judging criterion 6)

Najm Al Qua'a makes **specific, testable claims**. This page shows how to check each one yourself. Nothing here is asserted without a way to falsify it.

---

## 1. The score inputs are real and reproducible

The "Best Stargazing Tonight" score is a deterministic function of three inputs. Two come from public, **no-API-key** endpoints you can call right now:

### a) Cloud cover & visibility — Open-Meteo

```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=23.6046&longitude=54.7503&hourly=cloud_cover,visibility&timezone=Asia%2FDubai"
```

- Returns `hourly.cloud_cover` (%) and `hourly.visibility` (m) for the Al Qua'a pin.
- The app averages these **over the dark window only** (not the whole day).
- Lower cloud = higher score. Desert dust shows up as lower visibility.

### b) The true-dark window — sunrise-sunset.org (cross-check)

```bash
curl "https://api.sunrise-sunset.org/json?lat=23.6046&lng=54.7503&formatted=0"
```

- `results.astronomical_twilight_end` → `astronomical_twilight_begin` (next morning) is the window when the sky is genuinely dark (sun below −18°).
- The app computes this **locally with SunCalc** and you can confirm it matches this API.
- **Worked example (27 Jun 2026):** the API returns `astronomical_twilight_end = 16:39 UTC` and `…begin = 00:09 UTC`, i.e. **20:39–04:09 GST** — exactly the window the app displays. ✔

### c) Moon illumination — SunCalc (offline)

Open the browser console on the running app and run:

```js
SunCalc.getMoonIllumination(new Date()).fraction   // 0 = new moon, 1 = full
```

- Lower illumination = darker sky = higher score.
- The app further weights this by **how much of the dark window the moon is above the horizon** (a bright moon that has set doesn't hurt): `SunCalc.getMoonPosition(t, 23.6046, 54.7503).altitude`.

---

## 2. No key, no backend, no secrets — verifiable by inspection

```bash
grep -ri "api_key\|apikey\|secret\|token\|process.env" js/ || echo "none found"
```

There is **no server code and no secret** in this repo. The only network calls are the two public endpoints above. Confirm in `js/api.js`.

---

## 3. It works offline — verifiable live

1. Load the app once (so the service worker + cache populate).
2. DevTools → **Network → Offline** → reload.
3. The app shell, **moon phase**, and **dark-window times** still render (SunCalc is local); conditions show the **last cached** values with a "last updated" label.

---

## 4. It is fully bilingual EN/AR with RTL — verifiable live

Toggle **العربية**. `document.documentElement.dir` becomes `rtl` and every string switches language. Toggle back for English.

---

## 5. The booking flow is a complete happy path — verifiable live

**Stay with a host → Request a night →** fill the form → you get a confirmation screen with a ready-to-send **WhatsApp message** (`https://wa.me/?text=…`) and the request saved under "My requests". No dead buttons.

---

## 6. Claims we explicitly do NOT make (see README §8)

- We do **not** show a live Bortle/SQM sky-brightness number (no free no-key API exists; `lightpollutionmap.info` returns HTTP 403 on hotlink). The dark-sky rating is a sourced, hard-coded qualitative value.
- Hosts are labelled **samples**; the app is not a transactional marketplace.

If any claim above fails to reproduce, it's a bug — open an issue.
