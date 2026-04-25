(() => {
  const $ = (id) => document.getElementById(id);
  const careerKey = 'basket-vs-ai-enhanced-career';
  const profileKey = 'basket-vs-ai-player-profile';
  const langKey = 'basket-vs-ai-language';
  const GRAVITY = 920;

  const i18n = {
    en: {
      sound: 'Sound', soundOn: 'Sound on', soundOff: 'Sound off', howToPlay: 'How to play', reset: 'Reset',
      eyebrow: 'Enhanced arcade basketball', heroTitle: 'Beat the AI. Build your legend.',
      heroCopy: 'Stable Enhanced Pro: separate aim and power, no-stick physics, career, shop and competitions.',
      playMatch: '▶ Play match', openHub: '🏆 Open hub', mode: 'Mode', difficulty: 'Difficulty', time: 'Time',
      classic: 'Classic', blitz: 'Blitz', moving: 'Moving hoop', chaos: 'Chaos wind', bankMode: 'Bank lab',
      easy: 'Easy', normal: 'Normal', hard: 'Hard', pro: 'Pro', you: 'You', perfectShots: 'Perfect', rimHits: 'Rim hits', bankShots: 'Bank shots', combo: 'Combo',
      perfectAssist: 'Perfect assist', ballSpeed: 'Ball speed', aimControl: 'Aim control', power: 'Power', shoot: 'SHOOT', exitMatch: 'Exit match',
      shotHint: 'Aim, hold shoot for power, release near the gold zone.', hubTitle: 'Player hub', close: 'Close', career: 'Career', shop: 'Shop', leaderboard: 'Leaderboard', competitions: 'Competitions',
      level: 'Level', cash: 'Cash', fans: 'Fans', bestScore: 'Best score', bestCombo: 'Best combo', achievements: 'Achievements', upgrades: 'Upgrades',
      weak: 'Weak', good: 'Good arc', perfect: 'Perfect window', strong: 'Too strong', noWind: 'No wind', windActive: 'Wind', aim: 'Aim',
      perfectShot: 'Perfect shot!', bankShot: 'Bank shot!', rimHit: 'Rim hit!', miss: 'Miss', win: 'Win!', closeOne: 'Close one!', resetConfirm: 'Reset progress?', resetDone: 'Progress reset',
      helpDesktop: '<strong>Desktop:</strong> A/D or arrows to aim, hold Space for power.', helpAim: 'Aim is separate from power.', helpBank: 'Bank mode adds a bank-shot bonus when you aim wide.', helpMobile: '<strong>Mobile:</strong> use the slider and hold SHOOT.', helpRewards: 'Wins give XP, cash and fans.',
      playerIdentity: 'Player identity', gender: 'Gender', male: 'Male', female: 'Female', number: 'Number', saved: 'Saved', tournament: 'Tournament', league: 'League', daily: 'Daily challenge', start: 'Start'
    },
    ro: {
      sound: 'Sunet', soundOn: 'Sunet activ', soundOff: 'Sunet oprit', howToPlay: 'Cum se joacă', reset: 'Resetare',
      eyebrow: 'Baschet arcade îmbunătățit', heroTitle: 'Învinge AI-ul. Construiește-ți legenda.',
      heroCopy: 'Enhanced Pro stabil: țintire și putere separate, fizică fără blocaje, carieră, shop și competiții.',
      playMatch: '▶ Joacă meci', openHub: '🏆 Deschide hub', mode: 'Mod', difficulty: 'Dificultate', time: 'Timp',
      classic: 'Clasic', blitz: 'Blitz', moving: 'Coș mobil', chaos: 'Vânt haotic', bankMode: 'Bank lab',
      easy: 'Ușor', normal: 'Normal', hard: 'Greu', pro: 'Pro', you: 'Tu', perfectShots: 'Perfecte', rimHits: 'Inel', bankShots: 'Bank', combo: 'Combo',
      perfectAssist: 'Asistență perfectă', ballSpeed: 'Viteză minge', aimControl: 'Control țintă', power: 'Putere', shoot: 'ARUNCĂ', exitMatch: 'Ieși din meci',
      shotHint: 'Țintește, ține apăsat pentru putere, eliberează lângă zona aurie.', hubTitle: 'Hub jucător', close: 'Închide', career: 'Carieră', shop: 'Shop', leaderboard: 'Clasament', competitions: 'Competiții',
      level: 'Nivel', cash: 'Bani', fans: 'Fani', bestScore: 'Cel mai bun scor', bestCombo: 'Cel mai bun combo', achievements: 'Realizări', upgrades: 'Îmbunătățiri',
      weak: 'Slab', good: 'Arc bun', perfect: 'Fereastră perfectă', strong: 'Prea tare', noWind: 'Fără vânt', windActive: 'Vânt', aim: 'Țintă',
      perfectShot: 'Aruncare perfectă!', bankShot: 'Bank shot!', rimHit: 'Inel!', miss: 'Ratat', win: 'Victorie!', closeOne: 'A fost aproape!', resetConfirm: 'Resetezi progresul?', resetDone: 'Progres resetat',
      helpDesktop: '<strong>Desktop:</strong> A/D sau săgeți pentru țintire, Space pentru putere.', helpAim: 'Țintirea este separată de putere.', helpBank: 'Bank mode oferă bonus când țintești larg.', helpMobile: '<strong>Mobil:</strong> folosește sliderul și ține apăsat ARUNCĂ.', helpRewards: 'Victoriile oferă XP, bani și fani.',
      playerIdentity: 'Identitate jucător', gender: 'Gen', male: 'Masculin', female: 'Feminin', number: 'Număr', saved: 'Salvat', tournament: 'Turneu', league: 'Ligă', daily: 'Provocare zilnică', start: 'Start'
    }
  };

  let lang = localStorage.getItem(langKey) || 'ro';
  let audioEnabled = false;
  let audioCtx = null;
  let raf = null;
  let charging = false;
  let chargeDir = 1;
  let keys = new Set();
  let game = null;

  const defaultCareer = { level: 1, xp: 0, cash: 0, fans: 0, best: 0, wins: 0, matches: 0, perfectShots: 0, rimHits: 0, bankShots: 0, bestCombo: 0, leaderboard: [], upgrades: {} };
  const defaultProfile = { gender: 'male', avatar: 'dunk', number: 23 };

  function tr(key) { return i18n[lang]?.[key] || i18n.en[key] || key; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function loadJSON(key, fallback) { try { return { ...fallback, ...(JSON.parse(localStorage.getItem(key)) || {}) }; } catch { return { ...fallback }; } }
  function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function career() { return loadJSON(careerKey, defaultCareer); }
  function saveCareer(c) { saveJSON(careerKey, c); }
  function profile() { return loadJSON(profileKey, defaultProfile); }
  function saveProfile(p) { saveJSON(profileKey, { ...defaultProfile, ...p, number: clamp(parseInt(p.number, 10) || 0, 0, 99) }); }

  function tone(kind = 'tap') {
    if (!audioEnabled) return;
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const f = { tap: 260, score: 620, perfect: 880, rim: 180, miss: 120, win: 760 }[kind] || 320;
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(f, now);
    osc.type = kind === 'rim' ? 'square' : 'sine';
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'perfect' ? 0.14 : 0.08, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  function toast(message, cls = '') {
    const node = $('toast');
    if (!node) return;
    node.textContent = message;
    node.className = `toast show ${cls}`.trim();
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 1500);
  }

  function applyLanguage() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => node.innerHTML = tr(node.dataset.i18n));
    $('langToggle').textContent = lang === 'ro' ? 'EN' : 'RO';
    $('soundBtn').textContent = audioEnabled ? tr('soundOn') : tr('sound');
    renderCareer();
    renderCustomizer();
  }

  function xpNeeded(c) { return 100 + (c.level - 1) * 60; }
  function addRewards(won) {
    const c = career();
    c.matches += 1;
    if (won) c.wins += 1;
    c.cash += won ? 70 : 30;
    c.fans += won ? 18 : 6;
    c.xp += won ? 80 : 35;
    if (game) {
      c.best = Math.max(c.best, game.you);
      c.perfectShots += game.stats.perfectShots;
      c.rimHits += game.stats.rimHits;
      c.bankShots += game.stats.bankShots;
      c.bestCombo = Math.max(c.bestCombo, game.stats.bestCombo);
      c.leaderboard = [{ name: new Date().toLocaleDateString(), score: game.you, combo: game.stats.bestCombo }, ...(c.leaderboard || [])].sort((a, b) => b.score - a.score).slice(0, 8);
    }
    while (c.xp >= xpNeeded(c)) { c.xp -= xpNeeded(c); c.level += 1; c.cash += 25; }
    saveCareer(c);
  }

  function renderCareer() {
    const c = career();
    const p = profile();
    const rank = c.level >= 8 ? 'All-Star' : c.level >= 4 ? 'Rising Star' : 'Rookie';
    if ($('playerRank')) $('playerRank').textContent = `${rank} #${p.number}`;
    if ($('careerMeta')) $('careerMeta').textContent = `${tr('level')} ${c.level} · ${c.xp}/${xpNeeded(c)} XP · ${c.fans} ${tr('fans').toLowerCase()}`;
    if ($('xpFill')) $('xpFill').style.width = `${Math.min(100, c.xp / xpNeeded(c) * 100)}%`;
    const map = { statLevel: c.level, statCash: c.cash, statFans: c.fans, statBest: c.best, careerPerfectShots: c.perfectShots, careerRimHits: c.rimHits, careerBankShots: c.bankShots, careerBestCombo: c.bestCombo };
    Object.entries(map).forEach(([id, value]) => { if ($(id)) $(id).textContent = value; });
    if ($('achievementList')) $('achievementList').innerHTML = ['First win', 'Sharp shooter', 'Combo king'].map((name, i) => `<article class="achievement ${i === 0 && c.wins ? 'unlocked' : ''}"><strong>${i === 0 && c.wins ? '✅' : '🔒'} ${name}</strong><p>Keep playing to unlock.</p></article>`).join('');
    if ($('upgradeList')) $('upgradeList').innerHTML = ['Perfect focus', 'Power control', 'Wind guard'].map((name) => `<article class="upgrade"><div><strong>${name}</strong><p>Stable version upgrade placeholder.</p></div><button type="button" disabled>$50</button></article>`).join('');
    if ($('leaderboardList')) $('leaderboardList').innerHTML = [{ name: 'YOU', score: c.best, combo: c.bestCombo }, ...(c.leaderboard || [])].slice(0, 8).map((r, i) => `<div class="leader-row"><span>#${i + 1} <strong>${r.name}</strong></span><span>${r.score} pts · ${r.combo || 0} combo</span></div>`).join('');
    if ($('competitionList')) $('competitionList').innerHTML = ['tournament', 'league', 'daily'].map((x) => `<article class="competition-card"><strong>${tr(x)}</strong><p>Stable challenge mode.</p><button type="button" data-start-competition>${tr('start')}</button></article>`).join('');
  }

  function renderCustomizer() {
    if ($('playerCustomizer')) return;
    const host = document.querySelector('.player-card');
    if (!host) return;
    const p = profile();
    const panel = document.createElement('section');
    panel.id = 'playerCustomizer';
    panel.className = 'player-customizer';
    panel.innerHTML = `
      <div class="pc-head"><strong>${tr('playerIdentity')}</strong><span>Avatar · ${tr('gender')} · ${tr('number')}</span></div>
      <div class="pc-grid">
        <label><span>${tr('gender')}</span><select id="pcGender"><option value="male">${tr('male')}</option><option value="female">${tr('female')}</option></select></label>
        <label><span>${tr('number')}</span><input id="pcNumber" type="number" min="0" max="99" value="${p.number}"></label>
      </div>
      <div class="pc-avatars">
        <button type="button" data-avatar="dunk"><span class="pc-avatar-art dunk" data-num="${p.number}"><i class="ball"></i></span><span>Dunk</span></button>
        <button type="button" data-avatar="action"><span class="pc-avatar-art action" data-num="${p.number}"><i class="ball"></i></span><span>Action</span></button>
        <button type="button" data-avatar="male"><span class="pc-avatar-art male" data-num="${p.number}"></span><span>${tr('male')}</span></button>
        <button type="button" data-avatar="female"><span class="pc-avatar-art female" data-num="${p.number}"></span><span>${tr('female')}</span></button>
      </div>`;
    host.insertAdjacentElement('afterend', panel);
    const sync = () => {
      const p2 = profile();
      $('pcGender').value = p2.gender;
      $('pcNumber').value = p2.number;
      document.querySelectorAll('[data-avatar]').forEach((b) => b.classList.toggle('active', b.dataset.avatar === p2.avatar));
      document.querySelectorAll('.pc-avatar-art').forEach((a) => a.dataset.num = p2.number);
      renderCareer();
    };
    $('pcGender').addEventListener('change', () => { const cur = profile(); saveProfile({ ...cur, gender: $('pcGender').value, avatar: $('pcGender').value === 'female' ? 'female' : cur.avatar === 'female' ? 'male' : cur.avatar }); sync(); });
    $('pcNumber').addEventListener('input', () => { const cur = profile(); saveProfile({ ...cur, number: $('pcNumber').value }); sync(); });
    panel.querySelectorAll('[data-avatar]').forEach((b) => b.addEventListener('click', () => { const cur = profile(); const avatar = b.dataset.avatar; saveProfile({ ...cur, avatar, gender: avatar === 'female' ? 'female' : avatar === 'male' ? 'male' : cur.gender }); sync(); }));
    sync();
  }

  function switchScreen(target) {
    $('homeScreen')?.classList.toggle('hidden', target !== 'home');
    $('gameScreen')?.classList.toggle('hidden', target !== 'game');
    document.body.classList.toggle('game-active', target === 'game');
  }

  function openCareer(tab = 'career') {
    $('careerScreen')?.classList.remove('hidden');
    $('appShell')?.classList.add('with-career');
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-section').forEach((s) => s.classList.toggle('active', s.id === `tab-${tab}`));
    renderCareer();
  }

  function closeCareer() { $('careerScreen')?.classList.add('hidden'); $('appShell')?.classList.remove('with-career'); }

  function getWind() {
    const mode = $('modeSelect')?.value || 'classic';
    const difficulty = $('difficultySelect')?.value || 'normal';
    if (mode === 'classic' || mode === 'bank') return 0;
    const base = { easy: 4, normal: 10, hard: 18, pro: 26 }[difficulty] || 10;
    return (Math.random() * 2 - 1) * (mode === 'chaos' ? base * 1.6 : base);
  }

  function hoopPosition() {
    const rect = $('gameCanvas').getBoundingClientRect();
    const moving = game && (game.mode === 'moving' || game.mode === 'chaos');
    return { x: rect.width * 0.72 + (moving ? Math.sin(game.elapsed * 1.5) * 48 : 0), y: rect.height * 0.33 };
  }

  function startGame() {
    const seconds = Number($('timeSelect')?.value || 60);
    game = { you: 0, ai: 0, timeLeft: seconds, elapsed: 0, mode: $('modeSelect')?.value || 'classic', difficulty: $('difficultySelect')?.value || 'normal', wind: getWind(), aim: Number($('aimSlider')?.value || 0) / 100, power: 0, balls: [], shotId: 0, aiTick: 1, stats: { perfectShots: 0, rimHits: 0, bankShots: 0, combo: 0, bestCombo: 0 }, last: performance.now() };
    switchScreen('game');
    resizeCanvas();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    tone('tap');
  }

  function endGame(force = false) {
    if (!game) { switchScreen('home'); return; }
    cancelAnimationFrame(raf);
    const won = force ? false : game.you >= game.ai;
    if (!force) addRewards(won);
    const score = `${game.you}-${game.ai}`;
    game = null;
    charging = false;
    keys.clear();
    switchScreen('home');
    renderCareer();
    if (!force) toast(`${won ? tr('win') : tr('closeOne')} ${score}`, won ? 'toast-win' : '');
  }

  function resizeCanvas() {
    const canvas = $('gameCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function update(dt) {
    if (!game) return;
    game.elapsed += dt;
    game.timeLeft -= dt;
    if (game.timeLeft <= 0) return endGame();
    if (keys.has('ArrowLeft') || keys.has('KeyA')) game.aim -= dt * 1.7;
    if (keys.has('ArrowRight') || keys.has('KeyD')) game.aim += dt * 1.7;
    game.aim = clamp(game.aim, -1, 1);
    if ($('aimSlider')) $('aimSlider').value = Math.round(game.aim * 100);
    if (charging) {
      game.power += chargeDir * dt * 1.75;
      if (game.power >= 1) { game.power = 1; chargeDir = -1; }
      if (game.power <= 0) { game.power = 0; chargeDir = 1; }
    }
    const rect = $('gameCanvas').getBoundingClientRect();
    const hoop = hoopPosition();
    game.balls.forEach((ball) => updateBall(ball, dt, rect, hoop));
    game.balls = game.balls.filter((b) => !b.dead);
    game.aiTick -= dt;
    if (game.aiTick <= 0) {
      const rate = { easy: 2.2, normal: 1.8, hard: 1.35, pro: 1.05 }[game.difficulty] || 1.8;
      const chance = { easy: 0.35, normal: 0.48, hard: 0.62, pro: 0.72 }[game.difficulty] || 0.48;
      if (Math.random() < chance) game.ai += Math.random() < 0.18 ? 3 : 2;
      game.aiTick = rate + Math.random() * 0.6;
    }
    updateHud();
  }

  function updateBall(ball, dt, rect, hoop) {
    const prevY = ball.y;
    const prevX = ball.x;
    ball.life += dt;
    ball.vx += game.wind * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.vy += GRAVITY * dt;
    ball.speed = Math.hypot(ball.vx, ball.vy);
    const dx = ball.x - hoop.x;
    const dy = ball.y - hoop.y;
    const crossed = prevY < hoop.y - 4 && ball.y >= hoop.y - 4;
    const t = (hoop.y - 4 - prevY) / Math.max(0.001, ball.y - prevY);
    const crossX = prevX + (ball.x - prevX) * clamp(t, 0, 1);
    const inside = Math.abs(dx) < 52 && dy > -34 && dy < 42 && ball.vy > 0;
    if ((crossed && Math.abs(crossX - hoop.x) < 56 && ball.vy > 0) || inside) return score(ball);
    if (!ball.touchedRim && Math.abs(dx) < 74 && Math.abs(dy) < 54 && ball.vy > 0) {
      ball.touchedRim = true;
      game.stats.rimHits += 1;
      game.stats.combo = 0;
      ball.vx = dx < 0 ? -210 : 210;
      ball.vy = Math.max(ball.vy, 360);
      toast(tr('rimHit'), 'toast-miss');
      tone('rim');
    }
    if (ball.life > 0.65 && Math.abs(dx) < 150 && Math.abs(dy) < 150 && ball.speed < 260) return Math.abs(dx) < 62 ? score(ball) : miss(ball);
    if (ball.life > 2.4 || ball.x < -100 || ball.x > rect.width + 140 || ball.y > rect.height + 120) miss(ball);
  }

  function score(ball) {
    if (!game || ball.dead) return;
    const bank = Math.abs(game.aim) > 0.58 || game.mode === 'bank';
    ball.dead = true;
    ball.scored = true;
    if (bank) ball.bank = true;
    const perfect = ball.perfect;
    const points = perfect ? 3 : 2;
    game.you += points + (bank ? 1 : 0);
    game.stats.combo += 1;
    game.stats.bestCombo = Math.max(game.stats.bestCombo, game.stats.combo);
    if (perfect) game.stats.perfectShots += 1;
    if (bank) game.stats.bankShots += 1;
    toast(bank ? `${tr('bankShot')} +${points + 1}` : perfect ? `${tr('perfectShot')} +${points}` : `+${points}`, perfect ? 'toast-perfect' : bank ? 'toast-bank' : 'toast-win');
    tone(perfect ? 'perfect' : 'score');
  }

  function miss(ball) {
    if (!game || ball.dead) return;
    ball.dead = true;
    game.stats.combo = 0;
    toast(tr('miss'), 'toast-miss');
    tone('miss');
  }

  function updateHud() {
    if (!game) return;
    $('youScore').textContent = game.you;
    $('aiScore').textContent = game.ai;
    $('timer').textContent = Math.ceil(game.timeLeft);
    $('modeLabel').textContent = `${tr(game.mode)} · ${tr(game.difficulty)}`;
    $('powerFill').style.width = `${game.power * 100}%`;
    $('perfectShotsStat').textContent = game.stats.perfectShots;
    $('rimHitsStat').textContent = game.stats.rimHits;
    $('bankShotsStat').textContent = game.stats.bankShots;
    $('comboStat').textContent = game.stats.combo;
    $('speedStat').textContent = game.balls[0] ? Math.round(game.balls[0].speed) : 0;
    $('windChip').textContent = game.wind ? `💨 ${tr('windActive')} ${Math.round(game.wind)}` : `💨 ${tr('noWind')}`;
    const center = 0.66 + Math.abs(game.aim) * 0.06;
    const dist = Math.abs(game.power - center);
    const label = dist < 0.06 ? 'perfect' : game.power < center - 0.18 ? 'weak' : game.power > center + 0.18 ? 'strong' : 'good';
    $('assistLabel').textContent = tr(label);
    $('assistNeedle').style.left = `${game.power * 100}%`;
  }

  function shootStart() { if (!game || game.balls.length > 0) return; charging = true; chargeDir = 1; tone('tap'); }
  function shootRelease() {
    if (!game || !charging) return;
    charging = false;
    const rect = $('gameCanvas').getBoundingClientRect();
    const player = { x: rect.width * 0.2, y: rect.height * 0.75 };
    const hoop = hoopPosition();
    const center = 0.66 + Math.abs(game.aim) * 0.06;
    const perfect = Math.abs(game.power - center) + Math.abs(game.aim) * 0.06 < 0.12;
    const targetX = hoop.x + game.aim * 44;
    const targetY = hoop.y - 10;
    const missOffset = perfect ? 0 : (Math.random() - 0.5) * 70;
    const duration = clamp(0.88 - (game.power - 0.66) * 0.15, 0.68, 1.02);
    const vx = (targetX + missOffset - player.x) / duration;
    const vy = (targetY - (player.y - 45) - 0.5 * GRAVITY * duration * duration) / duration;
    game.balls.push({ id: ++game.shotId, x: player.x, y: player.y - 45, vx, vy, perfect, life: 0, dead: false, scored: false, touchedRim: false, speed: Math.hypot(vx, vy) });
    game.power = 0;
  }

  function draw() {
    const canvas = $('gameCanvas');
    if (!canvas || !game) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0b1020'); bg.addColorStop(0.58, '#111827'); bg.addColorStop(1, '#7c3f18');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const floorY = h * 0.64;
    ctx.fillStyle = '#b86628'; ctx.fillRect(0, floorY, w, h - floorY);
    ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 3; ctx.strokeRect(w * 0.06, floorY + 24, w * 0.88, h * 0.24);
    const hoop = hoopPosition();
    drawHoop(ctx, hoop);
    drawPlayer(ctx, { x: w * 0.2, y: h * 0.75 });
    drawTrajectory(ctx, { x: w * 0.2, y: h * 0.75 }, hoop, w, h);
    game.balls.forEach((b) => drawBall(ctx, b));
  }

  function drawHoop(ctx, hoop) {
    ctx.save();
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 3; ctx.strokeRect(hoop.x + 42, hoop.y - 76, 110, 70);
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(hoop.x, hoop.y, 44, 13, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(hoop.x + i * 9, hoop.y + 8); ctx.lineTo(hoop.x + i * 5, hoop.y + 54); ctx.stroke(); }
    ctx.restore();
  }

  function drawPlayer(ctx, p) {
    const prof = profile();
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 54, 46, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, 16); ctx.lineTo(-28, 66); ctx.moveTo(12, 16); ctx.lineTo(28, 62); ctx.stroke();
    ctx.strokeStyle = '#e7a171'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-24, -18); ctx.lineTo(-45, 18); ctx.moveTo(23, -20); ctx.lineTo(46, -54); ctx.stroke();
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(50, -62, 14, 0, Math.PI * 2); ctx.fill();
    const jersey = ctx.createLinearGradient(-28, -46, 28, 24); jersey.addColorStop(0, prof.gender === 'female' ? '#fb7185' : '#facc15'); jersey.addColorStop(.55, '#fb923c'); jersey.addColorStop(.56, '#1d4ed8'); jersey.addColorStop(1, '#1e40af');
    ctx.fillStyle = jersey; roundRect(ctx, -26, -46, 52, 68, 16); ctx.fill();
    ctx.fillStyle = '#dbeafe'; ctx.font = '1000 24px DM Sans, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(prof.number).slice(0, 2), 0, -10);
    ctx.fillStyle = '#2a160f'; ctx.beginPath(); ctx.ellipse(0, -73, prof.gender === 'female' ? 25 : 21, prof.gender === 'female' ? 22 : 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eba574'; ctx.beginPath(); ctx.ellipse(0, -61, 15, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawTrajectory(ctx, p, hoop, w, h) { ctx.save(); ctx.strokeStyle = 'rgba(250,204,21,.8)'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(p.x + 42, p.y - 62); ctx.quadraticCurveTo(w * (0.43 + game.aim * 0.16), h * 0.13, hoop.x + game.aim * 44, hoop.y); ctx.stroke(); ctx.restore(); }
  function drawBall(ctx, b) { ctx.save(); ctx.fillStyle = b.perfect ? '#facc15' : '#f97316'; ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x - 15, b.y); ctx.lineTo(b.x + 15, b.y); ctx.moveTo(b.x, b.y - 15); ctx.lineTo(b.x, b.y + 15); ctx.stroke(); ctx.restore(); }

  function loop(now) {
    if (!game) return;
    const dt = Math.min(0.05, (now - game.last) / 1000);
    game.last = now;
    update(dt);
    draw();
    if (game) raf = requestAnimationFrame(loop);
  }

  function bind() {
    $('playBtn')?.addEventListener('click', startGame);
    $('careerBtn')?.addEventListener('click', () => openCareer('career'));
    $('closeCareerBtn')?.addEventListener('click', closeCareer);
    $('quitBtn')?.addEventListener('pointerdown', (e) => { e.preventDefault(); endGame(true); }, { passive: false });
    $('quitBtn')?.addEventListener('click', (e) => { e.preventDefault(); endGame(true); });
    $('soundBtn')?.addEventListener('click', () => { audioEnabled = !audioEnabled; tone('tap'); applyLanguage(); });
    $('langToggle')?.addEventListener('click', () => { lang = lang === 'ro' ? 'en' : 'ro'; localStorage.setItem(langKey, lang); applyLanguage(); });
    $('resetBtn')?.addEventListener('click', () => { if (confirm(tr('resetConfirm'))) { saveCareer(defaultCareer); renderCareer(); toast(tr('resetDone')); } });
    $('openHelpBtn')?.addEventListener('click', () => $('helpDialog')?.showModal());
    $('shootBtn')?.addEventListener('pointerdown', shootStart, { passive: true });
    window.addEventListener('pointerup', shootRelease, { passive: true });
    $('aimSlider')?.addEventListener('input', (e) => { if (game) game.aim = Number(e.target.value) / 100; });
    $('leftBtn')?.addEventListener('pointerdown', () => keys.add('ArrowLeft'));
    $('leftBtn')?.addEventListener('pointerup', () => keys.delete('ArrowLeft'));
    $('rightBtn')?.addEventListener('pointerdown', () => keys.add('ArrowRight'));
    $('rightBtn')?.addEventListener('pointerup', () => keys.delete('ArrowRight'));
    window.addEventListener('keydown', (e) => { keys.add(e.code); if (e.code === 'Space') { e.preventDefault(); shootStart(); } });
    window.addEventListener('keyup', (e) => { keys.delete(e.code); if (e.code === 'Space') shootRelease(); });
    document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => openCareer(b.dataset.tab)));
    window.addEventListener('resize', resizeCanvas);
  }

  bind();
  applyLanguage();
  renderCareer();
})();
