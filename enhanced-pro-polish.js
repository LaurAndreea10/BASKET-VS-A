(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const POLISH_KEY = 'bvai.polish.v5';
  const STATE_KEY = 'bvai.state.v4';
  const PROFILE_KEY = 'bvai.player.profile.v1';

  const SKIN_SHOWCASE = [
    ['🏀 Neon Ball', 'Minge luminoasă pentru arcade vibes.', 'Ball'],
    ['🔥 Fire Ball', 'Trail cald și impact vizual puternic.', 'Ball'],
    ['🌌 Galaxy Ball', 'Variantă premium pentru update viitor.', 'Ball'],
    ['🥇 Gold Ball', 'Skin de status pentru scoruri mari.', 'Ball'],
    ['🏙️ Street Court', 'Teren urban, contrast puternic.', 'Court'],
    ['🌃 Night Court', 'Look cinematic, ideal pe mobil.', 'Court'],
    ['🧊 Ice Trail', 'Efect rece pentru aruncări perfecte.', 'Trail'],
    ['🔥 Flame Trail', 'Efect foc la combo-uri mari.', 'Trail']
  ];

  const AI_ROSTER = [
    ['Rookie Bot', 'Greșește des, perfect pentru încălzire.', 'Easy'],
    ['Street Bot', 'Ritm rapid și scor constant.', 'Normal'],
    ['Bank Master', 'Folosește panoul și bonusurile bank.', 'Bank'],
    ['Wind Hacker', 'Devine periculos când bate vântul.', 'Wind'],
    ['Final Boss: Legend AI', 'Boss final cu clutch și coș mobil.', 'Boss']
  ];

  const BADGES = [
    ['First Bucket', 'Primul coș marcat.', (s) => (s.totalMade || 0) >= 1],
    ['Perfect 5', '5 perfecte într-un meci sau progres total.', (s) => (s.perfectShots || 0) >= 5],
    ['Bank Artist', '10 bank shots.', (s) => (s.bankShots || 0) >= 10],
    ['AI Crusher', 'Câștigă la Pro.', (s) => (s.proWins || 0) >= 1],
    ['Legend', 'Câștigă turneul.', (s) => (s.tournamentWins || 0) >= 1]
  ];

  function readJson(key, fallback = {}) {
    try { return { ...fallback, ...(JSON.parse(localStorage.getItem(key)) || {}) }; }
    catch { return { ...fallback }; }
  }

  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function state() { return readJson(STATE_KEY, {}); }
  function profile() { return readJson(PROFILE_KEY, { name: 'Laura', gender: 'girl', number: 10 }); }

  function rankFor(s) {
    const lvl = Number(s.level || 1);
    if (lvl >= 20) return 'Legend';
    if (lvl >= 14) return 'MVP';
    if (lvl >= 9) return 'Star';
    if (lvl >= 5) return 'Pro';
    return 'Rookie';
  }

  function vibrate(pattern = 35) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
  }

  function injectHeroIdentity() {
    if ($('#laura-league-banner')) return;
    const stats = $('.hero-stats');
    const p = profile();
    const s = state();
    const banner = document.createElement('div');
    banner.id = 'laura-league-banner';
    banner.className = 'league-banner';
    banner.innerHTML = `🏆 Laura League <span class="rank-chip">${p.name || 'Player'} · ${rankFor(s)}</span>`;
    stats?.insertAdjacentElement('afterend', banner);
  }

  function injectTutorialButton() {
    if ($('#btn-tutorial')) return;
    const help = $('#btn-help');
    const btn = document.createElement('button');
    btn.id = 'btn-tutorial';
    btn.className = 'iconbtn tutorial-launch';
    btn.title = 'Tutorial jucabil';
    btn.textContent = '🎯';
    help?.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', startPlayableTutorial);
  }

  function startPlayableTutorial() {
    const classic = document.querySelector('input[name="mode"][value="classic"]');
    if (classic) classic.checked = true;
    localStorage.removeItem('bvai.complete.v1.tutorialDismissed');
    const s = state();
    s.tutorialDone = false;
    saveJson(STATE_KEY, s);
    $('#btn-play')?.click();
    setTimeout(() => showTutorialCoach(0), 250);
  }

  function showTutorialCoach(step = 0) {
    let panel = $('#tutorial-live-polish');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'tutorial-live-polish';
      panel.className = 'tutorial-panel-live';
      $('.court-wrap')?.appendChild(panel);
    }
    const data = [
      ['1. Țintește', 'Mută sliderul sau folosește ◀ ▶ ca să vezi traiectoria.'],
      ['2. Zona aurie', 'Ține apăsat ARUNCĂ până bara ajunge în zona aurie.'],
      ['3. Bank shot', 'Țintește mai larg pentru ricoșeu din panou și bonus.'],
      ['4. Recompensă', 'Primul PERFECT din tutorial primește +50 XP.']
    ];
    const [title, desc] = data[Math.min(step, data.length - 1)];
    panel.innerHTML = `<strong>${title}</strong><p>${desc}</p><div class="steps">${data.map((_, i) => `<i class="${i === step ? 'active' : ''}"></i>`).join('')}</div>`;
    clearTimeout(showTutorialCoach.t);
    if (step < data.length - 1) showTutorialCoach.t = setTimeout(() => showTutorialCoach(step + 1), 4500);
    else showTutorialCoach.t = setTimeout(() => panel.remove(), 6500);
  }

  function enhanceAfterMatch() {
    const observer = new MutationObserver(() => {
      const box = $('.after-box');
      if (!box || box.dataset.ratingAdded) return;
      box.dataset.ratingAdded = '1';
      const stats = $$('.after-stat strong').map((x) => x.textContent);
      const accuracy = parseInt(stats[0], 10) || 0;
      const combo = parseInt(stats[3], 10) || 0;
      const rating = accuracy >= 85 && combo >= 5 ? 'LEGEND' : accuracy >= 75 ? 'S' : accuracy >= 60 ? 'A' : accuracy >= 45 ? 'B' : 'C';
      const chip = document.createElement('div');
      chip.className = 'after-rating';
      chip.innerHTML = `Rating <b>${rating}</b>`;
      box.querySelector('p')?.insertAdjacentElement('afterend', chip);
      vibrate(rating === 'LEGEND' || rating === 'S' ? [40, 40, 80] : 35);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function injectShopShowcase() {
    const shop = $('.tab-panel[data-panel="shop"]');
    if (!shop || $('#skin-gallery')) return;
    const block = document.createElement('section');
    block.id = 'skin-gallery';
    block.className = 'feature-panel';
    block.innerHTML = `<h3>Skin-uri vizibile</h3><div class="skin-gallery">${SKIN_SHOWCASE.map(([name, desc, tag]) => `<article class="skin-card"><strong>${name}</strong><small>${desc}</small><em>${tag}</em></article>`).join('')}</div>`;
    shop.appendChild(block);
  }

  function injectAiRoster() {
    const comp = $('.tab-panel[data-panel="comp"]');
    if (!comp || $('#ai-roster')) return;
    const block = document.createElement('section');
    block.id = 'ai-roster';
    block.className = 'feature-panel';
    block.innerHTML = `<h3>Adversari AI</h3><div class="ai-roster">${AI_ROSTER.map(([name, desc, tag]) => `<article class="ai-card ${tag === 'Boss' ? 'boss' : ''}"><strong>${name}</strong><small>${desc}</small><em>${tag}</em></article>`).join('')}</div>`;
    comp.appendChild(block);
  }

  function injectDailyCards() {
    const daily = $('#daily-list');
    if (!daily || $('#daily-card-grid')) return;
    const s = state();
    const missions = s.daily?.missions?.length ? s.daily.missions : [
      { name: 'Fă 5 aruncări perfecte', progress: 0, target: 5, reward: 100 },
      { name: 'Câștigă pe Greu', progress: 0, target: 1, reward: 120 },
      { name: 'Marchează 3 bank shots', progress: 0, target: 3, reward: 90 }
    ];
    const grid = document.createElement('div');
    grid.id = 'daily-card-grid';
    grid.className = 'daily-card-grid';
    grid.innerHTML = missions.slice(0, 4).map((m) => {
      const pct = Math.min(100, (Number(m.progress || 0) / Math.max(1, Number(m.target || 1))) * 100);
      return `<article class="daily-card"><strong>${m.name}</strong><small>Recompensă: +${m.reward || 100}$ / XP</small><div class="bar"><div class="fill" style="width:${pct}%"></div></div><small>${m.progress || 0} / ${m.target || 1}</small></article>`;
    }).join('');
    daily.insertAdjacentElement('beforebegin', grid);
  }

  function injectBadges() {
    const career = $('.tab-panel[data-panel="career"]');
    if (!career || $('#badge-grid')) return;
    const s = state();
    const block = document.createElement('section');
    block.id = 'badge-grid';
    block.className = 'feature-panel';
    block.innerHTML = `<h3>Badge-uri</h3><div class="badge-grid">${BADGES.map(([name, desc, check]) => `<article class="badge-card ${check(s) ? 'done' : ''}"><strong>${check(s) ? '✓ ' : ''}${name}</strong><small>${desc}</small></article>`).join('')}</div>`;
    career.appendChild(block);
  }

  function bindFeedback() {
    const court = $('.court-wrap');
    if (!court) return;
    const observer = new MutationObserver(() => {
      const flash = $('#combo-flash');
      if (flash?.classList.contains('show')) vibrate([25, 30, 45]);
      if (court.classList.contains('slowmo')) vibrate([20, 20, 60]);
    });
    observer.observe(court, { attributes: true, subtree: true, childList: true });
  }

  function levelPopWatcher() {
    let previous = Number(state().level || 1);
    setInterval(() => {
      const current = Number(state().level || 1);
      if (current > previous) showLevelPop(current);
      previous = current;
      const banner = $('#laura-league-banner .rank-chip');
      if (banner) {
        const p = profile();
        banner.textContent = `${p.name || 'Player'} · ${rankFor(state())}`;
      }
    }, 1200);
  }

  function showLevelPop(level) {
    let pop = $('#level-pop');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'level-pop';
      pop.className = 'level-pop';
      document.body.appendChild(pop);
    }
    pop.textContent = `LEVEL ${level}`;
    pop.classList.remove('show');
    void pop.offsetWidth;
    pop.classList.add('show');
    vibrate([40, 40, 100]);
  }

  function runHubPolish() {
    injectShopShowcase();
    injectAiRoster();
    injectDailyCards();
    injectBadges();
  }

  function init() {
    injectHeroIdentity();
    injectTutorialButton();
    enhanceAfterMatch();
    bindFeedback();
    levelPopWatcher();
    $('#btn-hub')?.addEventListener('click', () => setTimeout(runHubPolish, 100));
    $$('.tab').forEach((tab) => tab.addEventListener('click', () => setTimeout(runHubPolish, 100)));
    runHubPolish();
    saveJson(POLISH_KEY, { version: 'pro-5', tutorialButton: true, rating: true, shopCards: true, aiRoster: true, dailyCards: true, badges: true, lauraLeague: true });
    console.info('Basket vs AI Enhanced Pro polish loaded: pro-5');
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
