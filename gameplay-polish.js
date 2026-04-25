(() => {
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();

  ready(() => {
    const fx = document.createElement('div');
    fx.className = 'arena-fx';
    fx.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fx);

    let lastYou = 0;
    let lastCombo = 0;
    let lastPerfect = 0;
    let lastBank = 0;
    let fxTimer = null;

    const showFx = (text, type = 'combo') => {
      fx.textContent = text;
      fx.className = `arena-fx ${type} show`;
      clearTimeout(fxTimer);
      fxTimer = setTimeout(() => fx.classList.remove('show'), 820);
    };

    const pulse = (selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        node.classList.remove('pulse');
        void node.offsetWidth;
        node.classList.add('pulse');
      });
    };

    const readNum = (id) => Number(document.getElementById(id)?.textContent || 0);

    const watchStats = () => {
      const you = readNum('youScore');
      const combo = readNum('comboStat');
      const perfect = readNum('perfectShotsStat');
      const bank = readNum('bankShotsStat');
      const assistLabel = document.getElementById('assistLabel')?.textContent.toLowerCase() || '';
      const assistTrack = document.querySelector('.assist-track');
      const windChip = document.getElementById('windChip');

      assistTrack?.classList.toggle('perfect-glow', assistLabel.includes('perfect') || assistLabel.includes('perfectă'));
      const windValue = Math.abs(Number((windChip?.textContent.match(/-?\d+/) || [0])[0]));
      windChip?.classList.toggle('wind-hot', windValue >= 25);

      if (you > lastYou) {
        pulse('.score-card:first-child');
        pulse('.match-stats span');
      }
      if (perfect > lastPerfect) showFx('PERFECT', 'perfect');
      if (bank > lastBank) showFx('BANK SHOT', 'bank');
      if (combo >= 3 && combo > lastCombo) showFx(`${combo}x COMBO`, 'combo');

      lastYou = you;
      lastCombo = combo;
      lastPerfect = perfect;
      lastBank = bank;
      requestAnimationFrame(watchStats);
    };
    requestAnimationFrame(watchStats);

    // Gentle scoring balance: reward visible combo milestones once per match via local HUD feedback.
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      if (key === 'basket-vs-ai-enhanced-career') {
        try {
          const parsed = JSON.parse(value);
          if (parsed && parsed.bestCombo >= 5 && !parsed.comboMilestonePaid) {
            parsed.cash = Number(parsed.cash || 0) + 25;
            parsed.comboMilestonePaid = true;
            value = JSON.stringify(parsed);
          }
        } catch {}
      }
      return originalSetItem(key, value);
    };

    // Make the current test link obvious in console for quick QA.
    console.info('Basket vs AI Enhanced Pro gameplay polish loaded: assets-4');
  });
})();
