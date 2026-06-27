/*
 * astro.js — The "Best Stargazing Tonight" scoring engine.
 *
 * It is a DETERMINISTIC, reproducible function of three inputs:
 *   1. Cloud cover %        — Open-Meteo (live, no key)            [lower = better]
 *   2. Moon illumination    — SunCalc, weighted by moon-up time     [lower = better]
 *      + dark-window length — SunCalc astronomical twilight         [longer = better]
 *   3. Air clarity (vis.)   — Open-Meteo visibility (desert dust)   [clearer = better]
 *
 * Moon + dark-window run fully client-side (SunCalc) so the core works OFFLINE.
 * Cloud + visibility need the (cached) Open-Meteo forecast.
 *
 * Anyone can reproduce the score inputs — see docs/VERIFY.md.
 */
(function () {
  const C = window.NAJM_CONFIG;

  // Return the astronomical-dark window for the night that BEGINS on `dateEvening`.
  // darkStart = astronomical dusk that evening; darkEnd = astronomical dawn next morning.
  function darkWindow(dateEvening, lat, lng) {
    const t1 = SunCalc.getTimes(dateEvening, lat, lng);
    const next = new Date(dateEvening.getTime() + 24 * 3600 * 1000);
    const t2 = SunCalc.getTimes(next, lat, lng);
    const start = t1.night;     // sun reaches -18° (astronomical dusk)
    const end = t2.nightEnd;    // sun rises past -18° (astronomical dawn)
    const valid = start instanceof Date && !isNaN(start) && end instanceof Date && !isNaN(end) && end > start;
    const hours = valid ? (end - start) / 3600000 : 0;
    return { start: valid ? start : null, end: valid ? end : null, hours, valid };
  }

  // Moon metrics across the dark window: illumination fraction, and the share of the
  // window during which the moon is ABOVE the horizon (a moon that's down doesn't hurt).
  function moonMetrics(win, lat, lng, refDate) {
    const ill = SunCalc.getMoonIllumination(refDate);
    const moonTimes = SunCalc.getMoonTimes(refDate, lat, lng);
    let fractionUp = 0;
    if (win.valid) {
      const samples = 12;
      let up = 0;
      for (let i = 0; i <= samples; i++) {
        const t = new Date(win.start.getTime() + (win.end - win.start) * (i / samples));
        const pos = SunCalc.getMoonPosition(t, lat, lng);
        if (pos.altitude > 0) up++;
      }
      fractionUp = up / (samples + 1);
    } else {
      const pos = SunCalc.getMoonPosition(refDate, lat, lng);
      fractionUp = pos.altitude > 0 ? 1 : 0;
    }
    // Effective moonlight: bright AND up = bad; bright but down = fine.
    const effective = ill.fraction * fractionUp;
    return {
      fraction: ill.fraction,       // 0 (new) .. 1 (full)
      phase: ill.phase,             // 0..1 around the lunar cycle
      fractionUp,
      effective,
      rise: moonTimes.rise || null,
      set: moonTimes.set || null,
    };
  }

  // Open-Meteo "2026-06-27T21:00" is wall-clock in the SITE timezone. Convert it to an
  // absolute instant using the payload's utc_offset_seconds, so comparisons against
  // SunCalc (absolute) are correct regardless of the VIEWER's timezone.
  function parseAbsolute(iso, offsetSec) {
    const m = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return new Date(iso);
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0) - offsetSec * 1000);
  }

  // Average an Open-Meteo hourly series over the hours inside [start,end] (absolute).
  // `series` = { time:[ISO...], values:[...] }. Returns null if no data in window.
  function avgInWindow(series, start, end, offsetSec) {
    if (!series || !series.time || !start || !end) return null;
    let sum = 0, n = 0;
    for (let i = 0; i < series.time.length; i++) {
      const tt = parseAbsolute(series.time[i], offsetSec);
      const v = series.values ? series.values[i] : null;
      if (v == null) continue;
      if (tt >= start && tt <= end) { sum += v; n++; }
    }
    return n ? sum / n : null;
  }

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  // Build hourly series objects from an Open-Meteo payload.
  function seriesFrom(meteo) {
    if (!meteo || !meteo.hourly) return { cloud: null, vis: null };
    return {
      cloud: { time: meteo.hourly.time, values: meteo.hourly.cloud_cover },
      vis: { time: meteo.hourly.time, values: meteo.hourly.visibility },
    };
  }

  // Score one night. `dateEvening` = a Date on the evening in question (local).
  function scoreNight(dateEvening, meteo) {
    const lat = C.site.lat, lng = C.site.lng, w = C.weights;
    const offsetSec = (meteo && typeof meteo.utc_offset_seconds === "number") ? meteo.utc_offset_seconds : 14400;
    const win = darkWindow(dateEvening, lat, lng);
    const moon = moonMetrics(win, lat, lng, win.valid ? new Date((win.start.getTime() + win.end.getTime()) / 2) : dateEvening);
    const s = seriesFrom(meteo);

    const avgCloud = win.valid ? avgInWindow(s.cloud, win.start, win.end, offsetSec) : null; // 0..100 or null
    const avgVis = win.valid ? avgInWindow(s.vis, win.start, win.end, offsetSec) : null;     // metres or null

    // Components (0..1, higher = better viewing)
    const cloudComp = avgCloud === null ? null : clamp01(1 - avgCloud / 100);
    const moonComp = clamp01(1 - moon.effective);
    const darkComp = clamp01(win.hours / 6);                 // 6h+ of true dark = full marks
    const visComp = avgVis === null ? null : clamp01((avgVis - 2000) / (20000 - 2000));

    // If cloud/visibility are missing (offline), score on moon + dark only and flag estimate.
    let score, estimate = false;
    if (cloudComp === null) {
      estimate = true;
      const wsum = w.moon + w.darkWindow;
      score = 100 * (w.moon * moonComp + w.darkWindow * darkComp) / wsum;
    } else {
      score = 100 * (
        w.cloud * cloudComp +
        w.moon * moonComp +
        w.darkWindow * darkComp +
        w.visibility * (visComp === null ? 0.6 : visComp)
      );
    }
    score = Math.round(clamp01(score / 100) * 100);

    const band = C.bands.find((b) => score >= b.min) || C.bands[C.bands.length - 1];

    return {
      date: dateEvening,
      score,
      band: band.key,
      estimate,
      window: win,
      moon,
      metrics: {
        cloudPct: avgCloud,
        visibilityM: avgVis,
        darkHours: win.hours,
        cloudComp, moonComp, darkComp, visComp,
      },
    };
  }

  // Score tonight + the next N nights from a single Open-Meteo payload.
  function scoreSeries(meteo, nights) {
    const out = [];
    const base = new Date();
    base.setHours(20, 0, 0, 0); // anchor each "night" at 8pm local
    for (let i = 0; i < nights; i++) {
      const d = new Date(base.getTime() + i * 24 * 3600 * 1000);
      out.push(scoreNight(d, meteo));
    }
    return out;
  }

  window.NAJM_ASTRO = { scoreNight, scoreSeries, darkWindow, moonMetrics };
})();
