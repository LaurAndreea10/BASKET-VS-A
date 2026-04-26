(() => {
  'use strict';
  const VERSION = 'zero-final-v5';
  const STORE = 'bvai.zero.final.v5';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const c = $('#court'), a = $('#action'), f = $('#fx'), arena = $('#arena');
  const xc = c.getContext('2d'), xa = a.getContext('2d'), xf = f.getContext('2d');
  let W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 2);
  let time = 0, last = 0, raf = 0, over = false, charging = false, charge = 0;
  let balls = [], particles = [], aiCooldown = 1.2;

  const opponents = [
    { id:'rookie', name:'Rookie Bot', acc:.38, delay:2.2, style:'ratează des' },
    { id:'sniper', name:'Sniper AI', acc:.67, delay:1.65, style:'perfect shots' },
    { id:'bank', name:'Bank Boss', acc:.58, delay:1.85, style:'bank bonus' },
    { id:'legend', name:'Legend AI', acc:.78, delay:1.35, style:'final boss' }
  ];
  const player = { x:.22, y:.80, gender:'female', shooting:false, sp:0, launch:false };
  const ai = { x:.82, y:.80, gender:'male', shooting:false, sp:0, launch:false };
  const hoop = { x:.70, y:.36, color:'#ff7a2a', size:1 };
  const hoopAI = { x:.84, y:.42, color:'#4ad9ff', size:.65, label:'AI' };
  const match = { mode:'classic', left:60, you:0, ai:0, wind:0, combo:0, started:false };

  const baseProgress = {
    level:1, xp:0, money:150, fans:0, best:0, perfect:0, bank:0, comboMax:0, wins:0,
    tournamentRound:0, bossStage:0,
    upgrades:{ assist:0, control:0, wind:0, bank:0, clutch:0 },
    owned:{ classic:true, neon:false, fire:false, gold:false, galaxy:false, arena:true, street:false, night:false, flame:false, ice:false, star:false },
    equipped:{ ball:'classic', court:'arena', trail:'star' },
    missions:{ bank:0, hard:0, combo:0, margin:0 },
    lastDaily:''
  };
  let progress = loadProgress();

  const shopItems = [
    { type:'upgrade', key:'assist', title:'Perfect Assist Lv.', desc:'Zona perfectă crește cu +3% per nivel.', max:5, price:120 },
    { type:'upgrade', key:'control', title:'Power Control Lv.', desc:'Bara de putere se mișcă mai lent.', max:5, price:150 },
    { type:'upgrade', key:'wind', title:'Wind Shield Lv.', desc:'Vântul afectează mai puțin mingea.', max:5, price:140 },
    { type:'upgrade', key:'bank', title:'Bank Master Lv.', desc:'Bank lab acordă bonus mai mare.', max:4, price:180 },
    { type:'upgrade', key:'clutch', title:'Clutch Mode Lv.', desc:'Ultimele 10 secunde pot dubla scorul.', max:3, price:220 },
    { type:'skin', key:'classic', slot:'ball', title:'Classic Ball', desc:'Mingea standard.', price:0 },
    { type:'skin', key:'neon', slot:'ball', title:'🏀 Neon Ball', desc:'Look arcade luminos.', price:220 },
    { type:'skin', key:'fire', slot:'ball', title:'🔥 Fire Ball', desc:'Minge cu energie pentru combo-uri.', price:360 },
    { type:'skin', key:'gold', slot:'ball', title:'🥇 Gold Ball', desc:'Skin premium de status.', price:520 },
    { type:'skin', key:'galaxy', slot:'ball', title:'🌌 Galaxy Ball', desc:'Ediție cosmică.', price:680 },
    { type:'skin', key:'arena', slot:'court', title:'Arena', desc:'Sala de bază.', price:0 },
    { type:'skin', key:'street', slot:'court', title:'🏙️ Street Court', desc:'Teren urban contrastat.', price:260 },
    { type:'skin', key:'night', slot:'court', title:'🌃 Night Court', desc:'Cinematic dark mode.', price:320 },
    { type:'skin', key:'flame', slot:'trail', title:'🔥 Flame Trail', desc:'Flacără la aruncare.', price:300 },
    { type:'skin', key:'ice', slot:'trail', title:'🧊 Ice Trail', desc:'Trail rece.', price:300 },
    { type:'skin', key:'star', slot:'trail', title:'✨ Star Trail', desc:'Scântei stelare.', price:460 }
  ];

  function loadProgress(){ try { return deepMerge(structuredClone(baseProgress), JSON.parse(localStorage.getItem(STORE) || 'null') || {}); } catch { return structuredClone(baseProgress); } }
  function deepMerge(a,b){ if(!b || typeof b !== 'object') return a; Object.keys(b).forEach(k => { if(b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) a[k] = deepMerge(a[k] || {}, b[k]); else a[k] = b[k]; }); return a; }
  function save(){ localStorage.setItem(STORE, JSON.stringify(progress)); syncHub(); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function resetDailyIfNeeded(){ if(progress.lastDaily !== today()){ progress.lastDaily = today(); progress.missions = { bank:0, hard:0, combo:0, margin:0 }; save(); } }
  function mode(){ return $('input[name="mode"]:checked').value; }
  function dur(){ return +$('input[name="dur"]:checked').value; }
  function label(m){ return {classic:'Clasic',blitz:'Blitz',moving:'Coș mobil',wind:'Vânt haotic',bank:'Bank lab',sudden:'Sudden Death',practice:'Practice',bossrush:'Boss Rush'}[m] || m; }
  function aimAngle(){ return +$('#aim').value || 8; }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function perfectBand(){ const extra = progress.upgrades.assist * .012; return [.47-extra, .57+extra]; }
  function isPerfectPower(p = charge){ const [a,b] = perfectBand(); return p >= a && p <= b; }
  function powerPercent(){ return Math.round(charge * 100); }
  function shotStatus(p = charge){ if(p === 0) return 'Așteaptă'; if(isPerfectPower(p)) return 'PERFECT'; if(p < perfectBand()[0]) return 'Prea slab'; return 'Prea tare'; }
  function currentOpponent(){ if(match.mode === 'bossrush') return opponents[progress.bossStage % opponents.length]; return opponents[Math.min(progress.tournamentRound, opponents.length-1)]; }
  function rank(){ return progress.level>=15?'Legend':progress.level>=10?'MVP':progress.level>=6?'Pro':progress.level>=3?'Street Player':'Rookie'; }

  function addVersionBadge(){ if($('#versionBadge')) return; const badge = document.createElement('div'); badge.id = 'versionBadge'; badge.textContent = VERSION; badge.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:9999;background:#ff7a2a;color:#111;padding:6px 10px;border-radius:999px;font:900 11px system-ui;box-shadow:0 8px 28px #0008;pointer-events:none'; document.body.appendChild(badge); }
  function resize(){ const r = arena.getBoundingClientRect(); W = r.width; H = r.height; [c,a,f].forEach(canvas => { canvas.width = W*DPR; canvas.height = H*DPR; canvas.style.width = W+'px'; canvas.style.height = H+'px'; canvas.getContext('2d').setTransform(DPR,0,0,DPR,0,0); }); drawArena(); }
  function updateReadouts(){ const pct = powerPercent(), angle = aimAngle(), status = shotStatus(); $('#fill').style.width = pct + '%'; $('#powerReadout').textContent = `${pct}% · ${status}`; $('#dataPower').textContent = pct + '%'; $('#dataAngle').textContent = angle + '°'; $('#dataStatus').textContent = status; $('#aimReadout').textContent = angle + '°'; $('#perfectText').style.opacity = isPerfectPower() ? '1' : '.55'; }

  function start(){
    cancelAnimationFrame(raf); resetDailyIfNeeded();
    match.mode = mode(); match.left = match.mode === 'practice' ? 999 : match.mode === 'blitz' ? 30 : dur();
    match.you = 0; match.ai = 0; match.wind = 0; match.combo = 0; match.started = true; balls = []; particles = []; over = false; charge = 0; charging = false; aiCooldown = 1.2;
    $('#end').classList.remove('show'); $('#scoreP').textContent = 0; $('#scoreAI').textContent = 0; $('#timer').textContent = match.mode === 'practice' ? '∞' : match.left;
    const opp = currentOpponent(); $('#aiName').textContent = match.mode === 'practice' ? 'Practice' : opp.name; $('#modeTag').textContent = `${label(match.mode)} · ${$('#aiName').textContent}`; $('#windTag').style.display = (match.mode === 'wind' || match.mode === 'bossrush') ? 'block' : 'none';
    updateReadouts(); syncHub(); last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function loop(now){ const dt = Math.min(.033, (now-last)/1000 || .016); last = now; time = now / 1000; if(!over && match.mode !== 'practice'){ match.left -= dt; if(match.left <= 0) return finish(); $('#timer').textContent = Math.ceil(match.left); } if(match.mode === 'wind' || match.mode === 'bossrush'){ const shield = 1 - progress.upgrades.wind * .13; match.wind = Math.sin(time * 1.7) * 70 * shield; $('#windTag').textContent = 'Vânt ' + Math.round(match.wind); } update(dt); render(); raf = requestAnimationFrame(loop); }
  function beginCharge(){ if(over || player.shooting) return; charging = true; charge = 0; updateReadouts(); }
  function releaseShot(){ if(!charging || over) return; charging = false; player.shooting = true; player.sp = 0; player.launch = true; player.shotPower = charge; player.shotAngle = aimAngle(); updateReadouts(); }
  function createShot(owner, target, power, angleDeg, forcedPerfect = false){ const perfect = forcedPerfect || isPerfectPower(power); const angleError = (angleDeg - 8) * 1.25; const powerError = (power - .52) * 150; const assist = progress.upgrades.assist * 2; const missScale = perfect ? 0 : 1; const targetX = target.rimX + missScale * (angleError + powerError * .20 - assist * Math.sign(angleError || 1)); const targetY = target.rimY + missScale * Math.abs(powerError) * .07; const dx = targetX - owner.ballX, dy = targetY - owner.ballY; const frames = 54, gravity = .22; balls.push({ x:owner.ballX, y:owner.ballY, vx:dx/frames, vy:(dy - .5*gravity*frames*frames)/frames, g:gravity, rot:0, target, owner, perfect, trail:[] }); }

  function update(dt){
    if(charging){ const speed = 4.2 - progress.upgrades.control * .36; charge = (Math.sin(time * speed - Math.PI/2) + 1) / 2; updateReadouts(); }
    [player, ai].forEach(p => { if(!p.shooting) return; p.sp += .035; if(p.sp > .58 && p.launch){ if(p === player) createShot(player, hoop, p.shotPower, p.shotAngle, false); else { const opp = currentOpponent(); const perfect = Math.random() < opp.acc; createShot(ai, hoopAI, perfect ? .52 : (.38 + Math.random()*.4), 8 + (Math.random()-.5)*18, perfect); } p.launch = false; } if(p.sp > 1){ p.shooting = false; p.sp = 0; } });
    if(match.mode !== 'practice' && !ai.shooting && !over){ const opp = currentOpponent(); aiCooldown -= dt; if(aiCooldown <= 0){ ai.shooting = true; ai.sp = 0; ai.launch = true; aiCooldown = opp.delay + Math.random()*.9; } }
    for(let i=balls.length-1;i>=0;i--){ const b = balls[i]; b.vx += match.wind * .0016; b.x += b.vx; b.y += b.vy; b.vy += b.g; b.rot += .25; b.trail.push({x:b.x,y:b.y}); if(b.trail.length > 14) b.trail.shift(); const dx = b.x - b.target.rimX, dy = b.y - b.target.rimY; if(Math.abs(dx)<32 && dy>-8 && dy<16 && b.vy>0 && !b.hit){ b.hit = true; if(Math.abs(dx)<20 && b.perfect){ boom(b.target.rimX,b.target.rimY,'perfect'); if(b.owner === player) scorePlayer(); else { match.ai += 2; $('#scoreAI').textContent = match.ai; } balls.splice(i,1); continue; } else { if(b.owner === player){ match.combo = 0; if(match.mode === 'sudden') finish(); } b.vx *= -.35; b.vy *= -.55; boom(b.x,b.y,'miss'); } } if(b.y > H + 60 || b.x < -80 || b.x > W + 80) balls.splice(i,1); }
  }
  function scorePlayer(){ let pts = match.mode === 'bank' ? 2 + progress.upgrades.bank : 2; if(progress.upgrades.clutch && match.left <= 10 && match.mode !== 'practice') pts *= 2; match.you += pts; match.combo++; progress.perfect++; progress.comboMax = Math.max(progress.comboMax, match.combo); progress.best = Math.max(progress.best, match.you); if(match.mode === 'bank'){ progress.bank++; progress.missions.bank = Math.min(3, progress.missions.bank + 1); } if(match.combo >= 5) progress.missions.combo = 5; $('#scoreP').textContent = match.you; save(); }
  function finish(){ over = true; cancelAnimationFrame(raf); const win = match.you >= match.ai; if(win && match.mode !== 'practice'){ progress.wins++; progress.money += 90; progress.xp += 45; progress.fans += 5; if(match.mode === 'bossrush') progress.bossStage = (progress.bossStage + 1) % opponents.length; else progress.tournamentRound = Math.min(opponents.length - 1, progress.tournamentRound + 1); if(match.you - match.ai >= 10) progress.missions.margin = 1; if(match.mode === 'bank' || match.mode === 'wind') progress.missions.hard = 1; } else if(match.mode !== 'practice') { progress.money += 20; progress.xp += 15; } while(progress.xp >= 100){ progress.xp -= 100; progress.level++; progress.money += 50; } save(); $('#endTitle').textContent = win ? 'VICTORIE!' : 'ÎNFRÂNGERE'; $('#endText').textContent = `Scor final: Tu ${match.you} - ${match.ai} ${$('#aiName').textContent}. +${win ? 90 : 20} bani`; $('#end').classList.add('show'); }

  function render(){ drawArena(); xa.clearRect(0,0,W,H); xf.clearRect(0,0,W,H); drawPlayer(player,false); drawPlayer(ai,true); balls.forEach(drawFlightBall); particles = particles.filter(p => (p.life -= .025) > 0).map(p => (p.x += p.vx, p.y += p.vy, p.vy += .15, p)); particles.forEach(p => { xf.globalAlpha = p.life; xf.fillStyle = p.c; xf.shadowColor = p.c; xf.shadowBlur = 10; xf.beginPath(); xf.arc(p.x,p.y,p.s*p.life,0,Math.PI*2); xf.fill(); xf.globalAlpha = 1; xf.shadowBlur = 0; }); }
  function drawArena(){ xc.clearRect(0,0,W,H); const night = progress.equipped.court === 'night'; const sky = xc.createLinearGradient(0,0,0,H*.62); sky.addColorStop(0, night?'#02040a':'#040712'); sky.addColorStop(.55,'#0b1328'); sky.addColorStop(1,'#18264a'); xc.fillStyle = sky; xc.fillRect(0,0,W,H*.58); drawCrowd(); drawFloor(); drawLines(); if(match.mode === 'moving'){ hoop.x = .70 + .035*Math.sin(time*2); hoopAI.x = .84 + .03*Math.cos(time*2); } else { hoop.x = .70; hoopAI.x = .84; } drawHoop(hoop); drawHoop(hoopAI); }
  function drawCrowd(){ const y=H*.28,h=H*.23; xc.fillStyle='rgba(15,21,48,.85)'; xc.fillRect(0,y,W,h); for(let r=0;r<3;r++) for(let i=0;i<W/18+2;i++){ const sx=i*18+(r*7)%13, sy=y+h*.3+r*h*.22; xc.fillStyle=`hsla(${195+(i*9)%80},28%,${18+r*5}%,.9)`; xc.beginPath(); xc.arc(sx,sy,5,0,Math.PI*2); xc.fill(); xc.fillRect(sx-6,sy+5,12,10); } }
  function drawFloor(){ const top=H*.53; const g=xc.createLinearGradient(0,top,0,H); g.addColorStop(0,'#2d1a08'); g.addColorStop(.45, progress.equipped.court === 'street' ? '#6d4a31' : '#8b5a1f'); g.addColorStop(1,'#b07a35'); xc.fillStyle=g; xc.fillRect(0,top,W,H-top); xc.strokeStyle='rgba(0,0,0,.2)'; xc.lineWidth=1; for(let i=0;i<14;i++){ const yy=top+i/14*(H-top); xc.beginPath(); xc.moveTo(0,yy); xc.lineTo(W,yy); xc.stroke(); } }
  function drawLines(){ xc.save(); xc.strokeStyle='rgba(74,217,255,.85)'; xc.shadowColor='rgba(74,217,255,.6)'; xc.shadowBlur=8; xc.lineWidth=2; xc.beginPath(); xc.moveTo(0,H*.58); xc.lineTo(W,H*.58); xc.stroke(); xc.beginPath(); xc.arc(W*.5,H*.78,W*.06,0,Math.PI*2); xc.stroke(); xc.beginPath(); xc.arc(W*.70,H*.76,W*.16,-Math.PI*.55,Math.PI*.15); xc.stroke(); xc.restore(); }
  function drawHoop(h){ const x=h.x*W,y=h.y*H,bw=W*.085*h.size,bh=H*.13*h.size; xc.save(); xc.fillStyle='rgba(15,22,40,.55)'; xc.fillRect(x-bw/2,y-bh/2,bw,bh); xc.strokeStyle=h.color; xc.shadowColor=h.color; xc.shadowBlur=10; xc.lineWidth=2; xc.strokeRect(x-bw/2,y-bh/2,bw,bh); h.rimX=x; h.rimY=y+bh*.76; xc.beginPath(); xc.arc(x,h.rimY,bw*.42,0,Math.PI*2); xc.stroke(); xc.shadowBlur=0; xc.strokeStyle='rgba(255,255,255,.35)'; for(let i=0;i<8;i++){ const an=i/8*Math.PI*2; xc.beginPath(); xc.moveTo(x+Math.cos(an)*bw*.36,h.rimY+Math.sin(an)*bw*.1); xc.lineTo(x+Math.cos(an)*bw*.18,h.rimY+bw*.62); xc.stroke(); } if(h.label){ xc.fillStyle=h.color; xc.font='bold 13px sans-serif'; xc.textAlign='center'; xc.fillText(h.label,x,y-bh/2-6); } xc.restore(); }
  function drawPlayer(p,isAI){ const x=p.x*W,y=p.y*H,s=H*.18,sp=p.sp,jump=p.shooting?-Math.sin(Math.min(1,sp)*Math.PI)*s*.16:0; xa.save(); xa.translate(x,y+jump); xa.fillStyle='rgba(0,0,0,.35)'; xa.beginPath(); xa.ellipse(0,s*.42-jump,s*.23,s*.06,0,0,Math.PI*2); xa.fill(); const glow=xa.createRadialGradient(0,s*.34,0,0,s*.34,s*.45); glow.addColorStop(0,isAI?'rgba(74,217,255,.34)':'rgba(255,93,143,.34)'); glow.addColorStop(1,'rgba(0,0,0,0)'); xa.fillStyle=glow; xa.fillRect(-s*.5,0,s,s*.5); xa.strokeStyle='#d99876'; xa.lineWidth=s*.05; xa.lineCap='round'; xa.beginPath(); xa.moveTo(-s*.06,s*.02); xa.lineTo(-s*.09,s*.34); xa.moveTo(s*.06,s*.02); xa.lineTo(s*.09,s*.34); xa.stroke(); xa.fillStyle=isAI?'#2e6aa6':'#ff5d8f'; rr(xa,-s*.13,-s*.02,s*.26,s*.14,5); xa.fill(); xa.fillStyle='#f4f7ff'; rr(xa,-s*.18,-s*.24,s*.36,s*.24,8); xa.fill(); xa.fillStyle=isAI?'#4ad9ff':'#ff5d8f'; xa.font=`bold ${s*.1}px sans-serif`; xa.textAlign='center'; xa.fillText('10',0,-s*.12); xa.fillStyle='#f5c8a8'; xa.beginPath(); xa.arc(0,-s*.36,s*.13,0,Math.PI*2); xa.fill(); xa.fillStyle='#2a1810'; xa.beginPath(); xa.arc(0,-s*.39,s*.13,Math.PI,Math.PI*2); xa.fill(); if(!isAI){ xa.fillStyle='#3a1f0c'; xa.beginPath(); xa.ellipse(s*.09,-s*.31,s*.05,s*.12,.2,0,Math.PI*2); xa.fill(); } let bx=s*.23, by=-s*.1+Math.sin(time*5)*2; if(p.shooting&&sp<.58){ const q=sp/.58; bx=s*.23*(1-q)+s*.06*q; by=(-s*.1)*(1-q)+(-s*.55)*q; } if(!p.shooting||sp<.58){ drawBall(xa,bx,by,s*.085,time*6); p.ballX=x+bx; p.ballY=y+jump+by; } xa.restore(); }
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x,y,w,h,r); else ctx.rect(x,y,w,h); }
  function ballColors(){ return progress.equipped.ball === 'gold' ? ['#fff1a8','#d49b16'] : progress.equipped.ball === 'neon' ? ['#bff7ff','#1aa0ff'] : progress.equipped.ball === 'galaxy' ? ['#d8b4ff','#3d1b7a'] : progress.equipped.ball === 'fire' ? ['#ffd08a','#d63810'] : ['#ffb066','#a04812']; }
  function drawBall(ctx,x,y,r,rot){ ctx.save(); ctx.translate(x,y); ctx.rotate(rot); const cs=ballColors(); const g=ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r); g.addColorStop(0,cs[0]); g.addColorStop(1,cs[1]); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#3a1a05'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(0,r); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0,0,r,r*.3,0,0,Math.PI*2); ctx.stroke(); ctx.restore(); }
  function drawFlightBall(b){ b.trail.forEach((p,i)=>{ const alpha=i/b.trail.length*.42; xf.fillStyle=progress.equipped.trail==='flame'?`rgba(255,90,20,${alpha})`:progress.equipped.trail==='ice'?`rgba(120,220,255,${alpha})`:`rgba(255,210,59,${alpha})`; xf.beginPath(); xf.arc(p.x,p.y,4+i*.35,0,Math.PI*2); xf.fill(); }); drawBall(xa,b.x,b.y,13,b.rot); }
  function boom(x,y,type){ for(let i=0;i<(type==='perfect'?28:14);i++){ const an=Math.random()*Math.PI*2, sp=2+Math.random()*5; particles.push({x,y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-1,life:1,s:3,c:['#ffd23b','#ff8c2a','#4ad9ff','#fff'][i%4]}); } }

  function syncHub(){ const setK=(name,val)=>$$('.kpi').forEach(k=>{ if((k.querySelector('span')?.textContent||'')===name) k.querySelector('b').textContent=val; }); setK('Nivel',progress.level); setK('Bani',progress.money); setK('Fani',progress.fans); setK('Best',progress.best); setK('Perfecte',progress.perfect); setK('Bank',progress.bank); setK('Combo max',progress.comboMax); $('#kBest') && ($('#kBest').textContent=progress.best); $('#kPerfect') && ($('#kPerfect').textContent=progress.perfect); $('#kBank') && ($('#kBank').textContent=progress.bank); $('#kCombo') && ($('#kCombo').textContent=progress.comboMax); const idCard=$('.identityFloat'); if(idCard){ idCard.querySelector('p').textContent=`Nivel ${progress.level} • ${rank()}`; idCard.querySelector('.row b').textContent=`${progress.xp} / 100`; idCard.querySelector('.xpbar i').style.width=progress.xp+'%'; } fillShop(); fillComp(); }
  function fillShop(){ $('#shopGrid').innerHTML = shopItems.map(item => { if(item.type==='upgrade'){ const lv=progress.upgrades[item.key]||0, maxed=lv>=item.max, price=item.price+lv*60; return `<div class="card"><strong>${item.title}${lv}</strong><p>${item.desc}</p><div class="row"><span class="tag">Lv ${lv}/${item.max} · ${price}$</span><button data-buy="${item.key}" ${maxed?'disabled':''}>${maxed?'MAX':'Cumpără'}</button></div></div>`; } const owned=!!progress.owned[item.key], eq=progress.equipped[item.slot]===item.key; return `<div class="card"><strong>${item.title}</strong><p>${item.desc}</p><div class="row"><span class="tag">${owned?'Owned':item.price+'$'}</span><button data-skin="${item.key}" data-slot="${item.slot}">${eq?'Echipat':owned?'Echipează':'Cumpără'}</button></div></div>`; }).join(''); }
  function fillComp(){ const comp=$('#comp'); if(!comp) return; const r=progress.tournamentRound; const mission=(label,cur,max,reward)=>`<div class="mission">${cur>=max?'✅':'⬜'} ${label} <span class="tag">${cur}/${max} · +${reward} bani</span><div class="bar"><i style="width:${Math.min(100,cur/max*100)}%"></i></div></div>`; comp.innerHTML=`<div class="section"><h3>Daily Missions</h3><div class="grid">${mission('Marchează 3 bank shots',progress.missions.bank,3,90)}${mission('Câștigă un meci pe Greu',progress.missions.hard,1,120)}${mission('Fă combo x5',progress.missions.combo,5,110)}${mission('Bate AI-ul la 10 puncte diferență',progress.missions.margin,1,160)}</div></div><div class="section"><h3>Turneu</h3><div class="grid">${opponents.slice(0,3).map((o,i)=>`<div class="card"><strong>${i<r?'✅':i===r?'▶':'🔒'} Runda ${i+1} — ${o.name}</strong><p>${i<r?'Câștigată':i===r?'Curentă':'Blocată'}</p></div>`).join('')}</div></div><div class="section"><h3>Adversari AI</h3><div class="grid">${opponents.map(o=>`<div class="card"><strong>${o.name}</strong><p>${o.style}</p><span class="tag">${o.id}</span></div>`).join('')}</div></div><div class="section"><h3>Boss Rush</h3><p>Rookie Bot → Sniper AI → Bank Boss → Legend AI</p><button class="primary" id="bossBtn">Joacă următorul meci</button></div>`; $('#bossBtn').onclick=()=>{ $('input[value="bossrush"]').checked=true; start(); scrollTo({top:arena.offsetTop-10,behavior:'smooth'}); }; }
  function buy(key){ const item=shopItems.find(i=>i.key===key); if(!item) return; if(item.type==='upgrade'){ const lv=progress.upgrades[key]||0; if(lv>=item.max) return; const price=item.price+lv*60; if(progress.money<price) return alert('Nu ai destui bani.'); progress.money-=price; progress.upgrades[key]=lv+1; } else { if(!progress.owned[key]){ if(progress.money<item.price) return alert('Nu ai destui bani.'); progress.money-=item.price; progress.owned[key]=true; } progress.equipped[item.slot]=key; } save(); }

  $('#openHub').onclick=()=>{ $('#hub').classList.add('open'); syncHub(); }; $('#closeHub').onclick=()=>$('#hub').classList.remove('open'); $('#endHub').onclick=()=>{ $('#hub').classList.add('open'); $('#end').classList.remove('show'); syncHub(); };
  $$('.tab').forEach(b=>b.onclick=()=>{ $$('.tab').forEach(x=>x.classList.remove('active')); $$('.panel').forEach(p=>p.classList.remove('active')); b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active'); syncHub(); });
  $('#reset').onclick=()=>{ if(confirm('Resetezi progresul?')){ localStorage.removeItem(STORE); progress=structuredClone(baseProgress); save(); location.reload(); } };
  $('#play').onclick=()=>{ start(); scrollTo({top:arena.offsetTop-10,behavior:'smooth'}); }; $('#restart').onclick=start; $('#again').onclick=start; $('#next').onclick=()=>start();
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-buy],[data-skin]'); if(!b) return; buy(b.dataset.buy||b.dataset.skin); });
  $('#shoot').onpointerdown=beginCharge; addEventListener('pointerup',releaseShot); $('#aim').oninput=updateReadouts; $$('input[name="mode"],input[name="dur"]').forEach(i=>i.onchange=start);
  resetDailyIfNeeded(); addVersionBadge(); resize(); fillShop(); syncHub(); start(); updateReadouts(); addEventListener('resize',resize); window.BVAI_VERSION=VERSION;
})();
