/* ============================================================
   AYURVEDA — DASHBOARD & ADMIN INTERACTIONS
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const toast = window.ayToast || (() => {});

  /* Sidebar (mobile) */
  const sidebar = $('.app-sidebar'), backdrop = $('.app-backdrop');
  const toggleSidebar = (on) => { sidebar?.classList.toggle('open', on); backdrop?.classList.toggle('show', on); };
  $$('[data-sidebar-toggle]').forEach(b => b.addEventListener('click', () => toggleSidebar(true)));
  backdrop?.addEventListener('click', () => toggleSidebar(false));

  /* Section routing */
  $$('[data-dash-nav]').forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.dashNav;
    $$('[data-dash-nav]').forEach(a => a.classList.toggle('active', a === link));
    $$('.dash-section').forEach(s => s.classList.toggle('active', s.id === target));
    const label = link.dataset.label || link.textContent.trim();
    const t = $('#dash-title'); if (t) t.textContent = label;
    const sub = $('#dash-subtitle'); if (sub) sub.textContent = link.dataset.sub || 'Ayurveda Wellness Portal';
    toggleSidebar(false);
    window.ayReveal?.();
    $('.app-content')?.scrollTo?.({ top: 0, behavior: 'smooth' });
    scrollTo({ top: 0, behavior: 'smooth' });
  }));

  /* Settings tabs */
  $$('[data-setting]').forEach(btn => btn.addEventListener('click', () => {
    $$('[data-setting]').forEach(b => b.classList.toggle('active', b === btn));
    $$('.settings-panel').forEach(p => p.classList.toggle('active', p.id === btn.dataset.setting));
  }));

  /* Switches */
  $$('.switch').forEach(sw => sw.addEventListener('click', () => {
    sw.classList.toggle('on');
    const on = sw.classList.contains('on');
    toast(`${sw.dataset.label || 'Setting'} ${on ? 'enabled' : 'disabled'}`);
  }));

  /* Reschedule / rebook */
  $$('[data-reschedule]').forEach(b => b.addEventListener('click', () => {
    window.ayOpenBooking?.(b.dataset.reschedule);
  }));

  /* Cancel appointment */
  $$('[data-cancel-appt]').forEach(b => b.addEventListener('click', () => {
    const item = b.closest('.appt-item');
    item.style.transition = 'opacity .3s, transform .3s';
    item.style.opacity = '0'; item.style.transform = 'translateX(-14px)';
    setTimeout(() => { item.remove(); toast('Appointment cancelled. Refund initiated.'); }, 320);
  }));

  /* Use package session */
  $$('[data-use-session]').forEach(b => b.addEventListener('click', () => {
    const card = b.closest('.pkg-card');
    const countEl = $('[data-sessions-left]', card);
    const bar = $('.progress > span', card);
    if (!countEl) return;
    const left = Math.max(0, +countEl.textContent - 1);
    countEl.textContent = left;
    const total = +(card.dataset.total || 10);
    if (bar) bar.style.width = `${((total - left) / total) * 100}%`;
    const tl = $('#usage-timeline');
    if (tl) tl.insertAdjacentHTML('afterbegin', `<div class="timeline-item"><b>Session used — ${$('h4', card)?.textContent}</b><span>Just now · ${new Date().toLocaleDateString()}</span></div>`);
    b.textContent = left ? 'Use session' : 'Package exhausted';
    b.disabled = !left;
    toast('Session logged to your wellness timeline.');
  }));

  /* Download receipt / invoice */
  $$('[data-download]').forEach(b => b.addEventListener('click', () => {
    const row = b.closest('tr');
    const cells = row ? [...row.querySelectorAll('td')].map(c => c.textContent.trim()) : [];
    const id = b.dataset.download;
    const content = `AYURVEDA WELLNESS & MASSAGE CENTER\nDigital Receipt / Invoice\n\nReference: ${id}\n${cells.join('\n')}\n\nThank you for choosing authentic Ayurvedic healing.\nGenerated ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Ayurveda-Receipt-${id}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast('Receipt downloaded.');
  }));

  /* Admin: table search + status filter */
  const adminSearch = $('#admin-search');
  adminSearch?.addEventListener('input', () => {
    const q = adminSearch.value.toLowerCase();
    $$('#bookings-table tbody tr').forEach(tr => { tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  });
  $$('[data-status-filter]').forEach(b => b.addEventListener('click', () => {
    $$('[data-status-filter]').forEach(x => x.classList.toggle('active', x === b));
    const f = b.dataset.statusFilter;
    $$('#bookings-table tbody tr').forEach(tr => { tr.style.display = (f === 'all' || tr.dataset.status === f) ? '' : 'none'; });
  }));
  $$('[data-approve]').forEach(b => b.addEventListener('click', () => {
    const row = b.closest('tr'); const st = $('[data-row-status]', row);
    st.textContent = 'Confirmed'; st.className = 'badge green dot'; row.dataset.status = 'confirmed';
    toast('Booking approved and client notified.');
  }));
  $$('[data-decline]').forEach(b => b.addEventListener('click', () => {
    const row = b.closest('tr'); const st = $('[data-row-status]', row);
    st.textContent = 'Cancelled'; st.className = 'badge terra dot'; row.dataset.status = 'cancelled';
    toast('Booking declined.');
  }));
  $$('[data-export]').forEach(btn => btn.addEventListener('click', () => {
    const table = btn.closest('.dash-panel')?.querySelector('table') || $('#bookings-table');
    const rows = table ? $$('tr', table).map(tr => [...tr.children].map(c => `"${c.textContent.trim().replace(/"/g, '""')}"`).join(',')) : ['Report'];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'ayurveda-report.csv'; a.click(); URL.revokeObjectURL(url);
    toast('Report exported to CSV.');
  }));

  /* Maintenance countdown */
  const clock = $('#maint-clock');
  if (clock) {
    const target = Date.now() + (3 * 24 * 60 * 60 + 7 * 60 * 60 + 42 * 60) * 1000;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60;
      $('#cd-days').textContent = String(d).padStart(2, '0');
      $('#cd-hours').textContent = String(h).padStart(2, '0');
      $('#cd-mins').textContent = String(m).padStart(2, '0');
    };
    tick(); setInterval(tick, 60000);
  }
})();
