/* =========================================================
   Maison Indigo — site interactions
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Preloader + welcome popup ---------- */
  window.addEventListener("load", () => {
    setTimeout(() => $("#preloader").classList.add("is-done"), 500);
    // Show the consultation popup once per session, a few seconds after load
    let seen = false;
    try { seen = sessionStorage.getItem("mi_popup_seen") === "1"; } catch (e) {}
    if (!seen) setTimeout(() => openModal("#welcomeModal"), 3500);
  });
  // Safety: never keep the preloader longer than 3s
  setTimeout(() => $("#preloader").classList.add("is-done"), 3000);

  /* ---------- Year ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Header scroll state + back to top ---------- */
  const nav = $("#nav");
  const header = $("#header");
  const toTop = $("#toTop");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    // Hide header when scrolling down, reveal when scrolling up
    header.classList.toggle("is-hidden", y > 500 && y > lastY && !nav.classList.contains("is-open"));
    toTop.classList.toggle("is-visible", y > 700);
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => (window.__lenis ? window.__lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" })));

  /* ---------- Scroll lock (works with Lenis smooth scroll) ---------- */
  const lockScroll = (on) => {
    document.body.classList.toggle("no-scroll", on);
    if (window.__lenis) on ? window.__lenis.stop() : window.__lenis.start();
  };
  window.__lockScroll = lockScroll;

  /* ---------- Mobile nav ---------- */
  const burger = $("#burger");
  const toggleNav = (force) => {
    const open = typeof force === "boolean" ? force : !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    lockScroll(open);
  };
  burger.addEventListener("click", () => toggleNav());
  $$("#nav a").forEach((a) => a.addEventListener("click", () => toggleNav(false)));

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = $$(".nav > a");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Hero slider ---------- */
  const slides = $$(".hero__slide");
  const lines = $$(".hero__line");
  const bar = $(".hero__bar i");
  const cur = $(".hero__current");
  let hIndex = 0, hTimer;
  const goHero = (i) => {
    hIndex = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("is-active", k === hIndex));
    lines.forEach((l, k) => l.classList.toggle("is-active", k === hIndex));
    cur.textContent = String(hIndex + 1).padStart(2, "0");
    bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run");
    clearTimeout(hTimer);
    hTimer = setTimeout(() => goHero(hIndex + 1), 6000);
  };
  $$(".hero__arrow").forEach((b) => b.addEventListener("click", () => goHero(hIndex + Number(b.dataset.dir))));
  goHero(0);

  /* ---------- Scroll reveal ---------- */
  const revealer = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); revealer.unobserve(en.target); }
    }),
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 0.08 + "s";
    revealer.observe(el);
  });

  /* ---------- Counters ---------- */
  const fmt = new Intl.NumberFormat("en-IN");
  const counter = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target, target = Number(el.dataset.target), dur = 1800, t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt.format(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counter.unobserve(el);
    }),
    { threshold: 0.5 }
  );
  $$(".js-count").forEach((el) => counter.observe(el));

  /* ---------- Portfolio filter ---------- */
  const tiles = $$(".tile");
  $$(".filter").forEach((btn) =>
    btn.addEventListener("click", () => {
      $$(".filter").forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      tiles.forEach((t) => {
        const show = f === "all" || t.dataset.cat === f;
        t.classList.toggle("is-hidden", !show);
      });
    })
  );

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  let lbList = [], lbIdx = 0;
  const showLb = (i) => {
    lbIdx = (i + lbList.length) % lbList.length;
    const t = lbList[lbIdx], img = $("img", t);
    lbImg.src = img.src.replace(/w=\d+/, "w=1600");
    lbImg.alt = img.alt;
    lbCap.textContent = $("h4", t).textContent + " — " + $("figcaption span", t).textContent;
  };
  tiles.forEach((t) =>
    t.addEventListener("click", () => {
      lbList = tiles.filter((x) => !x.classList.contains("is-hidden"));
      showLb(lbList.indexOf(t));
      lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
      lockScroll(true);
    })
  );
  const closeLb = () => { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); lockScroll(false); };
  $(".lightbox__close").addEventListener("click", closeLb);
  $(".lightbox__prev").addEventListener("click", (e) => { e.stopPropagation(); showLb(lbIdx - 1); });
  $(".lightbox__next").addEventListener("click", (e) => { e.stopPropagation(); showLb(lbIdx + 1); });
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });

  /* ---------- Before / After ---------- */
  const ba = $("#ba");
  if (ba) {
    const range = $(".ba__range", ba), before = $(".ba__before", ba), handle = $(".ba__handle", ba);
    const setBA = (v) => { before.style.clipPath = `inset(0 ${100 - v}% 0 0)`; handle.style.left = v + "%"; };
    range.addEventListener("input", () => setBA(range.value));
    setBA(50);
  }

  /* ---------- Process stepper ---------- */
  const tabs = $$(".stepper__tab"), panels = $$(".stepper__panel"), prog = $(".stepper__progress i");
  let sIdx = 0;
  const goStep = (i) => {
    sIdx = (i + tabs.length) % tabs.length;
    tabs.forEach((t, k) => { t.classList.toggle("is-active", k === sIdx); t.setAttribute("aria-selected", k === sIdx); });
    panels.forEach((p, k) => p.classList.toggle("is-active", k === sIdx));
    prog.style.width = ((sIdx + 1) / tabs.length) * 100 + "%";
  };
  tabs.forEach((t, k) => t.addEventListener("click", () => goStep(k)));
  $$("[data-step-dir]").forEach((b) => b.addEventListener("click", () => goStep(sIdx + Number(b.dataset.stepDir))));

  /* ---------- Cost estimator ---------- */
  const calc = $("#calc");
  const BASE = { 1: 260000, 2: 430000, 3: 620000, 4: 880000 }; // Kolhapur pricing
  const ADDON = { kitchen: 0.32, wardrobe: 0.26, living: 0.2, ceiling: 0.09, paint: 0.07, decor: 0.12 };
  const inr = (n) => "₹ " + fmt.format(Math.round(n / 1000) * 1000);
  const compute = () => {
    const bhk = $("input[name=bhk]:checked", calc).value;
    const tier = Number($("input[name=tier]:checked", calc).value);
    const rooms = $$("input[name=room]:checked", calc).map((r) => r.value);
    let share = rooms.reduce((s, r) => s + ADDON[r], 0.12); // 0.12 = design & base services
    const low = BASE[bhk] * share * tier;
    const high = low * 1.22;
    $("#calcOut").textContent = `${inr(low)} – ${inr(high).replace("₹ ", "")}`;
    $("#calcEmi").textContent = `EMI from ${inr(low / 36).replace(" ", "")}/month · 36 months`;
  };
  calc.addEventListener("change", compute);
  compute();

  /* ---------- Reviews slider ---------- */
  const slider = $("#reviewSlider");
  const track = $(".slider__track", slider), cards = $$(".review", slider), dotsWrap = $(".slider__dots", slider);
  let rIdx = 0, rTimer;
  const perView = () => (window.innerWidth <= 640 ? 1 : window.innerWidth <= 980 ? 2 : 3);
  const maxIdx = () => Math.max(0, cards.length - perView());
  const buildDots = () => {
    dotsWrap.innerHTML = "";
    for (let i = 0; i <= maxIdx(); i++) {
      const d = document.createElement("button");
      d.setAttribute("aria-label", "Go to review " + (i + 1));
      d.addEventListener("click", () => goReview(i));
      dotsWrap.appendChild(d);
    }
  };
  const goReview = (i) => {
    const m = maxIdx();
    rIdx = i > m ? 0 : i < 0 ? m : i;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    track.style.transform = `translateX(-${rIdx * (cards[0].offsetWidth + gap)}px)`;
    $$("button", dotsWrap).forEach((d, k) => d.classList.toggle("is-active", k === rIdx));
    clearInterval(rTimer);
    rTimer = setInterval(() => goReview(rIdx + 1), 5500);
  };
  $$("[data-slide-dir]").forEach((b) => b.addEventListener("click", () => goReview(rIdx + Number(b.dataset.slideDir))));
  // Swipe support
  let sx = null;
  track.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  track.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) goReview(rIdx + (dx < 0 ? 1 : -1));
    sx = null;
  });
  let rz;
  window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { buildDots(); goReview(Math.min(rIdx, maxIdx())); }, 150); });
  buildDots(); goReview(0);

  /* ---------- Modals ---------- */
  let lastFocus = null;
  function openModal(sel) {
    const m = $(sel);
    if (!m || m.classList.contains("is-open")) return;
    $$(".modal.is-open").forEach((x) => closeModal(x));
    lastFocus = document.activeElement;
    m.classList.add("is-open"); m.setAttribute("aria-hidden", "false");
    lockScroll(true);
    setTimeout(() => { const f = $("input:not([type=hidden])", m); f && f.focus({ preventScroll: true }); }, 350);
  }
  function closeModal(m) {
    m.classList.remove("is-open"); m.setAttribute("aria-hidden", "true");
    lockScroll(false);
    if (m.id === "welcomeModal") { try { sessionStorage.setItem("mi_popup_seen", "1"); } catch (e) {} }
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  $$(".modal").forEach((m) => $$("[data-close]", m).forEach((b) => b.addEventListener("click", () => closeModal(m))));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") {
      if (lb.classList.contains("is-open")) {
        if (e.key === "ArrowRight") showLb(lbIdx + 1);
        if (e.key === "ArrowLeft") showLb(lbIdx - 1);
      }
      return;
    }
    $$(".modal.is-open").forEach(closeModal);
    if (lb.classList.contains("is-open")) closeLb();
    if (nav.classList.contains("is-open")) toggleNav(false);
  });

  $$(".js-open-consult").forEach((b) =>
    b.addEventListener("click", () => {
      const m = $("#welcomeModal");
      const svc = b.dataset.service;
      $("#welcomeTitle").textContent = svc
        ? `Get a free quote for ${svc}.`
        : "Let's design the home you've been imagining.";
      openModal("#welcomeModal");
      m.dataset.service = svc || "";
    })
  );
  $$(".js-open-visit").forEach((b) =>
    b.addEventListener("click", () => {
      const type = $("input[name=visitType]:checked");
      $("#visitModal input[name=visitType]").value = type ? type.value : "";
      $("#visitTitle").textContent = "Book your " + (type ? type.value : "studio visit");
      openModal("#visitModal");
    })
  );

  // Date input: no past dates
  const today = new Date().toISOString().split("T")[0];
  $$(".js-min-today").forEach((d) => (d.min = today));

  /* ---------- Toast ---------- */
  let tTimer;
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("is-show");
    clearTimeout(tTimer); tTimer = setTimeout(() => t.classList.remove("is-show"), 3800);
  };

  /* ---------- Forms: validation + submission ---------- */
  const MESSAGES = {
    name: "Please enter your name",
    phone: "Enter a valid 10-digit mobile number",
    email: "Enter a valid email address",
    property: "Please select a property type",
    budget: "Please select your budget",
    date: "Please choose a date",
    time: "Please pick a time slot",
  };
  const setError = (input, msg) => {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.toggle("has-error", !!msg);
    let e = $(".error-msg", field);
    if (msg) {
      if (!e) { e = document.createElement("span"); e.className = "error-msg"; field.appendChild(e); }
      e.textContent = msg;
    } else if (e) e.remove();
  };
  const validate = (form) => {
    let ok = true;
    $$("input, select, textarea", form).forEach((el) => {
      if (el.type === "hidden" || el.type === "checkbox") return;
      if (el.name === "name") el.value = el.value.trimStart();
      let valid = el.checkValidity();
      if (el.name === "name" && el.value.trim().length < 2) valid = false;
      setError(el, valid ? "" : MESSAGES[el.name] || "This field is required");
      if (!valid) ok = false;
    });
    return ok;
  };
  // Live clean-up of errors and digits-only phone
  $$(".js-lead-form").forEach((form) => {
    $$("input, select, textarea", form).forEach((el) => {
      el.addEventListener("input", () => {
        if (el.type === "tel") el.value = el.value.replace(/\D/g, "").slice(0, 10);
        if (el.closest(".field.has-error") && el.checkValidity()) setError(el, "");
      });
      el.addEventListener("change", () => { if (el.closest(".field.has-error") && el.checkValidity()) setError(el, ""); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) { toast("Please check the highlighted fields."); return; }
      const btn = $("button[type=submit]", form);
      btn.classList.add("is-loading");
      const data = Object.fromEntries(new FormData(form).entries());
      data.source = form.dataset.form;
      const modal = form.closest(".modal");
      if (modal && modal.dataset.service) data.service = modal.dataset.service;
      data.submittedAt = new Date().toISOString();

      // Send the enquiry to the studio's WhatsApp (opens WhatsApp with the message pre-filled).
      // Must run synchronously inside the submit event so browsers don't block the new tab.
      sendToWhatsApp(data);

      setTimeout(() => {
        try {
          const all = JSON.parse(localStorage.getItem("mi_enquiries") || "[]");
          all.push(data); localStorage.setItem("mi_enquiries", JSON.stringify(all));
        } catch (err) {}
        btn.classList.remove("is-loading");
        const first = (data.name || "").split(" ")[0];
        const original = form.innerHTML;
        form.innerHTML = `
          <div class="form-success">
            <div class="tick">✓</div>
            <h4>Thank you${first ? ", " + escapeHtml(first) : ""}!</h4>
            <p>${data.source === "visit"
              ? `Your visit is booked for ${escapeHtml(data.date)} at ${escapeHtml(data.time)}. A confirmation will reach you on WhatsApp.`
              : "Your details are ready in WhatsApp. Just tap <strong>Send</strong> and our design consultant will reply shortly."}</p>
            <a class="link-arrow" href="${waUrl(data)}" target="_blank" rel="noopener">WhatsApp didn't open? Tap here →</a>
          </div>`;
        toast("Enquiry received. We'll be in touch soon!");
        if (modal) {
          try { sessionStorage.setItem("mi_popup_seen", "1"); } catch (err) {}
          setTimeout(() => closeModal(modal), 3200);
        }
        // Restore the form for future use
        setTimeout(() => { form.innerHTML = original; rebind(form); }, 6000);
      }, 900);
    });
  });
  /* ---------- WhatsApp delivery ---------- */
  const WHATSAPP_NUMBER = "918767807414"; // country code + number, no "+" or spaces
  const FORM_NAMES = { popup: "Free Consultation (popup)", contact: "Contact Form", visit: "Studio Visit Booking" };
  const LABELS = {
    name: "Name", phone: "Mobile", email: "Email", property: "Property", budget: "Budget",
    service: "Interested in", visitType: "Visit type", date: "Preferred date", time: "Time slot",
    message: "Message", whatsapp: "WhatsApp updates",
  };
  function buildMessage(d) {
    const lines = ["*New Enquiry · Maison Indigo Website*", "Form: " + (FORM_NAMES[d.source] || d.source), ""];
    Object.keys(LABELS).forEach((k) => {
      if (d[k] === undefined || String(d[k]).trim() === "") return;
      let v = String(d[k]).trim();
      if (k === "phone") v = "+91 " + v;
      if (k === "whatsapp") v = "Yes";
      if (k === "date") v = new Date(v + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      lines.push(`*${LABELS[k]}:* ${v}`);
    });
    lines.push("", "Sent on " + new Date().toLocaleString("en-IN"));
    return lines.join("\n");
  }
  function waUrl(d) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage(d))}`;
  }
  function sendToWhatsApp(d) {
    const url = waUrl(d);
    const win = window.open(url, "_blank");
    if (win) {
      try { win.opener = null; } catch (e) {}
    } else {
      // Popup blocked: fall back to opening in the same tab after the success message shows
      setTimeout(() => { window.location.href = url; }, 1500);
    }
  }

  // Re-attach input helpers after restoring a form's markup
  function rebind(form) {
    $$("input, select, textarea", form).forEach((el) => {
      el.addEventListener("input", () => {
        if (el.type === "tel") el.value = el.value.replace(/\D/g, "").slice(0, 10);
        if (el.closest(".field.has-error") && el.checkValidity()) setError(el, "");
      });
    });
    $$(".js-min-today", form).forEach((d) => (d.min = today));
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Newsletter ---------- */
  $("#newsletter").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("input", e.target);
    if (!inp.checkValidity() || !inp.value) { toast("Please enter a valid email address."); return; }
    toast("Subscribed! Design inspiration is on its way.");
    inp.value = "";
  });

  /* ---------- Journal (demo) ---------- */
  $$(".js-post").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); toast("Full articles are coming soon to the Journal."); }));

  /* ---------- Image fallback ---------- */
  $$("img").forEach((img) => img.addEventListener("error", () => { img.style.visibility = "hidden"; }));
})();
