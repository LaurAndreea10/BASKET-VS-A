(() => {
  function installPhysicsFix() {
    if (typeof updateBall !== 'function' || typeof scoreBall !== 'function' || typeof getHoop !== 'function') return false;

    getBackboard = function getBackboardFixed() {
      const h = getHoop();
      return { x: h.x + 60, y: h.y - 78, w: 10, h: 106 };
    };

    updateBall = function updateBallFixed(ball, dt, rect, hoop, board) {
      ball.life += dt;
      ball.prevX = ball.x;
      ball.prevY = ball.y;
      ball.vx += game.wind * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.vy += 930 * dt;
      ball.speed = Math.hypot(ball.vx, ball.vy);

      const dx = ball.x - hoop.x;
      const dy = ball.y - hoop.y;
      const prevDx = (ball.prevX ?? ball.x) - hoop.x;
      const prevDy = (ball.prevY ?? ball.y) - hoop.y;
      const crossedHoopPlane = prevDy < -6 && dy >= -6 && Math.abs(dx) < 42;
      const insideRimWindow = Math.abs(dx) < 40 && dy > -20 && dy < 28 && ball.vy > 0;
      const sweptThroughRim = crossedHoopPlane && ball.vy > 0 && Math.abs(prevDx) < 52;

      if (!ball.scored && (insideRimWindow || sweptThroughRim)) {
        scoreBall(ball);
        return;
      }

      const fixedBoard = board || getBackboard();
      const inBackboardX = ball.x > fixedBoard.x && ball.x < fixedBoard.x + fixedBoard.w + 8;
      const inBackboardY = ball.y > fixedBoard.y + 8 && ball.y < fixedBoard.y + fixedBoard.h * 0.78;
      const safelyBehindRim = ball.x > hoop.x + 42;
      const movingIntoBoard = ball.vx > 80;

      if (!ball.bank && movingIntoBoard && safelyBehindRim && inBackboardX && inBackboardY) {
        ball.x = fixedBoard.x - 10;
        ball.vx = -Math.abs(ball.vx) * (0.58 + (career.upgrades.bank || 0) * 0.035);
        ball.vy *= 0.82;
        ball.bank = true;
        ball.life = Math.max(0, ball.life - 0.25);
        playTone('rim');
      }

      if (!ball.touchedRim && Math.abs(dx) < 58 && Math.abs(dy) < 36 && ball.vy > 0 && !ball.scored) {
        ball.touchedRim = true;
        game.stats.rimHits += 1;
        game.stats.combo = Math.max(0, game.stats.combo - (career.upgrades.recovery >= 3 ? 0 : 1));
        showToast(t('rimHit'));
        playTone('rim');
        ball.vx += dx < 0 ? -55 : 55;
        ball.vy = Math.max(ball.vy, 130);
      }

      const verySlowNearHoop = ball.life > 0.75 && ball.speed < 95 && Math.abs(dx) < 95 && Math.abs(dy) < 95;
      const outOfBounds = ball.x < -80 || ball.x > rect.width + 120 || ball.y > rect.height + 100 || ball.life > 4.2;

      if (verySlowNearHoop) {
        ball.vy = Math.max(ball.vy, 260);
        ball.vx += dx < 0 ? -70 : 70;
        if (ball.life > 1.35) {
          if (!ball.notified) {
            showToast(t('miss'));
            playTone('miss');
            ball.notified = true;
            game.stats.combo = 0;
          }
          ball.dead = true;
        }
      } else if (outOfBounds) {
        if (!ball.scored && !ball.notified) {
          showToast(t('miss'));
          playTone('miss');
          ball.notified = true;
          game.stats.combo = 0;
        }
        ball.dead = true;
      }
    };

    console.info('Basket vs AI ball physics fix loaded: assets-6');
    return true;
  }

  if (!installPhysicsFix()) {
    const retry = setInterval(() => {
      if (installPhysicsFix()) clearInterval(retry);
    }, 80);
    setTimeout(() => clearInterval(retry), 3000);
  }
})();
