(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const STATE_KEY = 'bvai.state.v4';
  const PROFILE_KEY = 'bvai.player.profile.v1';
  const PRO6_KEY = 'bvai.pro6.audit';

  const UPGRADES = [
    ['stability', 'Perfect Assist Lv.', 'Zona aurie crește cu +5% per nivel.', 'zona +5%', 120, 5],
    ['power', 'Power Control', 'Bara de putere se mișcă mai lent.', 'control', 150, 5],
    ['focus', 'Wind Shield', 'Vântul afectează mai puțin mingea.', 'anti-vânt', 140, 5],
    ['bank', 'Bank Master', 'Primești bonus mai mare la bank shot.', 'bank +', 180, 4],
    ['clutch', 'Clutch Mode', 'Ultimele 10 secunde pot dubla scorul.', 'clutch', 220, 3]
  ];

  const SKINS = {
    ball: [
      ['classic', 'Classic Ball', 'Mingea standard.', 0],
      ['neon', 'Neon Ball', 'Look arcade luminos.', 220],
      ['fire', 'Fire Ball', 'Perfectă pentru combo-uri.', 360],
      ['gold', 'Gold Ball', 'Skin premium de status.', 520],
      ['galaxy', 'Galaxy Ball', 'Ediție cosmică Pro 6.', 680]
    ],
    court: [
      ['arena', 'Arena', 'Sala de bază.', 0],
      ['street', 'Street Court', 'Teren urban.', 260],
      ['cyber', 'Cyber Court', 'Look futurist.', 420],
      ['night', 'Night Court', 'Cinematic dark mode.', 320]
    ],
    trail: [
      ['gold', 'Spark Trail', 'Trail auriu.', 0],
      ['fire', 'Flame Trail', 'Flacără la aruncare.', 300],
      ['ice', 'Ice Trail', 'Trail rece.', 300],
      ['star', 'Star Trail', 'Scântei stelare.', 460]
    ],
    frame: [
      ['basic', 'Basic Frame', 'Rama standard.', 0],
      ['pro', 'Pro Frame', 'Rama portocalie.', 250],
      ['mvp', 'MVP Frame', 'Rama aurie.', 500],
      ['legend', 'Legend Frame', 'Rama final boss.', 900]
    ]
  };

  const AI = [
    ['rookie', 'Rookie Bot', 'Ușor', 'Greșește des, ideal pentru tutorial.', '🤖'],
    ['street', 'Street Bot', 'Normal', 'Joacă rapid și constant.', '🏙️'],
    ['sniper', 'Sniper AI', 'Hard', 'Are multe perfect shots.', '🎯'],
    ['bankboss', 'Bank Boss', 'Bank', 'Primește bonus la bank shots.', '🏦'],
    ['legend', 'Final Boss: Legend AI', 'Boss', 'Clutch, coș mobil și timp scurt.', '👑']
  ];

  const ACH = [
    ['first', 'First Bucket', 'Primul coș.', (s) => (s.totalMade || 0) >= 1],
    ['perfectFive', 'Perfect Five', '5 perfecte total.', (s) => (s.perfectShots || 0) >= 5],
    ['bankArtist', 'Bank Artist', '10 bank shots total.', (s) => (s.bankShots || 0) >= 10],
    ['crusher', 'AI Crusher', 'Câștigă pe Pro.', (s) => (s.proWins || 0) >= 1],
    ['tournament', 'Tournament King', 'Câștigă turneul.', (s) => (s.tournamentWins || 0) >= 1],
    ['legend', 'Legend', 'Ajungi la nivel 10.', (s) => (s.level || 1) >= 10]
  ];

  function read(key, fallback = {}) {
    try { return { ...fallback, ...(JSON.parse(localStorage.getItem(key)) || {}) }; } catch { return { ...fallback }; }
  }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function state() {
    const s = read(STATE_KEY, {});
    s.upgrades ||= {};
    s.skins ||= { ball: 'classic', court: 'arena', trail: 'gold', frame: 'basic' };
    s.ownedSkins ||= { ball: ['classic'], court: ['arena'], trail: ['gold'], frame: ['basic'] };
    s.daily ||= { date: '', missions: [] };
    s.achievements ||= {};
    s.leaderboard ||= [];
    return s;
  }
  function writeState(s) { save(STATE_KEY, s); }
  function money(s) { return Number(s.money || 0); }
  function lvl(s, id) { return Number(s.upgrades?.[id] || 0); }
  function cost(base, current) { return Math.round(base * Math.pow(1.55, current)); }
  function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }

  function ensureDaily(s) {
    if (s.daily?.date === today() && s.daily.missions?.length) return s;
    s.daily = {
      date: today(),
      missions: [
        { id: 'perfect5', name: 'Fă 5 aruncări perfecte', type: 'perfect', target: 5, progress: Math.min(5, Number(s.perfectShots || 0)), reward: 50, done: false },
        { id: 'hardWin', name: 'Câștigă un meci pe Greu', type: 'hardWin', target: 1, progress: 0, reward: 80, done: false },
        { id: 'combo5', name: 'Fă combo x5', type: 'combo', target: 5, progress: Math.min(5, Number(s.bestCombo || 0)), reward: 70, done: false },
        { id: 'bank3', name: 'Marchează 3 bank shots', type: 'bank', target: 3, progress: Math.min(3, Number(s.bankShots || 0)), reward: 60, done: false },
        { id: 'blitz', name: 'Bate AI-ul în Blitz', type: 'blitzWin', target: 1, progress: 0, reward: 90, done: false }
      ]
    };
    writeState(s);
    return s;
  }

  function updateMissionProgressFromTotals(s) {
    ensureDaily(s);
    for (const m of s.daily.missions) {
      if (m.type === 'perfect') m.progress = Math.min(m.target, Math.max(Number(m.progress || 0), Number(s.perfectShots || 0)));
      if (m.type === 'bank') m.progress = Math.min(m.target, Math.max(Number(m.progress || 0), Number(s.bankShots || 0)));
      if (m.type === 'combo') m.progress = Math.min(m.target, Math.max(Number(m.progress || 0), Number(s.bestCombo || 0)));
      if (!m.done && Number(m.progress || 0) >= Number(m.target || 1)) {
        m.done = true;
        s.money = money(s) + Number(m.reward || 0);
        s.xp = Number(s.xp || 0) + Math.round(Number(m.reward || 0) / 2);
      }
    }
    writeState(s);
  }

  function injectFooterVersion() {
    const muted = document.querySelector('.footer .muted');
    if (muted) {
      muted.textContent = 'v2.1 · Enhanced Pro 6';
      muted.classList.add('pro6-footer-mark');
    }
  }

  function injectShop() {
    const shopPanel = document.querySelector('.tab-panel[data-panel="shop"]');
    if (!shopPanel) return;
    let s = state();
    updateMissionProgressFromTotals(s);
    s = state();

    let panel = $('#pro6-shop-real');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'pro6-shop-real';
      panel.className = 'pro6-panel';
      shopPanel.prepend(panel);
    }
    panel.innerHTML = `<h3>Shop real — upgrade-uri cumpărabile</h3><div class="pro6-grid">${UPGRADES.map(([id, name, desc, tag, base, max]) => {
      const current = lvl(s, id);
      const isMax = current >= max;
      const price = cost(base, current);
      return `<article class="pro6-card"><strong>${name}${id === 'stability' ? current + 1 : ''}</strong><small>${desc}</small><div class="meta"><span class="pro6-pill">Lv ${current}/${max} · ${tag}</span><button class="pro6-buy" data-pro6-buy="${id}" ${isMax ? 'disabled' : ''}>${isMax ? 'MAX' : price + '$'}</button></div></article>`;
    }).join('')}</div>`;

    panel.querySelectorAll('[data-pro6-buy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pro6Buy;
        const item = UPGRADES.find((x) => x[0] === id);
        if (!item) return;
        const s2 = state();
        const current = lvl(s2, id);
        const price = cost(item[4], current);
        if (current >= item[5]) return;
        if (money(s2) < price) {
          toast('Fonduri insuficiente', 'bad');
          return;
        }
        s2.money = money(s2) - price;
        s2.upgrades[id] = current + 1;
        writeState(s2);
        toast(`Cumpărat: ${item[1].replace('Lv.', '')}`, 'gold');
        refreshAll();
      });
    });

    let skinPanel = $('#pro6-skins-real');
    if (!skinPanel) {
      skinPanel = document.createElement('section');
      skinPanel.id = 'pro6-skins-real';
      skinPanel.className = 'pro6-panel';
      panel.insertAdjacentElement('afterend', skinPanel);
    }
    const skinHtml = Object.entries(SKINS).map(([type, items]) => `
      <h3>${type === 'ball' ? 'Mingi' : type === 'court' ? 'Terenuri' : type === 'trail' ? 'Trail-uri' : 'Rame profil'}</h3>
      <div class="pro6-grid">${items.map(([id, name, desc, price]) => {
        const owned = (s.ownedSkins?.[type] || []).includes(id);
        const equipped = s.skins?.[type] === id;
        return `<article class="pro6-card"><div class="pro6-skin-preview ${id}"></div><strong>${name}</strong><small>${desc}</small><div class="meta"><span class="pro6-pill">${owned ? 'Owned' : price + '$'}</span><button class="pro6-equip" data-skin-type="${type}" data-skin-id="${id}" ${equipped ? 'disabled' : ''}>${equipped ? 'Echipat' : owned ? 'Echipează' : 'Cumpără'}</button></div></article>`;
      }).join('')}</div>`).join('');
    skinPanel.innerHTML = skinHtml;
    skinPanel.querySelectorAll('[data-skin-type]').forEach((btn) => btn.addEventListener('click', () => buyOrEquipSkin(btn.dataset.skinType, btn.dataset.skinId)));
  }

  function buyOrEquipSkin(type, id) {
    const s = state();
    s.skins ||= {};
    s.ownedSkins ||= {};
    s.ownedSkins[type] ||= [];
    const item = SKINS[type].find((x) => x[0] === id);
    if (!item) return;
    const owned = s.ownedSkins[type].includes(id);
    if (!owned) {
      const price = Number(item[3] || 0);
      if (money(s) < price) {
        toast('Fonduri insuficiente', 'bad');
        return;
      }
      s.money = money(s) - price;
      s.ownedSkins[type].push(id);
      toast(`Cumpărat: ${item[1]}`, 'gold');
    }
    s.skins[type] = id;
    writeState(s);
    refreshAll();
  }

  function injectDaily() {
    const compPanel = document.querySelector('.tab-panel[data-panel="comp"]');
    if (!compPanel) return;
    const s = state();
    updateMissionProgressFromTotals(s);
    const fresh = state();
    let panel = $('#pro6-daily-real');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'pro6-daily-real';
      panel.className = 'pro6-panel';
      const dailyList = $('#daily-list');
      dailyList ? dailyList.insertAdjacentElement('beforebegin', panel) : compPanel.prepend(panel);
    }
    panel.innerHTML = `<h3>Misiuni zilnice cu progres</h3><div class="pro6-grid">${fresh.daily.missions.map((m) => {
      const pct = Math.min(100, Number(m.progress || 0) / Math.max(1, Number(m.target || 1)) * 100);
      return `<article class="pro6-card pro6-daily-card ${m.done ? 'done' : ''}"><strong>${m.name}</strong><small>${m.progress || 0} / ${m.target} · Recompensă: +${m.reward} bani</small><div class="pro6-progress"><b style="width:${pct}%"></b></div><div class="meta"><span class="pro6-pill">${m.done ? 'Completă' : Math.round(pct) + '%'}</span></div></article>`;
    }).join('')}</div>`;
  }

  function injectAI() {
    const compPanel = document.querySelector('.tab-panel[data-panel="comp"]');
    if (!compPanel) return;
    let panel = $('#pro6-ai-real');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'pro6-ai-real';
      panel.className = 'pro6-panel';
      const tour = $('#tour-bracket');
      tour ? tour.insertAdjacentElement('beforebegin', panel) : compPanel.appendChild(panel);
    }
    panel.innerHTML = `<h3>AI cu personalități</h3><div class="pro6-grid">${AI.map(([id, name, diff, desc, icon]) => `<article class="pro6-card pro6-ai-card ${id === 'legend' ? 'boss' : ''}"><div class="avatar">${icon}</div><strong>${name}</strong><small>${desc}</small><div class="meta"><span class="pro6-pill">${diff}</span></div></article>`).join('')}</div>`;
  }

  function injectAchievements() {
    const career = document.querySelector('.tab-panel[data-panel="career"]');
    if (!career) return;
    const s = state();
    let panel = $('#pro6-achievements-real');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'pro6-achievements-real';
      panel.className = 'pro6-panel';
      const list = $('#achv-list');
      list ? list.insertAdjacentElement('beforebegin', panel) : career.appendChild(panel);
    }
    panel.innerHTML = `<h3>Achievement-uri complete</h3><div class="pro6-grid">${ACH.map(([id, name, desc, check]) => `<article class="pro6-card pro6-ach ${check(s) ? 'done' : ''}"><strong>${name}</strong><small>${desc}</small><div class="meta"><span class="pro6-pill">${check(s) ? 'Deblocat' : 'Locked'}</span></div></article>`).join('')}</div>`;
  }

  function enhanceFinalScreen() {
    const observer = new MutationObserver(() => {
      const box = $('.after-box');
      if (!box || box.dataset.pro6Final) return;
      box.dataset.pro6Final = '1';
      const strongs = $$('.after-stat strong', box).map((x) => x.textContent);
      const accuracy = parseInt(strongs[0], 10) || 0;
      const perfect = parseInt(strongs[1], 10) || 0;
      const bank = parseInt(strongs[2], 10) || 0;
      const combo = parseInt(strongs[3], 10) || 0;
      const rating = accuracy >= 90 || combo >= 10 ? 'LEGEND' : accuracy >= 80 || combo >= 6 ? 'S' : accuracy >= 65 ? 'A' : accuracy >= 45 ? 'B' : 'C';
      const score = box.querySelector('p strong')?.textContent || '0-0';
      const extra = document.createElement('section');
      extra.className = 'pro6-final-plus';
      extra.innerHTML = `<h3>Rezumat Pro 6</h3><strong>Tu ${score.replace('-', ' - ')} AI</strong><div class="pro6-final-row"><div><span>Perfecte</span><b>${perfect}</b></div><div><span>Bank</span><b>${bank}</b></div><div><span>Combo max</span><b>${combo}</b></div><div><span>Acuratețe</span><b>${accuracy}%</b></div></div><div class="pro6-rating">Rating <b>${rating}</b></div>`;
      box.querySelector('.after-grid')?.insertAdjacentElement('afterend', extra);
      try { navigator.vibrate?.(rating === 'LEGEND' || rating === 'S' ? [35, 35, 80] : 30); } catch {}
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function ensureSuddenDeathVisibility() {
    const modeField = document.querySelector('.chipset');
    if (!modeField) return;
    if (!document.querySelector('input[name="mode"][value="sudden"]')) {
      const label = document.createElement('label');
      label.innerHTML = '<input type="radio" name="mode" value="sudden"><span>Sudden Death</span>';
      modeField.appendChild(label);
    }
  }

  function injectSaveStatus() {
    const career = document.querySelector('.tab-panel[data-panel="career"]');
    if (!career || $('#pro6-save-status')) return;
    const panel = document.createElement('section');
    panel.id = 'pro6-save-status';
    panel.className = 'pro6-panel';
    panel.innerHTML = `<h3>Salvare progres localStorage</h3><div class="pro6-status"><div><b>✓</b> nivel, XP, bani, fani</div><div><b>✓</b> best score și leaderboard</div><div><b>✓</b> upgrade-uri și skin-uri</div><div><b>✓</b> realizări și daily progress</div></div>`;
    career.appendChild(panel);
  }

  function toast(message, kind = '') {
    const old = $('#toast');
    if (old) {
      old.textContent = message;
      old.className = `toast ${kind}`.trim();
      old.hidden = false;
      requestAnimationFrame(() => old.classList.add('show'));
      setTimeout(() => old.classList.remove('show'), 1400);
    }
  }

  function refreshStats() {
    const s = state();
    $('#kpi-money') && ($('#kpi-money').textContent = Number(s.money || 0).toLocaleString('ro-RO'));
    $('#kpi-level') && ($('#kpi-level').textContent = s.level || 1);
    $('#kpi-fans') && ($('#kpi-fans').textContent = Number(s.fans || 0).toLocaleString('ro-RO'));
    $('#hs-level') && ($('#hs-level').textContent = s.level || 1);
    $('#hs-xp') && ($('#hs-xp').textContent = Number(s.xp || 0).toLocaleString('ro-RO'));
    $('#hs-fans') && ($('#hs-fans').textContent = Number(s.fans || 0).toLocaleString('ro-RO'));
    $('#hs-best') && ($('#hs-best').textContent = Number(s.bestScore || 0).toLocaleString('ro-RO'));
  }

  function refreshAll() {
    refreshStats();
    injectShop();
    injectDaily();
    injectAI();
    injectAchievements();
    injectSaveStatus();
    injectFooterVersion();
    save(PRO6_KEY, { version: 'pro-6', shop: true, daily: true, finalScreen: true, ai: true, skins: true, animations: true, achievements: true, localStorage: true, suddenDeath: true, footer: true });
  }

  function bindRefresh() {
    $('#btn-hub')?.addEventListener('click', () => setTimeout(refreshAll, 120));
    $$('.tab').forEach((tab) => tab.addEventListener('click', () => setTimeout(refreshAll, 120)));
    setInterval(() => {
      const s = state();
      updateMissionProgressFromTotals(s);
      refreshStats();
    }, 2500);
  }

  function init() {
    ensureSuddenDeathVisibility();
    injectFooterVersion();
    enhanceFinalScreen();
    bindRefresh();
    refreshAll();
    console.info('Basket vs AI Enhanced Pro 6 layer loaded');
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
