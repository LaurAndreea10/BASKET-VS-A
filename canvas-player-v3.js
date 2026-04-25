(() => {
  const getProfile = () => window.BVAI_getPlayerProfile ? window.BVAI_getPlayerProfile() : { gender: 'male', avatar: 'dunk', number: 23 };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function arena(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1020');
    g.addColorStop(.58, '#111827');
    g.addColorStop(1, '#2b1408');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = .16;
    for (let i = 0; i < 5; i++) {
      const x = w * (.14 + i * .18);
      const beam = ctx.createRadialGradient(x, -30, 8, x, -30, h * .9);
      beam.addColorStop(0, '#fff');
      beam.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = beam;
      ctx.fillRect(x - w * .18, 0, w * .36, h);
    }
    ctx.restore();

    const fy = h * .62;
    const floor = ctx.createLinearGradient(0, fy, 0, h);
    floor.addColorStop(0, '#9a4f1e');
    floor.addColorStop(.48, '#b86628');
    floor.addColorStop(1, '#53220d');
    ctx.fillStyle = floor;
    ctx.fillRect(0, fy, w, h - fy);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.42)';
    ctx.lineWidth = Math.max(2, w * .003);
    ctx.strokeRect(w * .06, fy + h * .055, w * .88, h * .26);
    ctx.beginPath();
    ctx.arc(w * .5, fy + h * .19, h * .12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    for (let x = -40; x < w + 80; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + 54, h); ctx.stroke();
    }
    ctx.restore();
  }

  function hoop(ctx, h, scale = 1, ai = false) {
    const rim = ai ? '#3b82f6' : '#f97316';
    const boardX = h.x + 34 * scale, boardY = h.y - 78 * scale;
    ctx.save();
    ctx.shadowColor = ai ? 'rgba(59,130,246,.35)' : 'rgba(249,115,22,.38)';
    ctx.shadowBlur = 18 * scale;
    ctx.fillStyle = ai ? 'rgba(30,64,175,.15)' : 'rgba(226,232,240,.16)';
    ctx.strokeStyle = ai ? 'rgba(96,165,250,.58)' : 'rgba(226,232,240,.62)';
    ctx.lineWidth = Math.max(1.5, 3 * scale);
    rr(ctx, boardX, boardY, 116 * scale, 70 * scale, 9 * scale);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = rim;
    ctx.lineWidth = Math.max(3, 7 * scale);
    ctx.beginPath(); ctx.ellipse(h.x, h.y, 44 * scale, 13 * scale, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = ai ? 'rgba(147,197,253,.36)' : 'rgba(255,255,255,.52)';
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(h.x + i * 9 * scale, h.y + 8 * scale); ctx.lineTo(h.x + i * 4.6 * scale, h.y + 52 * scale); ctx.stroke(); }
    ctx.restore();
  }

  function player(ctx, p, profile) {
    const female = profile.gender === 'female';
    const n = String(profile.number ?? 23).slice(0, 2);
    const s = profile.avatar === 'male' || profile.avatar === 'female' ? .9 : 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);
    ctx.rotate(profile.avatar === 'action' ? -0.12 : -0.04);

    ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.beginPath(); ctx.ellipse(0, 54, 58, 15, 0, 0, Math.PI * 2); ctx.fill();

    // legs behind jersey
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, 18); ctx.lineTo(-35, 75); ctx.moveTo(13, 18); ctx.lineTo(34, 66); ctx.stroke();
    ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-31, 75); ctx.lineTo(-46, 80); ctx.moveTo(34, 66); ctx.lineTo(49, 61); ctx.stroke();

    // arms
    ctx.strokeStyle = female ? '#efb08a' : '#e7a171'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-25, -19); ctx.lineTo(-50, 18); ctx.moveTo(24, -22); ctx.lineTo(50, -56); ctx.stroke();

    // shooting ball in hand
    ctx.fillStyle = '#f97316'; ctx.shadowColor = 'rgba(249,115,22,.65)'; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(55, -63, 15, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(67,20,7,.65)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(43, -63); ctx.lineTo(67, -63); ctx.moveTo(55, -75); ctx.lineTo(55, -51); ctx.stroke();

    // jersey
    const j = ctx.createLinearGradient(-28, -46, 34, 26);
    j.addColorStop(0, female ? '#fb7185' : '#facc15');
    j.addColorStop(.38, '#fb923c');
    j.addColorStop(.72, '#f97316');
    j.addColorStop(.73, '#1d4ed8');
    j.addColorStop(1, '#1e40af');
    ctx.fillStyle = j;
    rr(ctx, -29, -48, 58, 72, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; ctx.stroke();

    ctx.fillStyle = '#dbeafe'; ctx.font = '1000 27px DM Sans, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n, 0, -10);

    // head/hair
    ctx.fillStyle = '#2a160f';
    ctx.beginPath();
    if (female) ctx.ellipse(-4, -74, 30, 24, -.12, 0, Math.PI * 2); else ctx.ellipse(-2, -74, 27, 20, -.08, 0, Math.PI * 2);
    ctx.fill();
    if (female) {
      ctx.beginPath(); ctx.ellipse(-36, -69, 28, 10, -.45, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = female ? '#f1b28d' : '#eba574';
    ctx.beginPath(); ctx.ellipse(0, -62, 17, 19, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = '900 13px DM Sans, system-ui, sans-serif';
    ctx.fillText('YOU', 0, 95);
    ctx.restore();
  }

  function traj(ctx, p, hp, w, h) {
    const aim = game?.aim || 0, power = game?.power || 0;
    ctx.save();
    ctx.strokeStyle = power > 0 ? 'rgba(250,204,21,.88)' : 'rgba(255,255,255,.33)';
    ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.shadowColor = 'rgba(250,204,21,.32)'; ctx.shadowBlur = power > 0 ? 12 : 0;
    ctx.beginPath(); ctx.moveTo(p.x + 46, p.y - 65); ctx.quadraticCurveTo(w * (.43 + aim * .18), h * (.12 + (1 - power) * .08), hp.x + aim * 92, hp.y); ctx.stroke();
    ctx.restore();
  }

  function ball(ctx, b) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(b.x + 10, b.y + 18, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(b.x - 7, b.y - 8, 2, b.x, b.y, 18);
    g.addColorStop(0, b.perfect ? '#fef3c7' : '#fed7aa'); g.addColorStop(.42, b.perfect ? '#facc15' : '#f97316'); g.addColorStop(1, '#9a3412');
    ctx.fillStyle = g; ctx.shadowColor = b.perfect ? 'rgba(250,204,21,.5)' : 'rgba(249,115,22,.35)'; ctx.shadowBlur = b.perfect ? 18 : 10;
    ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(67,20,7,.62)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x - 15, b.y); ctx.lineTo(b.x + 15, b.y); ctx.moveTo(b.x, b.y - 15); ctx.lineTo(b.x, b.y + 15); ctx.stroke();
    if (b.bank) { ctx.strokeStyle = 'rgba(34,211,238,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, b.y, 22, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }

  function install() {
    if (typeof drawGame !== 'function') return false;
    drawGame = function drawGameV3() {
      if (!game) return;
      const c = $('gameCanvas'); const ctx = c.getContext('2d'); const r = c.getBoundingClientRect(); const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);
      arena(ctx, w, h);
      const p = { x: w * .18, y: h * .68 };
      const hp = getHoop();
      hoop(ctx, { x: w * .87, y: h * .32 }, .55, true);
      traj(ctx, p, hp, w, h);
      hoop(ctx, hp, 1, false);
      player(ctx, p, getProfile());
      game.balls.forEach((b) => ball(ctx, b));
    };
    console.info('Basket vs AI canvas player v3 loaded');
    return true;
  }

  if (!install()) {
    const retry = setInterval(() => { if (install()) clearInterval(retry); }, 80);
    setTimeout(() => clearInterval(retry), 3000);
  }
})();
