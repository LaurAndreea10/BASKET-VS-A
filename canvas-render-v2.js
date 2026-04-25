(() => {
  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawArena(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0b1020');
    sky.addColorStop(0.48, '#10172a');
    sky.addColorStop(1, '#121826');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 5; i++) {
      const lx = w * (0.14 + i * 0.18);
      const beam = ctx.createRadialGradient(lx, -30, 10, lx, -30, h * 0.72);
      beam.addColorStop(0, 'rgba(255,255,255,.42)');
      beam.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(lx - w * 0.16, 0);
      ctx.lineTo(lx + w * 0.16, 0);
      ctx.lineTo(lx + w * 0.22, h);
      ctx.lineTo(lx - w * 0.22, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    const floorY = h * 0.68;
    const floor = ctx.createLinearGradient(0, floorY, 0, h);
    floor.addColorStop(0, '#7c3f18');
    floor.addColorStop(0.5, '#b86628');
    floor.addColorStop(1, '#5b2b12');
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorY, w, h - floorY);

    ctx.save();
    ctx.globalAlpha = 0.24;
    for (let y = floorY; y < h; y += 26) {
      ctx.fillStyle = y % 52 < 26 ? '#f59e0b' : '#4b1f0d';
      ctx.fillRect(0, y, w, 1.5);
    }
    for (let x = -40; x < w + 60; x += 84) {
      ctx.strokeStyle = 'rgba(255,236,190,.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + 45, h);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.strokeRect(w * 0.08, floorY + h * 0.045, w * 0.84, h * 0.22);
    ctx.beginPath();
    ctx.arc(w * 0.5, floorY + h * 0.16, h * 0.12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.22, floorY + h * 0.15, h * 0.17, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.restore();

    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.42, h * 0.1, w * 0.5, h * 0.52, h * 0.82);
    vignette.addColorStop(0, 'rgba(255,255,255,.04)');
    vignette.addColorStop(1, 'rgba(0,0,0,.36)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function drawHoop(ctx, hoop, scale = 1, team = 'player') {
    const rimColor = team === 'ai' ? '#3b82f6' : '#f97316';
    const glow = team === 'ai' ? 'rgba(59,130,246,.32)' : 'rgba(249,115,22,.38)';
    const boardW = 116 * scale;
    const boardH = 70 * scale;
    const boardX = hoop.x + 34 * scale;
    const boardY = hoop.y - 78 * scale;

    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18 * scale;
    ctx.fillStyle = team === 'ai' ? 'rgba(30,64,175,.18)' : 'rgba(226,232,240,.13)';
    ctx.strokeStyle = team === 'ai' ? 'rgba(96,165,250,.55)' : 'rgba(226,232,240,.55)';
    ctx.lineWidth = Math.max(1.5, 3 * scale);
    roundRect(ctx, boardX, boardY, boardW, boardH, 8 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = team === 'ai' ? 'rgba(96,165,250,.62)' : 'rgba(249,115,22,.65)';
    ctx.lineWidth = Math.max(1.2, 2 * scale);
    ctx.strokeRect(boardX + boardW * 0.32, boardY + boardH * 0.25, boardW * 0.34, boardH * 0.34);

    ctx.shadowBlur = 20 * scale;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = Math.max(3, 7 * scale);
    ctx.beginPath();
    ctx.ellipse(hoop.x, hoop.y, 44 * scale, 13 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = team === 'ai' ? 'rgba(147,197,253,.35)' : 'rgba(255,255,255,.46)';
    ctx.lineWidth = Math.max(1, 1.35 * scale);
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(hoop.x + i * 9 * scale, hoop.y + 8 * scale);
      ctx.lineTo(hoop.x + i * 4.8 * scale, hoop.y + 53 * scale);
      ctx.stroke();
    }
    for (let y = 18; y <= 45; y += 13) {
      ctx.beginPath();
      ctx.ellipse(hoop.x, hoop.y + y * scale, (35 - y * 0.34) * scale, 6 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayerAvatar(ctx, player, label) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 38, 52, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    const jersey = ctx.createLinearGradient(player.x - 26, player.y - 48, player.x + 28, player.y + 22);
    jersey.addColorStop(0, '#facc15');
    jersey.addColorStop(0.55, '#fb923c');
    jersey.addColorStop(1, '#ea580c');
    ctx.fillStyle = jersey;
    roundRect(ctx, player.x - 25, player.y - 44, 50, 64, 15);
    ctx.fill();

    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(player.x - 25, player.y - 22);
    ctx.lineTo(player.x - 47, player.y + 18);
    ctx.moveTo(player.x + 25, player.y - 22);
    ctx.lineTo(player.x + 48, player.y + 8);
    ctx.stroke();

    ctx.fillStyle = '#2f1b12';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 60, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0b38b';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 51, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(player.x - 12, player.y + 19);
    ctx.lineTo(player.x - 26, player.y + 61);
    ctx.moveTo(player.x + 12, player.y + 19);
    ctx.lineTo(player.x + 27, player.y + 61);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = '900 13px DM Sans, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, player.x, player.y + 88);
    ctx.restore();
  }

  function drawTrajectoryV2(ctx, player, hoop, w, h) {
    const aim = game?.aim || 0;
    const power = game?.power || 0;
    ctx.save();
    ctx.strokeStyle = power > 0 ? 'rgba(250,204,21,.88)' : 'rgba(255,255,255,.28)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.shadowColor = 'rgba(250,204,21,.3)';
    ctx.shadowBlur = power > 0 ? 14 : 0;
    ctx.beginPath();
    ctx.moveTo(player.x + 10, player.y - 72);
    ctx.quadraticCurveTo(w * (0.43 + aim * 0.18), h * (0.12 + (1 - power) * 0.08), hoop.x + aim * 92, hoop.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (Math.abs(aim) > 0.52 || game?.mode === 'bank') {
      const b = getBackboard();
      ctx.strokeStyle = 'rgba(34,211,238,.65)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(player.x + 10, player.y - 72);
      ctx.quadraticCurveTo(w * 0.54, h * 0.13, b.x, b.y + b.h * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBallV2(ctx, ball) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath();
    ctx.ellipse(ball.x + 11, ball.y + 18, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(ball.x - 7, ball.y - 8, 2, ball.x, ball.y, 18);
    grad.addColorStop(0, ball.perfect ? '#fef3c7' : '#fed7aa');
    grad.addColorStop(0.42, ball.perfect ? '#facc15' : '#f97316');
    grad.addColorStop(1, '#9a3412');
    ctx.fillStyle = grad;
    ctx.shadowColor = ball.perfect ? 'rgba(250,204,21,.5)' : 'rgba(249,115,22,.35)';
    ctx.shadowBlur = ball.perfect ? 18 : 10;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(67,20,7,.62)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, 16, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(ball.x, ball.y, 16, Math.PI * 1.5, Math.PI * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ball.x - 15, ball.y); ctx.quadraticCurveTo(ball.x, ball.y - 7, ball.x + 15, ball.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ball.x - 15, ball.y); ctx.quadraticCurveTo(ball.x, ball.y + 7, ball.x + 15, ball.y); ctx.stroke();

    if (ball.bank) {
      ctx.strokeStyle = 'rgba(34,211,238,.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAiMarker(ctx, w, h) {
    const aiHoop = { x: w * 0.86, y: h * 0.34 };
    ctx.save();
    ctx.globalAlpha = 0.74;
    drawHoop(ctx, aiHoop, 0.62, 'ai');
    ctx.fillStyle = 'rgba(96,165,250,.9)';
    ctx.font = '900 12px DM Sans, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AI', aiHoop.x, aiHoop.y - 82 * 0.62);
    ctx.restore();
  }

  function drawHudOverlay(ctx, w) {
    ctx.save();
    ctx.fillStyle = 'rgba(5,8,20,.58)';
    roundRect(ctx, 14, 13, Math.min(300, w - 28), 38, 15);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = '900 12px DM Sans, system-ui, sans-serif';
    ctx.textAlign = 'left';
    const wind = document.getElementById('windChip')?.textContent || '';
    ctx.fillText(`${t('aim')} ${Math.round((game?.aim || 0) * 100)} · ${wind}`, 28, 37);
    ctx.restore();
  }

  function installRenderer() {
    if (typeof drawGame !== 'function') return false;
    drawGame = function drawGameEnhancedCourt() {
      if (!game) return;
      const canvas = $('gameCanvas');
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      drawArena(ctx, w, h);
      const player = { x: w * 0.22, y: h * 0.76 };
      const hoop = getHoop();
      drawAiMarker(ctx, w, h);
      drawTrajectoryV2(ctx, player, hoop, w, h);
      drawHoop(ctx, hoop, 1, 'player');
      drawPlayerAvatar(ctx, player, t('you').toUpperCase());
      game.balls.forEach((ball) => drawBallV2(ctx, ball));
      drawHudOverlay(ctx, w);
    };
    console.info('Basket vs AI canvas renderer v2 loaded');
    return true;
  }

  if (!installRenderer()) {
    const retry = setInterval(() => {
      if (installRenderer()) clearInterval(retry);
    }, 80);
    setTimeout(() => clearInterval(retry), 3000);
  }
})();
