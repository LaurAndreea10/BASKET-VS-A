(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function setBranding(){
    document.title = '🏀 Basket vs AI — Enhanced Pro 17';
    const em=$('.brand-text em'); if(em) em.textContent='Enhanced Pro 17';
    const lede=$('.lede'); if(lede) lede.textContent='Pro 17 adaugă polish de interfață: scoreboard cu spații clare, hub KPI curat, finală blocată, Boss Rush pe rânduri, leaderboard cu separator și popup-uri premium.';
    const ft=$('.footer .muted'); if(ft){ft.textContent='v3.2 · Enhanced Pro 17'; ft.classList.add('pro17-version');}
  }

  function liveScoreline(){
    const board=$('.scoreboard'); if(!board || $('#pro17-live-score')) return;
    const line=document.createElement('div');
    line.id='pro17-live-score';
    line.className='pro17-scoreline-live';
    line.innerHTML='<div class="left"><span>Tu</span><strong id="pro17-you">0</strong></div><div class="vs">— VS —</div><div class="right"><span>Rookie Bot</span><strong id="pro17-ai">0</strong></div>';
    board.parentNode.insertBefore(line, board);
  }

  function syncScores(){
    const y=$('#sb-you')?.textContent?.trim() || '0';
    const a=$('#sb-ai')?.textContent?.trim() || '0';
    if($('#pro17-you')) $('#pro17-you').textContent=y;
    if($('#pro17-ai')) $('#pro17-ai').textContent=a;
  }

  function hubKpis(){
    const grid=$('.kpi-grid'); if(!grid) return;
    grid.classList.add('pro17-kpi-grid');
    const labels=['Nivel','Bani','Fani','Best','Perfecte','Inel','Bank','Combo max'];
    const ids=['kpi-level','kpi-money','kpi-fans','kpi-best','kpi-perfect','kpi-rim','kpi-bank','kpi-combo'];
    grid.innerHTML=labels.map((l,i)=>`<div class="kpi"><span>${l}</span><strong id="${ids[i]}">${document.getElementById(ids[i])?.textContent?.trim() || '0'}</strong></div>`).join('');
  }

  function competitionBlocks(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel) return;
    ['#pro17-tour','#pro17-boss'].forEach(x=>$(x)?.remove());
    const practice=$('#pro16-practice, #pro15fix-practice, #pro15-practice') || $('#daily-list') || panel.firstElementChild;
    const tour=document.createElement('section'); tour.id='pro17-tour'; tour.className='pro17-section';
    tour.innerHTML='<h3>Turneu</h3><div class="pro17-grid"><article class="pro17-card won"><strong>✅ Runda 1 — Rookie Bot</strong><p>Câștigată</p></article><article class="pro17-card current"><strong>▶ Runda 2 — Sniper AI</strong><p>Curentă</p></article><article class="pro17-card locked"><strong>🔒 Finală — Legend AI</strong><p>Deblocată după runda 2</p></article></div>';
    practice.after(tour);
    const boss=document.createElement('section'); boss.id='pro17-boss'; boss.className='pro17-section';
    boss.innerHTML='<h3>Boss Rush</h3><div class="pro17-route"><span>Etapa 1: Rookie Bot</span><span>Etapa 2: Sniper AI</span><span>Etapa 3: Bank Boss</span><span>Final Boss: Legend AI</span></div><p>O singură viață.</p><p>Recompensă: +500 bani, +100 fani, badge Boss Slayer.</p>';
    tour.after(boss);
  }

  function leaders(){
    const rows=[['Laura League','12'],['Rookie Bot','10'],['Sniper AI','8'],['Bank Boss','6']];
    const lb=$('#leader-list'); if(lb){lb.className='pro17-leader'; lb.innerHTML=rows.slice(0,3).map(([n,p])=>`<li><strong>${n}</strong><span>${p}</span></li>`).join('');}
    const lg=$('#league-list'); if(lg){lg.className='pro17-leader'; lg.innerHTML=rows.map(([n,p])=>`<li><strong>${n}</strong><span>${p}</span></li>`).join('');}
  }

  function achievementPopup(){
    const b=document.createElement('div'); b.className='pro17-badge';
    b.innerHTML='<strong>Realizare deblocată!</strong><small>🔥 On Fire<br>Combo x5<br>+50 bani</small>';
    document.body.appendChild(b); setTimeout(()=>b.remove(),3600);
  }

  function premiumFx(){
    const t=$('#toast'); if(!t || t.dataset.pro17) return; t.dataset.pro17='1';
    new MutationObserver(()=>{
      const msg=t.textContent||'';
      if(/combo x5|on fire/i.test(msg)) achievementPopup();
      if(/combo x7|legend|perfect/i.test(msg)) t.classList.add('pro17-combo');
      setTimeout(()=>t.classList.remove('pro17-combo'),900);
    }).observe(t,{childList:true,subtree:true});
    $$('.pro15-rating,.pro14-rating').forEach(x=>x.classList.add('pro17-glow'));
  }

  function refresh(){
    setBranding(); liveScoreline(); syncScores(); hubKpis(); competitionBlocks(); leaders(); premiumFx();
    try{localStorage.setItem('bvai.pro17.audit', JSON.stringify({version:'pro-17', at:Date.now()}));}catch{}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    refresh();
    const mo=new MutationObserver(syncScores); const y=$('#sb-you'), a=$('#sb-ai'); if(y) mo.observe(y,{childList:true,characterData:true,subtree:true}); if(a) mo.observe(a,{childList:true,characterData:true,subtree:true});
    $$('#btn-hub,.tab').forEach(x=>x.addEventListener('click',()=>setTimeout(refresh,100)));
    setInterval(refresh,2500);
    console.info('Enhanced Pro 17 loaded');
  });
})();