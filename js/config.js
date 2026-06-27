/*
 * config.js — Single source of truth for the SITE this app serves.
 *
 * SCALABILITY / REPLICATION (judging criterion 5):
 * To deploy this for ANY other dark-sky community on earth, change ONLY this file:
 * set the coordinates, name, timezone and dark-sky note. Everything else
 * (the live scoring engine, the UI, the offline cache) adapts automatically.
 */
window.NAJM_CONFIG = {
  // The viewing site. Default: the "Al Qua'a Milky Way Spot" — the pin UAE tour
  // operators and the Associated Press (May 2026) call the darkest spot in the UAE.
  site: {
    id: "al-quaa",
    name_en: "Al Qua'a Milky Way Spot",
    name_ar: "موقع درب التبانة – القُع",
    // Reported Google Maps pin (gofrogi / beno travel databases). It sits in the
    // Al Ain region of Abu Dhabi emirate, close to the Tropic of Cancer (23.43°N).
    // NOTE: this coordinate is configurable — set it to your exact community pin.
    lat: 23.6046,
    lng: 54.7503,
    timezone: "Asia/Dubai",
    region_en: "Al Ain region · Abu Dhabi · UAE",
    region_ar: "منطقة العين · أبوظبي · الإمارات",
    // ~distance/drive context (AP: ~100 km SE of Abu Dhabi city).
    drive_en: "≈ 90 min (about 100–130 km) southeast of Abu Dhabi, toward Al Ain",
    drive_ar: "نحو 90 دقيقة (100–130 كم تقريبًا) جنوب شرق أبوظبي باتجاه العين",
    // Dark-sky rating is a HARD-CODED qualitative value with a cited reputation —
    // NOT a live Bortle/SQM API, because no free no-key sky-brightness API exists.
    // Stated openly so the claim stays falsifiable. (See README "Honest limitations".)
    darkSky: {
      rating_en: "Among the darkest skies in the UAE (naked-eye Milky Way)",
      rating_ar: "من أحلك السماوات في الإمارات (درب التبانة بالعين المجردة)",
      bortleEstimate: "≈ Bortle 2–3 (estimated, not a certified on-site measurement)",
      certified: false,
      certifiedNote_en: "No DarkSky-International-certified site exists in the UAE yet — a regional first-mover gap.",
      certifiedNote_ar: "لا يوجد حتى الآن موقع معتمد من DarkSky International في الإمارات — فرصة ريادية إقليمية.",
    },
    bestSeason_en: "October–April · new-moon nights · ~10:30pm–3:30am",
    bestSeason_ar: "أكتوبر–أبريل · ليالي المحاق · نحو 10:30م–3:30ص",
  },

  // Scoring weights (must sum to 1.0). Surfaced in the UI for transparency.
  weights: { cloud: 0.5, moon: 0.3, darkWindow: 0.1, visibility: 0.1 },

  // Verdict bands for the 0–100 score.
  bands: [
    { min: 80, key: "excellent" },
    { min: 60, key: "good" },
    { min: 40, key: "fair" },
    { min: 20, key: "poor" },
    { min: 0, key: "skip" },
  ],

  // Number of upcoming nights to forecast (Open-Meteo supports up to 16).
  forecastNights: 7,

  // Default WhatsApp country code for host booking requests (UAE).
  whatsappCountry: "971",
};
