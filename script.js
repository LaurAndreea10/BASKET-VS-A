const $ = (id) => document.getElementById(id);

const storageKey = 'basket-vs-ai-enhanced-career';
const defaultCareer = {
  level: 1,
  xp: 0,
  cash: 0,
  fans: 0,
  best: 0,
  wins: 0,
  matches: 0,
  upgrades: { focus: 0, power: 0, clutch: 0 },
};

let career = loadCareer();
let game = null;
let charging = false;
let chargeDirection = 1;
let keys = new Set();
let animationId = null;

const upgrades = [
  { id: 'focus', name: 'Focus', desc: 'Makes aiming smoother and more forgiving.', cost: 45 },
  { id: 'power', name: 'Power control', desc: 'Improves perfect shot timing.', cost: 60 },
  { id: 'clutch', name: 'Clutch finisher', desc: 'Bonus chance in the final 15 seconds.', cost: 80 },
];

function loadCareer() {
  try {
    return { ...defaultCareer, ...(JSON.parse(localStorage.getItem(storageKey)) || {}) };
  } catch {
    return { ...defaultCareer };
  }
}

function saveCareer() {
  localStorage.setItem(storageKey, JSON.stringify(career));
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function xpNeeded() {
  return 100 + (career.level - 1) * 60;
}

function addXp(amount) {
  career.xp += amount;
  while (career.xp >= xpNeeded()) {
    career.xp -= xpNeeded();
    career.level += 1;
    career.cash += 35;
    showToast(`Level up! You reached level ${career.level}`);
  }
}

function updateCareerUi() {
  const rank = career.level >= 8 ? 'All-Star' : career.level >= 4 ? 'Rising Star' : 'Rookie';
  $('playerRank').textContent = rank;
  $('careerMeta').textContent = `Level ${career.level} · ${career.xp}/${xpNeeded()} XP · ${career.fans} fans`;
  $('xpFill').style.width = `${Math.min(100, (career.xp / xpNeeded()) * 100)}%`;
  $('statLevel').textContent = career.level;
  $('statCash').textContent = career.cash;
  $('statFans').textContent = career.fans;
  $('statBest').textContent = career.best;
  renderUpgrades();
  renderAchievements();
}

function renderUpgrades() {
  $('upgradeList').innerHTML = upgrades.map((upgrade) => {
    const level = career.upgrades[upgrade.id] || 0;
    const price = upgrade.cost + level * 35;
    const maxed = level >= 5;
    const disabled = maxed || career.cash < price;
    return `<article class="upgrade">
      <div><strong>${upgrade.name} · Lv ${level}/5</strong><p>${upgrade.desc}</p></div>
      <button type="button" data-upgrade="${upgrade.id}" ${disabled ? 'disabled' : ''}>${maxed ? 'Max' : `$${price}`}</button>
    </article>`;
  }).join('');

  document.querySelectorAll('[data-upgrade]').forEach((button) => {
    button.addEventListener('click', () => buyUpgrade(button.dataset.upgrade));
  });
}

function buyUpgrade(id) {
  const upgrade = upgrades.find((item) => item.id === id);
  const level = career.upgrades[id] || 0;
  const price = upgrade.cost + level * 35;
  if (career.cash < price || level >= 5) return;
  career.cash -= price;
  career.upgrades[id] = level + 1;
  saveCareer();
  updateCareerUi();
  showToast(`${upgrade.name} upgraded!`);
}

function renderAchievements() {
  const achievements = [
    { name: 'First win', desc: 'Win one match against the AI.', done: career.wins >= 1 },
    { name: 'Fan favorite', desc: 'Reach 100 fans.', done: career.fans >= 100 },
    { name: 'Sharp shooter', desc: 'Score 25+ points in a match.', done: career.best >= 25 },
    { name: 'Career grind', desc: 'Play 10 matches.', done: career.matches >= 10 },
  ];
  $('achievementList').innerHTML = achievements.map((item) => `
    <article class="achievement ${item.done ? 'unlocked' : ''}">
      <strong>${item.done ? '✅' : '🔒'} ${item.name}</strong>
      <p>${item.desc}</p>
    </article>`).join('');
}

function switchScreen(target) {
  $('homeScreen').classList.toggle('hidden', target !== 'home');
  $('gameScreen').classList.toggle('hidden', target !== 'game');
}

function openCareer() {
  $('careerScreen').classList.remove('hidden');
  document.querySelector('.app-shell').classList.add('with-career');
  updateCareerUi();
}

function closeCareer() {
  $('careerScreen').classList.add('hidden');
  document.querySelector('.app-shell').classList.remove('with-career');
}

function startGame() {
  const seconds = Number($('timeSelect').value);
  game = {
    you: 0,
    ai: 0,
    timeLeft: seconds,
    duration: seconds,
    aim: 0,
    power: 0,
    ball: null,
    aiCooldown: 1.15,
    hoopPhase: 0,
    mode: $('modeSelect').value,
    difficulty: $('difficultySelect').value,
    lastTick: performance.now(),
  };
  $('modeLabel').textContent = `${label(game.mode)} · ${label(game.difficulty)}`;
  switchScreen('game');
  resizeCanvas();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function label(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
}

function endGame() {
  cancelAnimationFrame(animationId);
  const won = game.you >= game.ai;
  const reward = won ? 70 : 35;
  const fans = won ? 18 : 7;
  career.matches += 1;
  career.wins += won ? 1 : 0;
  career.cash += Math.round(reward + game.you * 1.6);
  career.fans += fans + Math.floor(game.you / 3);
  career.best = Math.max(career.best, game.you);
  addXp(reward + game.you * 2);
  saveCareer();
  updateCareerUi();
  switchScreen('home');
  showToast(won ? `Win! ${game.you}-${game.ai}` : `Close one! ${game.you}-${game.ai}`);
  game = null;
}

function resizeCanvas() {
  const canvas = $('gameCanvas');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function loop(now) {
  if (!game) return;
  const dt = Math.min(0.05, (now - game.lastTick) / 1000);
  game.lastTick = now;
  updateGame(dt);
  drawGame();
  animationId = requestAnimationFrame(loop);
}

function updateGame(dt) {
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) return endGame();

  const aimSpeed = 1.75 + (career.upgrades.focus || 0) * 0.16;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) game.aim -= aimSpeed * dt;
  if (keys.has('ArrowRight') || keys.has('KeyD')) game.aim += aimSpeed * dt;
  game.aim = Math.max(-1, Math.min(1, game.aim));

  if (charging) {
    const powerSpeed = 1.9 + (career.upgrades.power || 0) * 0.12;
    game.power += chargeDirection * powerSpeed * dt;
    if (game.power >= 1) { game.power = 1; chargeDirection = -1; }
    if (game.power <= 0) { game.power = 0; chargeDirection = 1; }
  }

  if (game.ball) {
    game.ball.x += game.ball.vx * dt;
    game.ball.y += game.ball.vy * dt;
    game.ball.vy += 920 * dt;
    if (game.mode === 'chaos') game.ball.x += Math.sin(game.timeLeft * 4) * 26 * dt;
    const hoop = getHoop();
    const dx = game.ball.x - hoop.x;
    const dy = game.ball.y - hoop.y;
    if (!game.ball.scored && Math.abs(dx) < 34 && Math.abs(dy) < 24 && game.ball.vy > 0) {
      game.you += game.ball.perfect ? 3 : 2;
      game.ball.scored = true;
      showToast(game.ball.perfect ? 'Perfect shot! +3' : 'Nice shot! +2');
    }
    if (game.ball.y > $('gameCanvas').getBoundingClientRect().height + 80) game.ball = null;
  }

  const aiRate = { easy: 2.5, normal: 2.0, hard: 1.55, pro: 1.18 }[game.difficulty];
  game.aiCooldown -= dt;
  if (game.aiCooldown <= 0) {
    const chance = { easy: .46, normal: .56, hard: .67, pro: .76 }[game.difficulty];
    if (Math.random() < chance) game.ai += Math.random() < .18 ? 3 : 2;
    game.aiCooldown = aiRate + Math.random() * .8;
  }

  game.hoopPhase += dt;
  $('youScore').textContent = game.you;
  $('aiScore').textContent = game.ai;
  $('timer').textContent = Math.ceil(game.timeLeft);
  $('powerFill').style.width = `${game.power * 100}%`;
}

function getHoop() {
  const rect = $('gameCanvas').getBoundingClientRect();
  const moving = game?.mode === 'moving' || game?.mode === 'chaos';
  return {
    x: rect.width * 0.68 + (moving ? Math.sin(game.hoopPhase * 1.7) * 56 : 0),
    y: rect.height * 0.32,
  };
}

function drawGame() {
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#17172a');
  grad.addColorStop(1, '#090910');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,.08)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(w * .2, h * .82, 110 + i * 34, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }

  const player = { x: w * .22, y: h * .78 };
  const hoop = getHoop();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(hoop.x + 48, hoop.y - 55);
  ctx.lineTo(hoop.x + 48, hoop.y + 38);
  ctx.stroke();
  ctx.strokeStyle = '#ff6b2b';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(hoop.x, hoop.y, 44, 12, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ff6b2b';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.font = '700 13px DM Sans';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', player.x, player.y + 48);

  ctx.strokeStyle = 'rgba(255,179,71,.7)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 7]);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 32);
  ctx.quadraticCurveTo(w * (.42 + game.aim * .16), h * .08, hoop.x, hoop.y);
  ctx.stroke();
  ctx.setLineDash([]);

  if (game.ball) {
    ctx.fillStyle = '#ff8a3d';
    ctx.beginPath();
    ctx.arc(game.ball.x, game.ball.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(game.ball.x - 12, game.ball.y);
    ctx.lineTo(game.ball.x + 12, game.ball.y);
    ctx.moveTo(game.ball.x, game.ball.y - 12);
    ctx.lineTo(game.ball.x, game.ball.y + 12);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.font = '700 12px DM Sans';
  ctx.textAlign = 'left';
  ctx.fillText(`Aim ${Math.round(game.aim * 100)} · ${game.mode === 'chaos' ? 'Wind active' : 'No wind'}`, 18, 28);
}

function startCharge() {
  if (!game || game.ball) return;
  charging = true;
  chargeDirection = 1;
}

function releaseShot() {
  if (!game || !charging || game.ball) return;
  charging = false;
  const rect = $('gameCanvas').getBoundingClientRect();
  const player = { x: rect.width * .22, y: rect.height * .78 };
  const hoop = getHoop();
  const focusBonus = (career.upgrades.focus || 0) * .018;
  const powerBonus = (career.upgrades.power || 0) * .018;
  const aimError = Math.abs(game.aim) * .55;
  const powerError = Math.abs(game.power - .74);
  const clutch = game.timeLeft < 15 ? (career.upgrades.clutch || 0) * .018 : 0;
  const perfect = aimError + powerError < .15 + focusBonus + powerBonus + clutch;
  const targetX = hoop.x + game.aim * 140 + (perfect ? 0 : (Math.random() - .5) * 120);
  const targetY = hoop.y - 12 + (perfect ? 0 : (Math.random() - .5) * 50);
  const duration = .92;
  game.ball = {
    x: player.x,
    y: player.y - 35,
    vx: (targetX - player.x) / duration,
    vy: (targetY - player.y + 35 - .5 * 920 * duration * duration) / duration,
    perfect,
    scored: false,
  };
  game.power = 0;
}

function bindEvents() {
  $('playBtn').addEventListener('click', startGame);
  $('careerBtn').addEventListener('click', openCareer);
  $('closeCareerBtn').addEventListener('click', closeCareer);
  $('quitBtn').addEventListener('click', () => { if (game) endGame(); });
  $('openHelpBtn').addEventListener('click', () => $('helpDialog').showModal());
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset enhanced career progress?')) return;
    career = { ...defaultCareer, upgrades: { ...defaultCareer.upgrades } };
    saveCareer();
    updateCareerUi();
    showToast('Career reset');
  });

  $('shootBtn').addEventListener('pointerdown', startCharge);
  window.addEventListener('pointerup', releaseShot);
  $('leftBtn').addEventListener('pointerdown', () => keys.add('ArrowLeft'));
  $('leftBtn').addEventListener('pointerup', () => keys.delete('ArrowLeft'));
  $('rightBtn').addEventListener('pointerdown', () => keys.add('ArrowRight'));
  $('rightBtn').addEventListener('pointerup', () => keys.delete('ArrowRight'));
  window.addEventListener('keydown', (event) => {
    keys.add(event.code);
    if (event.code === 'Space') {
      event.preventDefault();
      startCharge();
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    if (event.code === 'Space') releaseShot();
  });
  window.addEventListener('resize', resizeCanvas);
}

bindEvents();
updateCareerUi();
