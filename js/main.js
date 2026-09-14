/* Sierra Global Link — interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro / page load ---------- */
  const markLoaded = () => document.body.classList.add('is-loaded');
  if (document.readyState === 'complete') setTimeout(markLoaded, 250);
  else window.addEventListener('load', () => setTimeout(markLoaded, 250), { once: true });
  // Safety net: never leave the curtain up.
  setTimeout(markLoaded, 2200);

  /* ---------- Navigation ---------- */
  const nav = $('#nav');
  const links = $('#navLinks');
  const burger = $('#burger');
  const hero = $('#hero');

  const onScrollNav = () => {
    const threshold = (hero ? hero.offsetHeight : 600) - 90;
    nav.classList.toggle('is-scrolled', window.scrollY > Math.min(threshold, 80));
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  const closeMenu = () => {
    links.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
  };
  burger.addEventListener('click', () => {
    const open = !links.classList.contains('is-open');
    links.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  });
  $$('a', links).forEach((a) => a.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

  // Active section highlighting
  const navAnchors = $$('a[data-nav]', links);
  const sections = navAnchors
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          navAnchors.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            ro.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    revealEls.forEach((el) => ro.observe(el));
  }

  /* ---------- Count-up numbers ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const duration = 1400;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(target * ease(p)).toString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach((el) => (el.textContent = el.dataset.count));
    } else {
      const co = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              runCounter(en.target);
              co.unobserve(en.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => co.observe(el));
    }
  }

  /* ---------- Hero parallax ---------- */
  const heroImg = $('#heroImg');
  if (heroImg && !reduceMotion && window.matchMedia('(min-width: 900px)').matches) {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroImg.style.translate = `0 ${y * 0.18}px`;
      }
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ---------- Dashboard tilt ---------- */
  const dash = $('#dash');
  if (dash && !reduceMotion && window.matchMedia('(pointer: fine) and (min-width: 1000px)').matches) {
    const wrap = dash.parentElement;
    const max = 6;
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      dash.style.transform = `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
    wrap.addEventListener('pointerleave', () => {
      dash.style.transform = '';
    });
  }

  /* ---------- Quote form (front-end only) ---------- */
  const form = $('#quoteForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      $$('[required]', form).forEach((input) => {
        const field = input.closest('.field');
        const ok = input.type === 'email' ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value) : input.value.trim().length > 0;
        field.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        $('.is-invalid input, .is-invalid textarea', form)?.focus();
        return;
      }
      // TODO: connect to a backend / form service (e.g. Formspree, HubSpot, custom API).
      form.classList.add('is-sent');
    });
    $$('input, textarea', form).forEach((input) =>
      input.addEventListener('input', () => input.closest('.field').classList.remove('is-invalid'))
    );
  }

  /* ---------- Misc ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
