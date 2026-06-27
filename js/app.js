/*
 * app.js — UI orchestration for Najm Al Qua'a.
 * Renders 5 views, handles the EN/AR + RTL toggle, the live score, the 7-night
 * forecast, the host directory and the booking-request happy path.
 */
(function () {
  const C = window.NAJM_CONFIG;
  const L = window.NAJM_LANG;
  const API = window.NAJM_API;
  const ASTRO = window.NAJM_ASTRO;
  const HOSTS = window.NAJM_HOSTS;
  const t = (k) => L.t(k);

  const state = { view: "tonight", scores: [], meta: null, twilight: null, booking: null };

  // ---- helpers ---------------------------------------------------------------
  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  const loc = () => (L.current === "ar" ? "ar-AE" : "en-GB");
  function fmtTime(d) {
    if (!(d instanceof Date) || isNaN(d)) return "—";
    return new Intl.DateTimeFormat(loc(), { hour: "2-digit", minute: "2-digit", timeZone: C.site.timezone }).format(d);
  }
  function nightLabel(d, i) {
    if (i === 0) return t("tonight_word");
    return new Intl.DateTimeFormat(loc(), { weekday: "short", day: "numeric", timeZone: C.site.timezone }).format(d);
  }
  function relTime(ms) {
    if (!ms) return "—";
    const mins = Math.round((Date.now() - ms) / 60000);
    if (mins < 1) return L.current === "ar" ? "الآن" : "just now";
    if (mins < 60) return (L.current === "ar" ? `قبل ${mins} د` : `${mins} min ago`);
    const h = Math.round(mins / 60);
    return L.current === "ar" ? `قبل ${h} س` : `${h} h ago`;
  }
  const moonEmoji = (phase) => {
    const e = ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"];
    return e[Math.round(phase * 8) % 8];
  };

  // ---- score ring (SVG) ------------------------------------------------------
  function scoreRing(score, band, size) {
    size = size || 168;
    const r = size / 2 - 12, cx = size / 2, cy = size / 2;
    const circ = 2 * Math.PI * r;
    const off = circ * (1 - score / 100);
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("class", "ring");
    svg.setAttribute("width", size); svg.setAttribute("height", size);
    const mk = (cls, dash) => {
      const c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
      c.setAttribute("class", cls); c.setAttribute("fill", "none");
      c.setAttribute("stroke-width", 11); c.setAttribute("stroke-linecap", "round");
      if (dash != null) { c.setAttribute("stroke-dasharray", circ); c.setAttribute("stroke-dashoffset", dash);
        c.setAttribute("transform", `rotate(-90 ${cx} ${cy})`); }
      return c;
    };
    svg.appendChild(mk("ring-track"));
    svg.appendChild(mk("ring-fill band-" + band, off));
    const txt = document.createElementNS(ns, "text");
    txt.setAttribute("x", cx); txt.setAttribute("y", cy - 2);
    txt.setAttribute("text-anchor", "middle"); txt.setAttribute("class", "ring-score");
    txt.textContent = score;
    const sub = document.createElementNS(ns, "text");
    sub.setAttribute("x", cx); sub.setAttribute("y", cy + 22);
    sub.setAttribute("text-anchor", "middle"); sub.setAttribute("class", "ring-sub");
    sub.textContent = t("score_outof");
    svg.appendChild(txt); svg.appendChild(sub);
    return svg;
  }

  function bar(label, valuePct, hint) {
    return el("div", { class: "metric" }, [
      el("div", { class: "metric-top" }, [el("span", null, [label]), el("span", { class: "metric-hint" }, [hint])]),
      el("div", { class: "metric-bar" }, [el("div", { class: "metric-fill", style: `width:${Math.round(valuePct)}%` })]),
    ]);
  }

  // ---- views -----------------------------------------------------------------
  function viewTonight() {
    const wrap = el("div", { class: "view" });
    const tn = state.scores[0];
    if (!tn) { wrap.appendChild(el("p", { class: "muted" }, ["…"])); return wrap; }

    if (state.meta && (state.meta.fromCache || !navigator.onLine)) {
      wrap.appendChild(el("div", { class: "banner" }, [t("offline_banner")]));
    }

    const verdict = el("div", { class: "verdict" }, [
      el("h2", { class: "v-title band-text-" + tn.band }, [t("v_" + tn.band)]),
      el("p", { class: "muted" }, [t("v_" + tn.band + "_d")]),
    ]);

    const hero = el("div", { class: "tonight-hero" }, [
      el("div", { class: "ring-wrap" }, [scoreRing(tn.score, tn.band, 176)]),
      el("div", { class: "verdict-wrap" }, [
        el("div", { class: "kicker" }, [t("tonight_title")]),
        verdict,
        tn.window.valid
          ? el("div", { class: "window-pill" }, [
              el("span", { class: "wp-label" }, [t("best_window")]),
              el("strong", null, [`${fmtTime(tn.window.start)} – ${fmtTime(tn.window.end)}`]),
            ])
          : el("div", { class: "window-pill warn" }, [t("no_dark_window")]),
        tn.estimate ? el("p", { class: "estimate" }, [t("estimate_note")]) : null,
        el("button", { class: "btn primary", onclick: () => { state.view = "hosts"; render(); } }, [t("book_best")]),
      ]),
    ]);

    // breakdown
    const m = tn.metrics;
    const moonPct = Math.round(tn.moon.fraction * 100);
    const breakdown = el("div", { class: "card" }, [
      el("h3", null, [t("breakdown")]),
      el("div", { class: "metrics" }, [
        bar(t("f_cloud"), m.cloudComp == null ? 0 : m.cloudComp * 100,
          m.cloudPct == null ? "—" : `${Math.round(m.cloudPct)}% · ${t("lower_better")}`),
        bar(t("f_moon"), m.moonComp * 100, `${moonEmoji(tn.moon.phase)} ${moonPct}% ${t("illum")} · ${t("lower_better")}`),
        bar(t("f_dark"), m.darkComp * 100, `${m.darkHours.toFixed(1)} h · ${t("higher_better")}`),
        bar(t("f_vis"), m.visComp == null ? 60 : m.visComp * 100,
          m.visibilityM == null ? "—" : `${(m.visibilityM / 1000).toFixed(0)} km · ${t("higher_better")}`),
      ]),
      el("div", { class: "moon-row" }, [
        el("span", null, [`${t("moonrise")}: ${fmtTime(tn.moon.rise)}`]),
        el("span", null, [`${t("moonset")}: ${fmtTime(tn.moon.set)}`]),
      ]),
      el("div", { class: "updated-row" }, [
        el("span", { class: "muted" }, [`${t("updated")}: ${relTime(state.meta && state.meta.fetchedAt)}`]),
        el("span", null, [
          el("button", { class: "link-btn", onclick: refresh }, [t("refresh")]),
          el("a", { class: "link-btn", href: API.meteoUrl(), target: "_blank", rel: "noopener" }, [t("verify_link")]),
        ]),
      ]),
    ]);

    wrap.appendChild(hero);
    wrap.appendChild(breakdown);
    return wrap;
  }

  function viewForecast() {
    const wrap = el("div", { class: "view" });
    const scores = state.scores;
    let best = 0;
    scores.forEach((s, i) => { if (s.score > scores[best].score) best = i; });
    wrap.appendChild(el("div", { class: "kicker" }, [t("forecast_title")]));
    wrap.appendChild(el("p", { class: "muted top-sub" }, [t("forecast_sub")]));
    const grid = el("div", { class: "forecast-grid" });
    scores.forEach((s, i) => {
      const card = el("button", { class: "night-card band-bg-" + s.band + (i === best ? " best" : ""),
        onclick: () => { openBooking(null, s.date); } }, [
        i === best ? el("span", { class: "best-badge" }, [t("best_badge")]) : null,
        el("div", { class: "night-label" }, [nightLabel(s.date, i)]),
        el("div", { class: "night-score band-text-" + s.band }, [String(s.score)]),
        el("div", { class: "night-moon" }, [`${moonEmoji(s.moon.phase)} ${Math.round(s.moon.fraction * 100)}%`]),
        el("div", { class: "night-cloud muted" }, [s.metrics.cloudPct == null ? "—" : `☁ ${Math.round(s.metrics.cloudPct)}%`]),
      ]);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function priceTier(n) { return "💰".repeat(Math.max(1, Math.min(3, n))); }

  function viewHosts() {
    const wrap = el("div", { class: "view" });
    wrap.appendChild(el("div", { class: "kicker" }, [t("hosts_title")]));
    wrap.appendChild(el("p", { class: "muted top-sub" }, [t("hosts_sub")]));

    const reqs = loadRequests();
    if (reqs.length) {
      const list = el("div", { class: "my-requests" }, [
        el("h3", null, [`${t("my_requests")} (${reqs.length})`]),
        ...reqs.slice(-3).reverse().map((r) => el("div", { class: "req-chip" }, [
          `${L.current === "ar" ? r.hostNameAr : r.hostNameEn} · ${r.date}`,
        ])),
      ]);
      wrap.appendChild(list);
    }

    const grid = el("div", { class: "hosts-grid" });
    HOSTS.forEach((h) => {
      const name = L.current === "ar" ? h.name_ar : h.name_en;
      const tags = (L.current === "ar" ? h.tags_ar : h.tags_en) || [];
      const includes = (L.current === "ar" ? h.includes_ar : h.includes_en) || [];
      const card = el("div", { class: "host-card" }, [
        el("div", { class: "host-top" }, [
          el("h3", null, [name]),
          h.sample ? el("span", { class: "sample-badge" }, [t("sample_badge")]) : null,
        ]),
        el("p", { class: "host-by muted" }, [L.current === "ar" ? h.host_ar : h.host_en]),
        el("p", { class: "host-offer" }, [L.current === "ar" ? h.offering_ar : h.offering_en]),
        el("ul", { class: "host-includes" }, includes.map((x) => el("li", null, [x]))),
        el("div", { class: "host-tags" }, tags.map((x) => el("span", { class: "tag" }, [x]))),
        el("div", { class: "host-foot" }, [
          el("div", { class: "price" }, [
            el("span", { class: "tier" }, [priceTier(h.priceTier)]),
            el("span", null, [`${t("from")} ${h.priceFrom_aed} ${t("aed")} ${t("per_night")}`]),
            el("span", { class: "muted cap" }, [`${t("up_to")} ${h.capacity} ${t("guests")}`]),
          ]),
          el("button", { class: "btn primary sm", onclick: () => openBooking(h, state.scores[0] && state.scores[0].date) }, [t("request_night")]),
        ]),
      ]);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function viewLocation() {
    const wrap = el("div", { class: "view" });
    const s = C.site;
    wrap.appendChild(el("div", { class: "kicker" }, [t("location_title")]));
    const facts = el("div", { class: "fact-grid" }, [
      factRow(t("coordinates"), `${s.lat}°N, ${s.lng}°E`),
      factRow(t("distance"), L.current === "ar" ? s.drive_ar : s.drive_en),
      factRow(t("dark_sky"), `${L.current === "ar" ? s.darkSky.rating_ar : s.darkSky.rating_en} · ${s.darkSky.bortleEstimate}`),
      factRow(t("best_season"), L.current === "ar" ? s.bestSeason_ar : s.bestSeason_en),
    ]);
    wrap.appendChild(el("div", { class: "card" }, [facts,
      el("p", { class: "muted small" }, [L.current === "ar" ? s.darkSky.certifiedNote_ar : s.darkSky.certifiedNote_en]),
      el("a", { class: "btn", href: `https://www.google.com/maps?q=${s.lat},${s.lng}`, target: "_blank", rel: "noopener" }, [t("open_maps")]),
    ]));

    const bring = t("bring");
    wrap.appendChild(el("div", { class: "card" }, [
      el("h3", null, [t("bring_title")]),
      el("ul", { class: "bring" }, bring.map((b) => el("li", null, [b]))),
      el("p", { class: "facilities" }, [t("facilities_note")]),
    ]));
    return wrap;
  }
  function factRow(k, v) {
    return el("div", { class: "fact-row" }, [el("span", { class: "fact-k" }, [k]), el("span", { class: "fact-v" }, [v])]);
  }

  function viewAbout() {
    const wrap = el("div", { class: "view" });
    wrap.appendChild(el("div", { class: "kicker" }, [t("about_title")]));
    wrap.appendChild(el("div", { class: "card" }, [el("p", { class: "lede" }, [t("about_body")])]));
    const facts = t("facts");
    wrap.appendChild(el("div", { class: "card" }, [
      el("h3", null, [t("facts_title")]),
      el("ul", { class: "facts" }, facts.map((f) => el("li", null, [
        f[0] + " ", el("a", { href: f[1], target: "_blank", rel: "noopener", class: "src" }, ["↗"]),
      ]))),
    ]));
    wrap.appendChild(el("div", { class: "card" }, [
      el("h3", null, [t("data_sources")]),
      el("ul", { class: "sources" }, [
        srcLi("Open-Meteo", "cloud cover + visibility · no key", "https://open-meteo.com/en/docs"),
        srcLi("SunCalc (MIT)", "moon phase + astronomical twilight · offline", "https://github.com/mourner/suncalc"),
        srcLi("sunrise-sunset.org", "twilight cross-check · no key", "https://sunrise-sunset.org/api"),
      ]),
    ]));
    wrap.appendChild(el("p", { class: "made-for muted" }, [t("made_for")]));
    return wrap;
  }
  function srcLi(name, desc, url) {
    return el("li", null, [el("a", { href: url, target: "_blank", rel: "noopener" }, [name]), el("span", { class: "muted" }, [" — " + desc])]);
  }

  // ---- booking ---------------------------------------------------------------
  function isoDate(d) {
    if (!(d instanceof Date) || isNaN(d)) d = new Date();
    return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: C.site.timezone }).format(d);
  }
  function openBooking(host, date) {
    if (!host) host = HOSTS[0];
    state.booking = { host, date: isoDate(date), step: "form" };
    renderModal();
  }
  function loadRequests() { try { return JSON.parse(localStorage.getItem("najm_requests") || "[]"); } catch (e) { return []; } }
  function saveRequest(r) { const a = loadRequests(); a.push(r); localStorage.setItem("najm_requests", JSON.stringify(a)); }

  function buildMessage(r) {
    if (L.current === "ar") {
      return `مرحبًا، أرغب بحجز ليلة رصد فلكي في «${r.hostNameAr}» بالقُع.\nالليلة: ${r.date}\nالضيوف: ${r.guests}\nالاسم: ${r.name}\nالتواصل: ${r.contact}${r.note ? "\nملاحظة: " + r.note : ""}\n— عبر تطبيق نجم القُع`;
    }
    return `Hello! I'd like to book a stargazing night at "${r.hostNameEn}" in Al Qua'a.\nNight: ${r.date}\nGuests: ${r.guests}\nName: ${r.name}\nContact: ${r.contact}${r.note ? "\nNote: " + r.note : ""}\n— via the Najm Al Qua'a app`;
  }

  function renderModal() {
    let overlay = document.getElementById("modal");
    if (overlay) overlay.remove();
    if (!state.booking) return;
    const b = state.booking;
    const host = b.host;
    const close = () => { state.booking = null; const o = document.getElementById("modal"); if (o) o.remove(); render(); };

    let body;
    if (b.step === "form") {
      const f = {};
      const input = (key, type, ph, val) => {
        const i = el("input", { type, class: "in", placeholder: ph, value: val || "" });
        f[key] = i; return i;
      };
      body = el("div", { class: "modal-card" }, [
        el("div", { class: "modal-head" }, [
          el("h3", null, [t("booking_title")]),
          el("button", { class: "x", onclick: close }, ["×"]),
        ]),
        el("p", { class: "muted" }, [`${t("booking_for")}: ${L.current === "ar" ? host.name_ar : host.name_en}`]),
        el("label", null, [t("f_name"), input("name", "text", t("f_name"))]),
        el("div", { class: "row2" }, [
          el("label", null, [t("f_guests"), input("guests", "number", "2", "2")]),
          el("label", null, [t("f_date"), input("date", "date", "", b.date)]),
        ]),
        el("label", null, [t("f_contact"), input("contact", "text", "+9715…")]),
        el("label", null, [t("f_message"), input("note", "text", t("f_message"))]),
        el("div", { class: "modal-actions" }, [
          el("button", { class: "btn ghost", onclick: close }, [t("cancel")]),
          el("button", { class: "btn primary", onclick: () => {
            const r = {
              hostId: host.id, hostNameEn: host.name_en, hostNameAr: host.name_ar,
              name: f.name.value || "—", guests: f.guests.value || "2",
              date: f.date.value || b.date, contact: f.contact.value || "—", note: f.note.value || "",
              at: Date.now(),
            };
            saveRequest(r);
            b.request = r; b.step = "done"; renderModal();
          } }, [t("send_request")]),
        ]),
      ]);
    } else {
      const r = b.request;
      const msg = buildMessage(r);
      const wa = "https://wa.me/?text=" + encodeURIComponent(msg);
      body = el("div", { class: "modal-card" }, [
        el("div", { class: "modal-head" }, [
          el("h3", { class: "band-text-excellent" }, [t("booking_done_title")]),
          el("button", { class: "x", onclick: close }, ["×"]),
        ]),
        el("p", null, [t("booking_done_msg")]),
        el("pre", { class: "msg-preview" }, [msg]),
        el("div", { class: "modal-actions" }, [
          el("button", { class: "btn ghost", onclick: (e) => {
            navigator.clipboard && navigator.clipboard.writeText(msg);
            e.target.textContent = t("copied");
          } }, [t("copy_request")]),
          el("a", { class: "btn primary", href: wa, target: "_blank", rel: "noopener" }, [t("open_whatsapp")]),
        ]),
      ]);
    }
    overlay = el("div", { id: "modal", class: "overlay", onclick: (e) => { if (e.target.id === "modal") close(); } }, [body]);
    document.body.appendChild(overlay);
  }

  // ---- shell -----------------------------------------------------------------
  const VIEWS = { tonight: viewTonight, forecast: viewForecast, hosts: viewHosts, location: viewLocation, about: viewAbout };
  const TABS = [["tonight", "tab_tonight"], ["forecast", "tab_forecast"], ["hosts", "tab_hosts"], ["location", "tab_location"], ["about", "tab_about"]];

  function render() {
    document.documentElement.lang = L.current;
    document.documentElement.dir = L.isRTL() ? "rtl" : "ltr";
    document.title = t("appName") + " · " + t("tab_tonight");

    const app = document.getElementById("app");
    app.innerHTML = "";

    const header = el("header", { class: "app-header" }, [
      el("div", { class: "brand" }, [
        el("div", { class: "logo" }, ["✦"]),
        el("div", null, [
          el("div", { class: "brand-name" }, [t("appName")]),
          el("div", { class: "brand-tag" }, [t("tagline")]),
        ]),
      ]),
      el("button", { class: "lang-btn", onclick: () => { L.set(L.current === "en" ? "ar" : "en"); render(); } }, [t("langToggle")]),
    ]);

    const nav = el("nav", { class: "tabs" }, TABS.map(([k, lbl]) =>
      el("button", { class: "tab" + (state.view === k ? " active" : ""), onclick: () => { state.view = k; render(); } }, [t(lbl)])
    ));

    const main = el("main", { class: "main" }, [VIEWS[state.view]()]);
    app.appendChild(header); app.appendChild(nav); app.appendChild(main);
    renderModal();
  }

  // ---- data load -------------------------------------------------------------
  function recompute(meta) {
    state.meta = meta;
    state.scores = ASTRO.scoreSeries(meta && meta.data, C.forecastNights);
  }
  async function load() {
    // First paint with whatever we can (SunCalc works with no data).
    recompute({ data: null, fetchedAt: null, fromCache: false });
    render();
    const res = await API.getConditions();
    recompute(res);
    render();
    API.getTwilightCrosscheck().then((tw) => { if (tw) state.twilight = tw; });
  }
  async function refresh() {
    const res = await API.getConditions({ force: true });
    recompute(res); render();
  }

  window.addEventListener("online", () => refresh());
  window.addEventListener("offline", () => render());

  // Register the service worker for offline use (no-op on file://).
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  load();
})();
