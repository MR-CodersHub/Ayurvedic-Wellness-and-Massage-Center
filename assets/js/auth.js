/* ============================================================
   AYURVEDA — AUTHENTICATION INTERACTIONS (frontend only)
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const toast = (msg, type) => {
    if (typeof window.ayToast === 'function') window.ayToast(msg, type);
  };

  const validators = window.ayValidators || {
    required: v => v.trim().length > 0,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: v => /^[\d\s+\-()]{7,20}$/.test(v.trim()),
    min: (v, n) => v.trim().length >= +n,
    match: (v, sel) => { const other = sel && $(sel); return !!other && v.trim() === other.value.trim(); }
  };

  $$('[data-password-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.passwordToggle);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }));

  const forgot = $('[data-forgot-password]');
  if (forgot) forgot.addEventListener('click', e => {
    e.preventDefault();
    toast('Password recovery is not connected yet — please contact hello@ayurveda-wellness.in.');
  });

  $$('.auth-inline-link').forEach(link => link.addEventListener('click', e => e.preventDefault()));

  const checkInput = (input) => {
    const rules = (input.dataset.rule || '').split('|').filter(Boolean);
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
    input.closest('.field')?.classList.toggle('invalid', !valid);
    input.setAttribute('aria-invalid', String(!valid));
    return valid;
  };

  const clearInput = (input) => {
    input.closest('.field')?.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
  };

  $$('form[data-auth-form]').forEach(form => {
    const inputs = $$('[data-rule]', form);
    inputs.forEach(input => {
      input.addEventListener('input', () => clearInput(input));
      if (input.type === 'checkbox') input.addEventListener('change', () => clearInput(input));
    });

    const password = $('#signup-password', form);
    const confirm = $('#signup-confirm', form);
    if (password && confirm) password.addEventListener('input', () => { if (confirm.value) checkInput(confirm); });

    form.addEventListener('submit', e => {
      e.preventDefault();
      let firstInvalid = null;
      inputs.forEach(input => { if (!checkInput(input) && !firstInvalid) firstInvalid = input; });
      if (firstInvalid) {
        toast('Please check the highlighted fields', 'error');
        firstInvalid.focus();
        return;
      }
      window.location.assign(form.dataset.authForm === 'login' ? 'client-dashboard.html' : 'login.html');
    });
  });
})();
