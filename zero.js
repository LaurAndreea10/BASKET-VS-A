(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const c = $('#court'), a = $('#action'), f = $('#fx'), arena = $('#arena');
  const xc = c.getContext('2d'), xa = a.getContext('2d'), xf = f.getContext('2d');
  let W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 2);
  let time = 0, last = 0, raf = 0, over = false, charging = false, charge = 0;
  let balls = [], particles = [], round = 0, lastShot = { power: 0, angle: 8, status: 'Așteaptă' };
  const names = ['Rookie Bot', 'Sniper AI', 'Bank Boss', 'Legend AI'];
  const player = { x: .22, y: .80, shooting: false, sp: 0, launch: false };
  const ai = { x: .82, y: .80, shooting: false, sp: 0, launch: false };
  const hoop = { x: .70, y: .36, color: '#ff7a2a', size: 1 };
  const hoopAI = { x: .84, y: .42, color: '#4ad9ff', size: .65, label: 'AI' };
  const state = { mode: 'classic', left: 60, you: 0, ai: 0, wind: 0, combo: 0, best: 0, perfect: 0, bank: 0 };

  function mode(){ return $('input[name="mode"]:checked').value; }
  function dur(){ return +$('input[name="dur"]:checked').value; }
  function label(m){ return {classic:'Clasic',blitz:'Blitz',moving:'Coș mobil',wind:'Vânt haotic',bank:'Bank lab',sudden:'Sudden Death',practice:'Practice',bossrush:'Boss Rush'}[m] || m; }
  function aimAngle(){ return +$('#aim').value || 8; }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function powerPercent(){ return Math.round(charge * 100); }
  function isPerfectPower(p = charge){ return p >= .47 && p <= .57; }
  function shotStatus(p = charge){ if(p === 0) return 'Așteaptă'; if(isPerfectPower(p)) return 'PERFECT'; if(p < .47) return 'Prea slab'; return 'Prea tare'; }

  function resize(){
    const r = arena.getBoundingClientRect(); W = r.width; H = r.height;
    [c,a,f].forEach(canvas => { canvas.width = W*DPR; canvas.height = H*DPR; canvas.style.width = W+'px'; canvas.style.height = H+'px'; canvas.getContext('2d').setTransform(DPR,0,0,DPR,0,0); });
    drawArena();
  }

  function updateReadouts(){
    const pct = powerPercent();
    const angle = aimAngle();
    const status = shotStatus();
    $('#fill').style.width = pct + '%';
    $('#powerReadout').textContent = `${pct}% · ${status}`;
    $('#dataPower').textContent = pct + '%';
    $('#dataAngle').textContent = angle + '°';
    $('#dataStatus').textContent = status;
    $('#aimReadout').textContent = angle + '°';
    $('#perfectText').textContent = isPerfectPower() ? 'PERFECT' : 'PERFECT';
    $('#perfectText').style.opacity = isPerfectPower() ? '1' : '.55';
  }

  function start(){
    cancelAnimationFrame(raf);
    state.mode = mode(); state.left = state.mode === 'practice' ? 999 : state.mode === 'blitz' ? 30 : dur();
    state.you = 0; state.ai = 0; state.wind = 0; state.combo = 0; balls = []; particles = []; over = false; charge = 0; charging = false;
    $('#end').classList.remove('show'); $('#scoreP').textContent = 0; $('#scoreAI').textContent = 0;
    $('#timer').textContent = state.mode === 'practice' ? '∞' : state.left;
    $('#aiName').textContent = state.mode === 'bossrush' ? names[round % 4] : state.mode === 'practice' ? 'Practice' : names[Math.min(round, 1)];
    $('#modeTag').textContent = `${label(state.mode)} · ${$('#aiName').textContent}`;
    $('#windTag').style.display = (state.mode === 'wind' || state.mode === 'bossrush') ? 'block' : 'none';
    updateReadouts();
    last = performance.now(); raf = requestAnimationFrame(loop);
  }

  function loop(now){
    const dt = Math.min(.033, (now-last)/1000 || .016); last = now; time = now / 1000;
    if(!over && state.mode !== 'practice'){
      state.left -= dt; if(state.left <= 0) return finish(); $('#timer').textContent = Math.ceil(state.left);
    }
    if(state.mode === 'wind' || state.mode === 'bossrush'){
      state.wind = Math.sin(time * 1.7) * 70; $('#windTag').textContent = 'Vânt ' + Math.round(state.wind);
    }
    update(dt); render(); raf = requestAnimationFrame(loop);
  }

  function beginCharge(){ if(over || player.shooting) return; charging = true; charge = 0; lastShot.status = 'Încărcare'; updateReadouts(); }
  function releaseShot(){
    if(!charging || over) return;
    charging = false;
    lastShot = { power: charge, angle: aimAngle(), status: shotStatus(charge) };
    player.shooting = true; player.sp = 0; player.launch = true; player.shotPower = charge; player.shotAngle = aimAngle();
    updateReadouts();
  }

  function createShot(owner, target, power, angleDeg, forcedPerfect = false){
    const perfect = forcedPerfect || isPerfectPower(power);
    const angleError = (angleDeg - 8) * 1.35;
    const powerError = (power - .52) * 170;
    let targetX = target.rimX + (perfect ? 0 : angleError + powerError * .22);
    let targetY = target.rimY + (perfect ? 0 : Math.abs(powerError) * .08);
    const dx = targetX - owner.ballX;
    const dy = targetY - owner.ballY;
    const frames = 54;
    const gravity = .22;
    const arcBoost = 5.9 + clamp(power, .25, .9) * 1.2;
    balls.push({
      x: owner.ballX, y: owner.ballY,
      vx: dx / frames,
      vy: (dy - 0.5 * gravity * frames * frames) / frames - arcBoost * .05,
      g: gravity,
      rot: 0, target, owner, perfect, trail: []
    });
  }

  function update(dt){
    if(charging){
      // Oscilant, nu doar creștere până la capăt: arată date reale și permite dozaj.
      charge = (Math.sin(time * 4.2 - Math.PI/2) + 1) / 2;
      updateReadouts();
    }

    [player, ai].forEach(p => {
      if(!p.shooting) return;
      p.sp += .035;
      if(p.sp > .58 && p.launch){
        if(p === player) createShot(player, hoop, p.shotPower, p.shotAngle, false);
        else createShot(ai, hoopAI, .52, 8, true);
        p.launch = false;
      }
      if(p.sp > 1){ p.shooting = false; p.sp = 0; }
    });

    if(state.mode !== 'practice' && Math.random() < .010 && !ai.shooting){ ai.shooting = true; ai.sp = 0; ai.launch = true; }

    for(let i=balls.length-1;i>=0;i--){
      const b = balls[i];
      b.vx += state.wind * .0016;
      b.x += b.vx; b.y += b.vy; b.vy += b.g; b.rot += .25;
      b.trail.push({x:b.x,y:b.y}); if(b.trail.length > 12) b.trail.shift();
      const dx = b.x - b.target.rimX, dy = b.y - b.target.rimY;
      if(Math.abs(dx)<32 && dy>-8 && dy<16 && b.vy>0 && !b.hit){
        b.hit = true;
        if(Math.abs(dx)<20 && b.perfect){
          boom(b.target.rimX,b.target.rimY);
          if(b.owner === player){ state.you += state.mode === 'bank' ? 3 : 2; state.perfect++; state.combo++; state.best = Math.max(state.best,state.you); $('#scoreP').textContent = state.you; syncStats(); }
          else { state.ai += 2; $('#scoreAI').textContent = state.ai; }
          balls.splice(i,1); continue;
        } else {
          if(b.owner === player){ state.combo = 0; if(state.mode === 'sudden') finish(); }
          b.vx *= -.35; b.vy *= -.55; boom(b.x,b.y);
        }
      }
      if(b.y > H + 60 || b.x < -80 || b.x > W + 80) balls.splice(i,1);
    }
  }

  function finish(){
    over = true; cancelAnimationFrame(raf);
    const win = state.you >= state.ai;
    $('#endTitle').textContent = win ? 'VICTORIE!' : 'ÎNFRÂNGERE';
    $('#endText').textContent = `Scor final: Tu ${state.you} - ${state.ai} ${$('#aiName').textContent}`;
    $('#end').classList.add('show');
  }

  function render(){
    drawArena(); xa.clearRect(0,0,W,H); xf.clearRect(0,0,W,H);
    drawPlayer(player,false); drawPlayer(ai,true); balls.forEach(drawFlightBall);
    particles = particles.filter(p => (p.life -= .025) > 0).map(p => (p.x += p.vx, p.y += p.vy, p.vy += .15, p));
    particles.forEach(p => { xf.globalAlpha = p.life; xf.fillStyle = p.c; xf.beginPath(); xf.arc(p.x,p.y,p.s*p.life,0,Math.PI*2); xf.fill(); xf.globalAlpha = 1; });
  }

  function drawArena(){
    xc.clearRect(0,0,W,H);
    const g = xc.createLinearGradient(0,0,0,H); g.addColorStop(0,'#040712'); g.addColorStop(.55,'#131e3a'); g.addColorStop(.56,'#4a2b0e'); g.addColorStop(1,'#b07a35');
    xc.fillStyle = g; xc.fillRect(0,0,W,H);
    xc.strokeStyle = 'rgba(74,217,255,.8)'; xc.shadowColor = 'rgba(74,217,255,.6)'; xc.shadowBlur = 8; xc.lineWidth = 2;
    xc.beginPath(); xc.moveTo(0,H*.58); xc.lineTo(W,H*.58); xc.stroke();
    xc.beginPath(); xc.arc(W*.5,H*.78,W*.06,0,Math.PI*2); xc.stroke();
    if(state.mode === 'moving'){ hoop.x = .70 + .035*Math.sin(time*2); hoopAI.x = .84 + .03*Math.cos(time*2); } else { hoop.x = .70; hoopAI.x = .84; }
    drawHoop(hoop); drawHoop(hoopAI);
  }

  function drawHoop(h){
    const x = h.x*W, y = h.y*H, bw = W*.085*h.size, bh = H*.13*h.size;
    xc.fillStyle = 'rgba(15,22,40,.55)'; xc.fillRect(x-bw/2,y-bh/2,bw,bh);
    xc.strokeStyle = h.color; xc.shadowColor = h.color; xc.shadowBlur = 10; xc.strokeRect(x-bw/2,y-bh/2,bw,bh);
    h.rimX = x; h.rimY = y + bh*.76;
    xc.beginPath(); xc.arc(x,h.rimY,bw*.42,0,Math.PI*2); xc.stroke();
    if(h.label){ xc.fillStyle = h.color; xc.font = 'bold 13px sans-serif'; xc.textAlign = 'center'; xc.fillText(h.label,x,y-bh/2-6); }
  }

  function drawPlayer(p,isAI){
    const x = p.x*W, y = p.y*H, s = H*.18, sp = p.sp, jump = p.shooting ? -Math.sin(Math.min(1,sp)*Math.PI)*s*.16 : 0;
    xa.save(); xa.translate(x,y+jump);
    xa.fillStyle = 'rgba(0,0,0,.35)'; xa.beginPath(); xa.ellipse(0,s*.42-jump,s*.22,s*.06,0,0,Math.PI*2); xa.fill();
    xa.strokeStyle = '#d99876'; xa.lineWidth = s*.05; xa.lineCap='round'; xa.beginPath(); xa.moveTo(-s*.06,s*.02); xa.lineTo(-s*.08,s*.34); xa.moveTo(s*.06,s*.02); xa.lineTo(s*.08,s*.34); xa.stroke();
    xa.fillStyle = isAI ? '#2e6aa6' : '#ff5d8f'; roundRect(-s*.12,-s*.02,s*.24,s*.14,5); xa.fill();
    xa.fillStyle = '#f4f7ff'; roundRect(-s*.18,-s*.24,s*.36,s*.24,8); xa.fill();
    xa.fillStyle = isAI ? '#4ad9ff' : '#ff5d8f'; xa.font = `bold ${s*.1}px sans-serif`; xa.textAlign='center'; xa.fillText('10',0,-s*.12);
    xa.fillStyle = '#f5c8a8'; xa.beginPath(); xa.arc(0,-s*.36,s*.13,0,Math.PI*2); xa.fill();
    xa.fillStyle = '#2a1810'; xa.beginPath(); xa.arc(0,-s*.39,s*.13,Math.PI,Math.PI*2); xa.fill();
    let bx = s*.23, by = -s*.1 + Math.sin(time*5)*2;
    if(p.shooting && sp < .58){ const q = sp/.58; bx = s*.23*(1-q) + s*.06*q; by = (-s*.1)*(1-q) + (-s*.55)*q; }
    if(!p.shooting || sp < .58){ drawBall(xa,bx,by,s*.085,time*6); p.ballX = x+bx; p.ballY = y+jump+by; }
    xa.restore();
  }

  function roundRect(x,y,w,h,r){ xa.beginPath(); if(xa.roundRect) xa.roundRect(x,y,w,h,r); else xa.rect(x,y,w,h); }
  function drawBall(ctx,x,y,r,rot){
    ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
    const g = ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r); g.addColorStop(0,'#ffb066'); g.addColorStop(1,'#a04812');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#3a1a05'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(0,r); ctx.stroke(); ctx.restore();
  }
  function drawFlightBall(b){
    b.trail.forEach((p,i) => { const alpha = i / b.trail.length * .35; xf.fillStyle = `rgba(255,180,70,${alpha})`; xf.beginPath(); xf.arc(p.x,p.y,4+i*.3,0,Math.PI*2); xf.fill(); });
    drawBall(xa,b.x,b.y,13,b.rot);
  }
  function boom(x,y){ for(let i=0;i<18;i++){ const a = Math.random()*Math.PI*2, sp = 2+Math.random()*5; particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:1,s:3,c:['#ffd23b','#ff8c2a','#4ad9ff','#fff'][i%4]}); } }
  function syncStats(){ $('#kBest').textContent = state.best; $('#kPerfect').textContent = state.perfect; $('#kCombo').textContent = state.combo; }

  function fillShop(){
    const items = [['Perfect Assist Lv.1','Zona aurie crește cu +5% per nivel.','120$'],['Power Control','Bara de putere se mișcă mai lent.','150$'],['Wind Shield','Vântul afectează mai puțin mingea.','140$'],['Bank Master','Bonus mai mare la bank shot.','180$'],['Clutch Mode','Ultimele 10 secunde pot dubla scorul.','220$'],['🏀 Neon Ball','Look arcade luminos.','220$'],['🔥 Fire Ball','Perfectă pentru combo-uri.','360$'],['🌃 Night Court','Cinematic dark mode.','320$']];
    $('#shopGrid').innerHTML = items.map(i => `<div class="card"><strong>${i[0]}</strong><p>${i[1]}</p><div class="row"><span class="tag">${i[2]}</span><button>Cumpără</button></div></div>`).join('');
  }

  $('#openHub').onclick = () => $('#hub').classList.add('open');
  $('#closeHub').onclick = () => $('#hub').classList.remove('open');
  $('#endHub').onclick = () => { $('#hub').classList.add('open'); $('#end').classList.remove('show'); };
  $$('.tab').forEach(b => b.onclick = () => { $$('.tab').forEach(x=>x.classList.remove('active')); $$('.panel').forEach(p=>p.classList.remove('active')); b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active'); });
  $('#reset').onclick = () => location.reload();
  $('#play').onclick = () => { start(); scrollTo({top:arena.offsetTop-10, behavior:'smooth'}); };
  $('#restart').onclick = start; $('#again').onclick = start; $('#next').onclick = () => { round++; start(); };
  $('#bossBtn').onclick = () => { $('input[value="bossrush"]').checked = true; round++; start(); scrollTo({top:arena.offsetTop-10, behavior:'smooth'}); };
  $('#shoot').onpointerdown = beginCharge; addEventListener('pointerup', releaseShot);
  $('#aim').oninput = updateReadouts;
  $$('input[name="mode"],input[name="dur"]').forEach(i => i.onchange = start);

  fillShop(); resize(); start(); updateReadouts();
  addEventListener('resize', resize);
})();
