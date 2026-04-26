(() => {
  'use strict';
  const STORAGE_KEY = 'bvai.accent.color';
  const colors = [
    ['orange', 'Portocaliu'],
    ['blue', 'Albastru'],
    ['green', 'Verde'],
    ['purple', 'Mov'],
    ['pink', 'Roz']
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function applyAccent(value) {
    const accent = colors.some(([id]) => id === value) ? value : 'orange';
    document.body.dataset.accent = accent;
    try { localStorage.setItem(STORAGE_KEY, accent); } catch {}
    $$('.color-swatch').forEach(btn => {
      const active = btn.dataset.accent === accent;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function buildPanel() {
    const career = document.querySelector('.tab-panel[data-panel="career"]');
    if (!career || document.getElementById('accent-color-panel')) return;

    const panel = document.createElement('section');
    panel.id = 'accent-color-panel';
    panel.className = 'p17fc-section color-picker-panel';
    panel.innerHTML = `
      <h3>Culoare interfață</h3>
      <div class="color-picker-row" role="group" aria-label="Alege culoarea interfeței">
        ${colors.map(([id, label]) => `<button class="color-swatch" type="button" data-accent="${id}" aria-label="${label}" title="${label}"></button>`).join('')}
      </div>
      <p class="color-picker-note">Alege culoarea accent pentru butoane, scor, highlight-uri și elementele importante din interfață.</p>
    `;

    const settings = Array.from(career.querySelectorAll('section')).find(sec => /Settings/i.test(sec.textContent || ''));
    if (settings) settings.after(panel);
    else career.prepend(panel);

    $$('.color-swatch', panel).forEach(btn => btn.addEventListener('click', () => applyAccent(btn.dataset.accent)));
  }

  function init() {
    const saved = (() => { try { return localStorage.getItem(STORAGE_KEY) || 'orange'; } catch { return 'orange'; } })();
    applyAccent(saved);
    buildPanel();
    applyAccent(saved);
    document.getElementById('btn-hub')?.addEventListener('click', () => setTimeout(() => { buildPanel(); applyAccent(document.body.dataset.accent); }, 120));
    document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => setTimeout(() => { buildPanel(); applyAccent(document.body.dataset.accent); }, 120)));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
