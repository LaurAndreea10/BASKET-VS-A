(() => {
  'use strict';
  const STORE = 'bvai.zero.final.v5';
  const PACK_STORE = 'bvai.progression.pack.v1';
  const $ = (s, r = document) => r.querySelector(s);

  const ladder = [
    { name: 'Rookie Bot', lv: 1, round: 0, label: 'Rookie' },
    { name: 'Street Bot', lv: 2, round: 0, label: 'Street' },
    { name: 'Sniper AI', lv: 3, round: 1, label: 'Sniper' },
    { name: 'Bank Boss', lv: 5, round: 2, label: 'Bank' },
    { name: 'Wind Hacker', lv: 7, round: 2, label: 'Wind' },
    { name: 'Clutch Pro', lv: 9, round: 3, label: 'Clutch' },
    { name: 'Champion AI', lv: 12, round: 3, label: 'Champion' },
    { name: 'Legend AI', lv: 15, round: 3, label: 'Legend' }
  ];

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function progress() { return read(STORE, { level: 1, tournamentRound: 0, money: 150 }); }
  function pack() { return read(PACK_STORE, { equippedCharacterSkin: 'rookie', finalChampionshipUnlocked: false, weekly: { wins: 0, perfect: 0, boss: 0 } }); }
  function byLevel(lv) { return ladder.filter(x => lv >= x.lv).pop() || ladder[0]; }

  function syncOpponentForLevel() {
    const p = progress();
    const opponent = byLevel(Number(p.level || 1));
    p.tournamentRound = Math.max(Number(p.tournamentRound || 0), opponent.round);
    write(STORE, p);
    const name = $('#aiName');
    const tag = $('#modeTag');
    if (name) name.textContent = opponent.name;
    if (tag && !tag.textContent.includes('Legend Championship')) {
      tag.textContent = tag.textContent.replace(/· .+$/, '· ' + opponent.name);
    }
    document.documentElement.dataset.aiTier = opponent.label.toLowerCase();
  }

  function applyCharacterSkin() {
    const pk = pack();
    document.documentElement.dataset.characterSkin = pk.equippedCharacterSkin || 'rookie';
    let style = $('#character-skin-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'character-skin-style';
      document.head.appendChild(style);
    }
    style.textContent = `
      html[data-character-skin="street"] .arena{box-shadow:0 0 0 1px rgba(74,217,255,.24),0 24px 70px rgba(74,217,255,.18)}
      html[data-character-skin="pro"] .arena{box-shadow:0 0 0 1px rgba(255,122,42,.34),0 24px 70px rgba(255,122,42,.2)}
      html[data-character-skin="champion"] .arena{box-shadow:0 0 0 1px rgba(255,210,59,.45),0 24px 80px rgba(255,210,59,.2)}
      html[data-character-skin="legend"] .arena{box-shadow:0 0 0 1px rgba(255,93,143,.45),0 24px 90px rgba(255,93,143,.22)}
      html[data-ai-tier="legend"] .hud .modeTag:after{content:' · FINAL BOSS';color:#ffd23b;font-weight:900}
    `;
  }

  function addLegendChampionshipMode() {
    const group = document.querySelector('.setup .group');
    if (!group || document.querySelector('input[value="legendchampionship"]')) return;
    const p = progress();
    const unlocked = Number(p.level || 1) >= 15 || !!pack().finalChampionshipUnlocked;
    const label = document.createElement('label');
    label.className = 'chip';
    label.innerHTML = `<input name="mode" value="legendchampionship" type="radio" ${unlocked ? '' : 'disabled'}><span>${unlocked ? 'Legend Championship' : 'Legend 🔒'}</span>`;
    group.appendChild(label);
  }

  function activateLegendChampionship() {
    const selected = document.querySelector('input[name="mode"]:checked');
    if (!selected || selected.value !== 'legendchampionship') return false;
    const p = progress();
    p.tournamentRound = 3;
    p.bossStage = 3;
    write(STORE, p);
    const ai = $('#aiName');
    const tag = $('#modeTag');
    const timer = $('#timer');
    if (ai) ai.textContent = 'Legend AI';
    if (tag) tag.textContent = 'Legend Championship · Legend AI';
    if (timer && Number(timer.textContent) > 45) timer.textContent = '45';
    document.documentElement.dataset.aiTier = 'legend';
    return true;
  }

  function enhanceEndScreen() {
    const end = $('#end');
    if (!end || !end.classList.contains('show') || end.dataset.integrationDone === '1') return;
    end.dataset.integrationDone = '1';
    const p = progress();
    const pk = pack();
    const legend = document.querySelector('input[name="mode"]:checked')?.value === 'legendchampionship';
    if (legend) {
      pk.finalChampionDefeated = true;
      pk.finalChampionshipUnlocked = true;
      pk.weekly = pk.weekly || { wins: 0, perfect: 0, boss: 0 };
      pk.weekly.boss = 1;
      p.money = Number(p.money || 0) + 1500;
      p.fans = Number(p.fans || 0) + 300;
      write(STORE, p);
      write(PACK_STORE, pk);
      const txt = $('#endText');
      if (txt) txt.textContent += ' · Legend Championship finalizat: +1500 bani, +300 fani.';
    }
  }

  function patchStartButtons() {
    document.addEventListener('click', e => {
      if (e.target.closest('#play,#restart,#again,#next,#bossBtn')) {
        setTimeout(() => { syncOpponentForLevel(); activateLegendChampionship(); applyCharacterSkin(); }, 80);
        setTimeout(() => { syncOpponentForLevel(); activateLegendChampionship(); }, 600);
      }
      if (e.target.closest('[data-char-skin]')) setTimeout(applyCharacterSkin, 120);
    });
    document.addEventListener('change', e => {
      if (e.target.matches('input[name="mode"]')) setTimeout(() => { syncOpponentForLevel(); activateLegendChampionship(); }, 80);
    });
  }

  function loop() {
    syncOpponentForLevel();
    applyCharacterSkin();
    addLegendChampionshipMode();
    activateLegendChampionship();
    enhanceEndScreen();
  }

  window.addEventListener('load', () => {
    patchStartButtons();
    loop();
    setInterval(loop, 1500);
  });
  setTimeout(loop, 800);
})();
