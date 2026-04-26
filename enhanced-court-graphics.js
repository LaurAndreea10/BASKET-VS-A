(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const style = document.createElement('style');
  style.id = 'stable-public-hotfix-style';
  style.textContent = `
    body::before{content:'STABLE HUB PATCH';position:fixed;right:10px;bottom:10px;z-index:2147483647;background:#ff7a2a;color:#111;padding:6px 10px;border-radius:999px;font:800 11px system-ui;opacity:.85;pointer-events:none}
    #hub{z-index:2147482500!important;pointer-events:auto!important;max-height:92vh!important;overflow:auto!important}
    #hub:not([hidden]){display:block!important}
    .stable-hub-clean .tab-panel:not(.active),.stable-hub-clean [data-panel]:not(.active){display:none!important}
    .stable-hub-clean .stable-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:12px 0}
    .stable-hub-clean .stable-card{background:rgba(17,23,34,.92);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:15px;min-height:112px}
    .stable-hub-clean .stable-card strong{display:block;font-size:18px;margin-bottom:7px;color:#f4f7ff}
    .stable-hub-clean .stable-card p{margin:0 0 10px;color:rgba(244,247,255,.62);line-height:1.35}
    .stable-hub-clean .stable-row{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px}
    .stable-hub-clean .stable-pill{display:inline-flex;border:1px solid rgba(255,210,59,.42);background:rgba(255,210,59,.1);color:#ffd23b;border-radius:999px;padding:6px 10px;font-weight:900;font-size:12px;letter-spacing:.05em}
    .stable-hub-clean .stable-btn{border:1px solid rgba(255,122,42,.7);background:#ff7a2a;color:#111;border-radius:12px;padding:8px 12px;font-weight:900;cursor:pointer}
    .stable-hub-clean .stable-section{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:16px;margin:14px 0}
    .stable-hub-clean .stable-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:12px 0}
    .stable-hub-clean .stable-kpi{background:rgba(17,23,34,.92);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:12px}
    .stable-hub-clean .stable-kpi span{display:block;color:rgba(244,247,255,.55);font-size:11px;text-transform:uppercase;letter-spacing:.14em}.stable-hub-clean .stable-kpi b{font-size:26px;color:#f4f7ff}
    .stable-hub-clean .stable-progress{height:8px;background:#0a0f18;border-radius:999px;overflow:hidden;margin-top:8px}.stable-hub-clean .stable-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4ad9ff,#ff7a2a)}
    .perfect-shot-guide{position:absolute;left:0;right:0;bottom:116px;height:32px;z-index:40;pointer-events:none;display:flex;align-items:center;justify-content:center}
    .perfect-shot-guide .rail{width:min(82%,760px);height:10px;border-radius:999px;background:linear-gradient(90deg,#5fa7ff 0%,#5fa7ff 48%,#ffd23b 48%,#ffd23b 56%,#ff7a2a 56%,#ff7a2a 100%);box-shadow:0 0 0 1px rgba(255,255,255,.16),0 0 18px rgba(255,122,42,.25)}
    .perfect-shot-guide .zone{position:absolute;width:min(12%,110px);height:24px;border:2px solid #ffd23b;border-radius:999px;box-shadow:0 0 16px rgba(255,210,59,.65)}
    .perfect-shot-guide .txt{position:absolute;top:-16px;color:#ffd23b;font:900 11px system-ui;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 0 10px rgba(255,210,59,.6)}
  `;
  document.head.appendChild(style);

  function normalizeText(text) {
    return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function openHub(tab = 'career') {
    const hub = $('#hub');
    if (!hub) return;
    hub.hidden = false;
    hub.removeAttribute('hidden');
    hub.classList.add('stable-hub-clean');
    hub.style.display = 'block';
    hub.style.pointerEvents = 'auto';
    hub.scrollIntoView({ block: 'start', behavior: 'smooth' });
    setTab(tab);
  }

  function closeHub() {
    const hub = $('#hub');
    if (!hub) return;
    hub.hidden = true;
    hub.setAttribute('hidden', '');
    hub.style.display = 'none';
  }

  function setTab(tab) {
    const hub = $('#hub');
    if (!hub) return;
    const panels = $$('[data-panel],.tab-panel', hub);
    const tabs = $$('.tab,[data-tab]', hub);
    tabs.forEach(btn => {
      const btab = btn.dataset.tab || normalizeText(btn.textContent).split(/\s+/)[0];
      btn.classList.toggle('active', btab === tab);
    });
    panels.forEach(panel => {
      const ptab = panel.dataset.panel || panel.id || '';
      panel.classList.toggle('active', ptab === tab);
      panel.hidden = ptab !== tab;
      panel.style.display = ptab === tab ? 'block' : 'none';
    });
  }

  function card(title, desc, price, button = 'Cumpără') {
    return `<article class="stable-card"><strong>${title}</strong><p>${desc}</p><div class="stable-row"><span class="stable-pill">${price}</span><button type="button" class="stable-btn">${button}</button></div></article>`;
  }

  function cleanHubPanels() {
    const hub = $('#hub');
    if (!hub) return;
    hub.classList.add('stable-hub-clean');

    const career = $('[data-panel="career"]', hub);
    if (career) {
      career.innerHTML = `
        <section class="stable-section"><h3>Identitate</h3><div style="display:grid;grid-template-columns:84px 1fr;gap:16px;align-items:center"><div style="width:84px;height:84px;border-radius:22px;background:rgba(255,210,59,.15);border:1px solid rgba(255,210,59,.35);display:grid;place-items:center;font-size:42px">⛹️‍♀️</div><div><h2>Laura #10</h2><p>Nivel 1-2: Rookie · Nivel 3-5: Street Player · Nivel 6-9: Pro · Nivel 10-14: MVP · Nivel 15+: Legend</p><span class="stable-pill">XP 0 / 100</span></div></div></section>
        <section class="stable-section"><h3>Profil jucător</h3><div class="stable-card-grid"><div class="stable-card"><strong>Gen</strong><p>Fată</p></div><div class="stable-card"><strong>Nume</strong><p>Laura</p></div><div class="stable-card"><strong>Număr tricou</strong><p>10</p></div></div><p>Se salvează automat și apare pe tricou în joc.</p></section>
        <div class="stable-kpis"><div class="stable-kpi"><span>Nivel</span><b>1</b></div><div class="stable-kpi"><span>Bani</span><b>150</b></div><div class="stable-kpi"><span>Fani</span><b>0</b></div><div class="stable-kpi"><span>Best</span><b>0</b></div><div class="stable-kpi"><span>Perfecte</span><b>0</b></div><div class="stable-kpi"><span>Inel</span><b>0</b></div><div class="stable-kpi"><span>Bank</span><b>0</b></div><div class="stable-kpi"><span>Combo max</span><b>0</b></div></div>
        <section class="stable-section"><h3>Realizări</h3><div class="stable-card-grid"><div class="stable-card"><strong>🏀 First Bucket</strong><p>Marchează primul coș.</p><span class="stable-pill">Locked</span></div><div class="stable-card"><strong>🔥 On Fire</strong><p>Fă combo x5.</p><span class="stable-pill">Locked</span></div><div class="stable-card"><strong>🏦 Bank Artist</strong><p>10 bank shots total.</p><span class="stable-pill">Locked</span></div><div class="stable-card"><strong>👑 AI Crusher</strong><p>Câștigă pe Pro.</p><span class="stable-pill">Locked</span></div><div class="stable-card"><strong>🏆 Tournament King</strong><p>Câștigă turneul.</p><span class="stable-pill">Locked</span></div><div class="stable-card"><strong>🌟 Legend</strong><p>Ajungi la nivel 10.</p><span class="stable-pill">Locked</span></div></div></section>
        <section class="stable-section"><h3>Settings</h3><div class="stable-card-grid"><div class="stable-card"><strong>Sunet</strong><span class="stable-pill">ON</span></div><div class="stable-card"><strong>Vibrație</strong><span class="stable-pill">ON</span></div><div class="stable-card"><strong>Efecte</strong><span class="stable-pill">HIGH</span></div><div class="stable-card"><strong>Limbă</strong><span class="stable-pill">RO</span></div></div><button type="button" class="stable-btn" id="stable-reset-progress">RESET PROGRES</button></section>
      `;
    }

    const shop = $('[data-panel="shop"]', hub);
    if (shop) {
      shop.innerHTML = `
        <section class="stable-section"><h3>Shop real — upgrade-uri cumpărabile</h3><div class="stable-card-grid">
          ${card('Perfect Assist Lv.1','Zona aurie crește cu +5% per nivel.','Lv 0/5 · 120$')}
          ${card('Power Control','Bara de putere se mișcă mai lent.','Lv 0/5 · 150$')}
          ${card('Wind Shield','Vântul afectează mai puțin mingea.','Lv 0/5 · 140$')}
          ${card('Bank Master','Primești bonus mai mare la bank shot.','Lv 0/4 · 180$')}
          ${card('Clutch Mode','Ultimele 10 secunde pot dubla scorul.','Lv 0/3 · 220$')}
        </div></section>
        <section class="stable-section"><h3>Mingi</h3><div class="stable-card-grid">
          ${card('Classic Ball','Mingea standard.','Owned','Echipat')}
          ${card('🏀 Neon Ball','Look arcade luminos.','220$')}
          ${card('🔥 Fire Ball','Perfectă pentru combo-uri.','360$')}
          ${card('🥇 Gold Ball','Skin premium de status.','520$')}
          ${card('🌌 Galaxy Ball','Ediție cosmică premium.','680$')}
        </div></section>
        <section class="stable-section"><h3>Terenuri și trail-uri</h3><div class="stable-card-grid">
          ${card('Arena','Sala de bază.','Owned','Echipat')}
          ${card('🏙️ Street Court','Teren urban, contrast puternic.','260$')}
          ${card('🌃 Night Court','Cinematic dark mode.','320$')}
          ${card('🔥 Flame Trail','Flacără la aruncare.','300$')}
          ${card('🧊 Ice Trail','Trail rece.','300$')}
          ${card('✨ Star Trail','Scântei stelare.','460$')}
        </div></section>
      `;
    }

    const leader = $('[data-panel="leader"]', hub);
    if (leader) {
      leader.innerHTML = `
        <section class="stable-section"><h3>Clasament</h3><div class="stable-card-grid"><div class="stable-card"><strong>Laura League</strong><p>12</p></div><div class="stable-card"><strong>Rookie Bot</strong><p>10</p></div><div class="stable-card"><strong>Sniper AI</strong><p>8</p></div><div class="stable-card"><strong>Bank Boss</strong><p>6</p></div></div><p>Leaderboard-ul salvează local scorul, data, modul și dificultatea.</p></section>
      `;
    }

    const comp = $('[data-panel="comp"]', hub);
    if (comp) {
      comp.innerHTML = `
        <section class="stable-section"><h3>Daily Missions</h3><p>Daily Streak: 0 zile 🔥 · Total azi +480 bani</p><div class="stable-card-grid"><div class="stable-card"><strong>⬜ Marchează 3 bank shots</strong><p>0 / 3 · +90 bani</p><div class="stable-progress"><i></i></div></div><div class="stable-card"><strong>⬜ Câștigă un meci pe Greu</strong><p>0 / 1 · +120 bani</p><div class="stable-progress"><i></i></div></div><div class="stable-card"><strong>⬜ Fă combo x5</strong><p>0 / 5 · +110 bani</p><div class="stable-progress"><i></i></div></div><div class="stable-card"><strong>⬜ Bate AI-ul la 10 puncte diferență</strong><p>0 / 1 · +160 bani</p><div class="stable-progress"><i></i></div></div></div></section>
        <section class="stable-section"><h3>Turneu</h3><div class="stable-card-grid"><div class="stable-card"><strong>▶ Runda 1 — Rookie Bot</strong><p>Curentă</p></div><div class="stable-card"><strong>🔒 Runda 2 — Sniper AI</strong><p>Blocată</p></div><div class="stable-card"><strong>🔒 Finală — Legend AI</strong><p>Deblocată după runda 2</p></div></div></section>
        <section class="stable-section"><h3>Practice Goals</h3><div class="stable-card-grid"><div class="stable-card"><strong>⬜ 3 perfect shots</strong><p>Recompensă: +25 XP</p></div><div class="stable-card"><strong>⬜ 2 bank shots</strong><p>Învață ricoșeul din panou.</p></div><div class="stable-card"><strong>⬜ Combo x3</strong><p>Ține seria de coșuri.</p></div></div></section>
        <section class="stable-section"><h3>Boss Rush</h3><p>Rookie Bot → Sniper AI → Bank Boss → Legend AI</p><p>O singură viață. Recompensă: +500 bani, +100 fani, badge Boss Slayer.</p><button type="button" class="stable-btn" id="stable-next-match">Joacă următorul meci</button></section>
      `;
    }

    setTab('career');
  }

  function addPerfectGuide() {
    const wrap = $('.court-wrap') || $('.arena');
    if (!wrap || $('.perfect-shot-guide', wrap)) return;
    const guide = document.createElement('div');
    guide.className = 'perfect-shot-guide';
    guide.innerHTML = '<div class="txt">PERFECT</div><div class="rail"></div><div class="zone"></div>';
    wrap.appendChild(guide);
  }

  function patchShootingDistance() {
    const court = $('#court');
    if (!court) return;
    window.BVAI_SHOT_FIX = {
      playerX: 0.34,
      playerY: 0.78,
      hoopX: 0.72,
      hoopY: 0.34,
      minPower: 0.58,
      perfectMin: 0.48,
      perfectMax: 0.56
    };
    const aim = $('#aim');
    if (aim) aim.value = '8';

    document.addEventListener('pointerdown', (ev) => {
      const btn = ev.target.closest('#btn-shoot,#shoot,.big');
      if (!btn) return;
      const fill = $('#power-fill') || $('#fill');
      if (fill) fill.style.width = '52%';
    }, true);
  }

  function bindHubButtons() {
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button,a,[role="button"]');
      if (!btn) return;
      const text = normalizeText(btn.textContent);
      if (btn.id === 'btn-hub' || btn.id === 'btnHub' || text.includes('hub') || text.includes('deschide hub')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        cleanHubPanels();
        openHub('career');
      }
      if (btn.id === 'hub-close' || btn.id === 'closeHub' || text === '✕' || text === 'x') {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        closeHub();
      }
      if (btn.dataset.tab) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        setTab(btn.dataset.tab);
      }
      if (text.includes('reseteaza misiuni') || text.includes('reset progres')) {
        localStorage.removeItem('bvaiStableHub');
        localStorage.removeItem('basketVsAiProgress');
        cleanHubPanels();
        openHub('comp');
      }
      if (text.includes('joaca urmatorul meci') || text.includes('urmatorul adversar')) {
        cleanHubPanels();
        const mode = $('input[name="mode"][value="classic"]');
        if (mode) mode.checked = true;
      }
    }, true);
  }

  function init() {
    cleanHubPanels();
    addPerfectGuide();
    patchShootingDistance();
    bindHubButtons();
    console.info('Stable public hub/gameplay hotfix loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
