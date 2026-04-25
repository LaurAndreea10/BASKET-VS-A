(() => {
  function installBallPhysicsV2() {
    if (typeof updateBall !== 'function' || typeof scoreBall !== 'function' || typeof getHoop !== 'function') return false;

    const GRAVITY = 930;

    getBackboard = function getBackboardV2() {
      const hoop = getHoop();
      return {
        // Collision is deliberately behind the rim, never in the scoring lane.
        x: hoop.x + 72,
        y: hoop.y - 86,
        w: 9,
        h: 118
      };
    };

    function crossedSegment(prevY, y, targetY) {
      return (prevY <= targetY && y >= targetY) || (prevY >= targetY && y <= targetY);
    }

    function lerpAtY(prevX, prevY, x, y, targetY) {
      const denom = y - prevY;
      if (Math.abs(denom) < 0.0001) return x;
      const t = (targetY - prevY) / denom;
      return prevX + (x - prevX) * Math.max(0, Math.min(1, t));
    }

    updateBall = function updateBallNoStick(ball, dt, rect, hoop, board) {
      const prevX = ball.x;
      const prevY = ball.y;
      ball.life += dt;

      ball.vx += (game.wind || 0) * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.vy += GRAVITY * dt;
      ball.speed = Math.hypot(ball.vx, ball.vy);

      const dx = ball.x - hoop.x;
      const dy = ball.y - hoop.y;
      const prevDx = prevX - hoop.x;
      const prevDy = prevY - hoop.y;

      // 1) Score first, using both current position and swept path.
      const rimPlaneY = hoop.y - 4;
      const sweptX = lerpAtY(prevX, prevY, ball.x, ball.y, rimPlaneY);
      const sweptDx = sweptX - hoop.x;
      const crossedRim = crossedSegment(prevY, ball.y, rimPlaneY) && ball.vy > 0 && Math.abs(sweptDx) <= 48;
      const insideRim = ball.vy > 0 && Math.abs(dx) <= 46 && dy >= -26 && dy <= 34;
      const softDrop = ball.life > 0.45 && ball.vy > 0 && Math.abs(dx) <= 38 && dy >= -46 && dy <= 18;

      if (!ball.scored && (crossedRim || insideRim || softDrop)) {
        scoreBall(ball);
        return;
      }

      // 2) Backboard only exists behind the rim and only for fast shots.
      const bb = board || getBackboard();
      const fastEnough = ball.vx > 95;
      const behindRim = prevX > hoop.x + 42 || ball.x > hoop.x + 42;
      const hitsBackboard = fastEnough && behindRim && ball.x >= bb.x - 6 && ball.x <= bb.x + bb.w + 8 && ball.y >= bb.y + 12 && ball.y <= bb.y + bb.h * 0.78;

      if (!ball.bank && hitsBackboard) {
        ball.x = bb.x - 12;
        ball.vx = -Math.abs(ball.vx) * (0.5 + (career.upgrades.bank || 0) * 0.03);
        ball.vy *= 0.72;
        ball.bank = true;
        ball.life = Math.max(0, ball.life - 0.18);
        playTone('rim');
      }

      // 3) Rim hits should bounce or fall away, never hover.
      const nearRim = Math.abs(dx) <= 64 && Math.abs(dy) <= 44;
      if (!ball.touchedRim && nearRim && ball.vy > 0 && !ball.scored) {
        ball.touchedRim = true;
        game.stats.rimHits += 1;
        game.stats.combo = Math.max(0, game.stats.combo - (career.upgrades.recovery >= 3 ? 0 : 1));
        showToast(t('rimHit'));
        playTone('rim');
        ball.vx += dx <= 0 ? -95 : 95;
        ball.vy = Math.max(ball.vy, 260);
      }

      // 4) Dead-zone resolver around the hoop. This is the anti-freeze guard.
      const stuckInScoringArea = ball.life > 0.55 && Math.abs(dx) < 105 && Math.abs(dy) < 105 && ball.speed < 150;
      if (stuckInScoringArea) {
        if (Math.abs(dx) < 42 && dy < 34 && dy > -60 && ball.vy >= -40) {
          scoreBall(ball);
          return;
        }
        ball.vx += dx <= 0 ? -130 : 130;
        ball.vy = Math.max(ball.vy, 330);
      }

      // 5) Hard timeout near hoop; no visible hanging.
      const hangingNearHoop = ball.life > 1.25 && Math.abs(dx) < 130 && Math.abs(dy) < 130;
      const out = ball.x < -90 || ball.x > rect.width + 130 || ball.y > rect.height + 115 || ball.life > 3.8 || hangingNearHoop;
      if (out) {
        if (!ball.scored && !ball.notified) {
          showToast(t('miss'));
          playTone('miss');
          ball.notified = true;
          game.stats.combo = 0;
        }
        ball.dead = true;
      }
    };

    // Make future shots a little cleaner: less float, more decisive arc.
    if (typeof releaseShot === 'function' && !window.__BVAI_RELEASE_V2__) {
      window.__BVAI_RELEASE_V2__ = true;
      releaseShot = function releaseShotV2() {
        if (!game || !charging) return;
        charging = false;
        const r = $('gameCanvas').getBoundingClientRect();
        const player = { x: r.width * 0.22, y: r.height * 0.78 };
        const hoop = getHoop();
        const focusBonus = (career.upgrades.focus || 0) * 0.018;
        const powerBonus = (career.upgrades.power || 0) * 0.014;
        const clutch = game.timeLeft < 15 ? (career.upgrades.clutch || 0) * 0.018 : 0;
        const center = 0.66 + Math.abs(game.aim) * 0.07;
        const powerError = Math.abs(game.power - center);
        const aimError = Math.abs(game.aim) * 0.075;
        const perfect = powerError + aimError < 0.115 + focusBonus + powerBonus + clutch;
        const wantsBank = Math.abs(game.aim) > 0.56 || game.mode === 'bank';
        const targetX = wantsBank ? hoop.x + 72 : hoop.x + game.aim * 58;
        const targetY = wantsBank ? hoop.y - 28 : hoop.y - 8;
        const miss = perfect ? 0 : (Math.random() - 0.5) * Math.max(24, 88 - (career.upgrades.focus || 0) * 9);
        const duration = Math.max(0.72, Math.min(1.02, 0.93 - (game.power - 0.66) * 0.18));
        const vx = (targetX + miss - player.x) / duration;
        const vy = (targetY - player.y + 35 - 0.5 * GRAVITY * duration * duration) / duration;
        game.balls.push({ id: ++game.shotId, x: player.x, y: player.y - 35, vx, vy, perfect, bank: false, scored: false, touchedRim: false, dead: false, life: 0, speed: Math.hypot(vx, vy) });
        game.power = 0;
        game.stuckTimer = 0;
      };
    }

    console.info('Basket vs AI ball physics v2 loaded: assets-9');
    return true;
  }

  if (!installBallPhysicsV2()) {
    const retry = setInterval(() => {
      if (installBallPhysicsV2()) clearInterval(retry);
    }, 80);
    setTimeout(() => clearInterval(retry), 3000);
  }
})();
