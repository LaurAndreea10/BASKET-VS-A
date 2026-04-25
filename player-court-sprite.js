(() => {
  const getProfile = () => window.BVAI_getPlayerProfile ? window.BVAI_getPlayerProfile() : { gender: 'male', avatar: 'dunk', number: 23 };

  function ensureSprite() {
    const gamePanel = document.getElementById('gameScreen');
    if (!gamePanel) return null;
    let sprite = document.getElementById('courtPlayerSprite');
    if (!sprite) {
      sprite = document.createElement('div');
      sprite.id = 'courtPlayerSprite';
      sprite.className = 'court-player-sprite';
      sprite.setAttribute('aria-hidden', 'true');
      sprite.innerHTML = '<i class="ball"></i><i class="head"></i><i class="body"></i><i class="arm left"></i><i class="arm right"></i><i class="leg left"></i><i class="leg right"></i>';
      const canvas = document.getElementById('gameCanvas');
      if (canvas) canvas.insertAdjacentElement('afterend', sprite);
      else gamePanel.appendChild(sprite);
    }
    return sprite;
  }

  function syncSprite() {
    const sprite = ensureSprite();
    if (!sprite) return;
    const profile = getProfile();
    sprite.className = `court-player-sprite ${profile.gender === 'female' ? 'female' : 'male'} avatar-${profile.avatar || 'dunk'}`;
    const body = sprite.querySelector('.body');
    if (body) body.dataset.num = String(profile.number ?? 23).padStart(1, '0');
    const gameScreen = document.getElementById('gameScreen');
    sprite.classList.toggle('hidden', !gameScreen || gameScreen.classList.contains('hidden'));
  }

  function init() {
    syncSprite();
    window.addEventListener('bvai:player-profile', syncSprite);
    const gameScreen = document.getElementById('gameScreen');
    if (gameScreen) new MutationObserver(syncSprite).observe(gameScreen, { attributes: true, attributeFilter: ['class'] });
    setInterval(syncSprite, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
