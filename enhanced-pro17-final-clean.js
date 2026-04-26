(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function brand(){
    document.title = '🏀 Basket vs AI — Enhanced Pro 17';
    const em = $('.brand-text em'); if (em) em.textContent = 'Enhanced Pro 17';
    const ft = $('.footer .muted'); if (ft){ ft.textContent = 'v3.2 · Enhanced Pro 17'; ft.classList.add('p17fc-version'); }
  }

  function score(){
    const arena = $('#arena'); if (!arena) return;
    $('#pro17-live-score')?.remove();
    $('#p17fc-score')?.remove();
    const box = document.createElement('div');
    box.id = 'p17fc-score'; box.className = 'p17fc-score';
    box.innerHTML = '<span>Tu <b id="p17fc-you">0</b></span><span class="dash">—</span><span>Rookie Bot <b id="p17fc-ai">0</b></span>';
    arena.prepend(box);
    syncScore();
  }
  function syncScore(){
    const y = $('#sb-you')?.textContent?.trim() || '0';
    const a = $('#sb-ai')?.textContent?.trim() || '0';
    const py = $('#p17fc-you'); if (py) py.textContent = y;
    const pa = $('#p17fc-ai'); if (pa) pa.textContent = a;
  }

  function kpis(){
    const grid = $('.kpi-grid'); if (!grid) return;
    grid.className = 'kpi-grid p17fc-kpis';
    const data = [
      ['Nivel','1'], ['Bani','0'], ['Fani','0'], ['Best','0'],
      ['Perfecte','0'], ['Inel','0'], ['Bank','0'], ['Combo max','0']
    ];
    grid.innerHTML = data.map(([l,v]) => `<div class="kpi"><span>${l}</span><strong>${v}</strong></div>`).join('');
  }

  function comp(){
    const panel = $('.tab-panel[data-panel="comp"]'); if(!panel) return;
    ['#p17fc-tour','#p17fc-boss'].forEach(id => $(id)?.remove());
    const after = $('#daily-list') || panel.querySelector('.daily') || panel.firstElementChild;
    const tour = document.createElement('section'); tour.id='p17fc-tour'; tour.className='p17fc-section';
    tour.innerHTML = '<h3>Turneu</h3><div class="p17fc-grid"><article class="p17fc-card won"><strong>✅ Runda 1 — Rookie Bot</strong><p>Câștigată</p></article><article class="p17fc-card current"><strong>▶ Runda 2 — Sniper AI</strong><p>Curentă</p></article><article class="p17fc-card locked"><strong>🔒 Finală — Legend AI</strong><p>Deblocată după runda 2</p></article></div>';
    after.after(tour);
    const boss = document.createElement('section'); boss.id='p17fc-boss'; boss.className='p17fc-section';
    boss.innerHTML = '<h3>Boss Rush</h3><div class="p17fc-route"><span>Etapa 1: Rookie Bot</span><span>Etapa 2: Sniper AI</span><span>Etapa 3: Bank Boss</span><span>Final Boss: Legend AI</span></div><p>O singură viață.</p><p>Recompensă: +500 bani, +100 fani, badge Boss Slayer.</p>';
    tour.after(boss);
  }

  function leaders(){
    const rows = [['Laura League','12'],['Rookie Bot','10'],['Sniper AI','8'],['Bank Boss','6']];
    const lb = $('#leader-list'); if(lb){ lb.className='p17fc-leader'; lb.innerHTML = rows.slice(0,3).map(([n,p])=>`<li><strong>${n}</strong><span>${p}</span></li>`).join(''); }
    const lg = $('#league-list'); if(lg){ lg.className='p17fc-leader'; lg.innerHTML = rows.map(([n,p])=>`<li><strong>${n}</strong><span>${p}</span></li>`).join(''); }
  }

  function buttons(){
    $$('.ov-cta,.ctrl-row.shoot,.hero-cta,.pro15-final-actions,.pro14-final-actions').forEach(g => g.classList.add('p17fc-actions'));
  }

  function popup(){
    const b = document.createElement('div'); b.className='p17fc-badge';
    b.innerHTML = '<strong>Realizare deblocată!</strong><small>🔥 On Fire<br>Combo x5<br>+50 bani</small>';
    document.body.appendChild(b); setTimeout(()=>b.remove(),3600);
  }
  function watch(){
    const t = $('#toast'); if(!t || t.dataset.p17fc) return; t.dataset.p17fc='1';
    new MutationObserver(()=>{ const txt=t.textContent||''; if(/combo x5|on fire/i.test(txt)) popup(); }).observe(t,{childList:true,subtree:true});
  }

  function loadV3Graphics(){
    if (document.getElementById('bvai-player-court-v3-loader')) return;
    const s = document.createElement('script');
    s.id = 'bvai-player-court-v3-loader';
    s.src = 'enhanced-player-court-v3.js?v=player-court-v3';
    s.defer = true;
    document.body.appendChild(s);
  }

  function run(){ brand(); buttons(); score(); kpis(); comp(); leaders(); watch(); loadV3Graphics(); try{localStorage.setItem('bvai.pro17.finalClean','true')}catch{} }

  document.addEventListener('DOMContentLoaded', () => {
    run();
    const mo = new MutationObserver(syncScore); const y=$('#sb-you'), a=$('#sb-ai'); if(y) mo.observe(y,{childList:true,characterData:true,subtree:true}); if(a) mo.observe(a,{childList:true,characterData:true,subtree:true});
    $$('#btn-hub,.tab').forEach(x => x.addEventListener('click', () => setTimeout(run,100)));
    setInterval(run,3000);
    console.info('Enhanced Pro 17 Final Clean loaded');
  });
})();