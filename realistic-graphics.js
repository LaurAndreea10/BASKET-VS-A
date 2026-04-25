function drawWoodFloor(ctx, w, h) {
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#b97533');
  base.addColorStop(0.45, '#d39148');
  base.addColorStop(1, '#8f5526');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let y = 0; y < h; y += 34) {
    ctx.fillStyle = y % 68 === 0 ? '#f5b15b' : '#7b421d';
    ctx.fillRect(0, y, w, 2);
  }
  for (let x = 0; x < w; x += 82) {
    ctx.strokeStyle = x % 164 === 0 ? 'rgba(255,236,190,.25)' : 'rgba(77,38,13,.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(x) * 18, h);
    ctx.stroke();
  }
  for (let i = 0; i < 180; i++) {
    const x = (i * 73) % w;
    const y = (i * 41) % h;
    ctx.strokeStyle = 'rgba(92,48,18,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 26, y + 7, x + 74, y + 2);
    ctx.stroke();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(w * .5, h * .45, h * .2, w * .5, h * .45, h * .82);
  vignette.addColorStop(0, 'rgba(255,255,255,.06)');
  vignette.addColorStop(1, 'rgba(0,0,0,.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function drawCourtLines(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.78)';
  ctx.lineWidth = Math.max(2, w * .004);
  ctx.shadowColor = 'rgba(255,255,255,.18)';
  ctx.shadowBlur = 4;

  ctx.strokeRect(w * .055, h * .075, w * .89, h * .85);
  ctx.beginPath();
  ctx.arc(w * .22, h * .78, h * .22, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w * .68, h * .32, h * .22, Math.PI * .06, Math.PI * .94);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w * .5, h * .5, h * .11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * .5, h * .075);
  ctx.lineTo(w * .5, h * .925);
  ctx.stroke();
  ctx.strokeRect(w * .62, h * .22, w * .25, h * .2);
  ctx.restore();
}

function drawRealisticHoop(ctx, hoop) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 12;

  const boardGrad = ctx.createLinearGradient(hoop.x + 16, hoop.y - 88, hoop.x + 96, hoop.y + 20);
  boardGrad.addColorStop(0, 'rgba(255,255,255,.92)');
  boardGrad.addColorStop(1, 'rgba(210,226,240,.72)');
  ctx.fillStyle = boardGrad;
  roundRect(ctx, hoop.x + 24, hoop.y - 88, 86, 66, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,107,43,.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(hoop.x + 48, hoop.y - 67, 36, 26);

  ctx.strokeStyle = '#26313f';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(hoop.x + 110, hoop.y - 58);
  ctx.lineTo(hoop.x + 110, hoop.y + 70);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(hoop.x, hoop.y, 46, 13, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,.72)';
  ctx.lineWidth = 1.5;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(hoop.x + i * 9, hoop.y + 8);
    ctx.lineTo(hoop.x + i * 5, hoop.y + 52);
    ctx.stroke();
  }
  for (let y = 18; y <= 44; y += 13) {
    ctx.beginPath();
    ctx.ellipse(hoop.x, hoop.y + y, 35 - y * .35, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(ctx, player, labelText) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 34, 44, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  const jersey = ctx.createLinearGradient(player.x - 24, player.y - 42, player.x + 22, player.y + 28);
  jersey.addColorStop(0, '#ffb347');
  jersey.addColorStop(1, '#f97316');
  ctx.fillStyle = jersey;
  roundRect(ctx, player.x - 22, player.y - 38, 44, 58, 14);
  ctx.fill();

  ctx.fillStyle = '#2a1d16';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 54, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0b38b';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 48, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(player.x - 22, player.y - 18);
  ctx.lineTo(player.x - 42, player.y + 16);
  ctx.moveTo(player.x + 22, player.y - 18);
  ctx.lineTo(player.x + 42, player.y + 16);
  ctx.stroke();

  ctx.strokeStyle = '#111827';
  ctx.beginPath();
  ctx.moveTo(player.x - 11, player.y + 18);
  ctx.lineTo(player.x - 24, player.y + 58);
  ctx.moveTo(player.x + 11, player.y + 18);
  ctx.lineTo(player.x + 24, player.y + 58);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.font = '800 13px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(labelText, player.x, player.y + 83);
  ctx.restore();
}

function drawBall(ctx, ball) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.24)';
  ctx.beginPath();
  ctx.ellipse(ball.x + 10, ball.y + 18, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createRadialGradient(ball.x - 7, ball.y - 9, 3, ball.x, ball.y, 19);
  grad.addColorStop(0, '#ffc078');
  grad.addColorStop(.42, '#f97316');
  grad.addColorStop(1, '#9a3412');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(68,24,7,.62)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ball.x, ball.y, 16, Math.PI * .5, Math.PI * 1.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(ball.x, ball.y, 16, Math.PI * 1.5, Math.PI * .5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ball.x - 15, ball.y); ctx.quadraticCurveTo(ball.x, ball.y - 7, ball.x + 15, ball.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ball.x - 15, ball.y); ctx.quadraticCurveTo(ball.x, ball.y + 7, ball.x + 15, ball.y); ctx.stroke();
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawGame() {
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  drawWoodFloor(ctx, w, h);
  drawCourtLines(ctx, w, h);

  const player = { x: w * .22, y: h * .74 };
  const hoop = getHoop();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.64)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 9]);
  ctx.shadowColor = 'rgba(255,179,71,.65)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 48);
  ctx.quadraticCurveTo(w * (.42 + game.aim * .16), h * .08, hoop.x, hoop.y);
  ctx.stroke();
  ctx.restore();

  drawRealisticHoop(ctx, hoop);
  drawPlayer(ctx, player, t('you').toUpperCase());

  if (game.ball) drawBall(ctx, game.ball);

  ctx.save();
  ctx.fillStyle = 'rgba(5,5,8,.48)';
  roundRect(ctx, 14, 13, 210, 34, 14);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.font = '800 12px DM Sans, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${t('aim')} ${Math.round(game.aim * 100)} · ${game.mode === 'chaos' ? t('windActive') : t('noWind')}`, 28, 35);
  ctx.restore();
}
