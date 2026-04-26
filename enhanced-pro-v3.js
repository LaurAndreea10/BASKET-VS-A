(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const STATE_KEY = 'bvai.state.v2';
  const PROFILE_KEY = 'bvai.player.profile.v1';
  const GRAVITY = 1450;

  const defaults = {
    level: 1, xp: 0, money: 0, fans: 0, bestScore: 0, bestCombo: 0,
    perfectShots: 0, rimHits: 0, bankShots: 0, wins: 0, losses: 0, draws: 0,
    league: { standings: [] }
  };
  const profileDefaults = { gender: 'girl', name: 'Laura', number: 10 };

  let state = readJson(STATE_KEY, defaults);
  let profile = readJson(PROFILE_KEY, profileDefaults);
  let lang = localStorage.getItem('bvai.lang') || 'ro';
  let soundOn = true;
  let audioCtx = null;
  let raf = 0;

  const game = { canvas: null, ctx: null, w: 900, h: 540, running: false, last: 0, match: null, trails: [] };

  function readJson(key, fallback) {
    try { return { ...fallback, ...(JSON.parse(localStorage.getItem(key)) || {}) }; }
    catch { return { ...fallback }; }
  }
  function saveState() { try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {} }
  function saveProfile() {
    profile.name = String(profile.name || 'Player').trim().slice(0, 14) || 'Player';
    profile.number = Math.max(0, Math.min(99, parseInt(profile.number, 10) || 0));
    profile.gender = profile.gender === 'boy' ? 'boy' : 'girl';
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
  }
  function xpNeed() { return Math.round(100 * Math.pow(1.35, state.level - 1)); }
  function fmt(n) { return Number(n || 0).toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-US'); }
  function text(sel, val) { const n = $(sel); if (n) n.textContent = val; }
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
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now); osc.stop(now + 0.14);
    } catch {}
  }
  function toast(msg, kind = '') {
    const el = $('#toast'); if (!el) return;
    el.textContent = msg; el.className = `toast ${kind}`.trim(); el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.hidden = true; }, 250); }, 1500);
  }

  function ensureLeague() {
    if (state.league?.standings?.length) return;
    state.league = { standings: [
      { name: profile.name ? `⭐ ${profile.name}` : '⭐ Tu', pts: 0, you: true },
      { name: 'DunkBot', pts: 11 }, { name: 'HoopGPT', pts: 9 }, { name: 'NetNinja', pts: 7 },
      { name: 'Splash9000', pts: 6 }, { name: 'Ace-12', pts: 4 }
    ]};
  }
  function syncYouNameInLeague() {
    ensureLeague();
    const you = state.league.standings.find((x) => x.you);
    if (you) you.name = `⭐ ${profile.name || 'Tu'}`;
  }

  function injectProfileUi() {
    if ($('#player-profile-card')) return;
    const careerPanel = $('.tab-panel[data-panel="career"]');
    if (!careerPanel) return;
    const card = document.createElement('section');
    card.id = 'player-profile-card';
    card.className = 'profile-card';
    card.innerHTML = `
      <h3>Profil jucător</h3>
      <div class="profile-grid">
        <label><span>Gen</span><select id="profile-gender"><option value="girl">Fată</option><option value="boy">Băiat</option></select></label>
        <label><span>Nume</span><input id="profile-name" type="text" maxlength="14" autocomplete="off" /></label>
        <label><span>Număr tricou</span><input id="profile-number" type="number" min="0" max="99" /></label>
      </div>
      <p class="profile-hint">Se salvează automat și apare pe tricou în joc.</p>
    `;
    careerPanel.prepend(card);

    const gender = $('#profile-gender');
    const name = $('#profile-name');
    const number = $('#profile-number');
    if (gender) gender.value = profile.gender;
    if (name) name.value = profile.name;
    if (number) number.value = profile.number;

    const update = () => {
      profile.gender = gender?.value || 'girl';
      profile.name = name?.value || 'Player';
      profile.number = number?.value || 10;
      saveProfile();
      syncYouNameInLeague();
      renderHub();
      renderHero();
      draw();
    };
    gender?.addEventListener('change', update);
    name?.addEventListener('input', update);
    number?.addEventListener('input', update);
  }

  function renderHero() {
    text('#hs-level', state.level); text('#hs-xp', fmt(state.xp)); text('#hs-fans', fmt(state.fans)); text('#hs-best', fmt(state.bestScore));
  }
  function renderHub() {
    ensureLeague(); syncYouNameInLeague(); injectProfileUi();
    text('#kpi-level', state.level); text('#kpi-money', fmt(state.money)); text('#kpi-fans', fmt(state.fans)); text('#kpi-best', fmt(state.bestScore));
    text('#kpi-perfect', state.perfectShots); text('#kpi-rim', state.rimHits); text('#kpi-bank', state.bankShots); text('#kpi-combo', state.bestCombo);
    text('#xp-now', state.xp); text('#xp-need', xpNeed());
    const fill = $('#xp-fill'); if (fill) fill.style.width = `${Math.min(100, state.xp / xpNeed() * 100)}%`;
    const achv = $('#achv-list'); if (achv) achv.innerHTML = ['🏀 Primul coș','✨ 10 perfecte','🏦 Bank master','🔥 Combo x5'].map((x)=>`<li><strong>${x}</strong><span class="pts">—</span></li>`).join('');
    const shop = $('#shop-list'); if (shop) shop.innerHTML = ['🎯 Asistență țintire','🌈 Arc îmbunătățit','💨 Scut de vânt'].map((x)=>`<li><strong>${x}</strong><button disabled>soon</button></li>`).join('');
    const daily = $('#daily-list'); if (daily) daily.innerHTML = '<li><strong>Provocare zilnică</strong><div class="pbar"><div class="pfill" style="width:35%"></div></div></li>';
    const tour = $('#tour-bracket'); if (tour) tour.innerHTML = '<div class="muted">Turneu 3 runde</div>';
    const rows = state.league.standings.slice(0,10).map((r)=>`<li class="${r.you?'you':''}"><span></span><strong>${r.name}</strong><span class="pts">${r.pts}</span></li>`).join('');
    const leader = $('#leader-list'); const league = $('#league-list'); if (leader) leader.innerHTML = rows; if (league) league.innerHTML = rows;
  }

  function setupCanvas() {
    const cv = $('#court'); if (!cv) return false;
    const ctx = cv.getContext('2d'); if (!ctx) return false;
    game.canvas = cv; game.ctx = ctx;
    const resize = () => {
      const r = cv.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2);
      game.w = Math.max(1, r.width); game.h = Math.max(1, r.height);
      cv.width = Math.floor(game.w * dpr); cv.height = Math.floor(game.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    };
    resize(); window.addEventListener('resize', resize); return true;
  }
  function newMatch() {
    const mode = $('input[name="mode"]:checked')?.value || 'classic';
    const diff = $('input[name="diff"]:checked')?.value || 'normal';
    return { mode, diff, timeLeft: Number($('input[name="time"]:checked')?.value || 60), you: 0, ai: 0, perfect: 0, rim: 0, bank: 0, combo: 0, bestCombo: 0, power: 0, charging: false, chargeStart: 0, aimAngle: Number($('#aim')?.value || 0), ball: null, ended: false, aiNext: 2.3, wind: 0, rimT: 0, accuracy: { easy: .45, normal: .6, hard: .72, pro: .82 }[diff] || .6 };
  }
  function startMatch() {
    if (!game.ctx && !setupCanvas()) return;
    game.match = newMatch(); game.running = true; game.trails = []; game.last = performance.now();
    const overlay = $('#overlay'); if (overlay) overlay.hidden = true;
    text('#sb-mode', $('input[name="mode"]:checked + span')?.textContent || 'Clasic'); text('#sb-diff', $('input[name="diff"]:checked + span')?.textContent || 'Normal');
    cancelAnimationFrame(raf); tone('click'); raf = requestAnimationFrame(loop);
  }
  function endMatch(force=false) {
    const m = game.match; if (!m) return;
    game.running = false; cancelAnimationFrame(raf);
    if (!force) {
      const won = m.you > m.ai, drawMatch = m.you === m.ai;
      const xp = 30 + m.you * 5 + (won ? 50 : drawMatch ? 20 : 0), money = 20 + m.you * 4 + (won ? 40 : 0), fans = 5 + m.you * 2 + (won ? 30 : 0);
      state.bestScore = Math.max(state.bestScore, m.you); state.bestCombo = Math.max(state.bestCombo, m.bestCombo); state.perfectShots += m.perfect; state.rimHits += m.rim; state.bankShots += m.bank; state.money += money; state.fans += fans; state.xp += xp;
      while (state.xp >= xpNeed()) { state.xp -= xpNeed(); state.level++; }
      if (won) state.wins++; else if (drawMatch) state.draws++; else state.losses++;
      saveState(); renderHero(); renderHub(); text('#ov-title', won ? 'Victorie!' : drawMatch ? 'Egal' : 'Înfrângere'); text('#ov-msg', `+${xp} XP, +${money}$, +${fans} fani`); tone(won ? 'win' : 'miss');
    } else { text('#ov-title', 'Start'); text('#ov-msg', 'Țintește, ține apăsat pentru putere, eliberează lângă zona aurie.'); }
    game.match = null; const overlay = $('#overlay'); if (overlay) overlay.hidden = false; draw();
  }
  function rimPosition() {
    const m = game.match; let x = game.w * 0.78; const y = game.h * 0.38; if (m?.mode === 'moving') x += Math.sin(m.rimT) * game.w * .06; return { x, y, r: game.w * .048 };
  }
  function startShot() { const m = game.match; if (!m || m.ball || m.ended) return; m.charging = true; m.chargeStart = performance.now(); m.power = 0; }
  function releaseShot() {
    const m = game.match; if (!m || !m.charging) return; m.charging = false;
    if (m.ball || m.power < .08) { m.power = 0; return; }
    const px = game.w * .18, py = game.h * .79 - game.h * .22, angle = -Math.PI/2.4 + (m.aimAngle * Math.PI / 180), v = 8 + m.power * 12;
    m.ball = { x: px, y: py, vx: Math.cos(angle) * v * 60, vy: Math.sin(angle) * v * 60, life: 0, perfect: m.power >= .6 && m.power <= .72, bankAttempt: Math.abs(m.aimAngle) > 18, bankHit: false, rimHit: false };
    m.power = 0;
  }
  function update(dt) {
    const m = game.match; if (!m) return;
    if (m.charging) { let p = ((performance.now() - m.chargeStart) / 1000) % 2; if (p > 1) p = 2 - p; m.power = p; }
    m.timeLeft -= dt; if (m.timeLeft <= 0) { m.timeLeft = 0; endMatch(false); return; }
    if (m.mode === 'wind') { m.wind += (Math.random() - .5) * 120 * dt; m.wind = Math.max(-90, Math.min(90, m.wind)); } else m.wind = 0;
    if (m.mode === 'moving') m.rimT += dt * 1.2;
    m.aiNext -= dt; if (m.aiNext <= 0) { m.aiNext = 2.2 + Math.random() * 2.3; if (Math.random() < m.accuracy) m.ai += Math.random() < .15 ? 3 : 2; }
    if (m.ball) updateBall(m, m.ball, dt); updateUi();
  }
  function updateBall(m, b, dt) {
    const px = b.x, py = b.y; b.vy += GRAVITY * dt; b.vx += m.wind * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.life += dt;
    game.trails.push({ x: b.x, y: b.y, life: .35 }); if (game.trails.length > 28) game.trails.shift();
    const r = rimPosition(), br = game.w * .018, crossed = py < r.y && b.y >= r.y, t = (r.y - py) / Math.max(.001, b.y - py), cx = px + (b.x - px) * Math.max(0, Math.min(1, t));
    if ((crossed && b.vy > 0 && cx > r.x - r.r + 4 && cx < r.x + r.r * .45 - 4) || (b.vy > 0 && Math.abs(b.x-r.x) < r.r && Math.abs(b.y-r.y) < br+8)) { score(m, b); return; }
    const boardX = r.x + r.r * 1.4; if (b.x + br >= boardX && b.vx > 0 && b.y >= r.y-r.r*2.5 && b.y <= r.y-r.r*.2) { b.vx = -Math.abs(b.vx) * .65; b.x = boardX - br; b.bankHit = true; tone('rim'); }
    const rimL = r.x-r.r, rimR = r.x+r.r*.45, hitRim = b.vy > 0 && Math.abs(b.y-r.y) < br+5 && (Math.abs(b.x-rimL) < br+2 || Math.abs(b.x-rimR) < br+2);
    if (hitRim && !b.rimHit) { b.vx = (b.x < r.x ? Math.abs(b.vx) : -Math.abs(b.vx)) * .65; b.vy = -Math.abs(b.vy) * .55; b.rimHit = true; m.rim++; tone('rim'); }
    if ((b.life > .7 && Math.abs(b.x-r.x) < 120 && Math.abs(b.y-r.y) < 120 && Math.hypot(b.vx,b.vy) < 220) || b.y > game.h*.92 || b.x < -60 || b.x > game.w+60 || b.life > 5) miss(m);
  }
  function score(m, b) { let pts = 2, label = 'SWISH!', kind = 'good'; if (b.bankHit || b.bankAttempt || m.mode === 'bank') { pts++; m.bank++; label='BANK!'; kind='gold'; } if (b.perfect && !b.rimHit) { pts++; m.perfect++; label='PERFECT'; kind='gold'; } m.combo++; m.bestCombo = Math.max(m.bestCombo, m.combo); if (m.combo >= 3) pts++; m.you += pts; m.ball = null; toast(`${label}${m.combo>=2?` Combo x${m.combo}`:''}`, kind); tone('score'); }
  function miss(m) { m.combo = 0; m.ball = null; toast('Ratat', 'bad'); tone('miss'); }
  function updateUi() {
    const m = game.match; if (!m) return;
    text('#sb-time', Math.ceil(m.timeLeft)); text('#sb-you', m.you); text('#sb-ai', m.ai); text('#rb-perfect', m.perfect); text('#rb-rim', m.rim); text('#rb-bank', m.bank); text('#rb-combo', m.combo); text('#rb-speed', m.ball ? Math.round(Math.hypot(m.ball.vx,m.ball.vy)/10) : 0);
    const pf = $('#power-fill'); if (pf) pf.style.inset = `0 ${100-m.power*100}% 0 0`; const pp = $('#power-perfect'); if (pp) { pp.style.left='60%'; pp.style.width='12%'; }
    const st = $('#sb-streak'); if (st) st.hidden = m.combo < 2; text('#sb-streak-n', m.combo); const wind = $('#rb-wind'); if (wind) wind.hidden = m.mode !== 'wind'; text('#rb-wind-n', Math.round(Math.abs(m.wind||0))); text('#rb-wind-arrow', (m.wind||0)>=0?'→':'←');
  }

  function draw() {
    if (!game.ctx) return; const ctx = game.ctx, w = game.w, h = game.h, m = game.match; ctx.clearRect(0,0,w,h); drawBackground(ctx,w,h); const r = rimPosition(); drawHoop(ctx, r.x-r.r*.6, r.y-r.r*.4, r.r*1.95); drawPlayer(ctx, w*.18, h*.89, h*.38, m); drawAimPreview(ctx,w,h,m); drawTrails(ctx,w); if (m?.ball) drawBall(ctx,m.ball.x,m.ball.y,w*.018);
  }
  function drawBackground(ctx,w,h) {
    const sky = ctx.createLinearGradient(0,0,0,h*.7); sky.addColorStop(0,'#0a0c14'); sky.addColorStop(1,'#1a1220'); ctx.fillStyle=sky; ctx.fillRect(0,0,w,h*.7);
    ctx.fillStyle='rgba(255,255,255,.04)'; for(let i=0;i<40;i++){ ctx.beginPath(); ctx.arc(i*w/40,h*.6+Math.sin(i)*4,5,0,Math.PI*2); ctx.fill(); }
    const floor=ctx.createLinearGradient(0,h*.7,0,h); floor.addColorStop(0,'#5a3018'); floor.addColorStop(1,'#1a0c04'); ctx.fillStyle=floor; ctx.fillRect(0,h*.7,w,h*.3); ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(w*.7,h*.95,w*.32,h*.18,0,Math.PI,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(w*.55,h*.83); ctx.lineTo(w*.85,h*.83); ctx.stroke();
  }
  function drawHoop(ctx,cx,cy,scale) {
    const width=scale; ctx.fillStyle='#3a2a1a'; ctx.fillRect(cx+width*.7,cy-width*.6,width*.18,width*4); ctx.fillStyle='rgba(255,255,255,.92)'; ctx.strokeStyle='#1a0c04'; ctx.lineWidth=2; roundedRect(ctx,cx+width*.18,cy-width*.55,width*.7,width*1.4,4); ctx.fill(); ctx.stroke(); const rimY=cy+width*.4,rimL=cx-width*.55,rimR=cx+width*.18; ctx.strokeStyle='#ff5d22'; ctx.lineWidth=Math.max(3,width*.08); ctx.beginPath(); ctx.moveTo(rimL,rimY); ctx.lineTo(rimR,rimY); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=1.2; for(let i=0;i<=9;i++){ const tx=rimL+(rimR-rimL)*(i/9), bx=rimL+(rimR-rimL)*(.18+(i/9)*.66); ctx.beginPath(); ctx.moveTo(tx,rimY); ctx.quadraticCurveTo((tx+bx)/2,rimY+width*.5,bx,rimY+width*.95); ctx.stroke(); }
  }
  function drawPlayer(ctx,x,y,scale,match) {
    const phase = match?.charging ? .55 : match?.ball?.life < .25 ? .8 : 0, charge = match?.charging ? match.power : 0, h = scale, isGirl = profile.gender !== 'boy';
    ctx.save(); ctx.translate(x,y); ctx.fillStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0,4,h*.16,h*.035,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#d8a070'; roundedRect(ctx,-h*.075,-h*.39,h*.05,h*.37,4); ctx.fill(); roundedRect(ctx,h*.03,-h*.39,h*.05,h*.37,4); ctx.fill();
    ctx.fillStyle=isGirl?'#fb7185':'#ef6a1a'; roundedRect(ctx,-h*.105,-h*.45+phase*h*.035,h*.21,h*.15,5); ctx.fill();
    ctx.save(); ctx.translate(0,-h*.45+phase*h*.035); ctx.rotate(-phase*.12); ctx.fillStyle=isGirl?'#fff4f5':'#f4f1ea'; roundedRect(ctx,-h*.105,-h*.31,h*.21,h*.31,6); ctx.fill(); ctx.strokeStyle=isGirl?'#fb7185':'#ef6a1a'; ctx.lineWidth=h*.015; ctx.stroke();
    ctx.fillStyle=isGirl?'#fb7185':'#ef6a1a'; ctx.font=`800 ${h*.085}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(profile.number).slice(0,2),0,-h*.17);
    ctx.strokeStyle='#d8a070'; ctx.lineWidth=h*.043; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-h*.08,-h*.26); ctx.lineTo(-h*.035-phase*h*.075,-h*.16-phase*h*.16); ctx.moveTo(h*.08,-h*.26); const arm=Math.PI*(-.3-phase*.8); ctx.lineTo(h*.08+Math.cos(arm)*h*.28,-h*.26+Math.sin(arm)*h*.28); ctx.stroke();
    ctx.fillStyle='#d8a070'; ctx.beginPath(); ctx.arc(0,-h*.4,h*.072,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#1a0c04'; ctx.beginPath(); ctx.arc(0,-h*.42,h*.07,Math.PI,Math.PI*2); ctx.fill(); if(isGirl){ ctx.beginPath(); ctx.ellipse(-h*.065,-h*.38,h*.035,h*.07,-.35,0,Math.PI*2); ctx.fill(); }
    ctx.restore(); ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font=`700 ${h*.045}px Inter Tight, sans-serif`; ctx.textAlign='center'; ctx.fillText(profile.name,0,h*.08);
    if(charge>.05){ const g=ctx.createRadialGradient(0,0,1,0,0,h*.22*charge); g.addColorStop(0,`rgba(255,176,102,${.55*charge})`); g.addColorStop(1,'rgba(255,176,102,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(0,0,h*.22*charge,h*.055*charge,0,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
  function drawAimPreview(ctx,w,h,m){ if(!m||m.ball||m.ended)return; ctx.save(); ctx.strokeStyle=`rgba(247,201,72,${.25+(m.power||0)*.5})`; ctx.lineWidth=2; ctx.setLineDash([4,6]); ctx.beginPath(); const px=w*.18,py=h*.79-h*.22,ang=-Math.PI/2.4+(m.aimAngle*Math.PI/180),v=8+(m.power||.5)*12; let vx=Math.cos(ang)*v*60,vy=Math.sin(ang)*v*60,x=px,y=py; for(let i=0;i<60;i++){ vy+=GRAVITY*.03; x+=vx*.03; y+=vy*.03; if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y); if(y>h*.92||x>w)break; } ctx.stroke(); ctx.restore(); }
  function drawTrails(ctx,w){ game.trails.forEach(t=>{ ctx.fillStyle=`rgba(255,176,102,${t.life})`; ctx.beginPath(); ctx.arc(t.x,t.y,w*.012,0,Math.PI*2); ctx.fill(); t.life-=.02; }); game.trails=game.trails.filter(t=>t.life>0); }
  function drawBall(ctx,x,y,r){ const g=ctx.createRadialGradient(x-r*.3,y-r*.3,r*.1,x,y,r); g.addColorStop(0,'#ffc185'); g.addColorStop(.55,'#ef6a1a'); g.addColorStop(1,'#7a2c08'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#1a0c04'; ctx.lineWidth=Math.max(1,r*.12); ctx.beginPath(); ctx.moveTo(x-r,y); ctx.lineTo(x+r,y); ctx.moveTo(x,y-r); ctx.lineTo(x,y+r); ctx.stroke(); }
  function roundedRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function loop(now){ if(!game.running)return; const dt=Math.min(.05,(now-game.last)/1000||.016); game.last=now; update(dt); draw(); if(game.running)raf=requestAnimationFrame(loop); }
  function drawCover(){ const cv=$('#cover'); if(!cv)return; const ctx=cv.getContext('2d'); if(!ctx)return; const r=cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2); cv.width=Math.max(1,Math.floor(r.width*d)); cv.height=Math.max(1,Math.floor(r.height*d)); ctx.setTransform(d,0,0,d,0,0); const w=r.width,h=r.height; ctx.clearRect(0,0,w,h); drawBackground(ctx,w,h); drawHoop(ctx,w*.78,h*.42,w*.08); drawPlayer(ctx,w*.28,h*.74,h*.24,{charging:true,power:1}); const t=(performance.now()/1500)%1; drawBall(ctx,w*.32+(w*.46)*t,(h*.72-h*.32)-Math.sin(t*Math.PI)*h*.22,h*.022); requestAnimationFrame(drawCover); }
  function bind(){
    const aim=$('#aim'); aim?.addEventListener('input',()=>{ if(game.match)game.match.aimAngle=Number(aim.value||0); }); $('#aim-l')?.addEventListener('click',()=>{ if(!aim)return; aim.value=String(Math.max(-45,Number(aim.value)-3)); aim.dispatchEvent(new Event('input')); }); $('#aim-r')?.addEventListener('click',()=>{ if(!aim)return; aim.value=String(Math.min(45,Number(aim.value)+3)); aim.dispatchEvent(new Event('input')); });
    const press=e=>{e.preventDefault();startShot();}, release=e=>{e.preventDefault();releaseShot();}; $('#btn-shoot')?.addEventListener('pointerdown',press,{passive:false}); window.addEventListener('pointerup',release,{passive:false}); window.addEventListener('pointercancel',release,{passive:false});
    document.addEventListener('keydown',e=>{ if(e.repeat)return; if(e.code==='Space'){e.preventDefault();startShot();} if(e.key==='a'||e.key==='A'||e.key==='ArrowLeft')$('#aim-l')?.click(); if(e.key==='d'||e.key==='D'||e.key==='ArrowRight')$('#aim-r')?.click(); }); document.addEventListener('keyup',e=>{ if(e.code==='Space'){e.preventDefault();releaseShot();} });
    $('#btn-play')?.addEventListener('click',()=>{startMatch();$('#arena')?.scrollIntoView({behavior:'smooth',block:'start'});}); $('#ov-go')?.addEventListener('click',startMatch); $('#btn-end')?.addEventListener('click',()=>endMatch(true)); $('#ov-back')?.addEventListener('click',()=>endMatch(true));
    $('#btn-hub')?.addEventListener('click',()=>{ const hub=$('#hub'); if(!hub)return; hub.hidden=false; hub.dataset.open='true'; renderHub(); }); $('#hub-close')?.addEventListener('click',()=>{ const hub=$('#hub'); if(!hub)return; hub.dataset.open='false'; setTimeout(()=>{hub.hidden=true;},350); });
    $$('.tab').forEach(tab=>tab.addEventListener('click',()=>{ $$('.tab').forEach(n=>n.classList.remove('active')); tab.classList.add('active'); $$('.tab-panel').forEach(p=>p.classList.remove('active')); $(`.tab-panel[data-panel="${tab.dataset.tab}"]`)?.classList.add('active'); }));
    $('#btn-tour')?.addEventListener('click',()=>{ const hub=$('#hub'); if(hub){hub.dataset.open='false';setTimeout(()=>{hub.hidden=true;},350);} startMatch(); }); $('#btn-sound')?.addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.setAttribute('aria-pressed',soundOn?'true':'false');if(soundOn)tone('click');}); $('#btn-lang')?.addEventListener('click',()=>{lang=lang==='ro'?'en':'ro';localStorage.setItem('bvai.lang',lang);text('#lang-label',lang==='ro'?'EN':'RO');}); $('#btn-help')?.addEventListener('click',()=>$('#help')?.showModal()); $('#help-close')?.addEventListener('click',()=>$('#help')?.close()); $('#btn-reset')?.addEventListener('click',()=>{ if(!confirm('Sigur ștergi progresul?'))return; localStorage.removeItem(STATE_KEY); state=readJson(STATE_KEY,defaults); renderHero(); renderHub(); toast('OK','good'); });
  }
  function init(){ saveProfile(); text('#lang-label',lang==='ro'?'EN':'RO'); text('#year',new Date().getFullYear()); ensureLeague(); setupCanvas(); bind(); renderHero(); renderHub(); text('#ov-title','Start'); text('#ov-msg','Țintește, ține apăsat pentru putere, eliberează lângă zona aurie.'); draw(); drawCover(); console.info('Basket vs AI Enhanced Pro loaded: pro-3'); }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
