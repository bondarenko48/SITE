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
      navigator.clipboard.writeText('hola@adveroni.pl').then(() => {
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
