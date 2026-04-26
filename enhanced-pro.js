(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const KEY = 'bvai.state.v2';
  const GRAVITY = 1450;

  const defaults = {
    level: 1,
    xp: 0,
    money: 0,
    fans: 0,
    bestScore: 0,
    bestCombo: 0,
    perfectShots: 0,
    rimHits: 0,
    bankShots: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    league: { standings: [] }
  };

  let state = loadState();
  let lang = localStorage.getItem('bvai.lang') || 'ro';
  let soundOn = true;
  let audioCtx = null;
  let raf = 0;

  const game = {
    canvas: null,
    ctx: null,
    width: 900,
    height: 540,
    running: false,
    last: 0,
    match: null,
    trails: []
  };

  function loadState() {
    try {
      return { ...defaults, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
    } catch {
      return { ...defaults };
    }
  }

  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  function xpNeed() {
    return Math.round(100 * Math.pow(1.35, state.level - 1));
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-US');
  }

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function tone(type = 'click') {
    if (!soundOn) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const freq = { click: 420, score: 880, rim: 220, miss: 140, win: 720 }[type] || 420;
      const now = audioCtx.currentTime;
      osc.type = type === 'rim' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  function toast(message, kind = '') {
    const node = $('#toast');
    if (!node) return;
    node.textContent = message;
    node.className = `toast ${kind}`.trim();
    node.hidden = false;
    requestAnimationFrame(() => node.classList.add('show'));
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      node.classList.remove('show');
      setTimeout(() => { node.hidden = true; }, 260);
    }, 1500);
  }

  function ensureLeague() {
    if (state.league && Array.isArray(state.league.standings) && state.league.standings.length) return;
    state.league = {
      standings: [
        { name: '⭐ Tu', pts: 0, you: true },
        { name: 'DunkBot', pts: 11 },
        { name: 'HoopGPT', pts: 9 },
        { name: 'NetNinja', pts: 7 },
        { name: 'Splash9000', pts: 6 },
        { name: 'Ace-12', pts: 4 }
      ]
    };
  }

  function renderHero() {
    setText('#hs-level', state.level);
    setText('#hs-xp', formatNumber(state.xp));
    setText('#hs-fans', formatNumber(state.fans));
    setText('#hs-best', formatNumber(state.bestScore));
  }

  function renderHub() {
    ensureLeague();
    setText('#kpi-level', state.level);
    setText('#kpi-money', formatNumber(state.money));
    setText('#kpi-fans', formatNumber(state.fans));
    setText('#kpi-best', formatNumber(state.bestScore));
    setText('#kpi-perfect', state.perfectShots);
    setText('#kpi-rim', state.rimHits);
    setText('#kpi-bank', state.bankShots);
    setText('#kpi-combo', state.bestCombo);
    setText('#xp-now', state.xp);
    setText('#xp-need', xpNeed());
    const xpFill = $('#xp-fill');
    if (xpFill) xpFill.style.width = `${Math.min(100, (state.xp / xpNeed()) * 100)}%`;

    const achv = $('#achv-list');
    if (achv) achv.innerHTML = ['🏀 Primul coș', '✨ 10 perfecte', '🏦 Bank master', '🔥 Combo x5'].map((item) => `<li><strong>${item}</strong><span class="pts">—</span></li>`).join('');

    const shop = $('#shop-list');
    if (shop) shop.innerHTML = ['🎯 Asistență țintire', '🌈 Arc îmbunătățit', '💨 Scut de vânt'].map((item) => `<li><strong>${item}</strong><button disabled>soon</button></li>`).join('');

    const daily = $('#daily-list');
    if (daily) daily.innerHTML = '<li><strong>Provocare zilnică</strong><div class="pbar"><div class="pfill" style="width:35%"></div></div></li>';

    const tour = $('#tour-bracket');
    if (tour) tour.innerHTML = '<div class="muted">Turneu 3 runde</div>';

    const rows = state.league.standings
      .slice(0, 10)
      .map((row) => `<li class="${row.you ? 'you' : ''}"><span></span><strong>${row.name}</strong><span class="pts">${row.pts}</span></li>`)
      .join('');
    const leader = $('#leader-list');
    const league = $('#league-list');
    if (leader) leader.innerHTML = rows;
    if (league) league.innerHTML = rows;
  }

  function setupCanvas() {
    const canvas = $('#court');
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    game.canvas = canvas;
    game.ctx = ctx;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      game.width = Math.max(1, rect.width);
      game.height = Math.max(1, rect.height);
      canvas.width = Math.floor(game.width * dpr);
      canvas.height = Math.floor(game.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    resize();
    window.addEventListener('resize', resize);
    return true;
  }

  function newMatch() {
    const mode = $('input[name="mode"]:checked')?.value || 'classic';
    const diff = $('input[name="diff"]:checked')?.value || 'normal';
    const time = Number($('input[name="time"]:checked')?.value || 60);
    return {
      mode,
      diff,
      timeLeft: time,
      you: 0,
      ai: 0,
      perfect: 0,
      rim: 0,
      bank: 0,
      combo: 0,
      bestCombo: 0,
      power: 0,
      charging: false,
      chargeStart: 0,
      aimAngle: Number($('#aim')?.value || 0),
      ball: null,
      ended: false,
      aiNext: 2.3,
      wind: 0,
      rimT: 0,
      accuracy: { easy: 0.45, normal: 0.6, hard: 0.72, pro: 0.82 }[diff] || 0.6
    };
  }

  function startMatch() {
    if (!game.ctx && !setupCanvas()) return;
    game.match = newMatch();
    game.running = true;
    game.trails = [];
    game.last = performance.now();
    const overlay = $('#overlay');
    if (overlay) overlay.hidden = true;
    setText('#sb-mode', $('input[name="mode"]:checked + span')?.textContent || 'Clasic');
    setText('#sb-diff', $('input[name="diff"]:checked + span')?.textContent || 'Normal');
    tone('click');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function endMatch(force = false) {
    const match = game.match;
    if (!match) return;
    game.running = false;
    cancelAnimationFrame(raf);

    if (!force) {
      const won = match.you > match.ai;
      const drawMatch = match.you === match.ai;
      const xp = 30 + match.you * 5 + (won ? 50 : drawMatch ? 20 : 0);
      const money = 20 + match.you * 4 + (won ? 40 : 0);
      const fans = 5 + match.you * 2 + (won ? 30 : 0);
      state.bestScore = Math.max(state.bestScore, match.you);
      state.bestCombo = Math.max(state.bestCombo, match.bestCombo);
      state.perfectShots += match.perfect;
      state.rimHits += match.rim;
      state.bankShots += match.bank;
      state.money += money;
      state.fans += fans;
      state.xp += xp;
      while (state.xp >= xpNeed()) {
        state.xp -= xpNeed();
        state.level += 1;
      }
      if (won) state.wins += 1;
      else if (drawMatch) state.draws += 1;
      else state.losses += 1;
      saveState();
      renderHero();
      renderHub();
      setText('#ov-title', won ? 'Victorie!' : drawMatch ? 'Egal' : 'Înfrângere');
      setText('#ov-msg', `+${xp} XP, +${money}$, +${fans} fani`);
      tone(won ? 'win' : 'miss');
    } else {
      setText('#ov-title', 'Start');
      setText('#ov-msg', 'Țintește, ține apăsat pentru putere, eliberează lângă zona aurie.');
    }

    game.match = null;
    const overlay = $('#overlay');
    if (overlay) overlay.hidden = false;
    draw();
  }

  function rimPosition() {
    const match = game.match;
    let x = game.width * 0.82;
    const y = game.height * 0.42;
    if (match && match.mode === 'moving') x += Math.sin(match.rimT) * game.width * 0.07;
    return { x, y, r: game.width * 0.035 };
  }

  function startShot() {
    const match = game.match;
    if (!match || match.ball || match.ended) return;
    match.charging = true;
    match.chargeStart = performance.now();
    match.power = 0;
  }

  function releaseShot() {
    const match = game.match;
    if (!match || !match.charging) return;
    match.charging = false;
    if (match.ball || match.power < 0.08) {
      match.power = 0;
      return;
    }

    const playerX = game.width * 0.22;
    const playerY = game.height * 0.82 - game.height * 0.32;
    const angle = -Math.PI / 2.4 + (match.aimAngle * Math.PI / 180);
    const velocity = 8 + match.power * 12;
    match.ball = {
      x: playerX,
      y: playerY,
      vx: Math.cos(angle) * velocity * 60,
      vy: Math.sin(angle) * velocity * 60,
      life: 0,
      perfect: match.power >= 0.6 && match.power <= 0.72,
      bankAttempt: Math.abs(match.aimAngle) > 18,
      bankHit: false,
      rimHit: false
    };
    match.power = 0;
  }

  function update(dt) {
    const match = game.match;
    if (!match) return;

    if (match.charging) {
      let p = ((performance.now() - match.chargeStart) / 1000) % 2;
      if (p > 1) p = 2 - p;
      match.power = p;
    }

    match.timeLeft -= dt;
    if (match.timeLeft <= 0) {
      match.timeLeft = 0;
      endMatch(false);
      return;
    }

    if (match.mode === 'wind') {
      match.wind += (Math.random() - 0.5) * 120 * dt;
      match.wind = Math.max(-90, Math.min(90, match.wind));
    } else {
      match.wind = 0;
    }

    if (match.mode === 'moving') match.rimT += dt * 1.2;

    match.aiNext -= dt;
    if (match.aiNext <= 0) {
      match.aiNext = 2.2 + Math.random() * 2.3;
      if (Math.random() < match.accuracy) match.ai += Math.random() < 0.15 ? 3 : 2;
    }

    if (match.ball) updateBall(match, match.ball, dt);
    updateUi();
  }

  function updateBall(match, ball, dt) {
    const previousX = ball.x;
    const previousY = ball.y;
    ball.vy += GRAVITY * dt;
    ball.vx += match.wind * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.life += dt;

    game.trails.push({ x: ball.x, y: ball.y, life: 0.35 });
    if (game.trails.length > 28) game.trails.shift();

    const rim = rimPosition();
    const ballRadius = game.width * 0.018;
    const crossedRimY = previousY < rim.y && ball.y >= rim.y;
    const t = (rim.y - previousY) / Math.max(0.001, ball.y - previousY);
    const crossingX = previousX + (ball.x - previousX) * Math.max(0, Math.min(1, t));

    const scoredByCrossing = crossedRimY && ball.vy > 0 && crossingX > rim.x - rim.r + 4 && crossingX < rim.x + rim.r * 0.45 - 4;
    const scoredByPocket = ball.vy > 0 && Math.abs(ball.x - rim.x) < rim.r && Math.abs(ball.y - rim.y) < ballRadius + 8;
    if (scoredByCrossing || scoredByPocket) {
      score(match, ball);
      return;
    }

    const boardX = rim.x + rim.r * 1.4;
    const hitBackboard = ball.x + ballRadius >= boardX && ball.vx > 0 && ball.y >= rim.y - rim.r * 2.5 && ball.y <= rim.y - rim.r * 0.2;
    if (hitBackboard) {
      ball.vx = -Math.abs(ball.vx) * 0.65;
      ball.x = boardX - ballRadius;
      ball.bankHit = true;
      tone('rim');
    }

    const rimLeft = rim.x - rim.r;
    const rimRight = rim.x + rim.r * 0.45;
    const hitRim = ball.vy > 0 && Math.abs(ball.y - rim.y) < ballRadius + 5 && (Math.abs(ball.x - rimLeft) < ballRadius + 2 || Math.abs(ball.x - rimRight) < ballRadius + 2);
    if (hitRim && !ball.rimHit) {
      ball.vx = (ball.x < rim.x ? Math.abs(ball.vx) : -Math.abs(ball.vx)) * 0.65;
      ball.vy = -Math.abs(ball.vy) * 0.55;
      ball.rimHit = true;
      match.rim += 1;
      tone('rim');
    }

    const stuckNearRim = ball.life > 0.7 && Math.abs(ball.x - rim.x) < 120 && Math.abs(ball.y - rim.y) < 120 && Math.hypot(ball.vx, ball.vy) < 220;
    if (stuckNearRim || ball.y > game.height * 0.92 || ball.x < -60 || ball.x > game.width + 60 || ball.life > 5) {
      miss(match);
    }
  }

  function score(match, ball) {
    let points = 2;
    let label = 'SWISH!';
    let kind = 'good';
    if (ball.bankHit || ball.bankAttempt || match.mode === 'bank') {
      points += 1;
      match.bank += 1;
      label = 'BANK!';
      kind = 'gold';
    }
    if (ball.perfect && !ball.rimHit) {
      points += 1;
      match.perfect += 1;
      label = 'PERFECT';
      kind = 'gold';
    }
    match.combo += 1;
    match.bestCombo = Math.max(match.bestCombo, match.combo);
    if (match.combo >= 3) points += 1;
    match.you += points;
    match.ball = null;
    toast(`${label}${match.combo >= 2 ? ` Combo x${match.combo}` : ''}`, kind);
    tone('score');
  }

  function miss(match) {
    match.combo = 0;
    match.ball = null;
    toast('Ratat', 'bad');
    tone('miss');
  }

  function updateUi() {
    const match = game.match;
    if (!match) return;
    setText('#sb-time', Math.ceil(match.timeLeft));
    setText('#sb-you', match.you);
    setText('#sb-ai', match.ai);
    setText('#rb-perfect', match.perfect);
    setText('#rb-rim', match.rim);
    setText('#rb-bank', match.bank);
    setText('#rb-combo', match.combo);
    setText('#rb-speed', match.ball ? Math.round(Math.hypot(match.ball.vx, match.ball.vy) / 10) : 0);
    const powerFill = $('#power-fill');
    const powerPerfect = $('#power-perfect');
    if (powerFill) powerFill.style.inset = `0 ${100 - match.power * 100}% 0 0`;
    if (powerPerfect) {
      powerPerfect.style.left = '60%';
      powerPerfect.style.width = '12%';
    }
    const streak = $('#sb-streak');
    if (streak) streak.hidden = match.combo < 2;
    setText('#sb-streak-n', match.combo);
    const wind = $('#rb-wind');
    if (wind) wind.hidden = match.mode !== 'wind';
    setText('#rb-wind-n', Math.round(Math.abs(match.wind || 0)));
    setText('#rb-wind-arrow', (match.wind || 0) >= 0 ? '→' : '←');
  }

  function draw() {
    if (!game.ctx) return;
    const ctx = game.ctx;
    const w = game.width;
    const h = game.height;
    const match = game.match;
    ctx.clearRect(0, 0, w, h);
    drawBackground(ctx, w, h);
    const rim = rimPosition();
    drawHoop(ctx, rim.x - rim.r * 0.6, rim.y - rim.r * 0.4, rim.r * 1.6);
    drawPlayer(ctx, w * 0.22, h * 0.9, h * 0.55, match);
    drawAimPreview(ctx, w, h, match);
    drawTrails(ctx, w);
    if (match && match.ball) drawBall(ctx, match.ball.x, match.ball.y, w * 0.018);
  }

  function drawBackground(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, '#0a0c14');
    sky.addColorStop(1, '#1a1220');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.7);
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc((i * w) / 40, h * 0.6 + Math.sin(i) * 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    const floor = ctx.createLinearGradient(0, h * 0.7, 0, h);
    floor.addColorStop(0, '#5a3018');
    floor.addColorStop(1, '#1a0c04');
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w * 0.7, h * 0.95, w * 0.32, h * 0.18, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.55, h * 0.83);
    ctx.lineTo(w * 0.85, h * 0.83);
    ctx.stroke();
  }

  function drawHoop(ctx, cx, cy, scale) {
    const width = scale;
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(cx + width * 0.7, cy - width * 0.6, width * 0.18, width * 4);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.strokeStyle = '#1a0c04';
    ctx.lineWidth = 2;
    roundedRect(ctx, cx + width * 0.18, cy - width * 0.55, width * 0.7, width * 1.4, 4);
    ctx.fill();
    ctx.stroke();
    const rimY = cy + width * 0.4;
    const rimL = cx - width * 0.55;
    const rimR = cx + width * 0.18;
    ctx.strokeStyle = '#ff5d22';
    ctx.lineWidth = Math.max(3, width * 0.08);
    ctx.beginPath();
    ctx.moveTo(rimL, rimY);
    ctx.lineTo(rimR, rimY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i <= 9; i++) {
      const topX = rimL + (rimR - rimL) * (i / 9);
      const bottomX = rimL + (rimR - rimL) * (0.18 + (i / 9) * 0.66);
      ctx.beginPath();
      ctx.moveTo(topX, rimY);
      ctx.quadraticCurveTo((topX + bottomX) / 2, rimY + width * 0.5, bottomX, rimY + width * 0.95);
      ctx.stroke();
    }
  }

  function drawPlayer(ctx, x, y, scale, match) {
    const phase = match && match.charging ? 0.55 : match && match.ball && match.ball.life < 0.25 ? 0.8 : 0;
    const charge = match && match.charging ? match.power : 0;
    const h = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath();
    ctx.ellipse(0, 4, h * 0.18, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8a070';
    roundedRect(ctx, -h * 0.1, -h * 0.37, h * 0.07, h * 0.35, 4);
    ctx.fill();
    roundedRect(ctx, h * 0.03, -h * 0.37, h * 0.07, h * 0.35, 4);
    ctx.fill();
    ctx.fillStyle = '#ef6a1a';
    roundedRect(ctx, -h * 0.13, -h * 0.42 + phase * h * 0.04, h * 0.26, h * 0.16, 5);
    ctx.fill();
    ctx.save();
    ctx.translate(0, -h * 0.42 + phase * h * 0.04);
    ctx.rotate(-phase * 0.15);
    ctx.fillStyle = '#f4f1ea';
    roundedRect(ctx, -h * 0.13, -h * 0.32, h * 0.26, h * 0.32, 6);
    ctx.fill();
    ctx.fillStyle = '#ef6a1a';
    ctx.font = `700 ${h * 0.09}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', 0, -h * 0.18);
    ctx.strokeStyle = '#d8a070';
    ctx.lineWidth = h * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-h * 0.1, -h * 0.27);
    ctx.lineTo(-h * 0.05 - phase * h * 0.1, -h * 0.18 - phase * h * 0.2);
    ctx.moveTo(h * 0.1, -h * 0.27);
    const armAngle = Math.PI * (-0.3 - phase * 0.8);
    ctx.lineTo(h * 0.1 + Math.cos(armAngle) * h * 0.32, -h * 0.27 + Math.sin(armAngle) * h * 0.32);
    ctx.stroke();
    ctx.fillStyle = '#d8a070';
    ctx.beginPath();
    ctx.arc(0, -h * 0.41, h * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0c04';
    ctx.beginPath();
    ctx.arc(0, -h * 0.43, h * 0.083, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (charge > 0.05) {
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, h * 0.25 * charge);
      glow.addColorStop(0, `rgba(255,176,102,${0.6 * charge})`);
      glow.addColorStop(1, 'rgba(255,176,102,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(0, 0, h * 0.25 * charge, h * 0.06 * charge, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAimPreview(ctx, w, h, match) {
    if (!match || match.ball || match.ended) return;
    ctx.save();
    ctx.strokeStyle = `rgba(247,201,72,${0.25 + (match.power || 0) * 0.5})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    const px = w * 0.22;
    const py = h * 0.82 - h * 0.32;
    const angle = -Math.PI / 2.4 + (match.aimAngle * Math.PI / 180);
    const velocity = 8 + (match.power || 0.5) * 12;
    let vx = Math.cos(angle) * velocity * 60;
    let vy = Math.sin(angle) * velocity * 60;
    let x = px;
    let y = py;
    for (let i = 0; i < 60; i++) {
      vy += GRAVITY * 0.03;
      x += vx * 0.03;
      y += vy * 0.03;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      if (y > h * 0.92 || x > w) break;
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawTrails(ctx, w) {
    game.trails.forEach((trail) => {
      ctx.fillStyle = `rgba(255,176,102,${trail.life})`;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, w * 0.012, 0, Math.PI * 2);
      ctx.fill();
      trail.life -= 0.02;
    });
    game.trails = game.trails.filter((trail) => trail.life > 0);
  }

  function drawBall(ctx, x, y, radius) {
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    gradient.addColorStop(0, '#ffc185');
    gradient.addColorStop(0.55, '#ef6a1a');
    gradient.addColorStop(1, '#7a2c08');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a0c04';
    ctx.lineWidth = Math.max(1, radius * 0.12);
    ctx.beginPath();
    ctx.moveTo(x - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x, y + radius);
    ctx.stroke();
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function loop(now) {
    if (!game.running) return;
    const dt = Math.min(0.05, (now - game.last) / 1000 || 0.016);
    game.last = now;
    update(dt);
    draw();
    if (game.running) raf = requestAnimationFrame(loop);
  }

  function drawCover() {
    const canvas = $('#cover');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);
    drawBackground(ctx, w, h);
    drawHoop(ctx, w * 0.78, h * 0.42, w * 0.06);
    drawPlayer(ctx, w * 0.32, h * 0.72, h * 0.34, { charging: true, power: 1 });
    const progress = (performance.now() / 1500) % 1;
    drawBall(ctx, w * 0.32 + (w * 0.46) * progress, (h * 0.72 - h * 0.32) - Math.sin(progress * Math.PI) * h * 0.22, h * 0.022);
    requestAnimationFrame(drawCover);
  }

  function bind() {
    const aim = $('#aim');
    if (aim) {
      aim.addEventListener('input', () => {
        if (game.match) game.match.aimAngle = Number(aim.value || 0);
      });
    }

    $('#aim-l')?.addEventListener('click', () => {
      if (!aim) return;
      aim.value = String(Math.max(-45, Number(aim.value) - 3));
      aim.dispatchEvent(new Event('input'));
    });

    $('#aim-r')?.addEventListener('click', () => {
      if (!aim) return;
      aim.value = String(Math.min(45, Number(aim.value) + 3));
      aim.dispatchEvent(new Event('input'));
    });

    const shoot = $('#btn-shoot');
    const press = (event) => { event.preventDefault(); startShot(); };
    const release = (event) => { event.preventDefault(); releaseShot(); };
    shoot?.addEventListener('pointerdown', press, { passive: false });
    window.addEventListener('pointerup', release, { passive: false });
    window.addEventListener('pointercancel', release, { passive: false });

    document.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      if (event.code === 'Space') { event.preventDefault(); startShot(); }
      if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') $('#aim-l')?.click();
      if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') $('#aim-r')?.click();
    });

    document.addEventListener('keyup', (event) => {
      if (event.code === 'Space') { event.preventDefault(); releaseShot(); }
    });

    $('#btn-play')?.addEventListener('click', () => {
      startMatch();
      $('#arena')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#ov-go')?.addEventListener('click', startMatch);
    $('#btn-end')?.addEventListener('click', () => endMatch(true));
    $('#ov-back')?.addEventListener('click', () => endMatch(true));

    $('#btn-hub')?.addEventListener('click', () => {
      const hub = $('#hub');
      if (!hub) return;
      hub.hidden = false;
      hub.dataset.open = 'true';
      renderHub();
    });

    $('#hub-close')?.addEventListener('click', () => {
      const hub = $('#hub');
      if (!hub) return;
      hub.dataset.open = 'false';
      setTimeout(() => { hub.hidden = true; }, 350);
    });

    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach((node) => node.classList.remove('active'));
        tab.classList.add('active');
        $$('.tab-panel').forEach((panel) => panel.classList.remove('active'));
        $(`.tab-panel[data-panel="${tab.dataset.tab}"]`)?.classList.add('active');
      });
    });

    $('#btn-tour')?.addEventListener('click', () => {
      const hub = $('#hub');
      if (hub) {
        hub.dataset.open = 'false';
        setTimeout(() => { hub.hidden = true; }, 350);
      }
      startMatch();
    });

    $('#btn-sound')?.addEventListener('click', (event) => {
      soundOn = !soundOn;
      event.currentTarget.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      if (soundOn) tone('click');
    });

    $('#btn-lang')?.addEventListener('click', () => {
      lang = lang === 'ro' ? 'en' : 'ro';
      localStorage.setItem('bvai.lang', lang);
      setText('#lang-label', lang === 'ro' ? 'EN' : 'RO');
    });

    $('#btn-help')?.addEventListener('click', () => $('#help')?.showModal());
    $('#help-close')?.addEventListener('click', () => $('#help')?.close());

    $('#btn-reset')?.addEventListener('click', () => {
      if (!confirm('Sigur ștergi progresul?')) return;
      localStorage.removeItem(KEY);
      state = loadState();
      renderHero();
      renderHub();
      toast('OK', 'good');
    });
  }

  function init() {
    setText('#lang-label', lang === 'ro' ? 'EN' : 'RO');
    setText('#year', new Date().getFullYear());
    ensureLeague();
    setupCanvas();
    bind();
    renderHero();
    renderHub();
    setText('#ov-title', 'Start');
    setText('#ov-msg', 'Țintește, ține apăsat pentru putere, eliberează lângă zona aurie.');
    draw();
    drawCover();
    console.info('Basket vs AI Enhanced Pro loaded: pro-2');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
