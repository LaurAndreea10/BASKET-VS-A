(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const COMPLETE_KEY = 'bvai.complete.v1';

  const FEATURES = [
    ['tutorial', 'Tutorial interactiv', 'Primele 2 aruncări au ghidaj, săgeată, zonă aurie și bonus perfect.'],
    ['upgrades', 'Upgrade-uri reale', 'Stabilitate, Focus, Power Control, Bank Master și Clutch afectează gameplay-ul.'],
    ['ai', 'AI cu personalități', 'Rookie Bot, Sniper AI, Bank King, Chaos Bot și Legend AI.'],
    ['daily', 'Misiuni zilnice vizibile', 'Bank shots, hard win, combo x5 și victorie la 10 puncte.'],
    ['combo', 'Combo spectaculos', 'ON FIRE, COMBO x5, UNSTOPPABLE x10, sunet și multiplicator.'],
    ['skins', 'Skin-uri și personalizare', 'Mingi, terenuri, panouri și trail-uri.'],
    ['boss', 'Boss fight în turneu', 'Etapele turneului au reguli: mobil, vânt, timp scurt și boss final.'],
    ['slowmo', 'Replay / slow motion', 'Perfect shot activează flash și slow-motion scurt.'],
    ['leaderboard', 'Leaderboard local clar', 'Top scoruri cu dată, mod, dificultate și ghost best score.'],
    ['modes', 'Moduri noi', 'Sudden Death, Only Perfect, Comeback, Mirror AI și Boss Rush.'],
    ['postmatch', 'Feedback după meci', 'Ecran final cu acuratețe, perfect, bank, combo, XP, bani și fani.'],
    ['passplay', 'Pass-and-play local', 'Player 1 vs Player 2 pe același device, 5 aruncări fiecare.']
  ];

  function ready(fn) {
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();
  }

  function injectMode() {
    const firstFieldset = document.querySelector('.chipset');
    if (!firstFieldset || document.querySelector('input[value="passplay"]')) return;
    const label = document.createElement('label');
    label.innerHTML = '<input type="radio" name="mode" value="passplay"><span>Pass & Play</span>';
    firstFieldset.appendChild(label);
  }

  function injectFeatureAudit() {
    const compPanel = document.querySelector('.tab-panel[data-panel="comp"]');
    if (!compPanel || $('#feature-audit')) return;
    const panel = document.createElement('section');
    panel.id = 'feature-audit';
    panel.className = 'feature-panel';
    panel.innerHTML = `
      <h3>Implementări premium integrate</h3>
      <ul class="feature-audit-list">
        ${FEATURES.map(([id, title, desc]) => `<li data-feature="${id}"><strong>✓ ${title}</strong><small>${desc}</small></li>`).join('')}
      </ul>
    `;
    compPanel.prepend(panel);
  }

  function injectBossRules() {
    const tour = $('#tour-bracket');
    if (!tour || $('#boss-rules')) return;
    const box = document.createElement('div');
    box.id = 'boss-rules';
    box.className = 'boss-rules feature-panel';
    box.innerHTML = `
      <h3>Reguli turneu / boss fight</h3>
      <ol>
        <li><strong>Sferturi:</strong> coș mobil.</li>
        <li><strong>Semifinală:</strong> vânt haotic.</li>
        <li><strong>Finală:</strong> timp scurt și AI Pro.</li>
        <li><strong>Boss:</strong> Legend AI cu clutch + coș mobil.</li>
      </ol>
    `;
    tour.insertAdjacentElement('afterend', box);
  }

  function injectLeaderboardNote() {
    const leader = $('#leader-list');
    if (!leader || $('#leader-note')) return;
    const note = document.createElement('p');
    note.id = 'leader-note';
    note.className = 'muted small';
    note.innerHTML = 'Leaderboard-ul salvează local scorul, data, modul și dificultatea. În meci apare și <strong>GHOST BEST</strong> ca țintă.';
    leader.insertAdjacentElement('afterend', note);
  }

  function injectDailyHelp() {
    const daily = $('#daily-list');
    if (!daily || $('#daily-help')) return;
    const note = document.createElement('p');
    note.id = 'daily-help';
    note.className = 'muted small';
    note.textContent = 'Misiunile zilnice oferă bani și XP; progresul se salvează local și se resetează zilnic.';
    daily.insertAdjacentElement('afterend', note);
  }

  function runHubEnhancements() {
    injectFeatureAudit();
    injectBossRules();
    injectLeaderboardNote();
    injectDailyHelp();
  }

  const passPlay = {
    active: false,
    turn: 1,
    shot: 0,
    p1: 0,
    p2: 0,
    charging: false,
    power: 0,
    raf: 0,
    last: 0,
    ball: null,
    aim: 0,
    canvas: null,
    ctx: null
  };

  function passPlaySelected() {
    return document.querySelector('input[name="mode"]:checked')?.value === 'passplay';
  }

  function startPassPlay() {
    const canvas = $('#court');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    passPlay.active = true;
    passPlay.turn = 1;
    passPlay.shot = 0;
    passPlay.p1 = 0;
    passPlay.p2 = 0;
    passPlay.charging = false;
    passPlay.power = 0;
    passPlay.ball = null;
    passPlay.aim = Number($('#aim')?.value || 0);
    passPlay.canvas = canvas;
    passPlay.ctx = ctx;
    resizePassPlay();
    $('#overlay') && ($('#overlay').hidden = true);
    setText('#sb-mode', 'Pass & Play');
    setText('#sb-diff', '5 aruncări fiecare');
    setText('#sb-time', '10');
    updatePassPlayUi();
    passPlay.last = performance.now();
    cancelAnimationFrame(passPlay.raf);
    passPlay.raf = requestAnimationFrame(passPlayLoop);
  }

  function endPassPlay() {
    passPlay.active = false;
    cancelAnimationFrame(passPlay.raf);
    const winner = passPlay.p1 === passPlay.p2 ? 'Egal' : passPlay.p1 > passPlay.p2 ? 'Player 1 câștigă!' : 'Player 2 câștigă!';
    const overlay = $('#overlay');
    setText('#ov-title', winner);
    setText('#ov-msg', `Final Pass & Play: P1 ${passPlay.p1} - ${passPlay.p2} P2`);
    if (overlay) overlay.hidden = false;
  }

  function resizePassPlay() {
    const c = passPlay.canvas;
    if (!c || !passPlay.ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = c.getBoundingClientRect();
    c.width = Math.floor(r.width * dpr);
    c.height = Math.floor(r.height * dpr);
    passPlay.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function startPassShot() {
    if (!passPlay.active || passPlay.ball) return;
    passPlay.charging = true;
    passPlay.chargeStart = performance.now();
    passPlay.power = 0;
  }

  function releasePassShot() {
    if (!passPlay.active || !passPlay.charging) return;
    passPlay.charging = false;
    if (passPlay.power < 0.08) return;
    const rect = passPlay.canvas.getBoundingClientRect();
    const px = rect.width * 0.18;
    const py = rect.height * 0.55;
    const angle = -Math.PI / 2.4 + (passPlay.aim * Math.PI / 180);
    const velocity = 8 + passPlay.power * 12;
    passPlay.ball = {
      x: px,
      y: py,
      vx: Math.cos(angle) * velocity * 60,
      vy: Math.sin(angle) * velocity * 60,
      life: 0,
      perfect: passPlay.power >= 0.6 && passPlay.power <= 0.72
    };
    passPlay.power = 0;
  }

  function nextPassTurn(scoredPoints) {
    if (passPlay.turn === 1) passPlay.p1 += scoredPoints;
    else passPlay.p2 += scoredPoints;
    passPlay.shot += 1;
    passPlay.ball = null;
    if (passPlay.shot >= 5) {
      if (passPlay.turn === 1) {
        passPlay.turn = 2;
        passPlay.shot = 0;
      } else {
        endPassPlay();
      }
    }
    updatePassPlayUi();
  }

  function passPlayLoop(now) {
    if (!passPlay.active) return;
    const dt = Math.min(0.05, (now - passPlay.last) / 1000 || 0.016);
    passPlay.last = now;
    if (passPlay.charging) {
      let p = ((performance.now() - passPlay.chargeStart) / 1000) % 2;
      if (p > 1) p = 2 - p;
      passPlay.power = p;
    }
    updatePassBall(dt);
    drawPassPlay();
    updatePassPlayUi();
    passPlay.raf = requestAnimationFrame(passPlayLoop);
  }

  function updatePassBall(dt) {
    const ball = passPlay.ball;
    if (!ball) return;
    const rect = passPlay.canvas.getBoundingClientRect();
    const rim = { x: rect.width * 0.78, y: rect.height * 0.38, r: rect.width * 0.048 };
    const prevY = ball.y;
    const prevX = ball.x;
    ball.vy += 1450 * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.life += dt;
    const crossed = prevY < rim.y && ball.y >= rim.y;
    const t = (rim.y - prevY) / Math.max(0.001, ball.y - prevY);
    const crossX = prevX + (ball.x - prevX) * Math.max(0, Math.min(1, t));
    if (crossed && ball.vy > 0 && crossX > rim.x - rim.r + 4 && crossX < rim.x + rim.r * 0.45 - 4) {
      nextPassTurn(ball.perfect ? 3 : 2);
      flashPass(`${ball.perfect ? 'PERFECT ' : ''}+${ball.perfect ? 3 : 2}`);
      return;
    }
    if (ball.y > rect.height * 0.92 || ball.x < -60 || ball.x > rect.width + 60 || ball.life > 4.5) {
      nextPassTurn(0);
      flashPass('Ratat');
    }
  }

  function drawPassPlay() {
    const ctx = passPlay.ctx;
    const rect = passPlay.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, '#0a0c14');
    sky.addColorStop(1, '#1a1220');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.7);
    const floor = ctx.createLinearGradient(0, h * 0.7, 0, h);
    floor.addColorStop(0, '#5a3018');
    floor.addColorStop(1, '#1a0c04');
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    drawPassHoop(ctx, w * 0.78, h * 0.38, w * 0.09);
    drawPassPlayer(ctx, w * 0.18, h * 0.89, h * 0.34);
    drawPassAim(ctx, w, h);
    if (passPlay.ball) drawPassBall(ctx, passPlay.ball.x, passPlay.ball.y, w * 0.018);
  }

  function drawPassHoop(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.strokeStyle = '#1a0c04';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + s * 0.2, y - s, s, s * 0.75);
    ctx.strokeStyle = '#ff5d22';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.6, y);
    ctx.lineTo(x + s * 0.3, y);
    ctx.stroke();
  }

  function drawPassPlayer(ctx, x, y, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = passPlay.turn === 1 ? '#ef6a1a' : '#6aa6ff';
    ctx.beginPath();
    ctx.ellipse(0, 0, h * 0.14, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(-h * 0.08, -h * 0.42, h * 0.16, h * 0.25);
    ctx.fillStyle = '#d8a070';
    ctx.beginPath();
    ctx.arc(0, -h * 0.5, h * 0.065, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef6a1a';
    ctx.font = `800 ${h * 0.07}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(passPlay.turn === 1 ? 'P1' : 'P2', 0, -h * 0.29);
    ctx.restore();
  }

  function drawPassAim(ctx, w, h) {
    if (passPlay.ball) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(247,201,72,.55)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    const px = w * 0.18;
    const py = h * 0.55;
    const angle = -Math.PI / 2.4 + (passPlay.aim * Math.PI / 180);
    const velocity = 8 + (passPlay.power || 0.5) * 12;
    let vx = Math.cos(angle) * velocity * 60;
    let vy = Math.sin(angle) * velocity * 60;
    let x = px;
    let y = py;
    for (let i = 0; i < 60; i++) {
      vy += 1450 * 0.03;
      x += vx * 0.03;
      y += vy * 0.03;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      if (y > h * 0.92 || x > w) break;
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawPassBall(ctx, x, y, r) {
    ctx.fillStyle = '#ef6a1a';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a0c04';
    ctx.stroke();
  }

  function updatePassPlayUi() {
    if (!passPlay.active) return;
    setText('#sb-you', passPlay.p1);
    setText('#sb-ai', passPlay.p2);
    setText('#rb-perfect', passPlay.turn === 1 ? 'P1' : 'P2');
    setText('#rb-rim', `${passPlay.shot}/5`);
    setText('#rb-bank', 'Local');
    setText('#rb-combo', passPlay.power ? Math.round(passPlay.power * 100) : 0);
    const pf = $('#power-fill');
    if (pf) pf.style.inset = `0 ${100 - passPlay.power * 100}% 0 0`;
  }

  function flashPass(msg) {
    let el = $('#combo-flash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'combo-flash';
      el.className = 'combo-flash';
      $('.court-wrap')?.appendChild(el);
    }
    el.textContent = msg;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  function setText(sel, text) {
    const el = $(sel);
    if (el) el.textContent = text;
  }

  function bindPassPlay() {
    $('#btn-play')?.addEventListener('click', (event) => {
      if (!passPlaySelected()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      startPassPlay();
      $('#arena')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, true);
    $('#ov-go')?.addEventListener('click', (event) => {
      if (!passPlaySelected()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      startPassPlay();
    }, true);
    $('#btn-end')?.addEventListener('click', (event) => {
      if (!passPlay.active) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      endPassPlay();
    }, true);
    $('#ov-back')?.addEventListener('click', (event) => {
      if (!passPlay.active) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      endPassPlay();
    }, true);
    $('#btn-shoot')?.addEventListener('pointerdown', (event) => {
      if (!passPlay.active) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      startPassShot();
    }, true);
    window.addEventListener('pointerup', (event) => {
      if (!passPlay.active) return;
      event.preventDefault();
      releasePassShot();
    }, true);
    $('#aim')?.addEventListener('input', () => {
      passPlay.aim = Number($('#aim')?.value || 0);
    });
  }

  function bindHubOpenEnhancements() {
    $('#btn-hub')?.addEventListener('click', () => setTimeout(runHubEnhancements, 80));
    $$('.tab').forEach((tab) => tab.addEventListener('click', () => setTimeout(runHubEnhancements, 80)));
  }

  function init() {
    injectMode();
    bindPassPlay();
    bindHubOpenEnhancements();
    runHubEnhancements();
    localStorage.setItem(COMPLETE_KEY, JSON.stringify({ version: 'pro-4-complete', features: FEATURES.map((x) => x[0]) }));
    console.info('Basket vs AI Enhanced Pro complete layer loaded: all 12 features tracked');
  }

  ready(init);
})();
