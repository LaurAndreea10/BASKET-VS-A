(() => {
  'use strict';

  const COURT_ID = 'premium-court-overlay';
  const NOTE_ID = 'premium-court-note';

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function fitCanvas(canvas, target) {
    const rect = target.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W: rect.width, H: rect.height };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function drawHardwood(ctx, W, H) {
    const fy = H * 0.68;
    const floor = ctx.createLinearGradient(0, fy, 0, H);
    floor.addColorStop(0, '#7a3510');
    floor.addColorStop(0.3, '#9b4c20');
    floor.addColorStop(0.65, '#7a3510');
    floor.addColorStop(1, '#341404');
    ctx.fillStyle = floor;
    ctx.fillRect(0, fy, W, H - fy);

    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,.12)';
    ctx.lineWidth = 0.85;
    for (let y = fy + 6; y < H; y += 11) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.045)';
    for (let x = 0; x < W; x += 58) {
      ctx.beginPath();
      ctx.moveTo(x, fy);
      ctx.lineTo(x - W * 0.035, H);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.32)';
    ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.28, fy, W * 0.44, H * 0.2);
    ctx.beginPath();
    ctx.arc(W * 0.5, fy + H * 0.19, H * 0.14, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W * 0.5, fy, H * 0.3, Math.PI * 1.07, Math.PI * 1.93);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(W * 0.5, fy, H * 0.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawArena(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#050810');
    bg.addColorStop(0.48, '#0c1125');
    bg.addColorStop(1, '#150e08');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.09;
    for (let i = 0; i < 4; i++) {
      const lx = W * (0.14 + i * 0.25);
      const beam = ctx.createRadialGradient(lx, -20, 8, lx, -20, H * 0.85);
      beam.addColorStop(0, '#fff5e8');
      beam.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = beam;
      ctx.fillRect(0, 0, W, H * 0.85);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#0b1021';
    for (let i = 0; i < 26; i++) {
      const x = (i / 26) * W;
      const y = H * 0.58 + Math.sin(i * 1.3) * 5;
      ctx.beginPath();
      ctx.arc(x, y, 4 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    drawHardwood(ctx, W, H);
  }

  function drawHoop(ctx, hx, hy, hr, rimColor, rimGlow, blue = false) {
    const bx = hx - hr * 1.4;
    const by = hy - hr * 2.0;
    const bw = hr * 2.8;
    const bh = hr * 1.55;
    const r = Math.max(5, hr * 0.22);

    ctx.save();
    ctx.shadowColor = blue ? 'rgba(59,130,246,.3)' : 'rgba(255,210,150,.22)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = blue ? 'rgba(10,20,90,.28)' : 'rgba(210,225,255,.14)';
    ctx.strokeStyle = blue ? 'rgba(96,165,250,.72)' : 'rgba(220,235,255,.92)';
    ctx.lineWidth = Math.max(2, hr * 0.1);
    roundRect(ctx, bx, by, bw, bh, r);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath();
    ctx.moveTo(bx + r, by + 2);
    ctx.lineTo(bx + bw * 0.42, by + 2);
    ctx.lineTo(bx + bw * 0.32, by + bh * 0.44);
    ctx.lineTo(bx + r, by + bh * 0.44);
    ctx.closePath();
    ctx.fill();

    if (!blue) {
      ctx.strokeStyle = 'rgba(249,115,22,.82)';
      ctx.lineWidth = Math.max(1.5, hr * 0.07);
      ctx.strokeRect(hx - hr * 0.46, by + bh * 0.1, hr * 0.92, bh * 0.75);
    }

    ctx.strokeStyle = blue ? 'rgba(96,165,250,.38)' : 'rgba(200,215,240,.42)';
    ctx.lineWidth = Math.max(2, hr * 0.1);
    ctx.beginPath();
    ctx.moveTo(hx, by + bh);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    ctx.shadowColor = rimGlow;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = Math.max(5, hr * 0.22);
    ctx.beginPath();
    ctx.ellipse(hx, hy, hr, hr * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = blue ? 'rgba(96,165,250,.72)' : 'rgba(255,176,90,.85)';
    ctx.lineWidth = Math.max(2, hr * 0.1);
    ctx.beginPath();
    ctx.ellipse(hx, hy, hr * 0.88, hr * 0.26, 0, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const nx = hx + Math.cos(a) * hr;
      const ny = hy + Math.sin(a) * hr * 0.3;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.quadraticCurveTo(hx + Math.cos(a) * hr * 0.42, ny + hr * 0.9, hx, hy + hr * 1.45);
      ctx.strokeStyle = blue ? 'rgba(120,170,255,.22)' : 'rgba(255,255,255,.28)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(hx, hy + hr * (0.3 + i * 0.35), hr * (0.85 - i * 0.25), 0, Math.PI * 2);
      ctx.strokeStyle = blue ? 'rgba(100,160,255,.1)' : 'rgba(255,255,255,.1)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBall(ctx, x, y, br, inFlight) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath();
    ctx.ellipse(x + br * 0.5, y + br * 0.65, br * 0.9, br * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(inFlight ? performance.now() / 200 : 0);
    if (inFlight) {
      ctx.shadowColor = 'rgba(249,115,22,.55)';
      ctx.shadowBlur = br * 0.7;
    }
    const grd = ctx.createRadialGradient(-br * 0.35, -br * 0.35, br * 0.08, 0, 0, br);
    grd.addColorStop(0, '#ffa95a');
    grd.addColorStop(0.45, '#e05500');
    grd.addColorStop(1, '#7a1d00');
    ctx.beginPath();
    ctx.arc(0, 0, br, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.38)';
    ctx.beginPath();
    ctx.moveTo(-br, 0);
    ctx.lineTo(br, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, br * 0.58, 0, Math.PI, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, br * 0.58, Math.PI, Math.PI * 2, false);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.beginPath();
    ctx.ellipse(-br * 0.3, -br * 0.32, br * 0.28, br * 0.18, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawOverlay(canvas, wrap) {
    const { ctx, W, H } = fitCanvas(canvas, wrap);
    drawArena(ctx, W, H);
    drawHoop(ctx, W * 0.77, H * 0.34, Math.max(18, W * 0.035), '#cc4400', 'rgba(255,100,40,.8)', false);
    drawHoop(ctx, W * 0.22, H * 0.36, Math.max(14, W * 0.028), '#1a4a8a', 'rgba(59,130,246,.6)', true);
    ctx.save();
    ctx.font = 'bold 11px Inter Tight, DM Sans, sans-serif';
    ctx.fillStyle = 'rgba(59,130,246,.7)';
    ctx.textAlign = 'center';
    ctx.fillText('AI', W * 0.22, H * 0.36 - Math.max(14, W * 0.028) * 2.3);
    ctx.restore();
    drawBall(ctx, W * 0.37, H * 0.56, Math.max(10, W * 0.016), true);
  }

  function setup() {
    const wrap = $('.court-wrap');
    if (!wrap || $(`#${COURT_ID}`)) return;
    const canvas = document.createElement('canvas');
    canvas.id = COURT_ID;
    canvas.className = 'court-graphics-layer';
    wrap.prepend(canvas);

    const note = document.createElement('div');
    note.id = NOTE_ID;
    note.className = 'premium-court-note';
    note.textContent = 'Premium court graphics';
    wrap.appendChild(note);

    document.body.classList.add('premium-graphics-ready');

    let raf = 0;
    const render = () => {
      drawOverlay(canvas, wrap);
      raf = requestAnimationFrame(render);
    };
    render();

    const observer = new ResizeObserver(() => drawOverlay(canvas, wrap));
    observer.observe(wrap);

    window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
