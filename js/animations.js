/* =========================================================
   Maison Indigo — motion layer
   Lenis smooth scroll · GSAP ScrollTrigger reveals · parallax
   magnetic buttons
   Degrades gracefully: if the CDN libraries fail, the CSS
   fallback reveals in main.js still run.
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    // In-page anchor links glide smoothly
    $$('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: id === "#home" ? -200 : -70, duration: 1.4 });
        history.replaceState(null, "", id);
      })
    );
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$(".btn, .circle-btn, .hero__arrow, .floater").forEach((el) => {
      const strength = el.classList.contains("btn") ? 0.25 : 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.22,.8,.24,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ---------- GSAP scroll animations ---------- */
  if (!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("gsap-on");

  // Split section titles into masked lines/words for an editorial reveal
  const splitTitle = (el) => {
    if (el.dataset.split) return;
    el.dataset.split = "1";
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts
      .map((part) => {
        const tmp = document.createElement("div");
        tmp.innerHTML = part.trim();
        const words = [];
        tmp.childNodes.forEach((n) => {
          if (n.nodeType === 3) {
            n.textContent.split(/(\s+)/).forEach((w) => { if (w.trim()) words.push(`<span>${w}</span>`); else if (w) words.push(" "); });
          } else {
            words.push(`<span>${n.outerHTML}</span>`);
          }
        });
        return `<span class="split-line">${words.join("")}</span>`;
      })
      .join("");
  };

  $$(".section .title").forEach((t) => {
    splitTitle(t);
    gsap.from($$(".split-line > span", t), {
      yPercent: 110, rotate: 3, duration: 1.1, ease: "power4.out", stagger: 0.05,
      scrollTrigger: { trigger: t, start: "top 85%" },
    });
  });

  $$(".eyebrow").forEach((e) => {
    if (e.closest(".hero") || e.closest(".modal")) return;
    gsap.fromTo(e, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: e, start: "top 90%" } });
  });

  // Generic fade-up blocks
  // (elements that have their own dedicated animation below are skipped,
  //  otherwise two "from" tweens would fight and leave them invisible)
  $$(".reveal").forEach((el) => {
    if (el.matches(".service, .post, #ba, .swatches__group")) return;
    gsap.fromTo(el, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  // Staggered grids
  const staggerGroup = (parentSel, childSel, opts = {}) => {
    $$(parentSel).forEach((p) => {
      const { y = 70, x = 0, ...rest } = opts;
      // Explicit end values + clearProps so elements return cleanly to their stylesheet state
      gsap.fromTo($$(childSel, p), { y, x, opacity: 0 }, {
        y: 0, x: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: 0.12, clearProps: "transform,opacity", ...rest,
        scrollTrigger: { trigger: p, start: "top 82%" },
      });
    });
  };
  staggerGroup(".services__grid", ".service");
  staggerGroup(".journal__grid", ".post");
  staggerGroup(".usp", ".usp__item", { y: 30 });
  staggerGroup(".stats__grid", ".stat", { y: 40 });
  staggerGroup(".about__list", "li", { y: 20, x: -20 });
  staggerGroup(".stepper__tabs", ".stepper__tab", { y: 30, stagger: 0.06 });
  staggerGroup(".accordion", ".acc", { y: 30, stagger: 0.08 });
  staggerGroup(".swatches", ".swatches__group", { y: 30 });
  staggerGroup(".areas__chips", "span", { y: 14, stagger: 0.03, duration: 0.6 });
  staggerGroup(".logos", "span", { y: 20, stagger: 0.08 });

  // Image curtain reveals
  $$(".tile").forEach((t, i) => {
    gsap.fromTo(t, { clipPath: "inset(100% 0% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power4.inOut", delay: (i % 3) * 0.1,
      scrollTrigger: { trigger: t, start: "top 90%" },
    });
    gsap.from($("img", t), { scale: 1.35, duration: 1.8, ease: "power3.out", scrollTrigger: { trigger: t, start: "top 90%" } });
  });
  $$(".service__media, .post__media").forEach((m) => {
    gsap.fromTo(m, { clipPath: "inset(0% 0% 100% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power4.inOut",
      scrollTrigger: { trigger: m, start: "top 88%" },
    });
  });
  const aboutMain = $(".about__main");
  if (aboutMain) {
    gsap.fromTo(aboutMain, { clipPath: "inset(100% 0% 0% 0% round 220px 220px 16px 16px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 220px 220px 16px 16px)", duration: 1.6, ease: "power4.inOut",
      scrollTrigger: { trigger: aboutMain, start: "top 80%" },
    });
  }

  // Parallax
  $$("[data-parallax]").forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: img.parentElement, scrub: true } });
  });
  gsap.to(".about__media-sm", { y: -60, ease: "none", scrollTrigger: { trigger: ".about", scrub: true } });
  gsap.to(".about__exp", { y: 50, ease: "none", scrollTrigger: { trigger: ".about", scrub: true } });
  gsap.to(".hero__slides", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__content", { yPercent: 25, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // Before/after: card slides in, handle sweeps to show the transformation
  const ba = $("#ba");
  if (ba) {
    const range = $(".ba__range", ba);
    const sweep = { v: 85 };
    gsap.timeline({ scrollTrigger: { trigger: ba, start: "top 70%" } })
      .fromTo(ba, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: "power3.out" })
      .fromTo(sweep, { v: 85 }, {
        v: 50, duration: 1.4, ease: "power3.inOut",
        onUpdate: () => { range.value = sweep.v; range.dispatchEvent(new Event("input")); },
      }, "-=0.4");
  }

  // Stepper panel & estimator card
  gsap.fromTo(".stepper__panels", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".stepper__panels", start: "top 85%" } });
  gsap.fromTo(".studio3d__stage", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".studio3d__stage", start: "top 85%" } });
  gsap.fromTo(".review", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".slider", start: "top 85%" } });

  // Ticker speed reacts to scroll velocity
  if (lenis) {
    const track = $(".ticker__track");
    lenis.on("scroll", ({ velocity }) => {
      const skew = gsap.utils.clamp(-6, 6, velocity * 0.4);
      gsap.to(track, { skewX: -skew, duration: 0.4, overwrite: true });
    });
  }

  // Hero intro after preloader
  window.addEventListener("load", () => {
    gsap.timeline({ delay: 0.75 })
      .from(".hero .eyebrow", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".hero__sub", { y: 30, opacity: 0, duration: 0.9, ease: "power3.out" }, "-=0.5")
      .from(".hero__btns > *", { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }, "-=0.6")
      .from(".hero__counter", { opacity: 0, y: 20, duration: 0.8 }, "-=0.5")
      .from(".hero__badge", { scale: 0, rotate: -90, duration: 1, ease: "back.out(1.6)" }, "-=0.8");
    ScrollTrigger.refresh();
  });
})();
