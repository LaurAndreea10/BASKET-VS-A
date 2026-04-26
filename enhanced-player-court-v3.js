(() => {
  'use strict';

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let canvas, ctx, wrap, W = 900, H = 540, time = 0;
  const balls = [];
  const particles = [];
  let flash = 0;
  const player = { x: .18, y: .82, gender: 'female', facing: 1, shooting: false, shootProgress: 0 };
  const ai = { x: .82, y: .82, gender: 'male', facing: -1, shooting: false, shootProgress: 0 };
  const hoopP = { x: .32, y: .42, color: '#ff7a2a', size: 1 };
  const hoopAI = { x: .78, y: .50, color: '#4ad9ff', size: .65, label: 'AI' };

  function injectCss(){
    let style = document.getElementById('bvai-v3-graphics-css');
    if(!style){
      style = document.createElement('style');
      style.id = 'bvai-v3-graphics-css';
      document.head.appendChild(style);
    }
    style.textContent = `
      html,body{overflow-x:hidden;}
      .arena{width:100%;max-width:1240px;margin-left:auto!important;margin-right:auto!important;}
      .court-wrap{
        position:relative!important;
        overflow:hidden!important;
        width:100%!important;
        aspect-ratio:16/9!important;
        min-height:clamp(300px,52vw,620px)!important;
        max-height:72vh!important;
        border-radius:22px!important;
        transform:none!important;
        contain:layout paint size;
      }
      #court{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        opacity:.01!important;
        z-index:2!important;
        pointer-events:auto!important;
      }
      #bvai-v3-graphics{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        display:block!important;
        z-index:1!important;
        pointer-events:none!important;
        border-radius:inherit!important;
        transform:none!important;
      }
      .court-wrap>.overlay{z-index:6!important;}
      .court-wrap>.toast{z-index:7!important;}
      .scoreboard,.ribbon,.controls{width:100%;}
      @media(max-width:640px){
        .arena{padding-left:12px!important;padding-right:12px!important;gap:10px!important;}
        .court-wrap{aspect-ratio:16/11!important;min-height:300px!important;max-height:58vh!important;}
        .scoreboard{grid-template-columns:1fr auto 1fr!important;padding:12px!important;}
        .ribbon{gap:8px!important;}
        .controls{padding:12px!important;}
      }
    `;
  }

  function init(){
    wrap = document.querySelector('.court-wrap');
    if(!wrap) return;
    injectCss();
    canvas = document.getElementById('bvai-v3-graphics');
    if(!canvas){
      canvas = document.createElement('canvas');
      canvas.id = 'bvai-v3-graphics';
      wrap.prepend(canvas);
    }
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize, { passive:true });
    bindButtons();
    requestAnimationFrame(frame);
  }

  function bindButtons(){
    const shoot = document.getElementById('btn-shoot');
    if(shoot && !shoot.dataset.v3Graphics){
      shoot.dataset.v3Graphics = '1';
      shoot.addEventListener('click', () => shootPlayer(false));
    }
    const scoreAI = document.getElementById('sb-ai');
    if(scoreAI && !scoreAI.dataset.v3Graphics){
      scoreAI.dataset.v3Graphics = '1';
      new MutationObserver(() => shootAI()).observe(scoreAI, { childList:true, subtree:true, characterData:true });
    }
  }

  function resize(){
    if(!canvas || !wrap) return;
    const r = wrap.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
    canvas.style.width = '100%'; canvas.style.height = '100%';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function shootPlayer(miss){
    if(player.shooting) return;
    player.shooting = true; player.shootProgress = 0; player.ballNotLaunched = true; player.mode = miss ? 'miss' : 'perfect';
  }
  function shootAI(){
    if(ai.shooting) return;
    ai.shooting = true; ai.shootProgress = 0; ai.ballNotLaunched = true; ai.mode = Math.random() > .35 ? 'perfect' : 'miss';
  }

  function frame(t){
    time = t / 1000;
    updateCharacters();
    updateBalls();
    updateParticles();
    ctx.clearRect(0, 0, W, H);
    drawArena();
    drawCharacter(ctx, player, player.gender, false);
    drawCharacter(ctx, ai, 'male', true);
    balls.forEach(b => drawFlightBall(ctx, b));
    drawParticles(ctx);
    if(flash > 0){ ctx.fillStyle = `rgba(255,255,255,${flash * .22})`; ctx.fillRect(0,0,W,H); flash -= .035; }
    requestAnimationFrame(frame);
  }

  function updateCharacters(){
    [player, ai].forEach(p => {
      if(!p.shooting) return;
      p.shootProgress += .022;
      if(p.shootProgress >= .65 && p.ballNotLaunched && p.ballGlobalX){
        const target = p === player ? hoopP : hoopAI;
        const dx = target.rimX - p.ballGlobalX;
        const dy = target.rimY - p.ballGlobalY - 30;
        balls.push({ x:p.ballGlobalX, y:p.ballGlobalY, vx:dx/50, vy:dy/50 - 6, rot:0, rotSpeed:.25, trail:[], squash:1, target, mode:p.mode || 'perfect' });
        p.ballNotLaunched = false;
      }
      if(p.shootProgress >= 1){ p.shooting = false; p.shootProgress = 0; }
    });
  }
  function updateBalls(){
    for(let i = balls.length - 1; i >= 0; i--){
      const b = balls[i];
      b.x += b.vx; b.y += b.vy; b.vy += .18; b.rot += b.rotSpeed;
      b.trail.push({x:b.x,y:b.y}); if(b.trail.length > 12) b.trail.shift();
      if(b.squash < 1) b.squash = Math.min(1, b.squash + .05);
      const dxR = b.x - b.target.rimX, dyR = b.y - b.target.rimY;
      if(Math.abs(dxR) < 30 && dyR > -5 && dyR < 10 && b.vy > 0 && !b.scored){
        b.scored = true;
        if(Math.abs(dxR) < 16 && b.mode === 'perfect'){
          spawnParticles(b.target.rimX, b.target.rimY + 8, 'perfect', b.target === hoopAI ? 'cyan' : 'pink');
          balls.splice(i, 1); continue;
        }
        b.vx *= -.4; b.vy *= -.5; b.squash = .7;
        spawnParticles(b.target.rimX + dxR, b.target.rimY, 'miss', 'pink');
      }
      if(b.y > H + 40) balls.splice(i, 1);
    }
  }

  function drawArena(){
    const x = ctx;
    const sky = x.createLinearGradient(0, 0, 0, H * .6);
    sky.addColorStop(0, '#040712'); sky.addColorStop(.5, '#0a1020'); sky.addColorStop(1, '#131e3a');
    x.fillStyle = sky; x.fillRect(0, 0, W, H * .6);
    for(let i = 0; i < 5; i++){
      const px = W * (.05 + i * .225);
      const g = x.createRadialGradient(px, -10, 0, px, H * .4, H * .45);
      g.addColorStop(0, 'rgba(180,220,255,.14)'); g.addColorStop(.5, 'rgba(180,220,255,.03)'); g.addColorStop(1, 'rgba(180,220,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H * .55);
    }
    drawCrowd(x); drawFloor(x); drawCourtLines(x); drawHoop(x, hoopP); drawHoop(x, hoopAI);
    const vig = x.createRadialGradient(W/2, H/2, H*.25, W/2, H/2, H*.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,.5)');
    x.fillStyle = vig; x.fillRect(0,0,W,H);
  }
  function drawCrowd(x){
    const bandY = H*.28, bandH = H*.25;
    const bg = x.createLinearGradient(0, bandY, 0, bandY+bandH);
    bg.addColorStop(0, 'rgba(15,21,48,.95)'); bg.addColorStop(1, 'rgba(20,28,60,.5)'); x.fillStyle = bg; x.fillRect(0, bandY, W, bandH);
    const seed = n => Math.abs(Math.sin(n * 12.9898) * 43758.5453 % 1);
    for(let r = 0; r < 3; r++){
      const rowY = bandY + bandH*.3 + r*(bandH*.22), headSize = (3-r)*2 + 5, spacing = headSize*2.4, count = Math.ceil(W/spacing)+2;
      for(let i = 0; i < count; i++){
        const sx = i*spacing + seed(i+r*100)*spacing*.6 - spacing;
        const tone = .3 + seed(i*3+r*50)*.4, hue = 200 + (seed(i+r*7)-.5)*100;
        x.fillStyle = `hsla(${hue},28%,${14 + tone*18}%,.92)`;
        x.beginPath(); x.arc(sx,rowY,headSize,0,Math.PI*2); x.fill(); x.fillRect(sx-headSize*1.3,rowY+headSize*.5,headSize*2.6,headSize*1.6);
      }
    }
  }
  function drawFloor(x){
    const top = H*.53;
    const wood = x.createLinearGradient(0, top, 0, H);
    wood.addColorStop(0, '#2d1a08'); wood.addColorStop(.25, '#5d3814'); wood.addColorStop(.6, '#8b5a1f'); wood.addColorStop(1, '#b07a35');
    x.fillStyle = wood; x.fillRect(0, top, W, H-top);
    x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 1;
    for(let i=0;i<14;i++){ const y = top + (i/14)*(H-top); x.beginPath(); x.moveTo(0,y); x.lineTo(W,y); x.stroke(); }
    x.strokeStyle = 'rgba(0,0,0,.07)';
    for(let i=0;i<90;i++){ const sx = i/90*W; x.beginPath(); x.moveTo(sx,top); x.lineTo(sx,H); x.stroke(); }
    const shine = x.createLinearGradient(0, top, 0, top+25); shine.addColorStop(0, 'rgba(255,220,180,.22)'); shine.addColorStop(1, 'rgba(255,220,180,0)'); x.fillStyle = shine; x.fillRect(0, top, W, 25);
  }
  function drawCourtLines(x){
    x.save(); x.strokeStyle = 'rgba(74,217,255,.85)'; x.shadowColor = 'rgba(74,217,255,.6)'; x.shadowBlur = 8; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(0,H*.58); x.lineTo(W,H*.58); x.stroke();
    x.beginPath(); x.moveTo(W*.5,H*.58); x.lineTo(W*.5,H); x.stroke();
    x.beginPath(); x.arc(W*.5,H*.78,W*.06,0,Math.PI*2); x.stroke();
    const kpx = hoopP.x*W; x.beginPath(); x.moveTo(0,H*.65); x.lineTo(kpx+W*.08,H*.65); x.lineTo(kpx+W*.06,H*.85); x.lineTo(0,H*.85); x.stroke();
    x.beginPath(); x.arc(kpx,H*.75,W*.16,-Math.PI*.45,Math.PI*.45,false); x.stroke();
    const kax = hoopAI.x*W; x.beginPath(); x.moveTo(W,H*.65); x.lineTo(kax-W*.06,H*.65); x.lineTo(kax-W*.05,H*.82); x.lineTo(W,H*.82); x.stroke();
    x.beginPath(); x.arc(kax,H*.74,W*.12,Math.PI*.55,Math.PI*1.45,false); x.stroke(); x.restore();
  }
  function drawHoop(x,h){
    const px = h.x*W, py = h.y*H, s = h.size, boardW = W*.085*s, boardH = H*.13*s, color = h.color;
    x.fillStyle = '#1a1f2e'; x.fillRect(px-boardW*.04,py-boardH*.5,boardW*.08,boardH*1.3);
    x.save(); x.fillStyle = 'rgba(15,22,40,.55)'; x.fillRect(px-boardW/2,py-boardH/2,boardW,boardH); x.strokeStyle = color; x.shadowColor = color; x.shadowBlur = 10; x.lineWidth = 2; x.strokeRect(px-boardW/2,py-boardH/2,boardW,boardH); x.shadowBlur = 5; x.lineWidth = 1.5; x.strokeRect(px-boardW*.2,py-boardH*.075,boardW*.4,boardH*.3); x.restore();
    if(h.label){ x.save(); x.fillStyle=color; x.shadowColor=color; x.shadowBlur=8; x.font=`bold ${10*s+4}px sans-serif`; x.textAlign='center'; x.fillText(h.label,px,py-boardH/2-6); x.restore(); }
    h.rimX = px; h.rimY = py + boardH*.5 + boardW*.32; const r = boardW*.42;
    x.save(); x.strokeStyle=color; x.shadowColor=color; x.shadowBlur=14*s; x.lineWidth=4*s; x.beginPath(); x.arc(px,h.rimY,r,0,Math.PI*2); x.stroke(); x.restore(); drawNet(x,px,h.rimY,r);
  }
  function drawNet(x,cx,cy,r){
    const depth = r*1.8; x.save(); x.strokeStyle='rgba(255,255,255,.35)'; x.lineWidth=.8;
    for(let i=0;i<10;i++){ const a=i/10*Math.PI*2-Math.PI/2; x.beginPath(); x.moveTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r*.3); x.lineTo(cx+Math.cos(a)*r*.45, cy+depth); x.stroke(); }
    for(let lvl=1;lvl<=3;lvl++){ const t=lvl/4, rr=r*(1-t*.55), yy=cy+depth*t; x.beginPath(); x.ellipse(cx,yy,rr,rr*.25,0,0,Math.PI*2); x.stroke(); }
    x.restore();
  }

  function drawCharacter(x,p,gender,isAI=false){
    const px = p.x*W, py = p.y*H, scale = H*.18, facing = p.facing || 1, sp = p.shootProgress;
    let kneeFlex = 0, jumpY = 0;
    if(p.shooting){ if(sp < .3) kneeFlex = sp/.3; else if(sp < .7){ const t=(sp-.3)/.4; kneeFlex=1-t; jumpY=-t*scale*.18; } else { const t=(sp-.7)/.3; kneeFlex=-t*.2; jumpY=-(1-t)*scale*.18; } }
    const yOffset = Math.sin(time*2)*1.5 - kneeFlex*scale*.12 + jumpY;
    x.save(); x.translate(px, py+yOffset); x.scale(facing,1);
    x.save(); x.scale(1/facing,1); x.fillStyle='rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(0,scale*.42-yOffset,scale*.22,scale*.06,0,0,Math.PI*2); x.fill(); const glowColor=isAI?'rgba(74,217,255,.45)':(gender==='female'?'rgba(255,93,143,.5)':'rgba(74,217,255,.45)'); const glow=x.createRadialGradient(0,scale*.4-yOffset,0,0,scale*.4-yOffset,scale*.45); glow.addColorStop(0,glowColor); glow.addColorStop(1,glowColor.replace(/[\d.]+\)$/,'0)')); x.fillStyle=glow; x.fillRect(-scale*.5,scale*.1-yOffset,scale,scale*.5); x.restore();
    drawLeg(x,-scale*.07,scale*.04,scale*.32-kneeFlex*scale*.08,kneeFlex,isAI); drawLeg(x,scale*.07,scale*.04,scale*.32-kneeFlex*scale*.08,kneeFlex*.5,isAI);
    const shortsY=-scale*.02, shortsH=scale*.14, shortsW=scale*.24; x.save(); const sg=x.createLinearGradient(0,shortsY,0,shortsY+shortsH); if(isAI){sg.addColorStop(0,'#3a78b8');sg.addColorStop(1,'#1f4d80')}else{sg.addColorStop(0,'#ff7da3');sg.addColorStop(1,'#d63d70')} x.fillStyle=sg; roundRect(x,-shortsW/2,shortsY,shortsW,shortsH,4); x.fill(); x.strokeStyle='rgba(0,0,0,.18)'; x.beginPath(); x.moveTo(0,shortsY); x.lineTo(0,shortsY+shortsH); x.stroke(); x.restore();
    const torsoY=-scale*.24, torsoH=scale*.24, torsoW=scale*.21, accent=isAI?'#4ad9ff':(gender==='female'?'#ff5d8f':'#5dd4ff');
    x.save(); x.fillStyle='#f4f7ff'; x.beginPath(); x.moveTo(-torsoW*.85,torsoY+torsoH*.08); x.quadraticCurveTo(-torsoW*.95,torsoY,-torsoW*.6,torsoY); x.lineTo(torsoW*.6,torsoY); x.quadraticCurveTo(torsoW*.95,torsoY,torsoW*.85,torsoY+torsoH*.08); x.lineTo(torsoW*.78,torsoY+torsoH); x.lineTo(-torsoW*.78,torsoY+torsoH); x.closePath(); x.fill();
    x.fillStyle=accent; x.beginPath(); x.moveTo(-torsoW*.85,torsoY+torsoH*.08); x.lineTo(-torsoW*.78,torsoY+torsoH); x.lineTo(-torsoW*.62,torsoY+torsoH); x.lineTo(-torsoW*.7,torsoY+torsoH*.15); x.closePath(); x.fill(); x.beginPath(); x.moveTo(torsoW*.85,torsoY+torsoH*.08); x.lineTo(torsoW*.78,torsoY+torsoH); x.lineTo(torsoW*.62,torsoY+torsoH); x.lineTo(torsoW*.7,torsoY+torsoH*.15); x.closePath(); x.fill(); x.fillRect(-torsoW*.78,torsoY+torsoH-3,torsoW*1.56,3); x.font=`bold ${scale*.1}px sans-serif`; x.textAlign='center'; x.textBaseline='middle'; x.scale(1/facing,1); x.fillText('10',0,torsoY+torsoH*.5); x.scale(facing,1); x.strokeStyle='#ddd'; x.beginPath(); x.arc(0,torsoY+3,torsoW*.18,0,Math.PI,false); x.stroke(); x.restore();
    const headR=scale*.13, headY=torsoY-headR*.85; x.fillStyle='#f5c8a8'; x.fillRect(-headR*.28,torsoY-2,headR*.56,headR*.35); x.save(); const skin=x.createRadialGradient(-headR*.25,headY-headR*.2,0,0,headY,headR*1.4); skin.addColorStop(0,'#fbd9ba'); skin.addColorStop(1,'#e0a682'); x.fillStyle=skin; x.beginPath(); x.arc(0,headY,headR,0,Math.PI*2); x.fill(); if(gender==='female') drawHairFemale(x,headY,headR,accent); else drawHairMale(x,headY,headR,isAI); x.fillStyle='#1a1208'; x.beginPath(); x.arc(-headR*.32,headY+headR*.05,headR*.085,0,Math.PI*2); x.fill(); x.beginPath(); x.arc(headR*.32,headY+headR*.05,headR*.085,0,Math.PI*2); x.fill(); x.fillStyle='#fff'; x.beginPath(); x.arc(-headR*.3,headY+headR*.02,headR*.025,0,Math.PI*2); x.fill(); x.beginPath(); x.arc(headR*.34,headY+headR*.02,headR*.025,0,Math.PI*2); x.fill(); x.strokeStyle='#8b3a2a'; x.lineWidth=1.2; x.lineCap='round'; x.beginPath(); x.arc(0,headY+headR*.35,headR*.18,Math.PI*.15,Math.PI*.85); x.stroke(); if(gender==='female'){ x.fillStyle='rgba(255,130,160,.35)'; x.beginPath(); x.arc(-headR*.55,headY+headR*.3,headR*.13,0,Math.PI*2); x.fill(); x.beginPath(); x.arc(headR*.55,headY+headR*.3,headR*.13,0,Math.PI*2); x.fill(); } x.restore();
    if(!p.shooting || sp < .65){ let ballX, ballY; if(!p.shooting){ ballX=torsoW*1.05; ballY=torsoY+torsoH*.7+Math.sin(time*5)*2; } else { const t=sp/.65, startX=torsoW*1.05, startY=torsoY+torsoH*.7, endX=torsoW*.3, endY=-scale*.45, ctrlX=torsoW*1.2, ctrlY=torsoY*1.2; ballX=(1-t)*(1-t)*startX+2*(1-t)*t*ctrlX+t*t*endX; ballY=(1-t)*(1-t)*startY+2*(1-t)*t*ctrlY+t*t*endY; } drawBall(x,ballX,ballY,scale*.085,time*6); p.ballGlobalX=px+ballX*facing; p.ballGlobalY=py+yOffset+ballY; }
    x.restore();
  }
  function drawHairFemale(x,y,r,accent){ x.fillStyle='#3a1f0c'; x.beginPath(); x.arc(0,y-r*.05,r*1.02,Math.PI*1.05,Math.PI*1.95,false); x.lineTo(r*.5,y-r*.7); x.quadraticCurveTo(0,y-r*1.15,-r*.5,y-r*.7); x.closePath(); x.fill(); x.fillStyle='#2a1810'; x.beginPath(); x.moveTo(-r*.7,y-r*.4); x.quadraticCurveTo(-r*.3,y-r*.1,r*.1,y-r*.35); x.quadraticCurveTo(0,y-r*.7,-r*.5,y-r*.7); x.closePath(); x.fill(); x.fillStyle='#3a1f0c'; x.beginPath(); x.ellipse(r*.7,y+r*.3,r*.28,r*.7,.2,0,Math.PI*2); x.fill(); x.fillStyle=accent; x.fillRect(-r*.8,y-r*.55,r*1.6,r*.12); x.beginPath(); x.arc(r*.55,y-r*.5,r*.08,0,Math.PI*2); x.fill(); }
  function drawHairMale(x,y,r,isAI){ x.fillStyle='#1a1208'; x.beginPath(); x.moveTo(-r*.85,y-r*.3); x.quadraticCurveTo(-r*.5,y-r*1.2,0,y-r*1.05); x.quadraticCurveTo(r*.5,y-r*1.2,r*.85,y-r*.3); x.lineTo(r*.85,y-r*.45); x.quadraticCurveTo(r*.6,y-r*.55,r*.3,y-r*.5); x.quadraticCurveTo(0,y-r*.45,-r*.3,y-r*.5); x.quadraticCurveTo(-r*.6,y-r*.55,-r*.85,y-r*.45); x.closePath(); x.fill(); x.fillStyle=isAI?'#4ad9ff':'#5dd4ff'; x.fillRect(-r*.75,y-r*.5,r*1.5,r*.08); }
  function drawLeg(x,ox,oy,len,flex,isAI){ const kneeY=oy+len*.55+flex*len*.08, footY=oy+len+4; x.save(); x.lineCap='round'; x.strokeStyle='#d99876'; x.lineWidth=len*.16; x.beginPath(); x.moveTo(ox,oy); x.lineTo(ox+flex*len*.05,kneeY); x.lineTo(ox,footY); x.stroke(); x.strokeStyle='#a87858'; x.lineWidth=len*.06; x.beginPath(); x.moveTo(ox-len*.04,kneeY+len*.05); x.lineTo(ox-len*.04,footY-len*.05); x.stroke(); x.fillStyle='#f4f7ff'; x.beginPath(); x.ellipse(ox,footY+2,len*.18,len*.08,0,0,Math.PI*2); x.fill(); x.fillStyle='#1a1f2e'; x.fillRect(ox-len*.16,footY+6,len*.32,2); x.fillStyle=isAI?'#4ad9ff':'#ff5d8f'; x.fillRect(ox-len*.13,footY,len*.26,2); x.restore(); }
  function roundRect(x,rx,ry,w,h,r){ x.beginPath(); x.moveTo(rx+r,ry); x.lineTo(rx+w-r,ry); x.quadraticCurveTo(rx+w,ry,rx+w,ry+r); x.lineTo(rx+w,ry+h-r); x.quadraticCurveTo(rx+w,ry+h,rx+w-r,ry+h); x.lineTo(rx+r,ry+h); x.quadraticCurveTo(rx,ry+h,rx,ry+h-r); x.lineTo(rx,ry+r); x.quadraticCurveTo(rx,ry,rx+r,ry); x.closePath(); }
  function drawBall(x,cx,cy,r,rot,squash=1){ x.save(); x.translate(cx,cy); x.scale(squash,2-squash); x.rotate(rot); x.fillStyle='rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(0,r*1.3,r*.8,r*.18,0,0,Math.PI*2); x.fill(); const g=x.createRadialGradient(-r*.3,-r*.3,0,0,0,r); g.addColorStop(0,'#ffb066'); g.addColorStop(.5,'#e88030'); g.addColorStop(1,'#a04812'); x.fillStyle=g; x.beginPath(); x.arc(0,0,r,0,Math.PI*2); x.fill(); x.strokeStyle='#3a1a05'; x.lineWidth=r*.07; x.beginPath(); x.ellipse(0,0,r,r*.3,0,0,Math.PI*2); x.stroke(); x.beginPath(); x.moveTo(0,-r); x.lineTo(0,r); x.stroke(); x.beginPath(); x.ellipse(-r*.55,0,r*.2,r,0,0,Math.PI*2); x.stroke(); x.beginPath(); x.ellipse(r*.55,0,r*.2,r,0,0,Math.PI*2); x.stroke(); x.fillStyle='rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(-r*.35,-r*.4,r*.25,r*.15,-.3,0,Math.PI*2); x.fill(); x.restore(); }
  function drawFlightBall(x,b){ b.trail.forEach((t,i)=>{ const alpha=i/b.trail.length*.55, r=6+i/b.trail.length*4, g=x.createRadialGradient(t.x,t.y,0,t.x,t.y,r); g.addColorStop(0,`rgba(255,200,80,${alpha})`); g.addColorStop(.5,`rgba(255,100,40,${alpha*.5})`); g.addColorStop(1,'rgba(255,100,40,0)'); x.fillStyle=g; x.fillRect(t.x-r,t.y-r,r*2,r*2); }); drawBall(x,b.x,b.y,13,b.rot,b.squash); }
  function spawnParticles(x0,y0,type,color){ const colors=type==='perfect'?['#ffd23b','#ff8c2a','#4ad9ff','#fff']:(color==='cyan'?['#4ad9ff','#fff','#a3e8ff']:['#ff5d8f','#fff','#ffb0c8']); const count=type==='perfect'?30:14; for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, sp=2+Math.random()*6; particles.push({x:x0,y:y0,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:1,decay:.018+Math.random()*.02,size:2+Math.random()*3.5,color:colors[Math.floor(Math.random()*colors.length)],g:.18}); } if(type==='perfect') flash=.4; }
  function updateParticles(){ for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life-=p.decay; if(p.life<=0) particles.splice(i,1); } }
  function drawParticles(x){ particles.forEach(p=>{ x.save(); x.globalAlpha=p.life; x.fillStyle=p.color; x.shadowColor=p.color; x.shadowBlur=8; x.beginPath(); x.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); x.fill(); x.restore(); }); }

  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 350));
})();