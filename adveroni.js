/* ═══════════════════════════════════════
   ADVERONI — Main JS
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  /* ── State ── */
  let currentLang = 'pl';

  /* ── DOM shortcuts ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ══════════════════════════════════════
     HEADER — scroll effect
     ══════════════════════════════════════ */
  const header = $('#header');

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ══════════════════════════════════════
     MOBILE MENU — burger
     ══════════════════════════════════════ */
  const burger = $('#burger');
  const nav    = $('#nav');

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });

  // Close on nav link click
  $$('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.classList.remove('open');
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !burger.contains(e.target)) {
      nav.classList.remove('open');
      burger.classList.remove('open');
    }
  });

  /* ══════════════════════════════════════
     LANGUAGE SWITCH — PL / UA
     ══════════════════════════════════════ */
  const langBtns = $$('.lang-btn');

  function applyLang(lang) {
    currentLang = lang;

    // Update button states
    langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));

    // Update all elements with data-pl / data-ua
    $$('[data-pl]').forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text !== null) el.textContent = text;
    });

    // Update placeholders
    $$('[data-pl-ph]').forEach(el => {
      const ph = el.getAttribute(`data-${lang}-ph`);
      if (ph !== null) el.placeholder = ph;
    });

    // Update form success message
    const success = $('#formSuccess');
    if (success) success.textContent = success.getAttribute(`data-${lang}`) || success.textContent;

    // Persist
    try { localStorage.setItem('adv-lang', lang); } catch (_) {}
  }

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });

  // Restore saved language
  try {
    const saved = localStorage.getItem('adv-lang');
    if (saved === 'ua') applyLang('ua');
  } catch (_) {}

  /* ══════════════════════════════════════
     FAQ — accordion
     ══════════════════════════════════════ */
  $$('.faq-item__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all
      $$('.faq-item.open').forEach(i => i.classList.remove('open'));

      // Toggle clicked
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ══════════════════════════════════════
     SCROLL REVEAL — Intersection Observer
     ══════════════════════════════════════ */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    revealObs.observe(el);
  });

  /* ══════════════════════════════════════
     SMOOTH SCROLL — anchor links
     ══════════════════════════════════════ */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY
                - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10)
                - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ══════════════════════════════════════
     CONTACT FORM — basic feedback
     ══════════════════════════════════════ */
  const form    = $('#contactForm');
  const success = $('#formSuccess');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const inputs = $$('.form-inp', form);
      let valid = true;

      inputs.forEach(inp => {
        inp.style.borderColor = '';
        if (inp.required && !inp.value.trim()) {
          inp.style.borderColor = '#EF4444';
          valid = false;
        }
      });

      if (!valid) return;

      // Simulate sending
      const btn = $('button[type="submit"]', form);
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = currentLang === 'ua' ? 'Надсилаємо...' : 'Wysyłamy...';

      setTimeout(() => {
        form.reset();
        btn.disabled = false;
        btn.textContent = origText;
        success.hidden = false;
        success.textContent = success.getAttribute(`data-${currentLang}`) || success.getAttribute('data-pl');
        setTimeout(() => { success.hidden = true; }, 5000);
      }, 1200);
    });
  }

  /* ══════════════════════════════════════
     COUNTER ANIMATION — hero stats
     ══════════════════════════════════════ */
  function animateCounter(el, target, suffix) {
    const duration = 1600;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const heroObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateCounter($('.stat:nth-child(1) .stat__num'), 150, '+');
      animateCounter($('.stat:nth-child(3) .stat__num'), 98, '%');
      heroObs.disconnect();
    }
  }, { threshold: 0.5 });

  const statsEl = $('.hero__stats');
  if (statsEl) heroObs.observe(statsEl);

  /* ══════════════════════════════════════
     HERO CANVAS — ambient particles
     ══════════════════════════════════════ */
  const heroCanvas = document.getElementById('heroCanvas');
  if (heroCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const hctx = heroCanvas.getContext('2d');
    let cw, ch, heroVisible = true;

    function resizeHC() {
      cw = heroCanvas.width  = heroCanvas.offsetWidth;
      ch = heroCanvas.height = heroCanvas.offsetHeight;
    }
    resizeHC();
    window.addEventListener('resize', resizeHC, { passive: true });

    const pCount = window.innerWidth < 768 ? 28 : 65;
    const pts = Array.from({ length: pCount }, function () {
      return {
        x:  Math.random(),
        y:  Math.random(),
        r:  Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.00015,
        vy: (Math.random() - 0.5) * 0.00015,
        a:  Math.random() * 0.45 + 0.15
      };
    });

    const heroSection = $('#hero');
    if (heroSection) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(heroSection);
    }

    (function tick() {
      requestAnimationFrame(tick);
      if (!heroVisible || !cw) return;
      hctx.clearRect(0, 0, cw, ch);
      pts.forEach(function (p) {
        p.x = (p.x + p.vx + 1) % 1;
        p.y = (p.y + p.vy + 1) % 1;
        hctx.beginPath();
        hctx.arc(p.x * cw, p.y * ch, p.r, 0, 6.283);
        hctx.fillStyle = 'rgba(0,229,255,' + p.a + ')';
        hctx.fill();
      });
    })();
  }

})();
