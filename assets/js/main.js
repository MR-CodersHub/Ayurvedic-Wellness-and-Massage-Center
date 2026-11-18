/* ============================================================
   AYURVEDA — CORE INTERACTIONS (Vanilla JS, ES6)
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* noop */ } }
  };

  /* ---------- Theme + direction ---------- */
  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    store.set('ay-theme', t);
    $$('.site-header [data-theme-toggle]').forEach(btn => {
      const label = t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      btn.setAttribute('aria-label', label);
      btn.title = label;
    });
  };
  const applyDir = (d) => {
    document.documentElement.setAttribute('dir', d);
    document.documentElement.setAttribute('lang', d === 'rtl' ? 'ar' : 'en');
    store.set('ay-dir', d);
    const label = d === 'ltr' ? 'RTL' : 'LTR';
    $$('.site-header [data-dir-toggle] span').forEach(el => { el.textContent = label; });
    $$('.site-header [data-dir-toggle]').forEach(btn => {
      btn.title = `Switch to ${label}`;
      btn.setAttribute('aria-label', `Switch to ${label}`);
    });
  };
  applyTheme(store.get('ay-theme', 'light'));
  applyDir(store.get('ay-dir', 'ltr'));

  $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    if (!btn.closest('.site-header')) toast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
  }));
  $$('[data-dir-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
    applyDir(next);
    if (!btn.closest('.site-header')) toast(next === 'rtl' ? 'Right-to-left layout enabled' : 'Left-to-right layout enabled');
  }));

  /* ---------- Toast ---------- */
  function toast(msg, type = 'success') {
    let wrap = $('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const el = document.createElement('div');
    el.className = 'toast';
    const color = type === 'error' ? 'var(--terra)' : 'var(--gold-500)';
    const icon = type === 'error'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 4 4L19 6"/></svg>';
    el.innerHTML = `<span class="ico" style="background:${color}">${icon}</span><span>${msg}</span>`;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); el.classList.add('close'); setTimeout(() => el.remove(), 450); }, 3600);
  }
  window.ayToast = toast;

  /* ---------- Header ---------- */
  const header = $('.site-header');
  const onScroll = () => { if (header) header.classList.toggle('scrolled', scrollY > 20); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const drawer = $('.mobile-drawer');
  const openDrawer = () => { drawer?.classList.add('open'); document.body.classList.add('no-scroll'); };
  const closeDrawer = () => { drawer?.classList.remove('open'); document.body.classList.remove('no-scroll'); };
  $$('[data-menu-open]').forEach(b => b.addEventListener('click', openDrawer));
  $$('[data-menu-close]').forEach(b => b.addEventListener('click', closeDrawer));

  $$('.drawer-drop').forEach(btn => btn.addEventListener('click', () => {
    btn.parentElement.classList.toggle('open');
    const icon = $('.drawer-caret', btn);
    if (icon) icon.style.transform = btn.parentElement.classList.contains('open') ? 'rotate(180deg)' : '';
  }));

  /* ---------- Profile menu ---------- */
  const profileMenu = $('.profile-menu');
  if (profileMenu) {
    const toggle = $('[data-profile-toggle]', profileMenu);
    const links = $$('.dropdown a', profileMenu);
    const setOpen = (open) => {
      profileMenu.classList.toggle('open', open);
      if (toggle) toggle.setAttribute('aria-expanded', String(open));
    };
    toggle?.addEventListener('click', e => { e.stopPropagation(); setOpen(!profileMenu.classList.contains('open')); });
    document.addEventListener('click', e => { if (!profileMenu.contains(e.target)) setOpen(false); });
    document.addEventListener('focusin', e => { if (profileMenu.classList.contains('open') && !profileMenu.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && profileMenu.classList.contains('open')) { setOpen(false); toggle?.focus(); }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && document.activeElement === toggle) {
        e.preventDefault(); setOpen(true);
        (e.key === 'ArrowDown' ? links[0] : links[links.length - 1])?.focus();
      }
    });
    links.forEach(link => link.addEventListener('click', () => setOpen(false)));
  }

  /* ---------- Reveal ---------- */
  const revealObs = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;
  const initReveal = () => $$('.reveal:not(.in)').forEach(el => revealObs ? revealObs.observe(el) : el.classList.add('in'));
  initReveal();

  /* ---------- Counters ---------- */
  const counters = $$('[data-count]');
  if (counters.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target, target = +el.dataset.count, dur = 1600, start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + (el.dataset.suffix || '');
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick); obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
  }

  /* ---------- Hero slider ---------- */
  const slides = $$('.hero-slide');
  if (slides.length > 1) {
    let idx = 0, timer;
    const show = (i) => {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('active', n === idx));
      $$('.hero-dot').forEach((d, n) => d.classList.toggle('active', n === idx));
    };
    const start = () => { timer = setInterval(() => show(idx + 1), 6500); };
    const stop = () => clearInterval(timer);
    show(0); start();
    $$('.hero-dot').forEach((d, i) => d.addEventListener('click', () => { stop(); show(i); start(); }));
    $$('[data-hero-next]').forEach(b => b.addEventListener('click', () => { stop(); show(idx + 1); start(); }));
    $$('[data-hero-prev]').forEach(b => b.addEventListener('click', () => { stop(); show(idx - 1); start(); }));
  } else if (slides.length) slides[0].classList.add('active');

  /* ---------- Accordion ---------- */
  $$('.accordion-head').forEach(head => head.addEventListener('click', () => {
    const item = head.parentElement;
    const wasOpen = item.classList.contains('open');
    $$('.accordion-item.open').forEach(i => { i.classList.remove('open'); $('.accordion-body', i).style.maxHeight = null; });
    if (!wasOpen) { item.classList.add('open'); const body = $('.accordion-body', item); body.style.maxHeight = body.scrollHeight + 'px'; }
  }));

  /* ---------- Tabs & filters ---------- */
  $$('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    const group = btn.closest('.tabs')?.dataset.tabs;
    const wrap = group ? document.getElementById(group) : btn.parentElement.parentElement;
    if (!wrap) return;
    $$('.tab-btn', wrap).forEach(b => b.classList.toggle('active', b === btn));
    $$('.tab-panel', wrap).forEach(p => p.classList.toggle('active', p.dataset.panel === btn.dataset.tab));
    initReveal();
  }));
  $$('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    const wrap = btn.closest('[data-filter-group]');
    if (!wrap) return;
    $$('[data-filter]', wrap).forEach(b => b.classList.toggle('active', b === btn));
    const f = btn.dataset.filter;
    $$('[data-cat]', wrap).forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.style.display = show ? '' : 'none';
      if (show) card.classList.add('in');
    });
  }));

  /* ---------- Back to top ---------- */
  const toTop = $('.to-top');
  if (toTop) {
    addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 500), { passive: true });
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Forms ---------- */
  const validators = {
    required: v => v.trim().length > 0,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: v => /^[\d\s+\-()]{7,20}$/.test(v.trim()),
    min: (v, n) => v.trim().length >= n,
    match: (v, sel) => { const other = sel && $(sel); return !!other && v.trim() === other.value.trim(); }
  };
  window.ayValidators = validators;
  $$('form[data-validate]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[data-rule]', form).forEach(input => {
      const rules = input.dataset.rule.split('|');
      let valid = true;
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (rules.includes('required') && !input.checked) valid = false;
      } else if (!input.value.trim() && !rules.includes('required')) {
        valid = true;
      } else {
        rules.forEach(rule => {
          const [name, arg] = rule.split(':');
          if (validators[name] && !validators[name](input.value, arg)) valid = false;
        });
      }
      const field = input.closest('.field');
      field?.classList.toggle('invalid', !valid);
      input.setAttribute('aria-invalid', String(!valid));
      if (!valid) ok = false;
    });
    if (!ok) { toast('Please check the highlighted fields', 'error'); return; }
    const btn = $('button[type="submit"]', form);
    if (btn) { const original = btn.innerHTML; btn.disabled = true; btn.innerHTML = 'Sending…'; setTimeout(() => { btn.disabled = false; btn.innerHTML = original; form.reset(); toast('Thank you — we will be in touch shortly.'); }, 900); }
  }));

  $$('[data-newsletter]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('input', form);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { toast('Please enter a valid email', 'error'); return; }
    input.value = ''; toast('You are on the wellness list.');
  }));

  /* ---------- Image fallback (never a broken image) ---------- */
  const fallback = (el) => {
    if (el.dataset.fallbackApplied) return;
    el.dataset.fallbackApplied = '1';
    const seed = (el.dataset.seed || el.src || 'ay').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="hsl(${seed},22%,32%)"/><stop offset="1" stop-color="hsl(${(seed + 40) % 360},26%,58%)"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/><circle cx="400" cy="400" r="210" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/><circle cx="400" cy="400" r="150" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2"/><path d="M400 250c60 70 60 230 0 300-60-70-60-230 0-300z" fill="rgba(255,255,255,.1)"/></svg>`;
    el.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };
  $$('img').forEach(img => { img.addEventListener('error', () => fallback(img)); if (img.complete && img.naturalWidth === 0) fallback(img); });

  /* ---------- Booking wizard ---------- */
  const wizard = $('#booking-modal');
  let wizardState = { therapy: '', date: '', time: '', therapist: '' };
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let calMonth = new Date().getMonth(), calYear = new Date().getFullYear();

  function buildCalendar() {
    const grid = $('#cal-grid'); if (!grid) return;
    const first = new Date(calYear, calMonth, 1).getDay();
    const days = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    let html = ['S','M','T','W','T','F','S'].map(d => `<div class="cal-dow">${d}</div>`).join('');
    for (let i = 0; i < first; i++) html += '<div></div>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(calYear, calMonth, d);
      const disabled = date < today || date.getDay() === 0;
      const iso = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const sel = wizardState.date === iso ? 'selected' : '';
      const todayCls = date.getTime() === today.getTime() ? 'today' : '';
      html += `<div class="cal-day ${disabled ? 'disabled' : ''} ${sel} ${todayCls}" data-date="${iso}">${d}</div>`;
    }
    grid.innerHTML = html;
    $('#cal-title').textContent = `${months[calMonth]} ${calYear}`;
    $$('.cal-day:not(.disabled)', grid).forEach(day => day.addEventListener('click', () => {
      $$('.cal-day', grid).forEach(x => x.classList.remove('selected'));
      day.classList.add('selected'); wizardState.date = day.dataset.date;
      $('#book-next').disabled = false;
    }));
  }
  function selectOpt(group, value) {
    $$(`[data-${group}]`).forEach(el => el.classList.toggle('selected', el.dataset[group] === value));
    wizardState[group] = value;
  }
  function openWizard(therapy = '') {
    if (!wizard) return;
    wizardState = { therapy, date: '', time: '', therapist: '' };
    calMonth = new Date().getMonth(); calYear = new Date().getFullYear();
    goStep(0); buildCalendar();
    wizard.classList.add('open'); document.body.classList.add('no-scroll');
  }
  function closeWizard() { wizard?.classList.remove('open'); document.body.classList.remove('no-scroll'); }
  function goStep(step) {
    $$('.wizard-step').forEach((s, i) => s.classList.toggle('active', i === step));
    $$('.step-dot').forEach((d, i) => d.classList.toggle('active', i <= step));
    const prev = $('#book-prev'), next = $('#book-next');
    if (prev) prev.style.visibility = step === 0 ? 'hidden' : 'visible';
    if (next) next.textContent = step === 3 ? 'Confirm booking' : 'Continue';
    if (step === 3) {
      const t = $$('[data-therapy].selected')[0]?.dataset.therapy || wizardState.therapy;
      $('#summary-therapy').textContent = t || '—';
      $('#summary-date').textContent = wizardState.date || '—';
      $('#summary-time').textContent = wizardState.time || '—';
      $('#summary-therapist').textContent = wizardState.therapist || 'Any available therapist';
    }
  }
  window.ayOpenBooking = openWizard;
  $$('[data-book]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openWizard(b.dataset.book || ''); }));
  if (wizard) {
    $('.modal-backdrop', wizard).addEventListener('click', closeWizard);
    $('.modal-close', wizard).addEventListener('click', closeWizard);
    addEventListener('keydown', e => { if (e.key === 'Escape') closeWizard(); });
    $$('[data-therapy]').forEach(el => el.addEventListener('click', () => selectOpt('therapy', el.dataset.therapy)));
    $$('[data-therapist]').forEach(el => el.addEventListener('click', () => selectOpt('therapist', el.dataset.therapist)));
    $$('[data-time]').forEach(el => el.addEventListener('click', () => {
      $$('[data-time]').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected'); wizardState.time = el.dataset.time;
    }));
    $('#cal-prev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } buildCalendar(); });
    $('#cal-next').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } buildCalendar(); });
    $('#book-prev').addEventListener('click', () => goStep(Math.max(0, $$('.wizard-step.active')[0] ? [...$$('.wizard-step')].indexOf($('.wizard-step.active')) - 1 : 0)));
    $('#book-next').addEventListener('click', () => {
      const step = $$('.wizard-step').indexOf($('.wizard-step.active'));
      if (step === 0 && !wizardState.therapy) { toast('Please choose a therapy', 'error'); return; }
      if (step === 1 && (!wizardState.date || !wizardState.time)) { toast('Choose a date and time', 'error'); return; }
      if (step < 3) goStep(step + 1);
      else {
        closeWizard();
        toast('Booking confirmed — check your dashboard for details.');
        const h = $('#upcoming-list');
        if (h) h.insertAdjacentHTML('afterbegin', `<div class="appt-item reveal in"><div class="appt-date"><b>${wizardState.date.slice(8)}</b><span>${months[+wizardState.date.slice(5,7)-1].slice(0,3)}</span></div><div class="appt-info"><b>${wizardState.therapy}</b><span>${wizardState.time} · ${wizardState.therapist || 'Therapist to be assigned'}</span></div><span class="badge green dot">Confirmed</span></div>`);
      }
    });
  }

  /* ---------- Utility: reveal newly injected ---------- */
  window.ayReveal = initReveal;
})();
