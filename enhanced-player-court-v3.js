(() => {
  'use strict';

  let stage, cCourt, cAction, cFx, xCourt, xAction, xFx;
  let W = 0, H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let time = 0;
  let arenaFlash = 0;
  let shake = { x: 0, y: 0, intensity: 0 };
  const particles = [];
  const balls = [];

  const player = { x: 0.18, y: 0.82, gender: 'female', facing: 1, shooting: false, shootProgress: 0 };
  const ai = { x: 0.82, y: 0.82, gender: 'male', facing: -1, shooting: false, shootProgress: 0 };
  const hoopP = { x: 0.32, y: 0.42, color: '#ff7a2a', size: 1.0, label: null };
  const hoopAI = { x: 0.78, y: 0.50, color: '#4ad9ff', size: 0.65, label: 'AI' };

  function injectCss(){
    let style = document.getElementById('bvai-v3-graphics-css');
    if(!style){ style = document.createElement('style'); style.id = 'bvai-v3-graphics-css'; document.head.appendChild(style); }
    style.textContent = `
      html,body{overflow-x:hidden;}
      .court-wrap{position:relative!important;overflow:hidden!important;width:100%!important;aspect-ratio:16/9!important;min-height:clamp(300px,52vw,620px)!important;max-height:72vh!important;border-radius:22px!important;contain:layout paint size;}
      #court{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;opacity:0!important;z-index:4!important;pointer-events:auto!important;}
      #bvai-v3-stage{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:1!important;pointer-events:none!important;overflow:hidden!important;border-radius:inherit!important;background:#0a0e1a!important;}
      #bvai-v3-stage canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;}
      .court-wrap>.overlay{z-index:6!important;}.court-wrap>.toast{z-index:7!important;}
      @media(max-width:640px){.arena{padding-left:12px!important;padding-right:12px!important;}.court-wrap{aspect-ratio:16/11!important;min-height:300px!important;max-height:58vh!important;}}
    `;
  }

  function init(){
    const wrap = document.querySelector('.court-wrap');
    if(!wrap) return;
    injectCss();
    stage = document.getElementById('bvai-v3-stage');
    if(!stage){
      stage = document.createElement('div');
      stage.id = 'bvai-v3-stage';
      stage.innerHTML = '<canvas id="bvai-v3-court"></canvas><canvas id="bvai-v3-action"></canvas><canvas id="bvai-v3-fx"></canvas>';
      wrap.prepend(stage);
    }
    cCourt = document.getElementById('bvai-v3-court');
    cAction = document.getElementById('bvai-v3-action');
    cFx = document.getElementById('bvai-v3-fx');
    xCourt = cCourt.getContext('2d');
    xAction = cAction.getContext('2d');
    xFx = cFx.getContext('2d');
    resize();
    window.addEventListener('resize', resize, { passive:true });
    bindGameHooks();
    requestAnimationFrame(frame);
  }

  function resize(){
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    for(const c of [cCourt, cAction, cFx]){
      c.width = Math.floor(W * DPR); c.height = Math.floor(H * DPR);
      c.style.width = '100%'; c.style.height = '100%';
      c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    drawArena();
  }

  function bindGameHooks(){
    const shoot = document.getElementById('btn-shoot');
    if(shoot && !shoot.dataset.v3Graphics){
      shoot.dataset.v3Graphics = '1';
      shoot.addEventListener('click', () => startShot(player, 'perfect'));
    }
    const scoreAI = document.getElementById('sb-ai');
    if(scoreAI && !scoreAI.dataset.v3Graphics){
      scoreAI.dataset.v3Graphics = '1';
      new MutationObserver(() => startShot(ai, Math.random() > 0.4 ? 'perfect' : 'miss')).observe(scoreAI, { childList:true, subtree:true, characterData:true });
    }
  }

  function startShot(p, mode){
    if(p.shooting) return;
    p.shooting = true;
    p.shootProgress = 0;
    p.ballNotLaunched = true;
    p.shotMode = mode;
  }

  function drawArena(){
    const x = xCourt;
    x.clearRect(0, 0, W, H);
    const sky = x.createLinearGradient(0, 0, 0, H * 0.6);
    sky.addColorStop(0, '#040712'); sky.addColorStop(0.5, '#0a1020'); sky.addColorStop(1, '#131e3a');
    x.fillStyle = sky; x.fillRect(0, 0, W, H * 0.6);
    for(let i = 0; i < 5; i++){
      const px = W * (0.05 + i * 0.225);
      const grad = x.createRadialGradient(px, -10, 0, px, H * 0.4, H * 0.45);
      grad.addColorStop(0, 'rgba(180, 220, 255, 0.14)');
      grad.addColorStop(0.5, 'rgba(180, 220, 255, 0.03)');
      grad.addColorStop(1, 'rgba(180, 220, 255, 0)');
      x.fillStyle = grad; x.fillRect(0, 0, W, H * 0.55);
    }
    drawCrowd(x); drawFloor(x); drawCourtLines(x); drawHoop(x, hoopP); drawHoop(x, hoopAI);
    const vig = x.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    x.fillStyle = vig; x.fillRect(0, 0, W, H);
  }

  function drawCrowd(x){
    const bandY = H * 0.28, bandH = H * 0.25;
    const bg = x.createLinearGradient(0, bandY, 0, bandY + bandH);
    bg.addColorStop(0, 'rgba(15,21,48,0.95)'); bg.addColorStop(1, 'rgba(20,28,60,0.5)');
    x.fillStyle = bg; x.fillRect(0, bandY, W, bandH);
    const seed = n => Math.abs(Math.sin(n * 12.9898) * 43758.5453 % 1);
    for(let r = 0; r < 3; r++){
      const rowY = bandY + bandH * 0.3 + r * (bandH * 0.22);
      const headSize = (3 - r) * 2 + 5;
      const spacing = headSize * 2.4;
      const count = Math.ceil(W / spacing) + 2;
      for(let i = 0; i < count; i++){
        const sx = i * spacing + seed(i + r * 100) * spacing * 0.6 - spacing;
        const tone = 0.3 + seed(i * 3 + r * 50) * 0.4;
        const hue = 200 + (seed(i + r * 7) - 0.5) * 100;
        x.fillStyle = `hsla(${hue}, 28%, ${14 + tone * 18}%, 0.92)`;
        x.beginPath(); x.arc(sx, rowY, headSize, 0, Math.PI * 2); x.fill();
        x.fillRect(sx - headSize * 1.3, rowY + headSize * 0.5, headSize * 2.6, headSize * 1.6);
      }
    }
    for(let i = 0; i < 7; i++){
      const fx = (Math.abs(Math.sin(i * 7.1 + time * 0.3)) * W);
      const fy = bandY + Math.abs(Math.sin(i * 3.3)) * bandH * 0.7;
      const size = 6 + Math.sin(time * 4 + i) * 2;
      const grad = x.createRadialGradient(fx, fy, 0, fx, fy, size);
      grad.addColorStop(0, 'rgba(255,255,255,0.85)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = grad; x.fillRect(fx - size, fy - size, size * 2, size * 2);
    }
  }

  function drawFloor(x){
    const floorTop = H * 0.53;
    const wood = x.createLinearGradient(0, floorTop, 0, H);
    wood.addColorStop(0, '#2d1a08'); wood.addColorStop(0.25, '#5d3814'); wood.addColorStop(0.6, '#8b5a1f'); wood.addColorStop(1, '#b07a35');
    x.fillStyle = wood; x.fillRect(0, floorTop, W, H - floorTop);
    x.strokeStyle = 'rgba(0,0,0,0.22)'; x.lineWidth = 1;
    for(let i = 0; i < 14; i++){ const y = floorTop + (i / 14) * (H - floorTop); x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    x.strokeStyle = 'rgba(0,0,0,0.07)';
    for(let i = 0; i < 90; i++){ const sx = (i / 90) * W; x.beginPath(); x.moveTo(sx, floorTop); x.lineTo(sx, H); x.stroke(); }
    const shine = x.createLinearGradient(0, floorTop, 0, floorTop + 25);
    shine.addColorStop(0, 'rgba(255,220,180,0.22)'); shine.addColorStop(1, 'rgba(255,220,180,0)');
    x.fillStyle = shine; x.fillRect(0, floorTop, W, 25);
  }

  function drawCourtLines(x){
    x.save(); x.strokeStyle = 'rgba(74,217,255,0.85)'; x.shadowColor = 'rgba(74,217,255,0.6)'; x.shadowBlur = 8; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(0, H * 0.58); x.lineTo(W, H * 0.58); x.stroke();
    x.beginPath(); x.moveTo(W * 0.5, H * 0.58); x.lineTo(W * 0.5, H); x.stroke();
    x.beginPath(); x.arc(W * 0.5, H * 0.78, W * 0.06, 0, Math.PI * 2); x.stroke();
    const kpx = hoopP.x * W;
    x.beginPath(); x.moveTo(0, H * 0.65); x.lineTo(kpx + W * 0.08, H * 0.65); x.lineTo(kpx + W * 0.06, H * 0.85); x.lineTo(0, H * 0.85); x.stroke();
    x.beginPath(); x.arc(kpx, H * 0.75, W * 0.16, -Math.PI * 0.45, Math.PI * 0.45, false); x.stroke();
    const kax = hoopAI.x * W;
    x.beginPath(); x.moveTo(W, H * 0.65); x.lineTo(kax - W * 0.06, H * 0.65); x.lineTo(kax - W * 0.05, H * 0.82); x.lineTo(W, H * 0.82); x.stroke();
    x.beginPath(); x.arc(kax, H * 0.74, W * 0.12, Math.PI * 0.55, Math.PI * 1.45, false); x.stroke();
    x.restore();
  }

  function drawHoop(x, h){
    const px = h.x * W, py = h.y * H, s = h.size;
    const boardW = W * 0.085 * s, boardH = H * 0.13 * s, color = h.color;
    x.fillStyle = '#1a1f2e'; x.fillRect(px - boardW * 0.04, py - boardH * 0.5, boardW * 0.08, boardH * 1.3);
    x.save(); x.fillStyle = 'rgba(15, 22, 40, 0.55)'; x.fillRect(px - boardW/2, py - boardH/2, boardW, boardH);
    x.strokeStyle = color; x.shadowColor = color; x.shadowBlur = 10; x.lineWidth = 2; x.strokeRect(px - boardW/2, py - boardH/2, boardW, boardH);
    x.shadowBlur = 5; x.lineWidth = 1.5; x.strokeRect(px - boardW * 0.2, py - boardH * 0.075, boardW * 0.4, boardH * 0.3); x.restore();
    if(h.label){ x.save(); x.fillStyle = color; x.shadowColor = color; x.shadowBlur = 8; x.font = `bold ${10 * s + 4}px sans-serif`; x.textAlign = 'center'; x.fillText(h.label, px, py - boardH/2 - 6); x.restore(); }
    const rimY = py + boardH * 0.5; h.rimX = px; h.rimY = rimY + boardW * 0.32;
    const rimR = boardW * 0.42;
    x.save(); x.strokeStyle = color; x.shadowColor = color; x.shadowBlur = 14 * s; x.lineWidth = 4 * s; x.beginPath(); x.arc(px, h.rimY, rimR, 0, Math.PI * 2); x.stroke(); x.restore();
    drawNet(x, px, h.rimY, rimR);
  }

  function drawNet(x, cx, cy, r){
    const depth = r * 1.8;
    x.save(); x.strokeStyle = 'rgba(255, 255, 255, 0.35)'; x.lineWidth = 0.8;
    for(let i = 0; i < 10; i++){
      const a = (i / 10) * Math.PI * 2 - Math.PI/2;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.3); x.lineTo(cx + Math.cos(a) * r * 0.45, cy + depth); x.stroke();
    }
    for(let lvl = 1; lvl <= 3; lvl++){
      const t = lvl / 4, ringR = r * (1 - t * 0.55), ringY = cy + depth * t;
      x.beginPath(); x.ellipse(cx, ringY, ringR, ringR * 0.25, 0, 0, Math.PI * 2); x.stroke();
    }
    x.restore();
  }

  function drawCharacter(x, p, gender, isAI = false){
    const px = p.x * W, py = p.y * H, scale = H * 0.18, facing = p.facing || 1, sp = p.shootProgress;
    let kneeFlex = 0, jumpY = 0;
    if(p.shooting){
      if(sp < 0.3) kneeFlex = sp / 0.3;
      else if(sp < 0.7){ const t2 = (sp - 0.3) / 0.4; kneeFlex = 1 - t2; jumpY = -t2 * scale * 0.18; }
      else { const t3 = (sp - 0.7) / 0.3; kneeFlex = -t3 * 0.2; jumpY = -(1 - t3) * scale * 0.18; }
    }
    const yOffset = Math.sin(time * 2) * 1.5 - kneeFlex * scale * 0.12 + jumpY;
    x.save(); x.translate(px, py + yOffset); x.scale(facing, 1);
    x.save(); x.scale(1/facing, 1);
    x.fillStyle = 'rgba(0, 0, 0, 0.45)'; x.beginPath(); x.ellipse(0, scale * 0.42 - yOffset, scale * 0.22, scale * 0.06, 0, 0, Math.PI * 2); x.fill();
    const glowColor = isAI ? 'rgba(74,217,255,0.45)' : (gender === 'female' ? 'rgba(255,93,143,0.5)' : 'rgba(74,217,255,0.45)');
    const glow = x.createRadialGradient(0, scale * 0.4 - yOffset, 0, 0, scale * 0.4 - yOffset, scale * 0.45);
    glow.addColorStop(0, glowColor); glow.addColorStop(1, glowColor.replace(/[\d.]+\)$/, '0)'));
    x.fillStyle = glow; x.fillRect(-scale * 0.5, scale * 0.1 - yOffset, scale, scale * 0.5); x.restore();
    drawLeg(x, -scale * 0.07, scale * 0.04, scale * 0.32 - kneeFlex * scale * 0.08, kneeFlex, isAI);
    drawLeg(x, scale * 0.07, scale * 0.04, scale * 0.32 - kneeFlex * scale * 0.08, kneeFlex * 0.5, isAI);
    const shortsY = -scale * 0.02, shortsH = scale * 0.14, shortsW = scale * 0.24;
    x.save(); const shortsGrad = x.createLinearGradient(0, shortsY, 0, shortsY + shortsH);
    if(isAI){ shortsGrad.addColorStop(0, '#3a78b8'); shortsGrad.addColorStop(1, '#1f4d80'); } else { shortsGrad.addColorStop(0, '#ff7da3'); shortsGrad.addColorStop(1, '#d63d70'); }
    x.fillStyle = shortsGrad; roundRect(x, -shortsW/2, shortsY, shortsW, shortsH, 4); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, shortsY); x.lineTo(0, shortsY + shortsH); x.stroke(); x.restore();
    const torsoY = -scale * 0.24, torsoH = scale * 0.24, torsoW = scale * 0.21;
    const accentColor = isAI ? '#4ad9ff' : (gender === 'female' ? '#ff5d8f' : '#5dd4ff');
    x.save(); x.fillStyle = '#f4f7ff'; x.beginPath();
    x.moveTo(-torsoW * 0.85, torsoY + torsoH * 0.08); x.quadraticCurveTo(-torsoW * 0.95, torsoY, -torsoW * 0.6, torsoY); x.lineTo(torsoW * 0.6, torsoY); x.quadraticCurveTo(torsoW * 0.95, torsoY, torsoW * 0.85, torsoY + torsoH * 0.08); x.lineTo(torsoW * 0.78, torsoY + torsoH); x.lineTo(-torsoW * 0.78, torsoY + torsoH); x.closePath(); x.fill();
    x.fillStyle = accentColor;
    x.beginPath(); x.moveTo(-torsoW * 0.85, torsoY + torsoH * 0.08); x.lineTo(-torsoW * 0.78, torsoY + torsoH); x.lineTo(-torsoW * 0.62, torsoY + torsoH); x.lineTo(-torsoW * 0.7, torsoY + torsoH * 0.15); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(torsoW * 0.85, torsoY + torsoH * 0.08); x.lineTo(torsoW * 0.78, torsoY + torsoH); x.lineTo(torsoW * 0.62, torsoY + torsoH); x.lineTo(torsoW * 0.7, torsoY + torsoH * 0.15); x.closePath(); x.fill();
    x.fillRect(-torsoW * 0.78, torsoY + torsoH - 3, torsoW * 1.56, 3);
    x.font = `bold ${scale * 0.1}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.scale(1/facing, 1); x.fillText('10', 0, torsoY + torsoH * 0.5); x.scale(facing, 1);
    x.strokeStyle = '#ddd'; x.lineWidth = 1; x.beginPath(); x.arc(0, torsoY + 3, torsoW * 0.18, 0, Math.PI, false); x.stroke(); x.restore();
    const headR = scale * 0.13, headY = torsoY - headR * 0.85;
    x.fillStyle = '#f5c8a8'; x.fillRect(-headR * 0.28, torsoY - 2, headR * 0.56, headR * 0.35);
    x.save(); const skin = x.createRadialGradient(-headR * 0.25, headY - headR * 0.2, 0, 0, headY, headR * 1.4); skin.addColorStop(0, '#fbd9ba'); skin.addColorStop(1, '#e0a682'); x.fillStyle = skin; x.beginPath(); x.arc(0, headY, headR, 0, Math.PI * 2); x.fill();
    if(gender === 'female') drawHairFemale(x, headY, headR, accentColor); else drawHairMale(x, headY, headR, isAI);
    x.fillStyle = '#1a1208'; x.beginPath(); x.arc(-headR * 0.32, headY + headR * 0.05, headR * 0.085, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(headR * 0.32, headY + headR * 0.05, headR * 0.085, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(-headR * 0.3, headY + headR * 0.02, headR * 0.025, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(headR * 0.34, headY + headR * 0.02, headR * 0.025, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#8b3a2a'; x.lineWidth = 1.2; x.lineCap = 'round'; x.beginPath(); x.arc(0, headY + headR * 0.35, headR * 0.18, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
    if(gender === 'female'){ x.fillStyle = 'rgba(255, 130, 160, 0.35)'; x.beginPath(); x.arc(-headR * 0.55, headY + headR * 0.3, headR * 0.13, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(headR * 0.55, headY + headR * 0.3, headR * 0.13, 0, Math.PI * 2); x.fill(); }
    x.restore();
    if(!p.shooting || sp < 0.65){
      let ballX, ballY;
      if(!p.shooting){ ballX = torsoW * 1.05; ballY = torsoY + torsoH * 0.7 + Math.sin(time * 5) * 2; }
      else { const t = sp / 0.65, startX = torsoW * 1.05, startY = torsoY + torsoH * 0.7, endX = torsoW * 0.3, endY = -scale * 0.45, ctrlX = torsoW * 1.2, ctrlY = torsoY * 1.2; ballX = (1-t)*(1-t)*startX + 2*(1-t)*t*ctrlX + t*t*endX; ballY = (1-t)*(1-t)*startY + 2*(1-t)*t*ctrlY + t*t*endY; }
      drawBall(x, ballX, ballY, scale * 0.085, time * 6);
      p.ballGlobalX = px + ballX * facing; p.ballGlobalY = py + yOffset + ballY;
    }
    x.restore();
  }

  function drawHairFemale(x, y, r, accent){
    x.fillStyle = '#3a1f0c'; x.beginPath(); x.arc(0, y - r * 0.05, r * 1.02, Math.PI * 1.05, Math.PI * 1.95, false); x.lineTo(r * 0.5, y - r * 0.7); x.quadraticCurveTo(0, y - r * 1.15, -r * 0.5, y - r * 0.7); x.closePath(); x.fill();
    x.fillStyle = '#2a1810'; x.beginPath(); x.moveTo(-r * 0.7, y - r * 0.4); x.quadraticCurveTo(-r * 0.3, y - r * 0.1, r * 0.1, y - r * 0.35); x.quadraticCurveTo(0, y - r * 0.7, -r * 0.5, y - r * 0.7); x.closePath(); x.fill();
    x.fillStyle = '#3a1f0c'; x.beginPath(); x.ellipse(r * 0.7, y + r * 0.3, r * 0.28, r * 0.7, 0.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = accent; x.fillRect(-r * 0.8, y - r * 0.55, r * 1.6, r * 0.12); x.beginPath(); x.arc(r * 0.55, y - r * 0.5, r * 0.08, 0, Math.PI * 2); x.fill();
  }
  function drawHairMale(x, y, r, isAI){
    x.fillStyle = '#1a1208'; x.beginPath(); x.moveTo(-r * 0.85, y - r * 0.3); x.quadraticCurveTo(-r * 0.5, y - r * 1.2, 0, y - r * 1.05); x.quadraticCurveTo(r * 0.5, y - r * 1.2, r * 0.85, y - r * 0.3); x.lineTo(r * 0.85, y - r * 0.45); x.quadraticCurveTo(r * 0.6, y - r * 0.55, r * 0.3, y - r * 0.5); x.quadraticCurveTo(0, y - r * 0.45, -r * 0.3, y - r * 0.5); x.quadraticCurveTo(-r * 0.6, y - r * 0.55, -r * 0.85, y - r * 0.45); x.closePath(); x.fill();
    x.fillStyle = isAI ? '#4ad9ff' : '#5dd4ff'; x.fillRect(-r * 0.75, y - r * 0.5, r * 1.5, r * 0.08);
  }
  function drawLeg(x, ox, oy, len, flex, isAI){
    const kneeY = oy + len * 0.55 + flex * len * 0.08, footY = oy + len + 4;
    x.save(); x.lineCap = 'round'; x.strokeStyle = '#d99876'; x.lineWidth = len * 0.16; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + flex * len * 0.05, kneeY); x.lineTo(ox, footY); x.stroke();
    x.strokeStyle = '#a87858'; x.lineWidth = len * 0.06; x.beginPath(); x.moveTo(ox - len * 0.04, kneeY + len * 0.05); x.lineTo(ox - len * 0.04, footY - len * 0.05); x.stroke();
    x.fillStyle = '#f4f7ff'; x.beginPath(); x.ellipse(ox, footY + 2, len * 0.18, len * 0.08, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#1a1f2e'; x.fillRect(ox - len * 0.16, footY + 6, len * 0.32, 2); x.fillStyle = isAI ? '#4ad9ff' : '#ff5d8f'; x.fillRect(ox - len * 0.13, footY, len * 0.26, 2); x.restore();
  }
  function roundRect(x, rx, ry, w, h, r){ x.beginPath(); x.moveTo(rx + r, ry); x.lineTo(rx + w - r, ry); x.quadraticCurveTo(rx + w, ry, rx + w, ry + r); x.lineTo(rx + w, ry + h - r); x.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h); x.lineTo(rx + r, ry + h); x.quadraticCurveTo(rx, ry + h, rx, ry + h - r); x.lineTo(rx, ry + r); x.quadraticCurveTo(rx, ry, rx + r, ry); x.closePath(); }
  function drawBall(x, cx, cy, r, rot, squash = 1){
    x.save(); x.translate(cx, cy); x.scale(squash, 2 - squash); x.rotate(rot);
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.ellipse(0, r * 1.3, r * 0.8, r * 0.18, 0, 0, Math.PI * 2); x.fill();
    const grad = x.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r); grad.addColorStop(0, '#ffb066'); grad.addColorStop(0.5, '#e88030'); grad.addColorStop(1, '#a04812'); x.fillStyle = grad; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#3a1a05'; x.lineWidth = r * 0.07; x.beginPath(); x.ellipse(0, 0, r, r * 0.3, 0, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(0, -r); x.lineTo(0, r); x.stroke(); x.beginPath(); x.ellipse(-r * 0.55, 0, r * 0.2, r, 0, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.ellipse(r * 0.55, 0, r * 0.2, r, 0, 0, Math.PI * 2); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.ellipse(-r * 0.35, -r * 0.4, r * 0.25, r * 0.15, -0.3, 0, Math.PI * 2); x.fill(); x.restore();
  }
  function drawFlightBall(x, b){
    for(let i = 0; i < b.trail.length; i++){ const t = b.trail[i], alpha = (i / b.trail.length) * 0.55, r = 6 + (i / b.trail.length) * 4; const grad = x.createRadialGradient(t.x, t.y, 0, t.x, t.y, r); grad.addColorStop(0, `rgba(255, 200, 80, ${alpha})`); grad.addColorStop(0.5, `rgba(255, 100, 40, ${alpha * 0.5})`); grad.addColorStop(1, 'rgba(255, 100, 40, 0)'); x.fillStyle = grad; x.fillRect(t.x - r, t.y - r, r*2, r*2); }
    drawBall(x, b.x, b.y, 13, b.rot, b.squash);
  }
  function spawnParticles(x0, y0, type, color){
    const colors = type === 'perfect' ? ['#ffd23b', '#ff8c2a', '#4ad9ff', '#ffffff'] : color === 'cyan' ? ['#4ad9ff', '#ffffff', '#a3e8ff'] : ['#ff5d8f', '#ffffff', '#ffb0c8'];
    const count = type === 'perfect' ? 30 : 14;
    for(let i = 0; i < count; i++){ const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6; particles.push({ x:x0, y:y0, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1, life:1, decay:0.018+Math.random()*0.02, size:2+Math.random()*3.5, color:colors[Math.floor(Math.random()*colors.length)], g:0.18 }); }
    if(type === 'perfect'){ arenaFlash = 0.4; shake.intensity = 8; }
    else { shake.intensity = 3; }
  }
  function updateParticles(){ for(let i = particles.length - 1; i >= 0; i--){ const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life -= p.decay; if(p.life <= 0) particles.splice(i, 1); } }
  function drawParticles(x){ for(const p of particles){ x.save(); x.globalAlpha = p.life; x.fillStyle = p.color; x.shadowColor = p.color; x.shadowBlur = 8; x.beginPath(); x.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); x.fill(); x.restore(); } }

  function frame(t){
    time = t / 1000;
    if(shake.intensity > 0.1){
      shake.x = (Math.random() - 0.5) * shake.intensity;
      shake.y = (Math.random() - 0.5) * shake.intensity;
      shake.intensity *= 0.85;
      stage.style.transform = `translate(${shake.x}px, ${shake.y}px)`;
    } else {
      stage.style.transform = '';
    }
    for(const p of [player, ai]){
      if(p.shooting){
        p.shootProgress += 0.022;
        if(p.shootProgress >= 0.65 && p.ballNotLaunched && p.ballGlobalX){
          const target = p === player ? hoopP : hoopAI;
          const dx = target.rimX - p.ballGlobalX, dy = target.rimY - p.ballGlobalY - 30;
          balls.push({ x:p.ballGlobalX, y:p.ballGlobalY, vx:dx/50, vy:dy/50-6, rot:0, rotSpeed:0.25, trail:[], squash:1, target, mode:p.shotMode || 'perfect' });
          p.ballNotLaunched = false;
        }
        if(p.shootProgress >= 1){ p.shooting = false; p.shootProgress = 0; }
      }
    }
    for(let i = balls.length - 1; i >= 0; i--){
      const b = balls[i]; b.x += b.vx; b.y += b.vy; b.vy += 0.18; b.rot += b.rotSpeed; b.trail.push({x:b.x,y:b.y}); if(b.trail.length > 12) b.trail.shift(); if(b.squash < 1) b.squash = Math.min(1, b.squash + 0.05);
      const dxR = b.x - b.target.rimX, dyR = b.y - b.target.rimY;
      if(Math.abs(dxR) < 30 && dyR > -5 && dyR < 10 && b.vy > 0 && !b.scored){ b.scored = true; if(Math.abs(dxR) < 16 && b.mode === 'perfect'){ spawnParticles(b.target.rimX, b.target.rimY + 8, 'perfect', b.target === hoopAI ? 'cyan' : 'pink'); balls.splice(i, 1); continue; } else { b.vx *= -0.4; b.vy *= -0.5; b.squash = 0.7; spawnParticles(b.target.rimX + dxR, b.target.rimY, 'miss', 'pink'); } }
      if(b.y > H + 30) balls.splice(i, 1);
    }
    xAction.clearRect(0, 0, W, H);
    drawCharacter(xAction, player, player.gender, false);
    drawCharacter(xAction, ai, 'male', true);
    for(const b of balls) drawFlightBall(xAction, b);
    xFx.clearRect(0, 0, W, H);
    updateParticles(); drawParticles(xFx);
    if(arenaFlash > 0){ xFx.fillStyle = `rgba(255,255,255,${arenaFlash * 0.25})`; xFx.fillRect(0,0,W,H); arenaFlash -= 0.04; }
    requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 250));
})();
