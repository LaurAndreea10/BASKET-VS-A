(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const cache = 'pro-15-fix';

  function setBranding() {
    document.title = '🏀 Basket vs AI — Enhanced Pro 15';
    $('.brand-text em') && ($('.brand-text em').textContent = 'Enhanced Pro 15');
    const footer = $('.footer .muted');
    if (footer) footer.textContent = 'v3.0 · Enhanced Pro 15';
  }

  function visibleSep(label) {
    const s = document.createElement('span');
    s.className = 'pro15fix-sep';
    s.textContent = label || ' · ';
    s.setAttribute('aria-hidden', 'true');
    return s;
  }

  function separateActions(sel) {
    $$(sel).forEach(group => {
      group.classList.add('pro15fix-actions');
      const buttons = $$('button', group);
      [...group.childNodes].forEach(n => {
        if (n.classList && n.classList.contains('pro15fix-sep')) n.remove();
      });
      buttons.forEach((btn, i) => {
        if (i > 0 && btn.previousSibling?.className !== 'pro15fix-sep') {
          group.insertBefore(visibleSep(' · '), btn);
        }
      });
    });
  }

  function cleanShop() {
    const shop = $('#shop-list');
    if (!shop) return;
    shop.classList.add('pro15fix-list');
    $$('#shop-list li').forEach(li => {
      const textWrap = li.querySelector('span') || li.firstElementChild || li;
      textWrap.classList.add('pro15fix-stack');
      const em = li.querySelector('em');
      if (em) {
        const p = document.createElement('p');
        p.textContent = em.textContent.trim().replace(/\.$/, '') + '.';
        em.replaceWith(p);
      }
      const btn = li.querySelector('button');
      if (btn) btn.textContent = 'Cumpără în shop';
    });
  }

  function renderPractice() {
    const host = $('.tab-panel[data-panel="comp"]');
    if (!host) return;
    let sec = $('#pro15fix-practice');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'pro15fix-practice';
      sec.className = 'pro15fix-section';
      const old = $('#pro15-practice, #pro14-practice, #pro13-practice');
      (old || host.querySelector('#daily-list') || host.firstElementChild).after(sec);
    }
    sec.innerHTML = `
      <h3>Practice Goals</h3>
      <div class="pro15fix-grid">
        <article><strong>⬜ 3 perfect shots</strong><p>Recompensă: +25 XP</p></article>
        <article><strong>⬜ 2 bank shots</strong><p>Învață ricoșeul din panou.</p></article>
        <article><strong>⬜ Combo x3</strong><p>Ține seria de coșuri.</p></article>
      </div>`;
  }

  function renderTournament() {
    const host = $('.tab-panel[data-panel="comp"]');
    if (!host) return;
    let sec = $('#pro15fix-tour');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'pro15fix-tour';
      sec.className = 'pro15fix-section';
      const old = $('#pro15-tour, #pro14-tour, #pro13-tour, #tour-bracket');
      (old || host.lastElementChild).after(sec);
    }
    sec.innerHTML = `
      <h3>Turneu</h3>
      <div class="pro15fix-grid">
        <article class="won"><strong>✅ Runda 1 — Rookie Bot</strong><p>Câștigată</p></article>
        <article class="current"><strong>▶ Runda 2 — Sniper AI</strong><p>Curentă</p></article>
        <article class="locked"><strong>🔒 Finală — Legend AI</strong><p>Deblocată după runda 2</p></article>
      </div>`;
  }

  function renderLeague() {
    const rows = [
      ['Laura League', '12'],
      ['Rookie Bot', '10'],
      ['Sniper AI', '8'],
      ['Bank Boss', '6']
    ];
    const lg = $('#league-list');
    if (lg) {
      lg.className = 'pro15fix-leader';
      lg.innerHTML = rows.map(([name, pts]) => `<li><strong>${name}</strong><span>${pts}</span></li>`).join('');
    }
    const lb = $('#leader-list');
    if (lb) {
      lb.className = 'pro15fix-leader';
      lb.innerHTML = rows.slice(0, 3).map(([name, pts]) => `<li><strong>${name}</strong><span>${pts}</span></li>`).join('');
    }
  }

  function renderBossRush() {
    const host = $('.tab-panel[data-panel="comp"]');
    if (!host) return;
    let sec = $('#pro15fix-boss');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'pro15fix-boss';
      sec.className = 'pro15fix-section boss';
      const old = $('#pro15-boss, #pro14-boss, #pro13-boss');
      (old || host.lastElementChild).after(sec);
    }
    sec.innerHTML = `
      <h3>Boss Rush</h3>
      <div class="pro15fix-route">
        <span>Etapa 1: Rookie Bot</span>
        <span>Etapa 2: Sniper AI</span>
        <span>Etapa 3: Bank Boss</span>
        <span>Final Boss: Legend AI</span>
      </div>
      <p>O singură viață.</p>
      <p>Recompensă: +500 bani, +100 fani, badge Boss Slayer.</p>`;
  }

  function headerSpacing() {
    const stats = $('.hero-stats');
    if (stats) {
      stats.classList.add('pro15fix-header');
      stats.innerHTML = `
        <li><span class="k">Nivel</span><strong>1 · Rookie</strong></li>
        <li><span class="k">XP</span><strong>0 / 100</strong></li>
        <li><span class="k">Fani</span><strong>0</strong></li>
        <li><span class="k">Best</span><strong>0</strong></li>`;
    }
    $('.scoreboard')?.classList.add('pro15fix-scoreboard');
  }

  function cleanCosmetics() {
    $$('.pro15-card, .pro14-card, .pro13-card, .pro12-card').forEach(card => {
      if (card.textContent.includes('Night Court') || card.textContent.includes('Teren de noapte')) {
        const btn = card.querySelector('button');
        if (btn) btn.remove();
        const pill = card.querySelector('.pro15-pill, .pro14-pill, .pro13-pill, .pro12-pill');
        if (pill) pill.textContent = 'Echipat ✅';
      }
    });
  }

  function finalButtons() {
    separateActions('.pro15-final-actions, .pro14-final-actions, .pro12-final-actions');
  }

  function refresh() {
    setBranding();
    separateActions('.ov-cta, .ctrl-row.shoot, .hero-cta');
    finalButtons();
    cleanShop();
    renderPractice();
    renderTournament();
    renderLeague();
    renderBossRush();
    headerSpacing();
    cleanCosmetics();
    try { localStorage.setItem('bvai.pro15.fix.audit', JSON.stringify({version: cache, at: Date.now()})); } catch {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    refresh();
    $$('#btn-hub, .tab').forEach(el => el.addEventListener('click', () => setTimeout(refresh, 80)));
    setInterval(refresh, 1500);
    console.info('Enhanced Pro 15 fix loaded');
  });
})();