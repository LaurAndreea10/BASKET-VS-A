(() => {
  function installEmergencyFix() {
    const home = document.getElementById('homeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const quit = document.getElementById('quitBtn');

    // Hard exit: works even if the game loop or state got into a bad state.
    if (quit && !quit.dataset.emergencyExit) {
      quit.dataset.emergencyExit = '1';
      quit.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        try { cancelAnimationFrame(animationId); } catch {}
        try { charging = false; } catch {}
        try { keys?.clear?.(); } catch {}
        try { game = null; } catch {}
        if (gameScreen) gameScreen.classList.add('hidden');
        if (home) home.classList.remove('hidden');
        document.body.classList.remove('game-active');
      }, true);
    }

    if (typeof updateBall !== 'function' || typeof scoreBall !== 'function' || typeof getHoop !== 'function') {
      return false;
    }

    const GRAVITY = 930;

    // No physical backboard collider in front of the basket. Bank shots are now
    // detected by path/aim instead of a blocking rectangle, so the ball cannot stick.
    getBackboard = function getBackboardEmergency() {
      const hoop = getHoop();
      return { x: hoop.x + 95, y: hoop.y - 92, w: 6, h: 112 };
    };

    function segmentClosestXAtY(prevX, prevY, x, y, targetY) {
      const denom = y - prevY;
      if (Math.abs(denom) < 0.001) return x;
      const t = Math.max(0, Math.min(1, (targetY - prevY) / denom));
      return prevX + (x - prevX) * t;
    }

    updateBall = function updateBallEmergency(ball, dt, rect, hoop) {
      const prevX = ball.x;
      const prevY = ball.y;

      ball.life += dt;
      ball.vx += (game?.wind || 0) * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.vy += GRAVITY * dt;
      ball.speed = Math.hypot(ball.vx, ball.vy);

      const dx = ball.x - hoop.x;
      const dy = ball.y - hoop.y;
      const prevDy = prevY - hoop.y;

      // Scoring lane: if the ball crosses the front/open rim plane while falling,
      // count it. This eliminates the freeze point directly before the rim.
      const rimPlaneY = hoop.y - 6;
      const crossedDown = prevY <= rimPlaneY && ball.y >= rimPlaneY && ball.vy > 0;
      const crossX = segmentClosestXAtY(prevX, prevY, ball.x, ball.y, rimPlaneY);
      const crossedInside = crossedDown && Math.abs(crossX - hoop.x) <= 52;
      const alreadyInside = ball.vy > 0 && Math.abs(dx) <= 50 && dy > -30 && dy < 42;
      const fallingPocket = ball.life > 0.35 && ball.vy > 0 && Math.abs(dx) <= 44 && dy > -55 && dy < 20;

      if (!ball.scored && (crossedInside || alreadyInside || fallingPocket)) {
        scoreBall(ball);
        return;
      }

      // Cosmetic bank detection only; it never blocks the ball.
      if (!ball.bank && ball.x > hoop.x + 56 && ball.x < hoop.x + 112 && ball.y > hoop.y - 88 && ball.y < hoop.y + 20 && ball.vx > 0) {
        ball.bank = true;
        ball.vx *= -0.42;
        ball.vy *= 0.68;
        playTone?.('rim');
      }

      // Rim miss resolver: push the ball away and down, never let it hover.
      const nearRim = Math.abs(dx) < 72 && Math.abs(dy) < 52;
      if (!ball.touchedRim && nearRim && ball.vy > 0 && !ball.scored) {
        ball.touchedRim = true;
        if (game?.stats) {
          game.stats.rimHits += 1;
          game.stats.combo = 0;
        }
        showToast?.(t?.('rimHit') || 'Rim hit!');
        playTone?.('rim');
        ball.vx = dx < 0 ? -190 : 190;
        ball.vy = Math.max(ball.vy, 380);
      }

      // Absolute anti-stuck: anything slow or old near the hoop is immediately resolved.
      const stuckNearHoop = ball.life > 0.6 && Math.abs(dx) < 125 && Math.abs(dy) < 125 && ball.speed < 220;
      const oldNearHoop = ball.life > 1.05 && Math.abs(dx) < 150 && Math.abs(dy) < 150;
      if (stuckNearHoop || oldNearHoop) {
        if (Math.abs(dx) < 48 && dy > -64 && dy < 38 && ball.vy > -90) {
          scoreBall(ball);
          return;
        }
        ball.dead = true;
        if (!ball.notified) {
          showToast?.(t?.('miss') || 'Miss');
          playTone?.('miss');
          ball.notified = true;
          if (game?.stats) game.stats.combo = 0;
        }
        return;
      }

      if (ball.x < -100 || ball.x > rect.width + 150 || ball.y > rect.height + 135 || ball.life > 3.25) {
        ball.dead = true;
        if (!ball.scored && !ball.notified) {
          showToast?.(t?.('miss') || 'Miss');
          playTone?.('miss');
          ball.notified = true;
          if (game?.stats) game.stats.combo = 0;
        }
      }
    };

    // Deterministic shot arc. Less float, fewer near-rim stalls.
    if (typeof releaseShot === 'function') {
      releaseShot = function releaseShotEmergency() {
        if (!game || !charging) return;
        charging = false;
        const rect = document.getElementById('gameCanvas').getBoundingClientRect();
        const player = { x: rect.width * 0.22, y: rect.height * 0.78 };
        const hoop = getHoop();
        const center = 0.66 + Math.abs(game.aim) * 0.06;
        const timingError = Math.abs(game.power - center);
        const perfect = timingError + Math.abs(game.aim) * 0.065 < 0.12 + (career?.upgrades?.focus || 0) * 0.016;
        const wantsBank = Math.abs(game.aim) > 0.6 || game.mode === 'bank';
        const targetX = wantsBank ? hoop.x + 82 : hoop.x + game.aim * 45;
        const targetY = wantsBank ? hoop.y - 34 : hoop.y - 10;
        const miss = perfect ? 0 : (Math.random() - 0.5) * Math.max(18, 72 - (career?.upgrades?.focus || 0) * 8);
        const duration = Math.max(0.68, Math.min(0.94, 0.9 - (game.power - 0.64) * 0.16));
        const vx = (targetX + miss - player.x) / duration;
        const vy = (targetY - player.y + 35 - 0.5 * GRAVITY * duration * duration) / duration;
        game.balls.push({
          id: ++game.shotId,
          x: player.x,
          y: player.y - 35,
          vx,
          vy,
          perfect,
          bank: false,
          scored: false,
          touchedRim: false,
          dead: false,
          life: 0,
          speed: Math.hypot(vx, vy)
        });
        game.power = 0;
        game.stuckTimer = 0;
      };
    }

    console.info('Basket vs AI emergency game fix loaded: assets-10');
    return true;
  }

  if (!installEmergencyFix()) {
    const retry = setInterval(() => {
      if (installEmergencyFix()) clearInterval(retry);
    }, 60);
    setTimeout(() => clearInterval(retry), 4000);
  }
})();
