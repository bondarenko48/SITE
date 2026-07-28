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
    burger.setAttribute('aria-expanded', String(open));
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

    // Update <html lang> for screen readers and search engines
    document.documentElement.lang = lang === 'ua' ? 'uk' : 'pl';

    // Update button states
    langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));

    // Update all elements with data-pl / data-ua
    // Use innerHTML for elements whose attributes may contain HTML tags (links etc.)
    $$('[data-pl]').forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text === null) return;
      if (text.includes('<')) {
        el.innerHTML = text;
      } else {
        el.textContent = text;
      }
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
      $$('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
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
     CONTACT FORM — real submission via Formspree
     CONFIGURE: Sign up at formspree.io, create a form and replace CONFIGURE_ME
     with your form ID (also update the form action attribute in index.html)
     ══════════════════════════════════════ */
  const form = $('#contactForm');
  const FORM_ENDPOINT = form ? form.getAttribute('action') : '';

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const success = $('#formSuccess');
      const errorEl = $('#formError');

      // Validate required fields
      const inputs = $$('.form-inp', form);
      let valid = true;
      inputs.forEach(inp => {
        inp.style.borderColor = '';
        if (inp.required && !inp.value.trim()) {
          inp.style.borderColor = '#EF4444';
          valid = false;
        }
      });

      // Validate consent checkbox
      const consent = $('#form-consent');
      if (consent && !consent.checked) {
        consent.closest('.form-consent').style.outline = '1.5px solid #EF4444';
        valid = false;
      } else if (consent) {
        consent.closest('.form-consent').style.outline = '';
      }

      if (!valid) return;

      const btn = $('button[type="submit"]', form);
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = currentLang === 'ua' ? 'Надсилаємо...' : 'Wysyłamy...';
      if (success) success.hidden = true;
      if (errorEl) errorEl.hidden = true;

      if (!FORM_ENDPOINT || FORM_ENDPOINT.includes('CONFIGURE_ME')) {
        console.warn('ADVERONI: Form endpoint not configured. Set your Formspree ID in index.html form action.');
        btn.disabled = false;
        btn.textContent = origText;
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = errorEl.getAttribute(`data-${currentLang}`) || errorEl.getAttribute('data-pl');
        }
        return;
      }

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          if (typeof gtag === 'function') gtag('event', 'contact_form_submit', { event_category: 'form' });
          form.reset();
          window.location.href = 'thank-you.html';
          if (success) {
            success.hidden = false;
            success.textContent = success.getAttribute(`data-${currentLang}`) || success.getAttribute('data-pl');
            setTimeout(() => { success.hidden = true; }, 6000);
          }
        } else {
          throw new Error('Server error ' + res.status);
        }
      } catch (_) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = errorEl.getAttribute(`data-${currentLang}`) || errorEl.getAttribute('data-pl');
          setTimeout(() => { errorEl.hidden = true; }, 6000);
        }
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
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
     COOKIE CONSENT BANNER
     ══════════════════════════════════════ */
  const cookieBanner = $('#cookieBanner');
  const cookieAccept = $('#cookieAccept');
  const cookieReject = $('#cookieReject');

  function hideCookie() {
    if (cookieBanner) cookieBanner.classList.add('hidden');
  }

  try {
    const saved = localStorage.getItem('adv-cookie');
    if (!saved && cookieBanner) {
      setTimeout(() => cookieBanner.classList.remove('hidden'), 1200);
    }
  } catch (_) {}

  if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
      try { localStorage.setItem('adv-cookie', 'accepted'); } catch (_) {}
      hideCookie();
      if (window.dataLayer) window.dataLayer.push({ event: 'cookie_consent_accepted' });
    });
  }
  if (cookieReject) {
    cookieReject.addEventListener('click', () => {
      try { localStorage.setItem('adv-cookie', 'rejected'); } catch (_) {}
      hideCookie();
    });
  }

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

  /* ══════════════════════════════════════
     SCROLL SPY — active nav link
     ══════════════════════════════════════ */
  const sections = $$('section[id]');
  const navLinks = $$('.nav__link[href^="#"]');

  const spyObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = navLinks.find(l => l.getAttribute('href') === '#' + entry.target.id);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => spyObs.observe(s));

  /* ══════════════════════════════════════
     HERO ORB — 3D wireframe animated blob
     ══════════════════════════════════════ */
  const blobCanvas = document.getElementById('heroBlobCanvas');
  if (blobCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const bctx = blobCanvas.getContext('2d');
    let bW, bH, bCx, bCy, bR, bT0 = 0, bVisible = true;

    function bResize() {
      const p = blobCanvas.parentElement;
      bW = blobCanvas.width  = p.offsetWidth  || 460;
      bH = blobCanvas.height = p.offsetHeight || 460;
      bCx = bW * .5;
      bCy = bH * .5;
      bR  = Math.min(bW, bH) * .36;
    }
    bResize();
    window.addEventListener('resize', bResize, { passive: true });
    new IntersectionObserver(e => { bVisible = e[0].isIntersecting; }, { threshold: 0 })
      .observe(blobCanvas);

    const bCosTX = Math.cos(.26), bSinTX = Math.sin(.26);

    function blobDeform(phi, theta, t) {
      return bR * (1
        + .055 * Math.sin(2 * phi  + .65 * t)
        + .040 * Math.sin(3 * theta - .50 * t)
        + .030 * Math.cos(2 * theta + phi + .42 * t)
        + .022 * Math.sin(phi - 2 * theta + .28 * t)
      );
    }

    function bProj(phi, theta, t) {
      const r  = blobDeform(phi, theta, t);
      const ry = .20 * t;
      const cY = Math.cos(ry), sY = Math.sin(ry);
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.cos(phi);
      const sz = r * Math.sin(phi) * Math.sin(theta);
      const x1 =  sx * cY + sz * sY;
      const z1 = -sx * sY + sz * cY;
      const y2 = sy * bCosTX - z1 * bSinTX;
      const z2 = sy * bSinTX + z1 * bCosTX;
      return [bCx + x1, bCy - y2, z2];
    }

    const bLATS = 7, bLONS = 10, bSTEPS = 36, bBINS = 6;

    function bDraw(ts) {
      if (!bT0) bT0 = ts;
      const t = (ts - bT0) * .001;

      bctx.clearRect(0, 0, bW, bH);

      // Outer violet atmosphere
      const g1 = bctx.createRadialGradient(bCx, bCy, bR * .1, bCx, bCy, bR * 1.8);
      g1.addColorStop(0,   'rgba(139,92,246,.06)');
      g1.addColorStop(.55, 'rgba(99,102,241,.03)');
      g1.addColorStop(1,   'rgba(139,92,246,0)');
      bctx.fillStyle = g1; bctx.fillRect(0, 0, bW, bH);

      // Mid blue glow
      const g2 = bctx.createRadialGradient(bCx, bCy, 0, bCx, bCy, bR * 1.25);
      g2.addColorStop(0,   'rgba(34,116,255,.20)');
      g2.addColorStop(.5,  'rgba(34,116,255,.06)');
      g2.addColorStop(1,   'rgba(34,116,255,0)');
      bctx.fillStyle = g2; bctx.fillRect(0, 0, bW, bH);

      // Pulsing inner cyan
      const pulse = .10 + .04 * Math.sin(t * 1.1);
      const g3 = bctx.createRadialGradient(bCx, bCy, 0, bCx, bCy, bR * .58);
      g3.addColorStop(0,  `rgba(0,229,255,${pulse + .12})`);
      g3.addColorStop(.5, `rgba(0,229,255,${pulse})`);
      g3.addColorStop(1,  'rgba(0,229,255,0)');
      bctx.fillStyle = g3; bctx.fillRect(0, 0, bW, bH);

      // Build wire segments into depth bins (back→front)
      const bins = Array.from({length: bBINS}, () => []);

      function bSeg(p1, p2) {
        const dz = (p1[2] + p2[2]) * .5;
        const d  = Math.max(0, Math.min(.999, (dz + bR) / (2 * bR)));
        bins[Math.floor(d * bBINS)].push(p1[0], p1[1], p2[0], p2[1]);
      }

      // Latitude circles
      for (let li = 1; li < bLATS; li++) {
        const phi = (li / bLATS) * Math.PI;
        let prev = bProj(phi, 0, t);
        for (let si = 1; si <= bSTEPS; si++) {
          const cur = bProj(phi, (si / bSTEPS) * Math.PI * 2, t);
          bSeg(prev, cur); prev = cur;
        }
      }
      // Longitude arcs
      for (let li = 0; li < bLONS; li++) {
        const theta = (li / bLONS) * Math.PI * 2;
        let prev = bProj(0, theta, t);
        for (let si = 1; si <= bSTEPS; si++) {
          const cur = bProj((si / bSTEPS) * Math.PI, theta, t);
          bSeg(prev, cur); prev = cur;
        }
      }

      // Draw bins — colour: indigo (back) → cyan (front)
      for (let bi = 0; bi < bBINS; bi++) {
        const segs = bins[bi];
        if (!segs.length) continue;
        const d = (bi + .5) / bBINS;
        const cR = Math.round(99  * (1 - d));
        const cG = Math.round(102 + 127 * d);
        const cB = Math.round(241 + 14  * d);
        bctx.strokeStyle = `rgba(${cR},${cG},${cB},${.06 + d * .70})`;
        bctx.lineWidth   = .45 + d * .75;
        bctx.beginPath();
        for (let i = 0; i < segs.length; i += 4) {
          bctx.moveTo(segs[i], segs[i + 1]);
          bctx.lineTo(segs[i + 2], segs[i + 3]);
        }
        bctx.stroke();
      }

      // Bright equator ring
      const eqA = .30 + .09 * Math.sin(t * .85);
      bctx.strokeStyle = `rgba(0,229,255,${eqA})`;
      bctx.lineWidth = 1.1;
      bctx.beginPath();
      let ep = bProj(Math.PI * .5, 0, t);
      bctx.moveTo(ep[0], ep[1]);
      for (let es = 1; es <= bSTEPS * 2; es++) {
        const ep2 = bProj(Math.PI * .5, (es / (bSTEPS * 2)) * Math.PI * 2, t);
        bctx.lineTo(ep2[0], ep2[1]);
      }
      bctx.stroke();

      // Cyan orbital particles (inner ring)
      for (let pi = 0; pi < 18; pi++) {
        const a   = (pi / 18) * Math.PI * 2 + t * .32;
        const orb = bR * (1.07 + .13 * Math.sin(pi * 1.41 + t * .44));
        bctx.beginPath();
        bctx.arc(
          bCx + orb * Math.cos(a),
          bCy + orb * Math.sin(a) * .58,
          .7 + .5 * Math.sin(pi * 2.15 + t * .65),
          0, 6.283
        );
        bctx.fillStyle = `rgba(0,229,255,${.28 + .18 * Math.sin(pi * 1.83 + t * .5)})`;
        bctx.fill();
      }

      // Violet particles (outer ring, counter-rotating)
      for (let vi = 0; vi < 7; vi++) {
        const a   = (vi / 7) * Math.PI * 2 - t * .18;
        const orb = bR * (1.28 + .09 * Math.sin(vi * 2.3 + t * .3));
        bctx.beginPath();
        bctx.arc(
          bCx + orb * Math.cos(a),
          bCy + orb * Math.sin(a) * .60,
          1.1 + .45 * Math.sin(vi * 1.6 + t * .5),
          0, 6.283
        );
        bctx.fillStyle = `rgba(139,92,246,${.20 + .12 * Math.sin(vi * 1.9 + t * .4)})`;
        bctx.fill();
      }

      // Core glow
      const cA = .18 + .06 * Math.sin(t * 1.4);
      const gc = bctx.createRadialGradient(bCx, bCy, 0, bCx, bCy, bR * .32);
      gc.addColorStop(0,   `rgba(210,235,255,${cA + .18})`);
      gc.addColorStop(.35, `rgba(96,165,250,${cA})`);
      gc.addColorStop(1,   'rgba(34,116,255,0)');
      bctx.fillStyle = gc;
      bctx.beginPath(); bctx.arc(bCx, bCy, bR * .32, 0, 6.283); bctx.fill();
    }

    function bTick(ts) {
      requestAnimationFrame(bTick);
      if (!bVisible) return;
      bDraw(ts);
    }
    requestAnimationFrame(bTick);
  }

  /* ══════════════════════════════════════
     GA4 EVENT TRACKING
     ══════════════════════════════════════ */
  function fireGA(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params || {});
    }
  }

  // WhatsApp clicks
  $$('a[href^="https://wa.me/"]').forEach(el => {
    el.addEventListener('click', () => fireGA('whatsapp_click', { event_category: 'contact' }));
  });

  // Phone clicks
  $$('a[href^="tel:"]').forEach(el => {
    el.addEventListener('click', () => fireGA('phone_click', { event_category: 'contact' }));
  });

  // Email mailto clicks
  $$('a[href^="mailto:"]').forEach(el => {
    el.addEventListener('click', () => fireGA('email_click', { event_category: 'contact', method: 'mailto' }));
  });

  // Email copy button
  const emailCopyBtn = $('#emailCopyBtn');
  if (emailCopyBtn) {
    emailCopyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('kontakt@adveroni.pl').then(() => {
        emailCopyBtn.textContent = 'E-mail skopiowany';
        emailCopyBtn.classList.add('copied');
        setTimeout(() => {
          emailCopyBtn.textContent = 'Copy e-mail';
          emailCopyBtn.classList.remove('copied');
        }, 2500);
      }).catch(() => {});
      fireGA('email_click', { event_category: 'contact', method: 'copy' });
    });
  }

})();
