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
    const tabs = btn.closest('.tabs');
    const group = tabs?.dataset.tabs;
    const wrap = group ? document.getElementById(group) : (tabs?.parentElement || btn.parentElement.parentElement);
    if (!wrap) return;
    $$('.tab-btn', tabs || document).forEach(b => b.classList.toggle('active', b === btn));
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

  const therapyDetails = {
    abhyanga: {
      name: 'Abhyanga',
      eyebrow: 'Signature full-body ritual',
      title: 'Abhyanga — the embrace of warm herbal oil.',
      meta: 'Discover Abhyanga — a 90-minute warm herbal oil massage that calms the nervous system, nourishes tissue and restores natural balance.',
      lead: 'A deeply restorative full-body massage that follows the body’s energy channels, nourishes the tissues and invites the nervous system into rest.',
      image: '1600334129128-685c5582fd35',
      detailImage: '1544367567-0f2fcb009e0b',
      sectionTitle: 'More than a massage.',
      intro: 'In Sanskrit, abhyanga means “oil massage.” But this ritual is far more than the word suggests. Warm herb-infused oil is applied with long, rhythmic strokes that move with the body’s natural flow — soothing the nervous system while renewing the skin and tissues.',
      note: 'Your therapist adjusts pressure, oil and rhythm to your constitution. The result is a session that feels both deeply relaxing and remarkably revitalizing.',
      benefits: ['Relieves tension', 'Improves sleep', 'Boosts circulation', 'Softens skin', 'Calms the mind', 'Supports lymphatic flow'],
      duration: '90 minutes', oils: '4 oils', doshas: 'Vata & Pitta', price: '₹4,800',
      process: [
        ['Consultation & assessment', 'We begin with a conversation about your constitution, tension patterns and the outcome you want from the session.'],
        ['Oil selection', 'Your therapist warms a freshly blended oil chosen for your dosha — sesame, coconut, almond or a herbal infusion.'],
        ['The full-body ritual', 'Long, synchronized strokes move from head to toe, with focused attention on joints, marma points and areas of holding.'],
        ['Rest & integration', 'You are given quiet time to rest, followed by herbal tea and simple aftercare guidance to extend the benefits.']
      ],
      ingredientsTitle: 'Oils blended with intention.',
      ingredientsLead: 'We press and infuse our oils in small batches. Nothing is mass-produced, and nothing is chosen without regard for your constitution.',
      ingredients: [
        ['Sesame & Ashwagandha', 'Grounding and warm — ideal for Vata imbalance, dryness and restless sleep.'],
        ['Coconut & Brahmi', 'Cooling and calming — chosen for Pitta heat, sensitivity and mental fatigue.'],
        ['Almond & Turmeric', 'Nourishing and brightening — supports tissue health and a luminous complexion.'],
        ['Neem & Sandalwood', 'Purifying and soothing — used for Kapha congestion and stressed skin.']
      ],
      faq: [
        ['Is Abhyanga suitable for everyone?', 'Most people benefit greatly. We adjust the oil and pressure for pregnancy, sensitive skin and medical considerations — please tell us your details at booking.'],
        ['How often should I have an Abhyanga?', 'Monthly is a wonderful starting rhythm. Weekly or fortnightly sessions are common during periods of stress or transition.'],
        ['What should I wear?', 'You will be draped throughout. Disposable linen and a private changing space are provided.'],
        ['Can I combine it with Shirodhara?', 'Yes — our Golden Hour ritual pairs the two for a more extended experience.']
      ],
      ctaTitle: 'Let this ritual find you.',
      ctaText: 'Book your Abhyanga session and choose your preferred healer and time.'
    },
    shirodhara: {
      name: 'Shirodhara',
      eyebrow: 'Signature oil-pouring ritual',
      title: 'Shirodhara — the stillness of warm oil.',
      meta: 'Discover Shirodhara — a 75-minute warm oil pouring ritual that quietens the mind, eases tension and restores deep rest.',
      lead: 'A gentle stream of warm herbal oil flows across the forehead, quietening mental chatter and guiding the senses into profound stillness.',
      image: '1596755389378-c31d21fd1273',
      detailImage: '1596755389378-c31d21fd1273',
      sectionTitle: 'A stream of stillness.',
      intro: 'Shirodhara means “flowing oil.” Warm oil is poured in a continuous, delicate line over the third eye, melting away mental fatigue and inviting the nervous system into a slower rhythm.',
      note: 'The rhythm is adjusted to your breath and sensitivity. Many guests describe the experience as a gentle reset for a restless mind.',
      benefits: ['Calms mental chatter', 'Eases head tension', 'Improves sleep', 'Supports focus', 'Balances Vata', 'Soothes the senses'],
      duration: '75 minutes', oils: 'Warm herbal oil', doshas: 'Vata & Pitta', price: '₹5,400',
      process: [
        ['Consultation & assessment', 'We discuss sleep, stress and any head or neck tension before choosing the oil and flow.'],
        ['Oil warming', 'Sesame or coconut oil is warmed gently and blended with calming herbs for your constitution.'],
        ['The oil stream', 'A steady, delicate stream flows across the forehead while you rest in stillness.'],
        ['Quiet integration', 'You are given time to rest, followed by herbal tea and simple aftercare notes.']
      ],
      ingredientsTitle: 'Oils chosen for calm.',
      ingredientsLead: 'Every oil is selected for its ability to settle the mind without dulling the senses.',
      ingredients: [
        ['Sesame & Brahmi', 'Warm and grounding — supports deep sleep and a quiet mind.'],
        ['Coconut & Rose', 'Cooling and soothing — ideal for heat, sensitivity and irritability.'],
        ['Almond & Jatamansi', 'Nourishing and restorative — used for mental fatigue.'],
        ['Neem & Sandalwood', 'Purifying and calming — eases tension and stressed skin.']
      ],
      faq: [
        ['Is Shirodhara suitable for everyone?', 'Most people benefit. We adjust the temperature, flow and oil for sensitivity, pregnancy and medical considerations — please share your details at booking.'],
        ['How often should I have Shirodhara?', 'A single session is deeply restorative. Fortnightly or monthly rituals help maintain calm during demanding periods.'],
        ['Will the oil get into my eyes?', 'The flow is carefully guided across the forehead. You remain draped and comfortable, with a towel positioned for protection.'],
        ['Can I combine it with Abhyanga?', 'Yes — our Golden Hour ritual pairs Abhyanga with Shirodhara for a more extended experience.']
      ],
      ctaTitle: 'Let stillness find you.',
      ctaText: 'Book your Shirodhara session and choose your preferred healer and time.'
    },
    'herbal-steam': {
      name: 'Herbal Steam',
      eyebrow: 'Deep cleansing ritual',
      title: 'Herbal Steam — breathe, soften, release.',
      meta: 'Discover Herbal Steam — a 45-minute herbal steam therapy that opens the skin, clears the senses and releases deep tension.',
      lead: 'Warm herbal vapour opens the pores, eases muscular tightness and leaves the skin refreshed and softly renewed.',
      image: '1515377905703-c4788e51af15',
      detailImage: '1515377905703-c4788e51af15',
      sectionTitle: 'A cleanse you can feel.',
      intro: 'Herbal Steam combines warm vapour with medicinal leaves and oils. The gentle heat encourages circulation, softens tension and supports the body’s natural cleansing process.',
      note: 'Your therapist adjusts the blend and distance of the steam to keep the experience restorative, never overwhelming.',
      benefits: ['Opens the skin', 'Eases muscle tension', 'Clears the senses', 'Supports circulation', 'Softens the skin', 'Encourages rest'],
      duration: '45 minutes', oils: 'Herbal infusion', doshas: 'Kapha & Vata', price: '₹2,900',
      process: [
        ['Consultation & assessment', 'We check your skin sensitivity, breathing and any congestion before choosing the herbal blend.'],
        ['Blend preparation', 'Leaves and oils are steeped in warm water to create a gentle, aromatic vapour.'],
        ['The steam ritual', 'You rest beneath a canopy of warm herbal steam while your therapist guides slow breathing.'],
        ['Cool-down & tea', 'A cool cloth and herbal tea close the ritual, leaving the skin calm and refreshed.']
      ],
      ingredientsTitle: 'Steam with purpose.',
      ingredientsLead: 'Each infusion is chosen for the way it supports skin, breath and balance.',
      ingredients: [
        ['Eucalyptus & Neem', 'Clearing and purifying — supports easy breathing and clear skin.'],
        ['Lavender & Rose', 'Calming and soothing — eases tension and sensitivity.'],
        ['Turmeric & Tulsi', 'Warming and restorative — supports the body’s natural resilience.'],
        ['Sandalwood & Mint', 'Cooling and refreshing — balances heat while gently decongesting.']
      ],
      faq: [
        ['Is Herbal Steam suitable for sensitive skin?', 'We adjust the blend, temperature and distance of the steam. Please tell us about sensitivities at booking.'],
        ['How often should I have a steam session?', 'Monthly is a lovely reset. During seasonal change or congestion, weekly sessions may be recommended.'],
        ['What should I wear?', 'You will be draped comfortably. Disposable linen and a private changing space are provided.'],
        ['Can I combine it with a massage?', 'Yes — Herbal Steam pairs beautifully with Abhyanga or Udvartana for a deeper cleanse.']
      ],
      ctaTitle: 'Let clarity find you.',
      ctaText: 'Book your Herbal Steam session and choose your preferred healer and time.'
    },
    'panchakarma-detox': {
      name: 'Panchakarma Detox',
      eyebrow: 'Rejuvenating detox program',
      title: 'Panchakarma — a guided return to balance.',
      meta: 'Discover Panchakarma Detox — a 120-minute guided purification program that resets digestion and clears accumulated heaviness.',
      lead: 'A carefully guided purification program that resets digestion, clears accumulated heaviness and restores lightness.',
      image: '1556228720-195a672e8a03',
      detailImage: '1618221195710-dd6b41faaea6',
      sectionTitle: 'Reset, gently.',
      intro: 'Panchakarma is a classical Ayurvedic program of preparation, warm oil therapy and gentle elimination. It is designed to clear what no longer serves the body while protecting your strength.',
      note: 'Every step is adapted to your constitution, energy and digestion. Nothing is forced; the pace is always collaborative.',
      benefits: ['Resets digestion', 'Clears heaviness', 'Supports metabolism', 'Restores energy', 'Calms the mind', 'Nourishes tissues'],
      duration: '120 minutes', oils: 'Herbal oils', doshas: 'Kapha & Pitta', price: '₹8,900',
      process: [
        ['Consultation & assessment', 'We map your digestion, energy, sleep and constitution before designing your program.'],
        ['Preparation & oleation', 'Warm oils and gentle therapies loosen accumulated tension and support the cleansing process.'],
        ['Guided detoxification', 'A therapist-led sequence supports elimination while keeping you comfortable and nourished.'],
        ['Rejuvenation & aftercare', 'Herbal tea, simple meals and a clear aftercare plan help you integrate the reset.']
      ],
      ingredientsTitle: 'Supportive by nature.',
      ingredientsLead: 'The oils and herbs are chosen to nourish while they cleanse.',
      ingredients: [
        ['Sesame & Triphala', 'Warm and grounding — supports gentle elimination.'],
        ['Coconut & Neem', 'Cooling and purifying — balances heat and supports skin.'],
        ['Ghee & Ashwagandha', 'Nourishing and restorative — protects strength during reset.'],
        ['Ginger & Tulsi', 'Warming and digestive — kindles a steady metabolic fire.']
      ],
      faq: [
        ['Is Panchakarma suitable for everyone?', 'We tailor the program to your constitution and health history. Please share all medical details at booking so we can adapt it safely.'],
        ['How often should I have a detox?', 'Many guests choose a seasonal reset. Your therapist will recommend a rhythm based on your goals and energy.'],
        ['Will I need to fast?', 'No strict fasting is required. We suggest light, warm meals and will guide you through simple aftercare.'],
        ['Can I combine it with other therapies?', 'Yes — we often pair Panchakarma with Abhyanga or Herbal Steam as part of a wider program.']
      ],
      ctaTitle: 'Let balance find you.',
      ctaText: 'Book your Panchakarma Detox session and choose your preferred healer and time.'
    },
    'marma-therapy': {
      name: 'Marma Therapy',
      eyebrow: 'Energy-point therapy',
      title: 'Marma — release where tension is held.',
      meta: 'Discover Marma Therapy — a 60-minute focused energy-point treatment that releases tension and restores flow.',
      lead: 'Focused work on vital energy points releases deep-seated tension and restores the body’s natural flow of energy.',
      image: '1612817288484-6f916006741a',
      detailImage: '1596462502278-27bfdc403348',
      sectionTitle: 'Stillness at the points.',
      intro: 'Marma therapy works with the body’s vital energy points. Gentle, precise pressure is held at specific sites to release holding, calm the nervous system and renew circulation.',
      note: 'Pressure is always adapted to your sensitivity. The work is quiet, focused and deeply restorative.',
      benefits: ['Releases tension', 'Restores energy flow', 'Calms the nervous system', 'Supports circulation', 'Eases stiffness', 'Improves body awareness'],
      duration: '60 minutes', oils: 'Warm herbal oil', doshas: 'Vata & Kapha', price: '₹4,200',
      process: [
        ['Consultation & assessment', 'We locate areas of holding and discuss where you carry tension.'],
        ['Oil preparation', 'A warm oil is chosen to soften tissue and support steady pressure.'],
        ['Marma work', 'Precise points are held with gentle pressure, moving with your breath and comfort.'],
        ['Integration', 'A short rest and herbal tea help the body settle into the new sense of space.']
      ],
      ingredientsTitle: 'Oils for steady flow.',
      ingredientsLead: 'Blends are chosen to support circulation, warmth and a calm nervous system.',
      ingredients: [
        ['Sesame & Ashwagandha', 'Grounding and warm — supports steady energy.'],
        ['Almond & Turmeric', 'Nourishing and brightening — supports tissue health.'],
        ['Castor & Ginger', 'Warming and mobilising — eases stagnation.'],
        ['Neem & Sandalwood', 'Soothing and cooling — balances sensitive skin.']
      ],
      faq: [
        ['Is Marma Therapy suitable for everyone?', 'Yes, with adaptation. We adjust pressure for sensitivity, pregnancy and medical considerations — please tell us at booking.'],
        ['How often should I have a session?', 'Fortnightly or monthly helps maintain ease. Weekly sessions can be supportive during periods of stress.'],
        ['Is the pressure gentle?', 'Pressure is precise and adapted to your comfort. You can ask your therapist to lighten it at any point.'],
        ['Can I combine it with Abhyanga?', 'Yes — Marma work pairs beautifully with Abhyanga for full-body release.']
      ],
      ctaTitle: 'Let release find you.',
      ctaText: 'Book your Marma Therapy session and choose your preferred healer and time.'
    },
    udvartana: {
      name: 'Udvartana',
      eyebrow: 'Herbal powder massage',
      title: 'Udvartana — awaken the body.',
      meta: 'Discover Udvartana — a 60-minute herbal powder massage that stimulates circulation, supports metabolism and tones the skin.',
      lead: 'A stimulating herbal powder massage that awakens circulation, supports metabolism and leaves the skin toned and refreshed.',
      image: '1570172619644-dfd03ed5d881',
      detailImage: '1620916566398-39f1143ab7be',
      sectionTitle: 'Dry, warm, energising.',
      intro: 'Udvartana uses warm herbal powders applied with firm, rhythmic strokes. The gentle friction supports lymphatic flow, tones the skin and kindles a steady sense of energy.',
      note: 'The pressure is invigorating but never harsh. Your therapist adjusts the pace to your comfort and constitution.',
      benefits: ['Supports metabolism', 'Tones the skin', 'Improves circulation', 'Eases heaviness', 'Supports lymphatic flow', 'Energises the body'],
      duration: '60 minutes', oils: 'Herbal powders', doshas: 'Kapha & Vata', price: '₹3,900',
      process: [
        ['Consultation & assessment', 'We discuss energy, digestion and any areas of heaviness before selecting the powder.'],
        ['Powder preparation', 'Herbal powders are warmed and blended for your constitution.'],
        ['The massage', 'Firm, rhythmic strokes move across the body, awakening circulation and lymphatic flow.'],
        ['Warm finish', 'A warm towel and herbal tea close the session, leaving the body light and toned.']
      ],
      ingredientsTitle: 'Powders with purpose.',
      ingredientsLead: 'Each blend is chosen for its ability to tone, warm and gently stimulate.',
      ingredients: [
        ['Gram & Turmeric', 'Traditional and brightening — supports clear, toned skin.'],
        ['Ginger & Black Pepper', 'Warming and stimulating — kindles circulation.'],
        ['Neem & Tulsi', 'Purifying and balancing — supports skin clarity.'],
        ['Sandalwood & Rose', 'Cooling and soothing — balances warmth and sensitivity.']
      ],
      faq: [
        ['Is Udvartana suitable for sensitive skin?', 'We adjust the powder and pressure for sensitivity. Please tell us about skin conditions at booking.'],
        ['How often should I have Udvartana?', 'Weekly or fortnightly sessions are common when working toward toning and renewed energy.'],
        ['Will the powder feel gritty?', 'The powders are finely milled and warmed. The sensation is gently invigorating, never abrasive.'],
        ['Can I combine it with a massage?', 'Yes — Udvartana pairs well with Abhyanga or Herbal Steam in a wider program.']
      ],
      ctaTitle: 'Let energy find you.',
      ctaText: 'Book your Udvartana session and choose your preferred healer and time.'
    },
    nasya: {
      name: 'Nasya',
      eyebrow: 'Nasal oil therapy',
      title: 'Nasya — clear the senses, calm the mind.',
      meta: 'Discover Nasya — a 30-minute herbal oil therapy that clears the senses, eases congestion and calms the mind.',
      lead: 'Herbal oil drops gently clear the senses, ease congestion and calm the mind in a short, focused ritual.',
      image: '1512290923902-8a9f81dc236c',
      detailImage: '1512290923902-8a9f81dc236c',
      sectionTitle: 'A quiet clarity.',
      intro: 'Nasya is the gentle administration of herbal oil through the nasal passages. It is used to clear congestion, sharpen the senses and settle mental restlessness.',
      note: 'The drops are warm, mild and adjusted to your comfort. The session is brief but deeply clarifying.',
      benefits: ['Clears congestion', 'Sharpens the senses', 'Calms the mind', 'Eases head tension', 'Supports sleep', 'Balances Vata'],
      duration: '30 minutes', oils: 'Herbal oil drops', doshas: 'Vata & Kapha', price: '₹2,400',
      process: [
        ['Consultation & assessment', 'We discuss congestion, sinus comfort and any sensitivity before choosing the oil.'],
        ['Oil warming', 'A gentle herbal oil is warmed to body temperature.'],
        ['The drops', 'A few drops are administered while you rest with your head supported.'],
        ['Rest & guidance', 'A short rest and simple aftercare guidance complete the ritual.']
      ],
      ingredientsTitle: 'Drops with intention.',
      ingredientsLead: 'Only a few drops are needed — each one chosen for clarity and comfort.',
      ingredients: [
        ['Sesame & Tulsi', 'Warming and clearing — supports easy breathing.'],
        ['Coconut & Brahmi', 'Cooling and calming — eases mental restlessness.'],
        ['Almond & Turmeric', 'Nourishing and protective — supports delicate tissue.'],
        ['Neem & Rose', 'Purifying and soothing — balances sensitivity.']
      ],
      faq: [
        ['Is Nasya suitable for everyone?', 'We adjust the oil to your sensitivity and health history. Please share details at booking, especially during pregnancy or illness.'],
        ['How often should I have Nasya?', 'A short course is often recommended during seasonal change or periods of congestion. Your therapist will advise.'],
        ['Will it feel uncomfortable?', 'The drops are warm and mild. Most guests find the sensation gentle and clearing.'],
        ['Can I combine it with Shirodhara?', 'Yes — Nasya pairs beautifully with Shirodhara for head and mind balance.']
      ],
      ctaTitle: 'Let clarity find you.',
      ctaText: 'Book your Nasya session and choose your preferred healer and time.'
    },
    'pada-abhyanga': {
      name: 'Pada Abhyanga',
      eyebrow: 'Grounding foot ritual',
      title: 'Pada Abhyanga — come back to the ground.',
      meta: 'Discover Pada Abhyanga — a 45-minute warm-oil foot ritual that grounds the body, eases fatigue and calms the mind.',
      lead: 'A grounding warm-oil foot massage that settles the body, eases fatigue and draws a busy mind back into the present.',
      image: '1584132967334-10e028bd69f7',
      detailImage: '1584132967334-10e028bd69f7',
      sectionTitle: 'Rooted and restored.',
      intro: 'Pada Abhyanga focuses on the feet and lower legs, where Ayurveda believes much of our grounding begins. Warm oil, steady pressure and gentle movement ease fatigue and invite the whole body to settle.',
      note: 'The rhythm is slow and reassuring — ideal after travel, long days or periods of mental overload.',
      benefits: ['Grounds the body', 'Eases foot fatigue', 'Calms the mind', 'Supports sleep', 'Improves circulation', 'Relieves tension'],
      duration: '45 minutes', oils: 'Warm herbal oil', doshas: 'Vata & Pitta', price: '₹2,800',
      process: [
        ['Consultation & assessment', 'We discuss fatigue, travel and any foot or leg tension before choosing the oil.'],
        ['Oil warming', 'A grounding oil is warmed and prepared for the feet and lower legs.'],
        ['The foot ritual', 'Steady strokes and gentle pressure move through the feet, ankles and calves.'],
        ['Rest & tea', 'A short rest and herbal tea close the grounding experience.']
      ],
      ingredientsTitle: 'Warmth from the ground up.',
      ingredientsLead: 'Blends are chosen to calm, nourish and restore tired feet.',
      ingredients: [
        ['Sesame & Ashwagandha', 'Grounding and warm — eases restlessness.'],
        ['Coconut & Rose', 'Cooling and soothing — balances heat and sensitivity.'],
        ['Almond & Turmeric', 'Nourishing and brightening — supports tired skin.'],
        ['Neem & Sandalwood', 'Purifying and calming — refresh and soften.']
      ],
      faq: [
        ['Is Pada Abhyanga suitable for everyone?', 'Yes. We adjust pressure and oil for sensitivity, pregnancy and medical considerations — please tell us at booking.'],
        ['How often should I have a foot ritual?', 'Weekly or fortnightly sessions are wonderful during busy or travel-heavy periods.'],
        ['What should I wear?', 'Loose, comfortable clothing is ideal. Your feet and lower legs are draped throughout.'],
        ['Can I combine it with Abhyanga?', 'Yes — it makes a gentle addition to a full-body Abhyanga session.']
      ],
      ctaTitle: 'Let grounding find you.',
      ctaText: 'Book your Pada Abhyanga session and choose your preferred healer and time.'
    },
    'sound-oil-ceremony': {
      name: 'Sound & Oil Ceremony',
      eyebrow: 'Ceremonial ritual',
      title: 'Sound & Oil — rest in resonance.',
      meta: 'Discover Sound & Oil Ceremony — a 90-minute ceremonial ritual combining warm oil, sound and stillness for deep restoration.',
      lead: 'Warm oil and gentle sound weave together into a ceremonial ritual that carries the body into deep, resonant rest.',
      image: '1545205597-3d9d02c29597',
      detailImage: '1571902943202-507ec2618e8f',
      sectionTitle: 'Where sound meets stillness.',
      intro: 'This ceremony layers warm oil massage with gentle sound — singing bowls, chimes and silence. Vibrations soften holding while the oil nourishes the tissues, creating a deeply restorative experience.',
      note: 'The soundscape is kept gentle and responsive. Your therapist adjusts the rhythm to your comfort and the pace of your breath.',
      benefits: ['Deepens rest', 'Eases tension', 'Calms the mind', 'Supports emotional balance', 'Improves sleep', 'Restores energy'],
      duration: '90 minutes', oils: 'Warm ceremonial oil', doshas: 'Vata & Pitta', price: '₹6,200',
      process: [
        ['Consultation & assessment', 'We discuss your stress, sleep and sensitivity to sound before shaping the ceremony.'],
        ['Oil & sound preparation', 'A warm oil blend is chosen and the soundscape is prepared for your comfort.'],
        ['The ceremony', 'Oil massage and gentle sound unfold together, moving between touch, tone and stillness.'],
        ['Integration', 'A quiet rest and herbal tea allow the experience to settle.']
      ],
      ingredientsTitle: 'Blends for resonance.',
      ingredientsLead: 'Warm oils and gentle tones are chosen to complement one another.',
      ingredients: [
        ['Sesame & Lavender', 'Grounding and calming — supports deep rest.'],
        ['Coconut & Rose', 'Cooling and soothing — balances heat and sensitivity.'],
        ['Almond & Sandalwood', 'Nourishing and serene — supports a quiet mind.'],
        ['Neem & Tulsi', 'Purifying and clearing — refreshes the senses.']
      ],
      faq: [
        ['Is Sound & Oil Ceremony suitable for everyone?', 'Yes. We keep the sound gentle and can adapt it for sound sensitivity. Please share your preferences at booking.'],
        ['How often should I have this ceremony?', 'Monthly or fortnightly rituals are lovely for maintaining calm and restorative sleep.'],
        ['What kind of sound is used?', 'Gentle singing bowls and chimes, used sparingly and always at a comfortable volume.'],
        ['Can I combine it with Shirodhara?', 'Yes — the ceremony pairs beautifully with Shirodhara for extended stillness.']
      ],
      ctaTitle: 'Let resonance find you.',
      ctaText: 'Book your Sound & Oil Ceremony session and choose your preferred healer and time.'
    }
  };

  function initTherapyDetails() {
    if (!location.pathname.endsWith('therapy-details.html')) return;
    const slug = new URLSearchParams(location.search).get('therapy') || 'abhyanga';
    const data = therapyDetails[slug] || therapyDetails.abhyanga;
    const setText = (selector, value) => { const el = $(selector); if (el && value != null) el.textContent = value; };
    const setImage = (selector, id, alt) => {
      const img = $(selector); if (!img) return;
      img.src = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${selector.includes('hero') ? 1920 : 1200}&q=80`;
      img.alt = alt;
      img.dataset.seed = id;
    };

    document.title = `${data.name} Therapy Detail | Ayurveda Wellness & Massage Center`;
    const desc = $('meta[name="description"]'); if (desc) desc.content = data.meta;
    const ogTitle = $('meta[property="og:title"]'); if (ogTitle) ogTitle.content = `${data.name} Therapy Detail | Ayurveda Wellness`;
    const ogDesc = $('meta[property="og:description"]'); if (ogDesc) ogDesc.content = data.meta;

    setImage('.detail-hero-bg img', data.image, `${data.name} therapy session`);
    setText('.detail-hero .eyebrow', data.eyebrow);
    setText('.detail-hero h1', data.title);
    setText('.detail-hero .lead', data.lead);

    setText('.therapy-section .split-copy .h2', data.sectionTitle);
    setText('.therapy-section .split-copy > p.lead', data.intro);
    setText('.therapy-section .split-copy > p.soft', data.note);
    $$('.benefit-grid .benefit-item').forEach((el, i) => { if (data.benefits[i]) el.lastChild.textContent = ` ${data.benefits[i]}`; });
    $$('.therapy-fact').forEach((el, i) => {
      const values = [[data.duration, 'Session duration'], [data.oils, 'Blended for you'], [data.doshas, 'Balances doshas'], [data.price, 'Per session']];
      if (!values[i]) return;
      const b = $('b', el), s = $('small', el);
      if (b) b.textContent = values[i][0];
      if (s) s.textContent = values[i][1];
    });
    setImage('.therapy-visual .media img', data.detailImage || data.image, `${data.name} therapy session`);

    $$('.process-row').forEach((row, i) => {
      const item = data.process[i]; if (!item) return;
      const h = $('h4', row), p = $('p', row);
      if (h) h.textContent = item[0];
      if (p) p.textContent = item[1];
    });

    setText('.ingredients-section .h2', data.ingredientsTitle);
    setText('.ingredients-section .lead', data.ingredientsLead);
    $$('.ingredients-section .feature-card').forEach((card, i) => {
      const item = data.ingredients[i]; if (!item) return;
      const h = $('h3', card), p = $('p', card);
      if (h) h.textContent = item[0];
      if (p) p.textContent = item[1];
    });

    $$('.booking-faq-section .accordion-item').forEach((item, i) => {
      const qa = data.faq[i]; if (!qa) return;
      const head = $('.accordion-head', item), body = $('.accordion-body p', item);
      if (head && head.firstChild) head.firstChild.textContent = qa[0];
      if (body) body.textContent = qa[1];
    });

    setText('.cta-band h2', data.ctaTitle);
    setText('.cta-band p', data.ctaText);
    $$('[data-book]').forEach(btn => { btn.dataset.book = data.name; });
  }

  function initTherapyCards() {
    if (!location.pathname.endsWith('therapies.html')) return;
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.therapy-card');
      if (!card || e.target.closest('a, button, input, label, select, textarea')) return;
      const href = $('a[href^="therapy-details.html?therapy="]', card)?.getAttribute('href');
      if (href) location.href = href;
    });
  }

  const offer = (img, cat, name, desc, duration, tag, price, book, title, short) => ({ img, cat, name, desc, duration, tag, price, book, title, short });
  const weekDay = (name, time, status, label) => ({ name, time, status, label });
  const clientQuote = (text, img, name, role) => ({ text, img, name, role });
  const focus = (title, text) => ({ title, text });

  const therapistDetails = {
    'ananya-sharma': {
      name: 'Ananya Sharma', role: 'Senior Ayurvedic therapist', specialty: 'Abhyanga · Marma therapy · Panchakarma',
      avatar: '1494790108377-be9c29b29330', heroBg: '1551836022-d5d88e9218df', storyImage: '1522071820081-009f0129c71c',
      years: '14 years', rating: '4.9 / 5', therapies: '3 therapies', languages: 'EN / HI / MAL',
      storyEyebrow: 'Her story', storyTitle: 'A healer guided by listening.',
      intro: 'Ananya began her study of Ayurveda in the old family tradition of Thrissur, learning classical Abhyanga from her grandmother before formal training at the Kerala Ayurveda Academy. Fourteen years later, her hands remain as attentive as ever.',
      note: 'She is known for an extraordinary sensitivity to tension — finding places the body has learned to hide. Her sessions are slow, deliberate and quietly transformative. She believes the best therapy is the one that leaves you feeling more at home in your own skin.',
      credentials: ['Certified Senior Ayurvedic Therapist, Kerala Ayurveda Academy', 'Advanced Marma therapy training, Chennai lineage', 'Panchakarma specialist with hospital-based experience'],
      expertiseEyebrow: 'Where she shines', expertiseTitle: 'Areas of expertise', expertiseLead: 'Ananya tailors her practice to what each guest truly needs.',
      expertise: [focus('Abhyanga', 'Full-body warm oil therapy for deep nourishment and rest.'), focus('Marma therapy', 'Precise work on vital points to release held tension.'), focus('Panchakarma', 'Guided purification for lasting reset and renewal.'), focus('Stress & sleep', 'Grounding rituals for nervous system balance.')],
      weekEyebrow: 'Her week', weekTitle: 'Availability & sessions.', weekLead: 'Ananya’s calendar fills quickly. Reserve your preferred slot in advance, or let us find the next opening that suits you.',
      schedule: [weekDay('Monday', '08:00 – 16:00', 'open', 'Open'), weekDay('Tuesday', '09:00 – 18:00', 'open', 'Open'), weekDay('Wednesday', '08:00 – 16:00', 'open', 'Open'), weekDay('Thursday', '09:00 – 18:00', 'open', 'Open'), weekDay('Friday', '08:00 – 14:00', 'open', 'Open'), weekDay('Saturday', '09:00 – 15:00', 'open', 'Open'), weekDay('Sunday', 'Rest day', 'rest', 'Closed')],
      quoteEyebrow: 'Client words', quoteTitle: 'In capable hands', quoteLead: 'The quiet confidence Ananya brings to every session.',
      quotes: [clientQuote('Ananya found tension I had forgotten I was carrying. The release was immediate and the calm lasted for days.', '1600880292203-757bb62b4baf', 'Ritika Menon', 'Designer, Kochi'), clientQuote('She has a way of making the whole hour feel unhurried and completely yours. I book with her every time I visit.', '1531746020798-e6953c6e8e04', 'Thomas George', 'Writer, Dubai')],
      bookEyebrow: 'Book with Ananya', bookTitle: 'Rituals she offers',
      offerings: [offer('1556229010-6c3f2c9ca5f8', 'Full body', 'Abhyanga', 'Her signature warm-oil ritual for deep rest and renewal.', '90 min', 'Herbal', '₹4,800', 'Abhyanga', 'Abhyanga · 90 min', 'Full-body warm oil ritual'), offer('1612817288484-6f916006741a', 'Energy work', 'Marma Therapy', 'Focused pressure on vital points to restore natural flow.', '60 min', 'Herbal', '₹4,200', 'Marma Therapy', 'Marma therapy · 60 min', 'Focused energy-point work'), offer('1560448204-e02f11c3d0e2', 'Purification', 'Panchakarma Detox', 'A guided program to reset and restore balance.', '120 min', 'Herbal', '₹8,900', 'Panchakarma Detox', 'Panchakarma · 120 min', 'Guided cleansing program')],
      ctaTitle: 'Reserve a session with Ananya.', ctaText: 'Choose your ritual, date and preferred time in a few simple steps.',
      meta: 'Meet Ananya Sharma, senior Ayurvedic therapist specializing in Abhyanga, Marma therapy and Panchakarma. Reserve a personalized session at our wellness center.'
    },
    'rohan-menon': {
      name: 'Rohan Menon', role: 'Detox & herbal specialist', specialty: 'Panchakarma · Herbal medicine · Udvartana',
      avatar: '1552058544-f2b08422138a', heroBg: '1595152452543-e5fc28ebc2b8', storyImage: '1595152452543-e5fc28ebc2b8',
      years: '11 years', rating: '4.9 / 5', therapies: '3 therapies', languages: 'EN / HI / TAM',
      storyEyebrow: 'His story', storyTitle: 'A steady guide to a deeper reset.',
      intro: 'Rohan learned the discipline of Panchakarma in the classical hospitals of Kerala, where cleansing is treated as a careful conversation with the body rather than a quick fix. Eleven years on, he brings that same patience to every program he designs.',
      note: 'He is especially attentive to digestion, sleep and the rhythms that quietly shape wellbeing. His sessions are measured and thoughtful, never rushed — the kind of care that keeps people coming back season after season.',
      credentials: ['Certified Panchakarma therapist, Kerala Ayurveda Academy', 'Advanced herbal medicine training, Thrissur lineage', 'Hospital-based detox program specialist'],
      expertiseEyebrow: 'Where he shines', expertiseTitle: 'Areas of expertise', expertiseLead: 'Rohan shapes each program around the constitution and pace of the person in front of him.',
      expertise: [focus('Panchakarma', 'Guided cleansing programs that restore balance without harshness.'), focus('Herbal medicine', 'Personalised herbal blends to support digestion and renewal.'), focus('Udvartana', 'Herbal powder massage to stimulate circulation and lymphatic flow.'), focus('Digestive reset', 'Gentle rhythms and rituals for a settled, lighter body.')],
      weekEyebrow: 'His week', weekTitle: 'Availability & sessions.', weekLead: 'Rohan’s cleansing programs need a little more planning. Reserve your preferred slot in advance, or let us find the next opening that suits you.',
      schedule: [weekDay('Monday', '09:00 – 18:00', 'open', 'Open'), weekDay('Tuesday', '09:00 – 20:00', 'open', 'Open'), weekDay('Wednesday', '09:00 – 18:00', 'open', 'Open'), weekDay('Thursday', '09:00 – 20:00', 'open', 'Open'), weekDay('Friday', '09:00 – 16:00', 'open', 'Open'), weekDay('Saturday', '10:00 – 17:00', 'open', 'Open'), weekDay('Sunday', 'Rest day', 'rest', 'Closed')],
      quoteEyebrow: 'Client words', quoteTitle: 'In capable hands', quoteLead: 'The steadiness Rohan brings to every session.',
      quotes: [clientQuote('Rohan explained every step of the cleanse and made the whole process feel safe and clear. I came out lighter in body and mind.', '1547425260-76bcadfb4f2c', 'Sneha Krishnan', 'Teacher, Bengaluru'), clientQuote('His herbal blends and calm guidance made a real difference to my digestion and sleep. I finally feel like myself again.', '1521119989659-a83eee488004', 'Daniel Ross', 'Consultant, Chennai')],
      bookEyebrow: 'Book with Rohan', bookTitle: 'Rituals he offers',
      offerings: [offer('1560448204-e02f11c3d0e2', 'Cleanse', 'Panchakarma Detox', 'A guided reset with oils, herbs and close attention to digestion.', '120 min', 'Herbal', '₹8,900', 'Panchakarma Detox', 'Panchakarma · 120 min', 'Guided cleansing program'), offer('1531384441138-2736e62e0919', 'Herbal care', 'Herbal Consultation', 'A focused conversation and a blend chosen for your constitution.', '45 min', 'Personalised', '₹3,200', 'Herbal Consultation', 'Herbal consultation · 45 min', 'Constitution-led herbal guidance'), offer('1595152452543-e5fc28ebc2b8', 'Body work', 'Udvartana', 'Herbal powder massage to stimulate flow and refresh the skin.', '60 min', 'Herbal', '₹4,500', 'Udvartana', 'Udvartana · 60 min', 'Herbal powder massage')],
      ctaTitle: 'Reserve a session with Rohan.', ctaText: 'Choose your ritual, date and preferred time in a few simple steps.',
      meta: 'Meet Rohan Menon, Panchakarma and herbal specialist. Explore his cleansing programs and reserve a personalized session at our wellness center.'
    },
    'meera-iyer': {
      name: 'Meera Iyer', role: 'Shirodhara & meditation therapist', specialty: 'Shirodhara · Meditation · Abhyanga',
      avatar: '1568602471122-7832951cc4c5', heroBg: '1608248543803-ba4f8c70ae0b', storyImage: '1608248543803-ba4f8c70ae0b',
      years: '9 years', rating: '4.9 / 5', therapies: '3 therapies', languages: 'EN / HI / TAM',
      storyEyebrow: 'Her story', storyTitle: 'Stillness, poured slowly.',
      intro: 'Meera came to Shirodhara after years of studying meditation and the nervous system. She sees the steady stream of warm oil as an invitation — a way to give a restless mind something gentle to follow until it finally rests.',
      note: 'Her sessions are quiet and unhurried, with simple breath guidance woven in. Guests often describe the experience as the deepest sleep they have had in years.',
      credentials: ['Certified Shirodhara therapist, Kerala Ayurveda Academy', 'Meditation facilitator, Vipassana tradition', 'Advanced Abhyanga training, Mysore lineage'],
      expertiseEyebrow: 'Where she shines', expertiseTitle: 'Areas of expertise', expertiseLead: 'Meera works gently with the nervous system, giving busy minds a chance to settle.',
      expertise: [focus('Shirodhara', 'A steady stream of warm oil to quiet the mind and invite deep rest.'), focus('Meditation & breath', 'Simple guidance to soften mental chatter and find stillness.'), focus('Stress & sleep', 'Unhurried rituals for exhaustion, restlessness and mental fatigue.'), focus('Abhyanga', 'Warm, rhythmic oil work that grounds the whole body.')],
      weekEyebrow: 'Her week', weekTitle: 'Availability & sessions.', weekLead: 'Meera’s quiet sessions are in high demand. Reserve your preferred slot in advance, or let us find the next opening that suits you.',
      schedule: [weekDay('Monday', '08:00 – 15:00', 'open', 'Open'), weekDay('Tuesday', '10:00 – 18:00', 'open', 'Open'), weekDay('Wednesday', '08:00 – 15:00', 'open', 'Open'), weekDay('Thursday', '10:00 – 18:00', 'open', 'Open'), weekDay('Friday', '08:00 – 14:00', 'open', 'Open'), weekDay('Saturday', '09:00 – 16:00', 'open', 'Open'), weekDay('Sunday', 'Rest day', 'rest', 'Closed')],
      quoteEyebrow: 'Client words', quoteTitle: 'In capable hands', quoteLead: 'The unhurried calm Meera creates in every session.',
      quotes: [clientQuote('The Shirodhara felt like someone finally gave my mind permission to rest. Meera’s voice and pacing were exactly right.', '1544005313-94ddf0286df2', 'Priya Nambiar', 'Architect, Kochi'), clientQuote('I sleep better for days after seeing Meera. Her meditation guidance is simple, warm and surprisingly powerful.', '1524504388940-b1c1722653e1', 'Aparna Das', 'Journalist, Bengaluru')],
      bookEyebrow: 'Book with Meera', bookTitle: 'Rituals she offers',
      offerings: [offer('1608248543803-ba4f8c70ae0b', 'Mind & body', 'Shirodhara', 'Warm oil poured in a steady stream to settle the mind.', '75 min', 'Signature', '₹5,400', 'Shirodhara', 'Shirodhara · 75 min', 'Warm oil pouring ritual'), offer('1595152452543-e5fc28ebc2b8', 'Stillness', 'Meditation & breath', 'Gentle breath-led guidance for a quieter mind.', '60 min', 'Guided', '₹3,200', 'Meditation', 'Meditation & breath · 60 min', 'Breath-led grounding'), offer('1556229010-6c3f2c9ca5f8', 'Full body', 'Abhyanga', 'Rhythmic warm oil work for grounding and rest.', '90 min', 'Herbal', '₹4,800', 'Abhyanga', 'Abhyanga · 90 min', 'Full-body warm oil ritual')],
      ctaTitle: 'Reserve a session with Meera.', ctaText: 'Choose your ritual, date and preferred time in a few simple steps.',
      meta: 'Meet Meera Iyer, Shirodhara and meditation therapist. Reserve a calm, restorative session at our Ayurvedic wellness center.'
    },
    'kabir-nair': {
      name: 'Kabir Nair', role: 'Herbalist & therapist', specialty: 'Udvartana · Nasya · Herbal medicine',
      avatar: '1500648767791-00dcc994a43e', heroBg: '1531384441138-2736e62e0919', storyImage: '1531384441138-2736e62e0919',
      years: '12 years', rating: '4.8 / 5', therapies: '3 therapies', languages: 'EN / HI / MAL',
      storyEyebrow: 'His story', storyTitle: 'Where herbs meet skilled hands.',
      intro: 'Kabir trained as a herbalist before he trained as a therapist, and it shows. He blends powders and oils fresh for each guest, choosing ingredients for the season, the constitution and the body in front of him.',
      note: 'His Udvartana and Nasya sessions are brisk where they need to be and gentle where they matter. He has a calm, quiet way of making even a first visit feel familiar.',
      credentials: ['Diploma in Ayurvedic herbalism, Kerala', 'Certified Udvartana & Nasya therapist', 'Twelve years of clinical herbal practice'],
      expertiseEyebrow: 'Where he shines', expertiseTitle: 'Areas of expertise', expertiseLead: 'Kabir pairs fresh herbal blends with precise bodywork for a clear, grounded reset.',
      expertise: [focus('Udvartana', 'Herbal powder massage to stimulate circulation and lymphatic flow.'), focus('Nasya', 'Medicated drops and facial work to clear the senses.'), focus('Herbal blends', 'Freshly chosen powders and oils for your constitution.'), focus('Detox & steam', 'Warming rituals that support a lighter, clearer body.')],
      weekEyebrow: 'His week', weekTitle: 'Availability & sessions.', weekLead: 'Kabir’s diary fills quickly through the week. Reserve your preferred slot in advance, or let us find the next opening that suits you.',
      schedule: [weekDay('Monday', '09:00 – 17:00', 'open', 'Open'), weekDay('Tuesday', '09:00 – 17:00', 'open', 'Open'), weekDay('Wednesday', '09:00 – 17:00', 'open', 'Open'), weekDay('Thursday', '10:00 – 19:00', 'open', 'Open'), weekDay('Friday', '09:00 – 15:00', 'open', 'Open'), weekDay('Saturday', '09:00 – 16:00', 'open', 'Open'), weekDay('Sunday', 'Rest day', 'rest', 'Closed')],
      quoteEyebrow: 'Client words', quoteTitle: 'In capable hands', quoteLead: 'The herbal knowledge and steady touch Kabir brings to his work.',
      quotes: [clientQuote('Kabir explained exactly why he chose each herb. The Udvartana was invigorating and I left feeling lighter and clearer.', '1600880292203-757bb62b4baf', 'Nikhil Rao', 'Engineer, Hyderabad'), clientQuote('The Nasya session was surprisingly gentle and made such a difference to my sinus comfort. I will definitely be back.', '1531746020798-e6953c6e8e04', 'Farah Khan', 'Writer, Mumbai')],
      bookEyebrow: 'Book with Kabir', bookTitle: 'Rituals he offers',
      offerings: [offer('1595152452543-e5fc28ebc2b8', 'Body work', 'Udvartana', 'Herbal powder massage to stimulate flow and refresh the skin.', '60 min', 'Herbal', '₹4,500', 'Udvartana', 'Udvartana · 60 min', 'Herbal powder massage'), offer('1612817288484-6f916006741a', 'Senses', 'Nasya', 'Medicated drops and gentle facial work to clear the head.', '30 min', 'Herbal', '₹2,400', 'Nasya', 'Nasya · 30 min', 'Herbal nasal therapy'), offer('1531384441138-2736e62e0919', 'Warmth', 'Herbal Steam', 'A medicated steam ritual to soften and release tension.', '45 min', 'Herbal', '₹3,000', 'Herbal Steam', 'Herbal steam · 45 min', 'Medicated steam ritual')],
      ctaTitle: 'Reserve a session with Kabir.', ctaText: 'Choose your ritual, date and preferred time in a few simple steps.',
      meta: 'Meet Kabir Nair, herbalist and therapist specializing in Udvartana, Nasya and herbal medicine. Reserve a session at our wellness center.'
    },
    'devika-pillai': {
      name: 'Devika Pillai', role: 'Wellness therapist', specialty: 'Pada Abhyanga · Pregnancy care · Abhyanga',
      avatar: '1531123897727-8f129e1688ce', heroBg: '1556229010-6c3f2c9ca5f8', storyImage: '1556229010-6c3f2c9ca5f8',
      years: '7 years', rating: '4.9 / 5', therapies: '3 therapies', languages: 'EN / HI / MAL',
      storyEyebrow: 'Her story', storyTitle: 'Grounding, one step at a time.',
      intro: 'Devika found her way to Ayurveda through pregnancy care, where the smallest comfort can change an entire day. Her Pada Abhyanga rituals are slow, warm and deliberately grounding.',
      note: 'She is known for making guests feel completely at ease — especially those arriving tired, unsettled or in a season of change. Every session ends with a little more steadiness.',
      credentials: ['Certified wellness therapist, Kerala Ayurveda Academy', 'Pregnancy care specialist', 'Advanced Pada Abhyanga training'],
      expertiseEyebrow: 'Where she shines', expertiseTitle: 'Areas of expertise', expertiseLead: 'Devika’s work is gentle, steady and especially comforting for tired bodies and busy minds.',
      expertise: [focus('Pada Abhyanga', 'Warm, grounding foot and lower-leg oil massage.'), focus('Pregnancy care', 'Comforting, careful rituals for changing bodies.'), focus('Abhyanga', 'Full-body oil work for rest and renewal.'), focus('Rest & grounding', 'Slow sessions for the nervous system to settle.')],
      weekEyebrow: 'Her week', weekTitle: 'Availability & sessions.', weekLead: 'Devika’s sessions are popular, and a few slots are already reserved. Reserve your preferred time in advance, or let us find the next opening that suits you.',
      schedule: [weekDay('Monday', '08:00 – 14:00', 'open', 'Open'), weekDay('Tuesday', '09:00 – 16:00', 'open', 'Open'), weekDay('Wednesday', '08:00 – 14:00', 'open', 'Open'), weekDay('Thursday', '09:00 – 16:00', 'open', 'Open'), weekDay('Friday', '08:00 – 13:00', 'open', 'Open'), weekDay('Saturday', '09:00 – 15:00', 'open', 'Open'), weekDay('Sunday', 'Rest day', 'rest', 'Closed')],
      quoteEyebrow: 'Client words', quoteTitle: 'In capable hands', quoteLead: 'The warmth and steadiness Devika brings to every session.',
      quotes: [clientQuote('Devika made me feel so comfortable during my pregnancy. Her foot ritual was exactly the comfort I needed each week.', '1544005313-94ddf0286df2', 'Anjali Menon', 'Teacher, Kochi'), clientQuote('I arrived exhausted and left feeling genuinely grounded. There is something wonderfully calm about the way she works.', '1524504388940-b1c1722653e1', 'Rhea Thomas', 'Designer, Chennai')],
      bookEyebrow: 'Book with Devika', bookTitle: 'Rituals she offers',
      offerings: [offer('1556229010-6c3f2c9ca5f8', 'Grounding', 'Pada Abhyanga', 'Warm, rhythmic oil work for the feet and lower legs.', '45 min', 'Signature', '₹3,200', 'Pada Abhyanga', 'Pada Abhyanga · 45 min', 'Warm foot oil ritual'), offer('1608248543803-ba4f8c70ae0b', 'Care', 'Pregnancy Care', 'A gentle, carefully paced ritual for changing bodies.', '60 min', 'Gentle', '₹4,200', 'Pregnancy Care', 'Pregnancy care · 60 min', 'Comforting care ritual'), offer('1595152452543-e5fc28ebc2b8', 'Full body', 'Abhyanga', 'Full-body warm oil therapy for deep rest.', '90 min', 'Herbal', '₹4,800', 'Abhyanga', 'Abhyanga · 90 min', 'Full-body warm oil ritual')],
      ctaTitle: 'Reserve a session with Devika.', ctaText: 'Choose your ritual, date and preferred time in a few simple steps.',
      meta: 'Meet Devika Pillai, wellness therapist specializing in Pada Abhyanga and pregnancy care. Reserve a gentle session at our wellness center.'
    },
    'arjun-varma': {
      name: 'Arjun Varma', role: 'Senior therapist & sound healer', specialty: 'Abhyanga · Sound therapy · Marma therapy',
      avatar: '1599566150163-29194dcaad36', heroBg: '1560448204-e02f11c3d0e2', storyImage: '1560448204-e02f11c3d0e2',
      years: '10 years', rating: '4.8 / 5', therapies: '3 therapies', languages: 'EN / HI / TAM',
      storyEyebrow: 'His story', storyTitle: 'Rhythm, oil and deep rest.',
      intro: 'Arjun began with Abhyanga and gradually wove sound into his practice, drawn by the way a single steady tone can soften a room. His sessions pair confident bodywork with a carefully chosen soundscape.',
      note: 'He works especially well with guests who carry stress in the shoulders and jaw. The result is unhurried, tactile and often surprisingly emotional — in the best way.',
      credentials: ['Certified Senior Ayurvedic Therapist, Kerala', 'Sound therapy facilitator', 'Advanced Marma training, Chennai lineage'],
      expertiseEyebrow: 'Where he shines', expertiseTitle: 'Areas of expertise', expertiseLead: 'Arjun layers warm oil, precise pressure and steady sound into a deeply restorative ritual.',
      expertise: [focus('Abhyanga', 'Confident, rhythmic full-body oil work for tension and rest.'), focus('Sound therapy', 'Carefully chosen tones that carry the body into stillness.'), focus('Marma therapy', 'Focused pressure to release held tension and restore flow.'), focus('Stress release', 'Grounding work for tight shoulders, jaws and busy minds.')],
      weekEyebrow: 'His week', weekTitle: 'Availability & sessions.', weekLead: 'Arjun’s evening slots go quickly. Reserve your preferred time in advance, or let us find the next opening that suits you.',
      schedule: [weekDay('Monday', '09:00 – 17:00', 'open', 'Open'), weekDay('Tuesday', '11:00 – 20:00', 'open', 'Open'), weekDay('Wednesday', '09:00 – 17:00', 'open', 'Open'), weekDay('Thursday', '11:00 – 20:00', 'open', 'Open'), weekDay('Friday', '09:00 – 15:00', 'open', 'Open'), weekDay('Saturday', '10:00 – 18:00', 'open', 'Open'), weekDay('Sunday', 'Rest day', 'rest', 'Closed')],
      quoteEyebrow: 'Client words', quoteTitle: 'In capable hands', quoteLead: 'The rhythm and depth Arjun brings to every session.',
      quotes: [clientQuote('The combination of Abhyanga and sound was unlike anything I have tried. I felt completely unwound afterwards.', '1547425260-76bcadfb4f2c', 'Meera Krishnan', 'Doctor, Kochi'), clientQuote('Arjun found every place I was holding stress. Strong, steady work and the calmest finish.', '1521119989659-a83eee488004', 'Vikram Shetty', 'Founder, Mangaluru')],
      bookEyebrow: 'Book with Arjun', bookTitle: 'Rituals he offers',
      offerings: [offer('1556229010-6c3f2c9ca5f8', 'Full body', 'Abhyanga', 'Rhythmic warm oil work that releases deep tension.', '90 min', 'Signature', '₹4,800', 'Abhyanga', 'Abhyanga · 90 min', 'Full-body warm oil ritual'), offer('1560448204-e02f11c3d0e2', 'Sound & oil', 'Sound & Oil Ceremony', 'Warm oil and steady tones for a slower, softer state.', '90 min', 'Signature', '₹6,500', 'Sound Oil Ceremony', 'Sound & oil ceremony · 90 min', 'Oil work with sound'), offer('1612817288484-6f916006741a', 'Energy work', 'Marma Therapy', 'Focused pressure on vital points to restore flow.', '60 min', 'Clinical', '₹4,200', 'Marma Therapy', 'Marma therapy · 60 min', 'Focused energy-point work')],
      ctaTitle: 'Reserve a session with Arjun.', ctaText: 'Choose your ritual, date and preferred time in a few simple steps.',
      meta: 'Meet Arjun Varma, senior therapist and sound healer specializing in Abhyanga and sound therapy. Reserve a session at our wellness center.'
    }
  };

  let activeTherapistName = '';

  function initTherapistDetails() {
    if (!location.pathname.endsWith('therapist-details.html')) return;
    const slug = new URLSearchParams(location.search).get('therapist') || 'ananya-sharma';
    const data = therapistDetails[slug] || therapistDetails['ananya-sharma'];
    activeTherapistName = data.name;
    const setText = (selector, value) => { const el = $(selector); if (el && value != null) el.textContent = value; };
    const textIn = (root, selector, value) => { const el = $(selector, root); if (el && value != null) el.textContent = value; };
    const setImg = (selector, id, alt, width) => {
      const img = $(selector); if (!img || !id) return;
      img.src = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width || 1200}&q=80`;
      img.alt = alt; img.dataset.seed = id;
    };
    const setPrice = (root, value) => { const el = $('.price', root); if (el) el.firstChild.textContent = value; };

    document.title = `${data.name} — Therapist Profile | Ayurveda Wellness & Massage Center`;
    const desc = $('meta[name="description"]'); if (desc) desc.content = data.meta;
    const ogTitle = $('meta[property="og:title"]'); if (ogTitle) ogTitle.content = `${data.name} — Therapist Profile | Ayurveda Wellness`;
    const ogDesc = $('meta[property="og:description"]'); if (ogDesc) ogDesc.content = data.meta;

    setImg('.detail-hero-bg img', data.heroBg, `${data.name} wellness atmosphere`, 1920);
    setImg('.therapist-avatar-lg', data.avatar, data.name, 200);
    setText('.detail-hero .eyebrow', data.role);
    setText('.detail-hero h1', data.name);
    setText('.detail-hero .lead', data.specialty);

    const facts = [[data.years, 'Of practice'], [data.rating, 'Guest rating'], [data.therapies, 'Core specialties'], [data.languages, 'Languages']];
    $$('.detail-fact').forEach((el, i) => { if (!facts[i]) return; textIn(el, 'b', facts[i][0]); textIn(el, 'span', facts[i][1]); });

    setImg('.media.ratio-43 img', data.storyImage, `${data.name} with client`, 1200);
    setText('.split-copy .eyebrow', data.storyEyebrow);
    setText('.split-copy h2', data.storyTitle);
    setText('.split-copy > p.lead', data.intro);
    setText('.split-copy > p.soft', data.note);
    $$('.split-copy .check-list li span').forEach((el, i) => { if (data.credentials[i]) el.textContent = data.credentials[i]; });

    const heads = $$('.section-head.center');
    const setHead = (i, eyebrow, title, lead) => {
      const el = heads[i]; if (!el) return;
      textIn(el, '.eyebrow', eyebrow); textIn(el, 'h2', title); textIn(el, 'p.lead', lead);
    };
    setHead(0, data.expertiseEyebrow, data.expertiseTitle, data.expertiseLead);
    setHead(1, data.quoteEyebrow, data.quoteTitle, data.quoteLead);
    setHead(2, data.bookEyebrow, data.bookTitle, 'Choose a session and reserve a time that works for you.');

    $$('.grid.g4 .feature-card').forEach((card, i) => { const item = data.expertise[i]; if (!item) return; textIn(card, 'h3', item.title); textIn(card, 'p', item.text); });

    const weekGrid = $$('.grid.g-feature')[1];
    if (weekGrid) {
      textIn(weekGrid, '.eyebrow', data.weekEyebrow);
      textIn(weekGrid, 'h2', data.weekTitle);
      textIn(weekGrid, 'p.lead', data.weekLead);
    }
    const weekPanel = $('.week-panel');
    if (weekPanel) textIn(weekPanel, '.week-head p', `${data.name}’s regular hours`);
    $$('.week-grid .week-day').forEach((el, i) => {
      const item = data.schedule[i]; if (!item) return;
      textIn(el, '.week-name', item.name);
      textIn(el, 'b', item.time);
      textIn(el, '.week-status', item.label);
      el.classList.toggle('open', item.status === 'open');
      el.classList.toggle('rest', item.status === 'rest');
    });

    $$('.session-card').forEach((card, i) => {
      const item = data.offerings[i]; if (!item) return;
      textIn(card, 'h4', item.title);
      textIn(card, 'p.muted', item.short);
      setPrice(card, item.price);
      const btn = $('[data-book]', card); if (btn) btn.dataset.book = item.book;
    });

    $$('.quote-card').forEach((card, i) => {
      const item = data.quotes[i]; if (!item) return;
      textIn(card, '.quote-text', item.text);
      const img = $('.quote-author img', card);
      if (img) {
        img.src = `https://images.unsplash.com/photo-${item.img}?auto=format&fit=crop&w=160&q=80`;
        img.alt = item.name; img.dataset.seed = item.img;
      }
      textIn(card, '.quote-author b', item.name);
      textIn(card, '.quote-author span', item.role);
    });

    $$('.book-grid .therapy-card').forEach((card, i) => {
      const item = data.offerings[i]; if (!item) return;
      const img = $('.card-img img', card);
      if (img) {
        img.src = `https://images.unsplash.com/photo-${item.img}?auto=format&fit=crop&w=1200&q=80`;
        img.alt = `${item.name} therapy session`; img.dataset.seed = item.img;
      }
      textIn(card, '.therapy-cat-label', item.cat);
      textIn(card, '.card-body > p:not(.therapy-cat-label)', item.desc);
      const metas = $$('.card-meta span', card);
      if (metas[0]) metas[0].lastChild.textContent = ` ${item.duration}`;
      if (metas[1]) metas[1].lastChild.textContent = ` ${item.tag}`;
      setPrice(card, item.price);
      const btn = $('[data-book]', card); if (btn) btn.dataset.book = item.book;
    });

    setText('.cta-band h2', data.ctaTitle);
    setText('.cta-band p', data.ctaText);
  }

  const blogAuthors = {
    'Dr. Ananya Sharma': { img: '1517841905240-472988babdf9', bio: 'Senior Ayurvedic therapist with fourteen years of practice in classical Abhyanga, Marma therapy and Panchakarma. Ananya writes about the small daily rituals that make wellness sustainable.' },
    'Rohan Menon': { img: '1552058544-f2b08422138a', bio: 'Detox and herbal specialist with eleven years of clinical experience in Panchakarma and classical herbal medicine. Rohan writes about digestion, seasonality and steady, sustainable resets.' },
    'Meera Iyer': { img: '1568602471122-7832951cc4c5', bio: 'Shirodhara and meditation therapist with nine years of practice. Meera writes about rest, breath and the quiet ways a busy mind learns to settle.' },
    'Kabir Nair': { img: '1500648767791-00dcc994a43e', bio: 'Herbalist and therapist with twelve years of clinical practice. Kabir blends fresh powders and oils for each guest and writes about the plants behind the rituals.' },
    'Devika Pillai': { img: '1531123897727-8f129e1688ce', bio: 'Wellness therapist specializing in grounding foot work, pregnancy care and gentle daily rituals. Devika writes about small practices that fit real family life.' }
  };

  const blogDetails = {
    'daily-oiling': {
      title: 'The quiet power of daily oiling.', category: 'Herbal wisdom', read: '6 min read', date: '12 March 2026', author: 'Dr. Ananya Sharma',
      hero: '1426604966848-d7adac402bff', heroAlt: 'Herbal oils prepared for a daily ritual', detail: '1506744038136-46273834b3fb', detailAlt: 'Self oiling ritual at home',
      lead: 'In Ayurveda, the day begins with a simple act of care: a little warm oil, applied with attention. It is such a small thing that it is easy to overlook — and yet, practiced consistently, it changes how the body feels and how the mind meets the morning.',
      body: [
        ['p', 'Abhyanga, or self-oiling, is one of the oldest daily rituals in Indian wellness traditions. The practice is uncomplicated: warm a small amount of oil, then massage it slowly over the body before bathing. The oil is chosen according to your constitution and the season.'],
        ['h', 'Why the oil matters'],
        ['p', 'Oil is not merely a lubricant in Ayurvedic thought. It is considered a carrier of nourishment — a way of delivering the qualities of herbs deep into the tissues. Sesame oil warmed with ashwagandha is grounding; coconut oil with brahmi is cooling and calm. The right oil depends on your dosha and the time of year.'],
        ['q', 'The body remembers care. A few minutes of unhurried touch each morning tells it that it is safe to soften.'],
        ['f', '1600585152915-d208bec867a1', 'Warm herbal oil in a traditional vessel', 'Warm herbal oil, prepared for a morning ritual.'],
        ['h', 'A simple morning practice'],
        ['p', 'Begin with a tablespoon of oil warmed gently between your palms. Start at the head, moving slowly down the body with long strokes over the limbs and circular motions at the joints. Pay particular attention to the soles of the feet, the scalp and the abdomen. Five to ten minutes is enough.'],
        ['p', 'If a full-body ritual feels like too much, begin with the feet and hands alone. A practice that is small enough to repeat will always be more powerful than one that is ambitious and abandoned.'],
        ['h', 'What you may notice'],
        ['p', 'Regular self-oiling is traditionally said to support circulation, soften the skin, ease muscular stiffness and calm the nervous system. Many people find that it makes the transition from sleep into activity gentler.'],
        ['p', 'It is also useful in dry weather, after travel and during periods of mental overactivity. In each case the principle is the same: warmth, oil and unhurried attention return the body to a sense of ease.']
      ],
      takeaways: ['Warm oil before bathing is a simple daily ritual', 'Choose the oil for your dosha and season', 'Five unhurried minutes are enough to begin', 'Consistency matters more than duration'],
      tags: ['#Abhyanga', '#DailyRitual', '#HerbalOils', '#SelfCare', '#Dosha'],
      homeTitle: 'Try the ritual tonight.', homeLead: 'You do not need a treatment room to begin. Three quiet minutes, a little warm oil and your full attention are enough.',
      steps: [['Warm a spoonful of oil', 'Sesame or almond oil works beautifully. Warm it between your palms.'], ['Massage the soles', 'Slow circles on each foot, then long strokes up the legs.'], ['Rest before sleep', 'Let the oil absorb. Notice how the body settles.']],
      cta: 'Experience the practice yourself.', ctaText: 'Book an Abhyanga session and learn the ritual from a master therapist.',
      related: ['breath-practice', 'abhyanga-oils', 'sleep-healing'],
      meta: 'Read The quiet power of daily oiling — a gentle guide to Abhyanga, warm herbal oils and a calmer daily rhythm.'
    },
    'monsoon-energy': {
      title: 'Aligning your routine with monsoon energy.', category: 'Seasonal', read: '5 min read', date: '04 March 2026', author: 'Rohan Menon',
      hero: '1470071459604-3b5ec3a7fe05', heroAlt: 'Misty monsoon landscape', detail: '1500534314209-a25ddb2bd429', detailAlt: 'Rain falling on a quiet window',
      lead: 'When the rains arrive, the world grows heavier and slower. Ayurveda reads this as a shift in the doshas: Vata rises with the wind and movement, while Kapha gathers with the dampness. A few simple changes keep you steady through the season.',
      body: [
        ['p', 'Monsoon is a time of contrast. The air cools, the sky darkens and the body often asks for warmer food, longer sleep and a little more stillness. Fighting that rhythm usually leaves us tired. Working with it is far kinder.'],
        ['h', 'Keep the inner fire steady'],
        ['p', 'A settled digestive fire is your best companion in the rains. Favor warm, cooked meals with ginger, cumin and black pepper. Reduce cold drinks and raw foods, especially in the evenings, and give the stomach space between meals.'],
        ['q', 'Seasonal care is not about doing more. It is about doing the right small things at the right time.'],
        ['f', '1500534314209-a25ddb2bd429', 'Rain on a quiet window', 'The monsoon invites a slower, warmer rhythm.'],
        ['h', 'A gentler daily rhythm'],
        ['p', 'Wake a little later if you can, eat your largest meal at midday and keep dinner light. A short walk after food, warm oil on the soles of the feet and an early bedtime all help the body feel held rather than buffeted.']
      ],
      takeaways: ['Favor warm, cooked food with gentle spices', 'Keep evenings light and restful', 'Warm oil on the feet calms rising Vata', 'Move gently rather than pushing hard'],
      tags: ['#Seasonal', '#Monsoon', '#Dosha', '#DailyRitual', '#Balance'],
      homeTitle: 'Build a rain-day rhythm.', homeLead: 'A few small shifts make the monsoon feel grounding instead of heavy.',
      steps: [['Warm your food', 'Add ginger, cumin and pepper to simple cooked meals.'], ['Oil the feet', 'A little warm sesame oil before bed settles Vata.'], ['Slow the evening', 'Keep dinner early and give yourself a quiet hour before sleep.']],
      cta: 'Reset with the season.', ctaText: 'Ask our guides for a seasonal ritual suited to your constitution.',
      related: ['kindling-agni', 'sunday-reset', 'daily-oiling'],
      meta: 'Read Aligning your routine with monsoon energy — seasonal Ayurvedic guidance for warm food, steady digestion and calmer rains.'
    },
    'kindling-agni': {
      title: 'The gentle art of kindling agni.', category: 'Herbal wisdom', read: '5 min read', date: '28 February 2026', author: 'Rohan Menon',
      hero: '1596755094514-f87e34085b2c', heroAlt: 'Warm spices for digestion', detail: '1512621776951-a57141f2eefd', detailAlt: 'A warm spiced meal',
      lead: 'Agni is the digestive fire that turns food into nourishment. When it is steady, we feel light and clear. When it flickers, we feel heavy, sluggish and oddly unsatisfied even after a full meal.',
      body: [
        ['p', 'In Ayurveda, good digestion is not measured by how much you can eat. It is measured by how well you transform what you take in. A gentle, regular fire is more valuable than an aggressive one.'],
        ['h', 'Signs of a steady fire'],
        ['p', 'You feel hungry at roughly the same time each day, your meals sit comfortably and your energy stays even through the afternoon. When agni is low, you may feel weighed down, sleepy after eating or drawn to constant snacking.'],
        ['q', 'A happy digestive fire is quiet. You notice it most when it asks for nothing.'],
        ['f', '1512621776951-a57141f2eefd', 'Warm spices and a nourishing bowl of food', 'Simple warm food kindles a steady appetite.'],
        ['h', 'Small ways to stoke it'],
        ['p', 'Start the day with warm water, eat at regular times and keep meals simple enough that your body can recognize them. A pinch of ginger, a little cumin and a short walk after lunch often do more than any elaborate cleanse.']
      ],
      takeaways: ['Eat at regular times, not whenever stress calls', 'Favor warm, simple, freshly cooked meals', 'Ginger and cumin support a steady fire', 'A short walk after food helps digestion'],
      tags: ['#Agni', '#Digestion', '#HerbalWisdom', '#Food', '#Balance'],
      homeTitle: 'Try a kindler at home.', homeLead: 'A simple cup of warm spiced water can be a gentle daily reset.',
      steps: [['Boil warm water', 'Add a thin slice of ginger and a pinch of cumin seed.'], ['Sip slowly', 'Take it twenty minutes before your first meal.'], ['Keep it regular', 'Small daily signals matter more than occasional extremes.']],
      cta: 'Meet your digestion.', ctaText: 'Speak to a guide about a digestion-focused ritual or herbal consultation.',
      related: ['kitchen-spices', 'monsoon-energy', 'daily-oiling'],
      meta: 'Read The gentle art of kindling agni — simple Ayurvedic ways to support digestion with warm food, spices and daily rhythm.'
    },
    'sleep-healing': {
      title: 'Why sleep is a form of healing.', category: 'Rest', read: '7 min read', date: '21 February 2026', author: 'Meera Iyer',
      hero: '1611892440504-42a792e24d32', heroAlt: 'Calm bedroom prepared for rest', detail: '1497366754035-f200968a6e72', detailAlt: 'A restful room prepared for sleep',
      lead: 'Sleep is not the pause between the interesting parts of life. In Ayurveda it is one of the three pillars of health — a nightly repair in which the body settles, the mind unwinds and the nervous system remembers how to rest.',
      body: [
        ['p', 'We often treat sleep as something to squeeze in at the end of a full day. The body sees it differently. Darkness, stillness and regular timing tell every system that it is safe to slow down.'],
        ['h', 'The hours before midnight'],
        ['p', 'Ayurveda pays close attention to the early part of the night, when heavy, grounding qualities dominate. An early, consistent bedtime tends to feel deeper than the same number of hours gained later.'],
        ['q', 'Rest is not a reward for finishing everything. It is what makes the next day possible.'],
        ['f', '1497366754035-f200968a6e72', 'A calm, softly lit bedroom', 'A dark, quiet room is an invitation to rest.'],
        ['h', 'Preparing the body for sleep'],
        ['p', 'Dim the lights an hour before bed, keep screens away from the eyes if you can, and use warm oil on the soles of the feet or the scalp. A short breath practice by the bedside gives the mind one gentle thing to follow as the day closes.'],
        ['p', 'If sleep is irregular, begin with timing rather than effort. The same wake-up time, seven days a week, slowly teaches the body when to release.'],
      ],
      takeaways: ['Sleep is one of Ayurveda’s three pillars of health', 'Earlier nights usually feel deeper', 'Warm oil and dim light signal safety', 'Consistent wake time matters most'],
      tags: ['#Rest', '#Sleep', '#NervousSystem', '#EveningRitual', '#Shirodhara'],
      homeTitle: 'Make tonight quieter.', homeLead: 'A short evening ritual can change the quality of your whole night.',
      steps: [['Dim the room', 'Lower the lights an hour before bed and put screens away.'], ['Warm the soles', 'A little oil and a slow foot massage settle the body.'], ['Follow the breath', 'Count a few gentle cycles and let the mind land.']],
      cta: 'Rest more deeply.', ctaText: 'Explore Shirodhara and guided rest sessions with our meditation therapist.',
      related: ['breath-practice', 'three-minds', 'sunday-reset'],
      meta: 'Read Why sleep is a form of healing — Ayurverdic guidance on early nights, warm rituals and a calmer nervous system.'
    },
    'kitchen-spices': {
      title: 'Turmeric, ginger & the everyday kitchen.', category: 'Herbal wisdom', read: '4 min read', date: '14 February 2026', author: 'Kabir Nair',
      hero: '1498837167922-ddd27525d352', heroAlt: 'Herbs and spices in the kitchen', detail: '1596755094514-f87e34085b2c', detailAlt: 'Warm spices ready for cooking',
      lead: 'Ayurveda does not separate the kitchen from the medicine cabinet. Turmeric, ginger, cumin and pepper are everyday tools — chosen for the season, the meal and the person sitting at the table.',
      body: [
        ['p', 'The most useful herbs are usually the ones already in your kitchen. You do not need a shelf of obscure ingredients to begin. You need a little knowledge and a little attention.'],
        ['h', 'Why ginger earns its place'],
        ['p', 'Ginger warms, supports digestion and lends a bright edge to heavy foods. A thin slice in warm water before a meal is enough for most people. Those with a fiery constitution should use it more lightly.'],
        ['q', 'A good herbal practice is quiet, edible and easy to repeat.'],
        ['f', '1596755094514-f87e34085b2c', 'Turmeric, ginger and warm spices', 'Everyday spices are the beginning of herbal care.'],
        ['h', 'Turmeric with a little black pepper'],
        ['p', 'Turmeric is valued for its warming, clearing qualities. A pinch of black pepper is traditionally added to make it more available to the body. Stir both into warm milk, soups or lentils rather than chasing elaborate tonics.']
      ],
      takeaways: ['The kitchen is the first herbal cabinet', 'Ginger supports digestion and warmth', 'Black pepper helps turmeric do its work', 'Choose spices for your constitution'],
      tags: ['#HerbalWisdom', '#Turmeric', '#Ginger', '#Kitchen', '#FoodAsCare'],
      homeTitle: 'Open your spice drawer.', homeLead: 'One warm spice, used regularly, is a better foundation than a cupboard full of promises.',
      steps: [['Choose one spice', 'Start with ginger for warmth or cumin for steadiness.'], ['Add it simply', 'Stir into warm water, soup or lentils.'], ['Notice the effect', 'Pay attention to comfort, appetite and energy over a week.']],
      cta: 'Talk to our herbalist.', ctaText: 'Book a consultation and leave with a blend chosen for your constitution.',
      related: ['kindling-agni', 'monsoon-energy', 'daily-oiling'],
      meta: 'Read Turmeric, ginger & the everyday kitchen — practical Ayurvedic guidance on using common spices for daily balance.'
    },
    'three-minds': {
      title: 'The three minds: understanding your thoughts.', category: 'Mind & rest', read: '6 min read', date: '08 February 2026', author: 'Meera Iyer',
      hero: '1506126613408-eca07ce68773', heroAlt: 'Meditation and mindful thinking', detail: '1490645935967-10de6ba17061', detailAlt: 'A quiet moment of reflection',
      lead: 'Ayurveda describes three modes of mind: sattva, rajas and tamas. They are not good or bad — they are qualities that move through us all day, shaping how we think, react and rest.',
      body: [
        ['p', 'A clear mind is not an empty one. It is a mind that can choose where to rest its attention. The three gunas offer a simple vocabulary for noticing what is happening without judging yourself for it.'],
        ['h', 'Sattva, rajas and tamas'],
        ['p', 'Sattva feels light, clear and settled. Rajas is restless and driven, full of plans and reactions. Tamas is heavy and withdrawn, the fog that arrives when we are tired or stuck. Each has a place; balance is the practice.'],
        ['q', 'You do not have to fight a restless mind. You can simply give it somewhere gentle to land.'],
        ['f', '1490645935967-10de6ba17061', 'A quiet moment with warm herbs', 'Stillness gives the mind a reference point.'],
        ['h', 'Working with what is here'],
        ['p', 'When rajas is high, slow the breath and reduce stimulation. When tamas is heavy, seek light, movement and warm food. When sattva is present, protect it with a few minutes of silence before the day asks for more.']
      ],
      takeaways: ['The three gunas describe qualities of mind, not failures', 'Rajas needs slower breath and fewer inputs', 'Tamas responds to light, warmth and movement', 'Sattva is protected by small pockets of silence'],
      tags: ['#MindAndRest', '#Gunas', '#Meditation', '#Awareness', '#Balance'],
      homeTitle: 'Notice one quality today.', homeLead: 'A few minutes of honest noticing can change how you meet the rest of the day.',
      steps: [['Pause', 'Stop for one breath and name what feels dominant.'], ['Respond gently', 'Slow down if restless; move if heavy.'], ['Keep a pocket of quiet', 'Protect five minutes without input.']],
      cta: 'Find your stillness.', ctaText: 'Try a meditation and breath session with Meera, or speak to a guide first.',
      related: ['breath-practice', 'sleep-healing', 'sunday-reset'],
      meta: 'Read The three minds — a gentle introduction to sattva, rajas and tamas and how to work with each state.'
    },
    'sunday-reset': {
      title: 'A Sunday reset for the whole family.', category: 'Seasonal', read: '5 min read', date: '01 February 2026', author: 'Devika Pillai',
      hero: '1600612253971-422e7f7faeb6', heroAlt: 'Quiet home ritual', detail: '1506744038136-46273834b3fb', detailAlt: 'A calm home ritual with warm oil',
      lead: 'A reset does not need to be a strict schedule or a long list of chores. One shared rhythm — a warm meal, a short walk, a quiet hour — can help a whole household arrive at Monday with more ease.',
      body: [
        ['p', 'Sundays often swing between overscheduling and doing nothing at all. Both can leave us strangely unrested. A simple ritual gives the day a shape without turning it into another task.'],
        ['h', 'Begin with warmth'],
        ['p', 'Cook something slow and shared. Lentils, rice and warmed spices ask very little of you and fill the home with a settling smell. Let the kitchen be the place where the day gathers.'],
        ['q', 'A home reset is less about cleaning the house and more about clearing the atmosphere.'],
        ['f', '1506744038136-46273834b3fb', 'A calm home ritual', 'One shared ritual can steady an entire household.'],
        ['h', 'Keep the evening small'],
        ['p', 'A short walk after food, warm oil on the feet and an early, dim hour before bed are enough. Children copy what they see far more than what they are told — let them watch the pace change.']
      ],
      takeaways: ['Give Sunday a gentle shape, not a strict plan', 'Cook one slow, shared meal', 'A short family walk settles everyone', 'Keep the last hour dim and unhurried'],
      tags: ['#Seasonal', '#Family', '#HomeRitual', '#Rest', '#WeeklyReset'],
      homeTitle: 'Reset without a schedule.', homeLead: 'Three small gestures can change the feeling of a whole home.',
      steps: [['Cook something warm', 'Let one pot simmer slowly for the family.'], ['Step outside together', 'A ten-minute walk resets the atmosphere.'], ['Oil the feet', 'Warm oil and quiet voices close the day.']],
      cta: 'Bring the ritual home.', ctaText: 'Ask our therapists for simple practices that suit your family routine.',
      related: ['monsoon-energy', 'sleep-healing', 'daily-oiling'],
      meta: 'Read A Sunday reset for the whole family — gentle home rituals, warm food and an unhurried end to the week.'
    },
    'breath-practice': {
      title: 'A breath practice for busy minds.', category: 'Mind & rest', read: '4 min read', date: '26 January 2026', author: 'Meera Iyer',
      hero: '1575052814086-f385e2e2ad1b', heroAlt: 'Morning meditation and breath practice', detail: '1490645935967-10de6ba17061', detailAlt: 'A quiet seated breath practice',
      lead: 'When the mind is racing, telling it to calm down rarely works. The breath is a kinder doorway: already present, always moving, and gentle enough to follow without force.',
      body: [
        ['p', 'You do not need a cushion, an app or twenty spare minutes. Three slow cycles of breath, repeated a few times a day, can change the tone of a busy morning.'],
        ['h', 'Make the exhale longer'],
        ['p', 'Begin by noticing the breath as it is. Then let the out-breath become slightly longer than the in-breath. This simple shift signals safety to the nervous system and softens the drive to rush.'],
        ['q', 'The breath does not need to be perfect. It only needs to be noticed.'],
        ['f', '1490645935967-10de6ba17061', 'A quiet moment of breath and stillness', 'A few slow breaths can reset a crowded day.'],
        ['h', 'Where to practice'],
        ['p', 'Use the moments you already have: before opening your inbox, while water boils, at a red light. Small, frequent practices become familiar, and a familiar practice is the one that helps when stress is high.']
      ],
      takeaways: ['Follow the breath instead of fighting the mind', 'A longer exhale invites calm', 'Three cycles are enough to begin', 'Attach practice to moments already in your day'],
      tags: ['#MindAndRest', '#Breath', '#Meditation', '#Stress', '#DailyRitual'],
      homeTitle: 'Try three slow breaths.', homeLead: 'No equipment, no perfect posture — just a small pause you can repeat.',
      steps: [['Notice', 'Feel one natural breath without changing it.'], ['Lengthen', 'Make the exhale a little slower than the inhale.'], ['Repeat', 'Do three cycles before your next task.']],
      cta: 'Learn with a guide.', ctaText: 'Join a breath-led session and leave with a practice you can keep.',
      related: ['three-minds', 'sleep-healing', 'daily-oiling'],
      meta: 'Read A breath practice for busy minds — a simple longer-exhale technique for calmer days and a steadier nervous system.'
    },
    'abhyanga-oils': {
      title: 'How we blend our Abhyanga oils.', category: 'Herbal wisdom', read: '5 min read', date: '18 January 2026', author: 'Kabir Nair',
      hero: '1439405326854-014607f694d7', heroAlt: 'Herbal oils being blended', detail: '1600585152915-d208bec867a1', detailAlt: 'Warm herbal oil in a traditional vessel',
      lead: 'Every Abhyanga oil at our center begins with a conversation: your constitution, the season, your sleep and how your body tends to hold tension. The blend that follows is simple, fresh and chosen for you.',
      body: [
        ['p', 'A good oil is not complicated, but it is specific. Sesame, coconut and almond each bring a different quality. Herbs are then added to support warmth, calm or circulation, depending on what the body needs.'],
        ['h', 'The base matters'],
        ['p', 'Sesame is warming and grounding, ideal for Vata and for cooler months. Coconut is cooling and calming, often better for Pitta or humid weather. Almond is gentle and nourishing, a quiet choice for sensitive skin.'],
        ['q', 'The right oil does not announce itself. The body simply feels easier in it.'],
        ['f', '1600585152915-d208bec867a1', 'Warm oil being prepared for therapy', 'Each blend starts with a base chosen for the person.'],
        ['h', 'Freshly prepared, never generic'],
        ['p', 'We prepare small batches so the herbs remain lively. Ashwagandha and brahmi for a settled mind, turmeric and neem for clarity, a little camphor when the senses need waking. Your therapist adjusts the oil again on the day of the session.']
      ],
      takeaways: ['Every blend starts with your constitution', 'Sesame warms, coconut cools, almond nourishes', 'Herbs are chosen for the season and the person', 'Small batches keep the oil lively'],
      tags: ['#HerbalOils', '#Abhyanga', '#HerbalWisdom', '#Dosha', '#PersonalisedCare'],
      homeTitle: 'Choose your oil with care.', homeLead: 'Notice how different bases feel before you settle on a daily ritual.',
      steps: [['Warm a little', 'Rub a few drops between your palms.'], ['Notice the quality', 'Is it warming, cooling or deeply softening?' ], ['Ask a guide', 'Let us match the oil to your dosha and season.']],
      cta: 'Meet your blend.', ctaText: 'Book an Abhyanga session and leave with a blend chosen for your body.',
      related: ['daily-oiling', 'kindling-agni', 'kitchen-spices'],
      meta: 'Read How we blend our Abhyanga oils — a behind-the-scenes look at constitution-led herbal oil blending.'
    }
  };

  function initBlogDetails() {
    if (!location.pathname.endsWith('blog-details.html')) return;
    const slug = new URLSearchParams(location.search).get('post') || 'daily-oiling';
    const data = blogDetails[slug] || blogDetails['daily-oiling'];
    const author = blogAuthors[data.author] || blogAuthors['Dr. Ananya Sharma'];
    const imgUrl = (id, width) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width || 1200}&q=80`;
    const setText = (selector, value) => { const el = $(selector); if (el && value != null) el.textContent = value; };
    const textIn = (root, selector, value) => { const el = $(selector, root); if (el && value != null) el.textContent = value; };
    const setImg = (selector, id, alt, width) => { const img = $(selector); if (!img || !id) return; img.src = imgUrl(id, width); img.alt = alt; img.dataset.seed = id; };

    document.title = `${data.title} | Journal | Ayurveda Wellness`;
    const desc = $('meta[name="description"]'); if (desc) desc.content = data.meta;
    const ogTitle = $('meta[property="og:title"]'); if (ogTitle) ogTitle.content = document.title;
    const ogDesc = $('meta[property="og:description"]'); if (ogDesc) ogDesc.content = data.meta;

    setText('.page-hero .eyebrow', `${data.category} · ${data.read}`);
    setText('.page-hero h1', data.title);
    setText('.hero-author .author-name', data.author);
    setText('.date-meta span', data.date);
    setText('.read-meta span', data.read);
    setImg('.hero-author .author-avatar', author.img, data.author, 160);
    setImg('.page-hero-art img', data.hero, data.heroAlt, 1920);

    const article = $('.article-body');
    if (article) {
      article.innerHTML = `<p class="lead">${data.lead}</p>` + data.body.map(block => {
        if (block[0] === 'h') return `<h3>${block[1]}</h3>`;
        if (block[0] === 'q') return `<blockquote>${block[1]}</blockquote>`;
        if (block[0] === 'f') return `<figure class="article-figure"><img src="${imgUrl(block[1], 1200)}" alt="${block[2]}" loading="lazy" decoding="async" data-seed="${block[1]}"><figcaption>${block[3]}</figcaption></figure>`;
        return `<p>${block[1]}</p>`;
      }).join('');
    }

    const widgets = $$('aside .side-widget');
    if (widgets[0]) $$('li span', widgets[0]).forEach((el, i) => { if (data.takeaways[i]) el.textContent = data.takeaways[i]; });
    if (widgets[1]) $$('.recent-post', widgets[1]).forEach((post, i) => {
      const related = blogDetails[data.related[i]]; if (!related) return;
      textIn(post, 'b', related.title);
      const meta = $('span', post); if (meta) meta.textContent = related.read;
      const img = $('img', post); if (img) { img.src = imgUrl(related.hero, 160); img.alt = related.heroAlt; img.dataset.seed = related.hero; }
    });
    if (widgets[2]) $$('.tag-cloud a', widgets[2]).forEach((el, i) => { if (data.tags[i]) el.textContent = data.tags[i]; el.href = 'blog.html'; });

    const home = $('.grid.g-feature');
    if (home) { textIn(home, '.eyebrow', 'Bring it home'); textIn(home, 'h2', data.homeTitle); textIn(home, 'p.lead', data.homeLead); }
    setImg('.grid.g-feature .media.ratio-43 img', data.detail, data.detailAlt, 1200);
    $$('.process-row').forEach((row, i) => { const step = data.steps[i]; if (!step) return; textIn(row, 'h4', step[0]); textIn(row, 'p', step[1]); });

    setImg('.author-section .media-round', author.img, data.author, 180);
    setText('.author-section .therapy-cat-label', 'Written by');
    setText('.author-section h3', data.author);
    setText('.author-section p.soft', author.bio);

    const head = $('.section-head.center');
    if (head) { textIn(head, '.eyebrow', 'Keep reading'); textIn(head, 'h2', 'More from the journal'); textIn(head, 'p.lead', 'Thoughtful guidance for the seasons of your life.'); }
    $$('.keep-reading-grid .card').forEach((card, i) => {
      const key = data.related[i]; const related = blogDetails[key]; if (!related) return;
      const img = $('.card-img img', card); if (img) { img.src = imgUrl(related.hero, 1200); img.alt = related.heroAlt; img.dataset.seed = related.hero; }
      textIn(card, '.therapy-cat-label', related.category);
      textIn(card, 'h3', related.title);
      const link = $('a.text-link', card); if (link) link.href = `blog-details.html?post=${key}`;
    });

    setText('.cta-band h2', data.cta);
    setText('.cta-band p', data.ctaText);
  }

  initTherapyDetails();
  initTherapyCards();
  initTherapistDetails();
  initBlogDetails();

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
    if (therapy) selectOpt('therapy', therapy);
    if (activeTherapistName) selectOpt('therapist', activeTherapistName);
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
