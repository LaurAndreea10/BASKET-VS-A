(() => {
  const PROFILE_KEY = 'basket-vs-ai-player-profile';
  const readProfile = () => {
    try { return { gender: 'male', avatar: 'dunk', number: 23, ...(JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}) }; }
    catch { return { gender: 'male', avatar: 'dunk', number: 23 }; }
  };

  function ensurePlayer() {
    const gamePanel = document.getElementById('gameScreen');
    const canvas = document.getElementById('gameCanvas');
    if (!gamePanel || !canvas) return null;
    let player = document.getElementById('stablePlayerGirl');
    if (!player) {
      player = document.createElement('div');
      player.id = 'stablePlayerGirl';
      player.className = 'player-girl hidden';
      player.setAttribute('aria-hidden', 'true');
      player.innerHTML = '<i class="player-girl__ball"></i><i class="player-girl__head"></i><i class="player-girl__body"></i><i class="player-girl__arm left"></i><i class="player-girl__arm right"></i><i class="player-girl__leg left"></i><i class="player-girl__leg right"></i><i class="player-girl__shoe left"></i><i class="player-girl__shoe right"></i>';
      canvas.insertAdjacentElement('afterend', player);
    }
    return player;
  }

  function syncPlayer() {
    const player = ensurePlayer();
    const gamePanel = document.getElementById('gameScreen');
    if (!player || !gamePanel) return;
    const profile = readProfile();
    player.classList.toggle('is-female', profile.gender === 'female');
    player.querySelector('.player-girl__body')?.setAttribute('data-number', String(profile.number ?? 23).slice(0, 2));
    player.classList.toggle('hidden', gamePanel.classList.contains('hidden'));
  }

  function startCharge() {
    const player = ensurePlayer();
    if (!player) return;
    player.classList.remove('shooting');
    player.classList.add('charging-shot');
  }

  function stopChargeAndShoot() {
    const player = ensurePlayer();
    if (!player) return;
    if (!player.classList.contains('charging-shot')) return;
    player.classList.remove('charging-shot');
    player.classList.add('shooting');
    clearTimeout(stopChargeAndShoot.timer);
    stopChargeAndShoot.timer = setTimeout(() => player.classList.remove('shooting'), 450);
  }

  function init() {
    syncPlayer();
    const gamePanel = document.getElementById('gameScreen');
    if (gamePanel) new MutationObserver(syncPlayer).observe(gamePanel, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('storage', syncPlayer);
    setInterval(syncPlayer, 800);

    const shootBtn = document.getElementById('shootBtn');
    shootBtn?.addEventListener('pointerdown', startCharge, { passive: true });
    window.addEventListener('pointerup', stopChargeAndShoot, { passive: true });
    window.addEventListener('pointercancel', () => ensurePlayer()?.classList.remove('charging-shot'), { passive: true });

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && !event.repeat) startCharge();
    });
    document.addEventListener('keyup', (event) => {
      if (event.code === 'Space') stopChargeAndShoot();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
