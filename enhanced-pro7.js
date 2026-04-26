(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const STATE_KEY = 'bvai.state.v4';
  const PROFILE_KEY = 'bvai.player.profile.v1';
  const PRO7_KEY = 'bvai.pro7.audit';

  const UPGRADES = [
    { id: 'stability', name: 'Perfect Assist Lv.1', desc: 'Zona aurie este cu 5% mai mare per nivel.', price: 100, max: 5 },
    { id: 'power', name: 'Power Control', desc: 'Bara de putere se mișcă mai lent.', price: 120, max: 5 },
    { id: 'focus', name: 'Wind Shield', desc: 'Vântul te afectează mai puțin.', price: 150, max: 5 },
    { id: 'bank', name: 'Bank Master', desc: 'Bank shot-urile dau bonus mai mare.', price: 180, max: 4 },
    { id: 'clutch', name: 'Clutch Mode', desc: 'Ultimele 10 secunde dau bonus de scor.', price: 220, max: 3 }
  ];

  const MISSIONS = [
    { id: 'perfect5', name: 'Marchează 5 coșuri perfecte', type: 'perfectShots', target: 5, reward: 50 },
    { id: 'combo4', name: 'Fă combo x4', type: 'bestCombo', target: 4, reward: 50 },
    { id: 'hardWin', name: 'Câștigă un meci pe Greu', type: 'hardWins', target: 1, reward: 80 },
    { id: 'bank3', name: 'Marchează 3 bank shots', type: 'bankShots', target: 3, reward: 60 },
    { id: 'blitzWin', name: 'Bate AI-ul în Blitz', type: 'blitzWins', target: 1, reward: 90 }
  ];

  const AI = [
    ['rookie', 'Rookie Bot', 'Ușor', 'Ratează des și e bun pentru antrenament.', '🤖'],
    ['sniper', 'Sniper AI', 'Perfect', 'Foarte bun la aruncări perfecte.', '🎯'],
    ['bank', 'Bank Boss', 'Bank', 'Primește bonus la bank shots.', '🏦'],
    ['wind', 'Wind Hacker', 'Vânt', 'Are avantaj în Vânt haotic.', '💨'],
    ['legend', 'Legend AI', 'Final Boss', 'Boss final cu clutch și presiune mare.', '👑']
  ];

  const ACH = [
    ['first', '🏀 First Bucket', 'Marchează primul coș.', (s) => (s.totalMade || 0) >= 1],
    ['fire', '🔥 On Fire', 'Fă combo x5.', (s) => (s.bestCombo || 0) >= 5],
    ['crusher', '👑 AI Crusher', 'Câștigă pe Pro.', (s) => (s.proWins || 0) >= 1],
    ['king', '🏆 Tournament King', 'Câștigă turneul.', (s) => (s.tournamentWins || 0) >= 1],
    ['perfect', '✨ Perfect Five', '5 perfecte total.', (s) => (s.perfectShots || 0) >= 5],
    ['legend', '🌟 Legend', 'Ajungi la nivel 10.', (s) => (s.level || 1) >= 10]
  ];

  function read(key, fallback = {}) {
    try { return deepMerge(fallback, JSON.parse(localStorage.getItem(key)) || {}); }
    catch { return structuredClone(fallback); }
  }
  function deepMerge(base, patch) {
    const out = Array.isArray(base) ? [...base] : { ...base };
    for (const [k, v] of Object.entries(patch || {})) out[k] = v && typeof v === 'object' && !Array.isArray(v) && base[k] ? deepMerge(base[k], v) : v;
    return out;
  }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function state() {
    const s = read(STATE_KEY, {});
    s.money = Number(s.money || 0);
    if (s.money < 100 && !s.pro7StarterBonus) { s.money += 250; s.pro7StarterBonus = true; }
    s.upgrades ||= {};
    s.daily ||= { date: '', missions: [] };
    s.achievements ||= {};
    s.pro7Stats ||= { hardWins: 0, blitzWins: 0 };
    return s;
  }
  function writeState(s) { save(STATE_KEY, s); }
  function profile() { return read(PROFILE_KEY, { name: 'Laura', gender: 'girl', number: 10 }); }
  function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function money(s) { return Number(s.money || 0); }
  function level(s, id) { return Number(s.upgrades?.[id] || 0); }
  function upgradeCost(item, lvl) { return Math.round(item.price * Math.pow(1.5, lvl)); }
  function rank(s) {
    const l = Number(s.level || 1);
    if (l >= 15) return 'Legend';
    if (l >= 10) return 'MVP';
    if (l >= 6) return 'Pro';
    if (l >= 3) return 'Street Player';
    return 'Rookie';
  }

  function ensureDaily(s) {
    if (s.daily?.date !== today() || !s.daily?.missions?.length) {
      s.daily = { date: today(), missions: MISSIONS.map((m) => ({ ...m, progress: 0, done: false })) };
    }
    for (const m of s.daily.missions) {
      const value = m.type === 'hardWins' || m.type === 'blitzWins' ? Number(s.pro7Stats?.[m.type] || 0) : Number(s[m.type] || 0);
      m.progress = Math.min(m.target, Math.max(Number(m.progress || 0), value));
      if (!m.done && m.progress >= m.target) {
        m.done = true;
        s.money = money(s) + Number(m.reward || 0);
        s.xp = Number(s.xp || 0) + Math.round(Number(m.reward || 0) / 2);
      }
    }
    writeState(s);
  }

  function setText(sel, value) { const el = $(sel); if (el) el.textContent = value; }
  function toast(msg, kind = '') {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast ${kind}`.trim();
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => el.classList.remove('show'), 1500);
  }

  function injectBaseHtmlPlaceholders() {
    const achv = $('#achv-list');
    if (achv && !achv.dataset.pro7) {
      achv.dataset.pro7 = '1';
      achv.innerHTML = ACH.slice(0, 4).map((a) => `<li><strong>${a[1]}</strong><em>${a[2]}</em><span class="pts">—</span></li>`).join('');
    }
    const shop = $('#shop-list');
    if (shop && !shop.dataset.pro7) {
      shop.dataset.pro7 = '1';
      shop.innerHTML = UPGRADES.slice(0, 4).map((u) => `<li><strong>${u.name} — ${u.price} bani</strong><em>${u.desc}</em><button disabled>Hub</button></li>`).join('');
    }
    const daily = $('#daily-list');
    if (daily && !daily.dataset.pro7) {
      daily.dataset.pro7 = '1';
      daily.innerHTML = MISSIONS.slice(0, 3).map((m) => `<li><strong>${m.name}</strong><div class="pbar"><div class="pfill" style="width:0%"></div></div><div class="pmeta">0 / ${m.target} · +${m.reward} bani</div></li>`).join('');
    }
    const tour = $('#tour-bracket');
    if (tour && !tour.dataset.pro7) {
      tour.dataset.pro7 = '1';
      tour.innerHTML = AI.map((a, i) => `<div class="tour-row"><div class="name you">Runda ${i + 1}</div><div class="vs">vs</div><div class="name">${a[4]} ${a[1]}</div></div>`).join('');
    }
    const league = $('#league-list');
    if (league && !league.dataset.pro7) {
      league.dataset.pro7 = '1';
      league.innerHTML = ['Laura League', 'Rookie Bot', 'Sniper AI', 'Bank Boss', 'Legend AI'].map((n, i) => `<li class="${i === 0 ? 'you' : ''}"><span>${i + 1}</span><strong>${n}</strong><span class="pts">${Math.max(0, 12 - i * 2)}</span></li>`).join('');
    }
  }

  function injectMode() {
    const field = document.querySelector('.chipset');
    if (!field || document.querySelector('input[name="mode"][value="sudden"]')) return;
    const label = document.createElement('label');
    label.innerHTML = '<input type="radio" name="mode" value="sudden"><span>Sudden Death</span>';
    field.appendChild(label);
  }

  function injectAvatarRank() {
    const career = $('.tab-panel[data-panel="career"]');
    if (!career || $('#pro7-avatar-rank')) return;
    const s = state();
    const p = profile();
    const card = document.createElement('section');
    card.id = 'pro7-avatar-rank';
    card.className = 'pro7-section pro7-avatar-card';
    card.innerHTML = `<div class="pro7-avatar">${p.gender === 'boy' ? '⛹️‍♂️' : '⛹️‍♀️'}</div><div><h3>Avatar și rang</h3><strong>${p.name || 'Player'} #${p.number || 10}</strong><small>Nivel 1-2: Rookie · 3-5: Street Player · 6-9: Pro · 10-14: MVP · 15+: Legend</small><br><span class="pro7-rank">${rank(s)}</span></div>`;
    career.prepend(card);
  }

  function renderAchievements() {
    const career = $('.tab-panel[data-panel="career"]');
    if (!career) return;
    const s = state();
    let panel = $('#pro7-achievements');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'pro7-achievements';
      panel.className = 'pro7-section';
      const old = $('#achv-list');
      old ? old.insertAdjacentElement('beforebegin', panel) : career.appendChild(panel);
    }
    panel.innerHTML = `<h3>Realizări</h3><div class="pro7-grid">${ACH.map((a) => `<article class="pro7-card pro7-ach ${a[3](s) ? 'pro7-done' : ''}"><strong>${a[1]}</strong><small>${a[2]}</small><div class="pro7-row"><span class="pro7-pill">${a[3](s) ? 'Deblocat' : 'Locked'}</span></div></article>`).join('')}</div>`;
  }

  function renderShop() {
    const shopPanel = $('.tab-panel[data-panel="shop"]');
    if (!shopPanel) return;
    const s = state();
    let panel = $('#pro7-shop');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'pro7-shop';
      panel.className = 'pro7-section';
      shopPanel.prepend(panel);
    }
    panel.innerHTML = `<h3>Îmbunătățiri cumpărabile</h3><div class="pro7-grid">${UPGRADES.map((item) => {
      const lvl = level(s, item.id);
      const max = lvl >= item.max;
      const price = upgradeCost(item, lvl);
      return `<article class="pro7-card"><strong>${item.name.replace('Lv.1', `Lv.${lvl + 1}`)}</strong><small>${item.desc}</small><div class="pro7-row"><span class="pro7-pill">Lv ${lvl}/${item.max}</span><button class="pro7-btn" data-buy="${item.id}" ${max ? 'disabled' : ''}>${max ? 'MAX' : price + ' bani'}</button></div></article>`;
    }).join('')}</div>`;
    panel.querySelectorAll('[data-buy]').forEach((btn) => btn.addEventListener('click', () => buyUpgrade(btn.dataset.buy)));
  }

  function buyUpgrade(id) {
    const item = UPGRADES.find((u) => u.id === id);
    if (!item) return;
    const s = state();
    const lvl = level(s, id);
    const price = upgradeCost(item, lvl);
    if (lvl >= item.max) return;
    if (money(s) < price) return toast('Fonduri insuficiente', 'bad');
    s.money -= price;
    s.upgrades[id] = lvl + 1;
    writeState(s);
    toast(`Cumpărat: ${item.name.replace('Lv.1', '')}`, 'gold');
    refreshAll();
  }

  function renderDaily() {
    const comp = $('.tab-panel[data-panel="comp"]');
    if (!comp) return;
    const s = state();
    ensureDaily(s);
    const fresh = state();
    let panel = $('#pro7-daily');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'pro7-daily';
      panel.className = 'pro7-section';
      const old = $('#daily-list');
      old ? old.insertAdjacentElement('beforebegin', panel) : comp.prepend(panel);
    }
    const total = fresh.daily.missions.reduce((sum, m) => sum + Number(m.reward || 0), 0);
    panel.innerHTML = `<h3>Provocări zilnice</h3><div class="pro7-grid">${fresh.daily.missions.slice(0, 5).map((m) => {
      const pct = Math.min(100, Number(m.progress || 0) / Math.max(1, Number(m.target || 1)) * 100);
      return `<article class="pro7-card ${m.done ? 'pro7-done' : ''}"><strong>${m.done ? '✅' : '⬜'} ${m.name}</strong><small>${m.progress || 0} / ${m.target} · Recompensă: +${m.reward} bani</small><div class="pro7-progress"><b style="width:${pct}%"></b></div><div class="pro7-row"><span class="pro7-pill">${Math.round(pct)}%</span></div></article>`;
    }).join('')}</div><p class="muted small">Recompensă totală: +${total} bani</p>`;
  }

  function renderAI() {
    const comp = $('.tab-panel[data-panel="comp"]');
    if (!comp) return;
    let panel = $('#pro7-ai');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'pro7-ai';
      panel.className = 'pro7-section';
      const tour = $('#tour-bracket');
      tour ? tour.insertAdjacentElement('beforebegin', panel) : comp.appendChild(panel);
    }
    panel.innerHTML = `<h3>Adversari AI cu personalitate</h3><div class="pro7-grid">${AI.map((a) => `<article class="pro7-card ${a[0] === 'legend' ? 'pro7-ai-boss' : ''}"><div class="pro7-ai-avatar">${a[4]}</div><strong>${a[1]}</strong><small>${a[3]}</small><div class="pro7-row"><span class="pro7-pill">${a[2]}</span></div></article>`).join('')}</div>`;
  }

  function renderReset() {
    const career = $('.tab-panel[data-panel="career"]');
    if (!career || $('#pro7-reset')) return;
    const btn = document.createElement('button');
    btn.id = 'pro7-reset';
    btn.className = 'pro7-reset';
    btn.textContent = 'Reset progres';
    btn.addEventListener('click', () => {
      if (!confirm('Sigur vrei să ștergi progresul?')) return;
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem('bvai.state.v2');
      toast('Progres resetat', 'bad');
      setTimeout(() => location.reload(), 500);
    });
    career.appendChild(btn);
  }

  function tutorialButton() {
    if ($('#btn-pro7-tutorial')) return;
    const help = $('#btn-help');
    const btn = document.createElement('button');
    btn.id = 'btn-pro7-tutorial';
    btn.className = 'iconbtn';
    btn.title = 'Tutorial jucabil';
    btn.textContent = '🎯';
    help?.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', startTutorial);
  }

  function startTutorial() {
    const classic = document.querySelector('input[name="mode"][value="classic"]');
    if (classic) classic.checked = true;
    $('#btn-play')?.click();
    setTimeout(() => tutorialStep(0), 280);
  }

  function tutorialStep(i) {
    const wrap = $('.court-wrap');
    if (!wrap) return;
    let box = $('#pro7-tutorial');
    if (!box) {
      box = document.createElement('div');
      box.id = 'pro7-tutorial';
      box.className = 'pro7-tutorial';
      wrap.appendChild(box);
    }
    const steps = [
      ['Prima aruncare: țintire ghidată', 'Folosește sliderul sau ◀ ▶ și urmărește linia punctată.'],
      ['A doua aruncare: putere ghidată', 'Ține apăsat ARUNCĂ și eliberează când bara ajunge în zona aurie.'],
      ['A treia aruncare: bank shot', 'Alege un unghi mai larg ca mingea să atingă panoul.'],
      ['Recompensă tutorial', 'Finalizează tutorialul și primești +50 bani.']
    ];
    const [title, body] = steps[Math.min(i, steps.length - 1)];
    box.innerHTML = `<strong>${title}</strong><p>${body}</p><div class="pro7-tutorial-actions"><button class="btn ghost" id="pro7-tut-close">Închide</button><button class="btn primary" id="pro7-tut-next">${i >= steps.length - 1 ? 'Finalizează +50' : 'Următorul'}</button></div>`;
    $('#pro7-tut-close')?.addEventListener('click', () => box.remove());
    $('#pro7-tut-next')?.addEventListener('click', () => {
      if (i >= steps.length - 1) {
        const s = state();
        if (!s.pro7TutorialReward) {
          s.money = money(s) + 50;
          s.pro7TutorialReward = true;
          writeState(s);
          toast('+50 bani tutorial', 'gold');
        }
        box.remove();
        refreshAll();
      } else tutorialStep(i + 1);
    });
  }

  function bigFx(text) {
    const wrap = $('.court-wrap');
    if (!wrap) return;
    let fx = $('#pro7-bigfx');
    if (!fx) {
      fx = document.createElement('div');
      fx.id = 'pro7-bigfx';
      fx.className = 'pro7-bigfx';
      wrap.appendChild(fx);
    }
    fx.textContent = text;
    fx.classList.remove('show');
    void fx.offsetWidth;
    fx.classList.add('show');
    try { navigator.vibrate?.([30, 30, 70]); } catch {}
  }

  function observeEffects() {
    const toastEl = $('#toast');
    if (toastEl) {
      new MutationObserver(() => {
        const msg = toastEl.textContent || '';
        if (/PERFECT/i.test(msg)) {
          bigFx('PERFECT!');
          $('.court-wrap')?.classList.add('pro7-perfect');
          setTimeout(() => $('.court-wrap')?.classList.remove('pro7-perfect'), 500);
        }
        if (/Combo x5|ON FIRE/i.test(msg)) bigFx('ON FIRE!');
        if (/Combo x10|UNSTOPPABLE|LEGEND/i.test(msg)) bigFx('LEGEND x10');
        if (/SWISH|PERFECT/i.test(msg)) try { navigator.vibrate?.(35); } catch {}
      }).observe(toastEl, { childList: true, characterData: true, subtree: true });
    }
  }

  function finalScreenObserver() {
    const observer = new MutationObserver(() => {
      const box = $('.after-box');
      if (!box || box.dataset.pro7) return;
      box.dataset.pro7 = '1';
      const score = box.querySelector('p strong')?.textContent || box.querySelector('p')?.textContent?.match(/\d+[-–]\d+/)?.[0] || `${$('#sb-you')?.textContent || 0}-${$('#sb-ai')?.textContent || 0}`;
      const vals = $$('.after-stat strong', box).map((x) => x.textContent);
      const acc = parseInt(vals[0], 10) || 0;
      const perfect = parseInt(vals[1], 10) || 0;
      const bank = parseInt(vals[2], 10) || 0;
      const combo = parseInt(vals[3], 10) || 0;
      const rating = acc >= 90 || combo >= 10 ? 'LEGEND' : acc >= 80 || combo >= 6 ? 'S' : acc >= 65 ? 'A' : acc >= 45 ? 'B' : 'C';
      showFinal({ title: box.querySelector('h2')?.textContent || 'Final', score, xp: findPlus(box, 'XP'), money: findMoneyFans(box)[0], fans: findMoneyFans(box)[1], perfect, bank, combo, rating });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function findPlus(box, label) {
    const stat = $$('.after-stat', box).find((x) => x.textContent.includes(label));
    return stat?.querySelector('strong')?.textContent || '+0';
  }
  function findMoneyFans(box) {
    const stat = $$('.after-stat', box).find((x) => x.textContent.includes('Bani'));
    const text = stat?.querySelector('strong')?.textContent || '+0$ · +0';
    const m = text.match(/\+?([\d]+)\$/);
    const f = text.match(/·\s*\+?([\d]+)/);
    return [`+${m?.[1] || 0}$`, `+${f?.[1] || 0}`];
  }

  function showFinal(data) {
    let modal = $('#pro7-final');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pro7-final';
      modal.className = 'pro7-final';
      document.body.appendChild(modal);
    }
    modal.hidden = false;
    modal.innerHTML = `<div class="pro7-final-box"><h2>${data.title}</h2><div class="pro7-score">Tu ${String(data.score).replace('-', ' - ')} AI</div><div class="pro7-final-grid"><div class="pro7-final-stat"><span>XP</span><b>${data.xp}</b></div><div class="pro7-final-stat"><span>Bani</span><b>${data.money}</b></div><div class="pro7-final-stat"><span>Fani</span><b>${data.fans}</b></div><div class="pro7-final-stat"><span>Perfecte</span><b>${data.perfect}</b></div><div class="pro7-final-stat"><span>Bank</span><b>${data.bank}</b></div><div class="pro7-final-stat"><span>Combo max</span><b>${data.combo}</b></div></div><div class="pro7-rating">Rating <b>${data.rating}</b></div><div class="pro7-final-actions"><button class="btn ghost" id="pro7-final-hub">Hub</button><button class="btn primary" id="pro7-final-again">Joacă iar</button></div></div>`;
    $('#pro7-final-hub')?.addEventListener('click', () => { modal.hidden = true; $('#btn-hub')?.click(); });
    $('#pro7-final-again')?.addEventListener('click', () => { modal.hidden = true; $('#btn-play')?.click(); });
  }

  function scoreboardAIName() {
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'classic';
    const diff = document.querySelector('input[name="diff"]:checked')?.value || 'normal';
    let name = 'Rookie Bot';
    if (mode === 'wind') name = 'Wind Hacker';
    else if (mode === 'bank') name = 'Bank Boss';
    else if (diff === 'pro') name = 'Legend AI';
    else if (diff === 'hard') name = 'Sniper AI';
    setText('.sb-side.ai .sb-label', name);
  }

  function footerVersion() {
    const foot = $('.footer .muted');
    if (foot) {
      foot.textContent = 'v2.2 · Enhanced Pro 7';
      foot.classList.add('pro7-version');
    }
  }

  function updateStatsText() {
    const s = state();
    setText('#kpi-money', Number(s.money || 0).toLocaleString('ro-RO'));
    setText('#kpi-level', s.level || 1);
    setText('#kpi-fans', Number(s.fans || 0).toLocaleString('ro-RO'));
    setText('#kpi-best', Number(s.bestScore || 0).toLocaleString('ro-RO'));
    setText('#hs-level', s.level || 1);
    setText('#hs-xp', Number(s.xp || 0).toLocaleString('ro-RO'));
    setText('#hs-fans', Number(s.fans || 0).toLocaleString('ro-RO'));
    setText('#hs-best', Number(s.bestScore || 0).toLocaleString('ro-RO'));
  }

  function refreshAll() {
    const s = state();
    ensureDaily(s);
    updateStatsText();
    injectBaseHtmlPlaceholders();
    injectAvatarRank();
    renderAchievements();
    renderShop();
    renderDaily();
    renderAI();
    renderReset();
    scoreboardAIName();
    footerVersion();
    save(PRO7_KEY, { version: 'pro-7', finalScreen: true, daily: true, shop: true, aiNames: true, suddenDeath: true, tutorial: true, effects: true, avatarRanks: true, reset: true, timestamp: Date.now() });
  }

  function bind() {
    $('#btn-hub')?.addEventListener('click', () => setTimeout(refreshAll, 120));
    $$('.tab').forEach((t) => t.addEventListener('click', () => setTimeout(refreshAll, 120)));
    $('#btn-play')?.addEventListener('click', () => setTimeout(scoreboardAIName, 100));
    $('#ov-go')?.addEventListener('click', () => setTimeout(scoreboardAIName, 100));
    $$('input[name="mode"],input[name="diff"]').forEach((x) => x.addEventListener('change', scoreboardAIName));
    setInterval(() => { const s = state(); ensureDaily(s); updateStatsText(); }, 2500);
  }

  function init() {
    injectMode();
    tutorialButton();
    injectBaseHtmlPlaceholders();
    refreshAll();
    observeEffects();
    finalScreenObserver();
    bind();
    console.info('Basket vs AI Enhanced Pro 7 loaded');
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
