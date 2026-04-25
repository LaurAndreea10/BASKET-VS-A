(() => {
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();

  ready(() => {
    const body = document.body;
    const gameScreen = document.getElementById('gameScreen');
    const shootBtn = document.getElementById('shootBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const canvas = document.getElementById('gameCanvas');
    const toast = document.getElementById('toast');

    const syncGameClass = () => {
      body.classList.toggle('game-active', gameScreen && !gameScreen.classList.contains('hidden'));
    };
    const observer = new MutationObserver(syncGameClass);
    if (gameScreen) observer.observe(gameScreen, { attributes: true, attributeFilter: ['class'] });
    syncGameClass();

    [shootBtn, leftBtn, rightBtn].filter(Boolean).forEach((btn) => {
      const press = () => btn.classList.add('is-pressed');
      const release = () => btn.classList.remove('is-pressed');
      btn.addEventListener('pointerdown', press, { passive: true });
      btn.addEventListener('pointerup', release, { passive: true });
      btn.addEventListener('pointercancel', release, { passive: true });
      btn.addEventListener('pointerleave', release, { passive: true });
      btn.addEventListener('lostpointercapture', release, { passive: true });
    });

    window.addEventListener('pointercancel', () => {
      leftBtn?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      rightBtn?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      shootBtn?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
    }, { passive: true });

    if (canvas) {
      canvas.tabIndex = 0;
      canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));
    }

    if (toast) {
      const classify = () => {
        const text = toast.textContent.toLowerCase();
        toast.classList.remove('toast-perfect', 'toast-bank', 'toast-win', 'toast-miss');
        if (text.includes('perfect') || text.includes('perfectă')) toast.classList.add('toast-perfect');
        if (text.includes('bank')) toast.classList.add('toast-bank');
        if (text.includes('win') || text.includes('victorie')) toast.classList.add('toast-win');
        if (text.includes('miss') || text.includes('ratat')) toast.classList.add('toast-miss');
      };
      new MutationObserver(classify).observe(toast, { childList: true, characterData: true, subtree: true, attributes: true });
    }

    // Heal partially migrated saves from older Enhanced versions.
    try {
      const key = 'basket-vs-ai-enhanced-career';
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      let changed = false;
      const defaults = {
        perfectShots: 0,
        rimHits: 0,
        bankShots: 0,
        bestCombo: 0,
        upgrades: { focus: 0, power: 0, clutch: 0, wind: 0, bank: 0, recovery: 0 },
        league: { tier: 1, points: 0, games: 0 },
        tournament: { wins: 0, round: 1, trophy: false },
        leaderboard: []
      };
      Object.entries(defaults).forEach(([k, v]) => {
        if (saved[k] === undefined) { saved[k] = v; changed = true; }
        else if (typeof v === 'object' && !Array.isArray(v)) {
          Object.entries(v).forEach(([sub, subValue]) => {
            if (saved[k][sub] === undefined) { saved[k][sub] = subValue; changed = true; }
          });
        }
      });
      if (changed) localStorage.setItem(key, JSON.stringify(saved));
    } catch {}
  });
})();
