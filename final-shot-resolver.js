(() => {
  const STATE = { installed: false, lastBallIds: new Set() };

  function safeToast(key, fallback) {
    try { showToast(t(key)); }
    catch { try { showToast(fallback); } catch {} }
  }

  function safeTone(kind) {
    try { playTone(kind); } catch {}
  }

  function forceScore(ball, points = 2) {
    if (!game || !ball || ball.dead || ball.scored) return;
    try {
      // Use the native scorer if available so career stats stay consistent.
      scoreBall(ball);
    } catch {
      game.you = Number(game.you || 0) + points;
      if (game.stats) {
        game.stats.combo = Number(game.stats.combo || 0) + 1;
        game.stats.bestCombo = Math.max(Number(game.stats.bestCombo || 0), game.stats.combo);
        if (ball.perfect) game.stats.perfectShots = Number(game.stats.perfectShots || 0) + 1;
        if (ball.bank) game.stats.bankShots = Number(game.stats.bankShots || 0) + 1;
      }
      ball.scored = true;
      ball.dead = true;
      safeToast(ball.perfect ? 'perfectShot' : 'win', '+2');
      safeTone(ball.perfect ? 'perfect' : 'score');
    }
    ball.dead = true;
  }

  function forceMiss(ball) {
    if (!game || !ball || ball.dead || ball.scored) return;
    ball.dead = true;
    ball.notified = true;
    if (game.stats) game.stats.combo = 0;
    safeToast('miss', 'Miss');
    safeTone('miss');
  }

  function forceRim(ball, dx) {
    if (!game || !ball || ball.dead || ball.scored) return;
    if (!ball.touchedRim) {
      ball.touchedRim = true;
      if (game.stats) {
        game.stats.rimHits = Number(game.stats.rimHits || 0) + 1;
        game.stats.combo = 0;
      }
      safeToast('rimHit', 'Rim hit!');
      safeTone('rim');
    }
    ball.dead = true;
  }

  function resolveBall(ball, rect, hoop) {
    if (!ball || ball.dead || ball.scored) return;
    const dx = ball.x - hoop.x;
    const dy = ball.y - hoop.y;
    const age = Number(ball.life || 0);
    const speed = Math.hypot(Number(ball.vx || 0), Number(ball.vy || 0));

    // Any ball inside or directly above the hoop after a short travel time scores.
    if (age > 0.25 && Math.abs(dx) < 58 && dy > -72 && dy < 48 && Number(ball.vy || 0) > -120) {
      forceScore(ball);
      return;
    }

    // Any slow/stationary ball near the hoop is resolved immediately.
    if (age > 0.45 && Math.abs(dx) < 150 && Math.abs(dy) < 150 && speed < 320) {
      if (Math.abs(dx) < 72 && dy > -95 && dy < 62) forceScore(ball);
      else forceRim(ball, dx);
      return;
    }

    // Any ball that has been alive too long near the hoop is never allowed to remain visible.
    if (age > 0.9 && Math.abs(dx) < 190 && Math.abs(dy) < 190) {
      if (Math.abs(dx) < 90 && dy > -120 && dy < 80) forceScore(ball);
      else forceMiss(ball);
      return;
    }

    // Global timeout / out-of-bounds cleanup.
    if (age > 2.2 || ball.x < -80 || ball.x > rect.width + 120 || ball.y > rect.height + 120) {
      forceMiss(ball);
    }
  }

  function resolverTick() {
    try {
      if (typeof game !== 'undefined' && game && Array.isArray(game.balls) && typeof getHoop === 'function') {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas ? canvas.getBoundingClientRect() : { width: 900, height: 620 };
        const hoop = getHoop();
        game.balls.forEach((ball) => resolveBall(ball, rect, hoop));
        game.balls = game.balls.filter((ball) => !ball.dead);
      }
    } catch (error) {
      console.warn('Final shot resolver guard skipped a frame', error);
    }
    requestAnimationFrame(resolverTick);
  }

  function installHardExit() {
    const quit = document.getElementById('quitBtn');
    const home = document.getElementById('homeScreen');
    const gameScreen = document.getElementById('gameScreen');
    if (!quit || quit.dataset.finalResolverExit) return;
    quit.dataset.finalResolverExit = '1';
    quit.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      try { cancelAnimationFrame(animationId); } catch {}
      try { charging = false; } catch {}
      try { keys && keys.clear && keys.clear(); } catch {}
      try { game = null; } catch {}
      if (gameScreen) gameScreen.classList.add('hidden');
      if (home) home.classList.remove('hidden');
      document.body.classList.remove('game-active');
    }, true);
    quit.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  function init() {
    if (STATE.installed) return;
    STATE.installed = true;
    installHardExit();
    requestAnimationFrame(resolverTick);
    setInterval(installHardExit, 1000);
    console.info('Basket vs AI final shot resolver loaded: assets-11');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
