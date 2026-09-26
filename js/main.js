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

  /* ---------- Forms (front-end only) ---------- */
  const validators = {
    email: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
    tel: (v) => v.replace(/[^\d]/g, '').length >= 7,
  };
  /* Simple arithmetic challenge (client-side).
     For production, replace with Cloudflare Turnstile or reCAPTCHA and verify the token server-side. */
  const setupCaptcha = (form) => {
    const box = $('[data-captcha]', form);
    if (!box) return { refresh: () => {}, check: () => true };
    const q = $('[data-captcha-q]', box);
    const input = $('input[name="captcha"]', box);
    let answer = 0;
    const refresh = () => {
      const a = 2 + Math.floor(Math.random() * 8);
      const b = 1 + Math.floor(Math.random() * 9);
      const plus = Math.random() > 0.4 || a <= b;
      answer = plus ? a + b : a - b;
      q.textContent = `${a} ${plus ? '+' : '−'} ${b} = ?`;
      input.value = '';
      box.classList.remove('is-invalid');
    };
    $('[data-captcha-refresh]', box).addEventListener('click', refresh);
    refresh();
    return { refresh, check: (v) => Number(v.replace(/\s/g, '')) === answer };
  };

  const bindForm = (form, onSent) => {
    if (!form) return null;
    const captcha = setupCaptcha(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      $$('[required]', form).forEach((input) => {
        const field = input.closest('.field');
        const v = input.value.trim();
        let ok;
        if (input.type === 'checkbox') ok = input.checked;
        else {
          const check = input.name === 'captcha' ? captcha.check : validators[input.type];
          ok = v.length > 0 && (!check || check(v));
        }
        field.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        $('.is-invalid input, .is-invalid textarea, .is-invalid select', form)?.focus();
        return;
      }
      // TODO: connect to a backend / form service (e.g. Formspree, HubSpot, custom API).
      form.classList.add('is-sent');
      if (onSent) onSent();
    });
    $$('input, textarea, select', form).forEach((input) => {
      const clear = () => input.closest('.field').classList.remove('is-invalid');
      input.addEventListener('input', clear);
      input.addEventListener('change', clear);
    });
    return captcha;
  };
  bindForm($('#quoteForm'));

  /* ---------- Get a Quote modal ---------- */
  const modal = $('#quoteModal');
  if (modal) {
    const modalForm = $('#quoteModalForm', modal);
    let lastFocus = null;
    let modalCaptcha = null;

    const openModal = (trigger) => {
      if (modal.open) return;
      lastFocus = trigger || document.activeElement;
      if (links?.classList.contains('is-open')) closeMenu();
      modal.classList.remove('is-closing');
      modalCaptcha?.refresh();
      modal.showModal();
      document.body.classList.add('modal-open');
      // Focus the first field only on desktop — on phones the keyboard would cover the sheet.
      if (window.matchMedia('(min-width: 901px)').matches) {
        setTimeout(() => $('input, select, textarea', modalForm)?.focus({ preventScroll: true }), 350);
      }
    };
    const closeModal = () => {
      if (!modal.open || modal.classList.contains('is-closing')) return;
      if (reduceMotion) return modal.close();
      modal.classList.add('is-closing');
      const panel = $('.modal__panel', modal);
      const finish = () => {
        modal.classList.remove('is-closing');
        modal.close();
      };
      panel.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, 400); // safety net
    };

    // Native ESC / cancel: play the exit animation instead of snapping shut.
    modal.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeModal();
    });
    modal.addEventListener('close', () => {
      modal.classList.remove('is-closing');
      document.body.classList.remove('modal-open');
      if (modalForm.classList.contains('is-sent')) {
        modalForm.reset();
        modalForm.classList.remove('is-sent');
      }
      lastFocus?.focus?.({ preventScroll: true });
    });

    // Backdrop click closes; clicks inside the panel don't.
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    $$('[data-quote-close]', modal).forEach((b) => b.addEventListener('click', closeModal));
    $$('[data-quote]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(b);
      })
    );

    modalCaptcha = bindForm(modalForm, () => setTimeout(closeModal, 3200));
  }

  /* ---------- Cookie consent ---------- */
  const cookie = $('#cookie');
  if (cookie) {
    const KEY = 'sgl-cookie-consent';
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch {}
    if (!stored) {
      cookie.hidden = false;
      setTimeout(() => cookie.classList.add('is-visible'), 1600);
    }
    $$('[data-cookie]', cookie).forEach((b) =>
      b.addEventListener('click', () => {
        const choice = b.dataset.cookie;
        try { localStorage.setItem(KEY, choice); } catch {}
        document.cookie = `sgl_consent=${choice}; max-age=${60 * 60 * 24 * 180}; path=/; SameSite=Lax`;
        cookie.classList.remove('is-visible');
        setTimeout(() => (cookie.hidden = true), 500);
        // TODO: initialise analytics here when choice === 'all'.
      })
    );
  }

  /* ---------- Misc ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
