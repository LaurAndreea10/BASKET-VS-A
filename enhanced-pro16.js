(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function setBranding(){
    document.title = '🏀 Basket vs AI — Enhanced Pro 16';
    const em = $('.brand-text em'); if (em) em.textContent = 'Enhanced Pro 16';
    const ft = $('.footer .muted'); if (ft){ ft.textContent = 'v3.1 · Enhanced Pro 16'; ft.classList.add('pro16-version'); }
  }

  function actionGroup(sel){
    $$(sel).forEach(g => {
      g.classList.add('pro16-actions');
      const btns = $$('button', g);
      g.innerHTML = '';
      btns.forEach((b,i)=>{ if(i) { const sep=document.createElement('span'); sep.className='sep'; sep.textContent=' / '; g.appendChild(sep); } g.appendChild(b); });
    });
  }

  function header(){
    const ul = $('.hero-stats');
    if (!ul) return;
    ul.className = 'hero-stats pro16-headerstats';
    ul.innerHTML = '<li><span class="k">Nivel</span><strong>1 · Rookie</strong></li><li><span class="k">XP</span><strong>0 / 100</strong></li><li><span class="k">Fani</span><strong>0</strong></li><li><span class="k">Best</span><strong>0</strong></li>';
    $('.scoreboard')?.classList.add('pro16-scoreboard');
  }

  function cleanShop(){
    const list = $('#shop-list');
    if (!list) return;
    list.className = 'shop pro16-clean-list';
    $$('#shop-list li').forEach(li => {
      const strong = li.querySelector('strong')?.textContent || '';
      const desc = li.querySelector('p, em, small')?.textContent || '';
      li.innerHTML = `<span><strong>${strong}</strong><p>${desc}</p></span><button disabled>Cumpără în shop</button>`;
    });
    const night = Array.from(document.querySelectorAll('article')).find(x=>x.textContent.includes('Night Court') || x.textContent.includes('Teren de noapte'));
    if(night){ const btn = night.querySelector('button'); if(btn) btn.remove(); const pill = night.querySelector('.pro15-pill,.pro14-pill,.pro13-pill,.pro12-pill'); if(pill) pill.textContent='Echipat ✅'; }
  }

  function compSections(){
    const panel = $('.tab-panel[data-panel="comp"]'); if(!panel) return;
    ['#pro16-practice','#pro16-tour','#pro16-boss'].forEach(id=>$(id)?.remove());
    const daily = $('#daily-list') || panel.querySelector('.daily') || panel.firstElementChild;
    const practice = document.createElement('section'); practice.id='pro16-practice'; practice.className='pro16-section';
    practice.innerHTML = '<h3>Practice Goals</h3><div class="pro16-grid"><article class="pro16-card"><strong>⬜ 3 perfect shots</strong><p>Recompensă: +25 XP</p></article><article class="pro16-card"><strong>⬜ 2 bank shots</strong><p>Învață ricoșeul din panou.</p></article><article class="pro16-card"><strong>⬜ Combo x3</strong><p>Ține seria de coșuri.</p></article></div>';
    daily.after(practice);
    const tour = document.createElement('section'); tour.id='pro16-tour'; tour.className='pro16-section';
    tour.innerHTML = '<h3>Turneu</h3><div class="pro16-grid"><article class="pro16-card won"><strong>✅ Runda 1 — Rookie Bot</strong><p>Câștigată</p></article><article class="pro16-card current"><strong>▶ Runda 2 — Sniper AI</strong><p>Curentă</p></article><article class="pro16-card locked"><strong>🔒 Finală — Legend AI</strong><p>Deblocată după runda 2</p></article></div>';
    practice.after(tour);
    const boss = document.createElement('section'); boss.id='pro16-boss'; boss.className='pro16-section';
    boss.innerHTML = '<h3>Boss Rush</h3><div class="pro16-route"><span>Etapa 1: Rookie Bot</span><span>Etapa 2: Sniper AI</span><span>Etapa 3: Bank Boss</span><span>Final Boss: Legend AI</span></div><p>O singură viață.</p><p>Recompensă: +500 bani, +100 fani, badge Boss Slayer.</p>';
    tour.after(boss);
  }

  function leader(){
    const rows = [['Laura League','12'],['Rookie Bot','10'],['Sniper AI','8'],['Bank Boss','6']];
    const lg = $('#league-list'); if(lg){ lg.className='pro16-leader'; lg.innerHTML = rows.map(([n,p])=>`<li><strong>${n}</strong><span>${p}</span></li>`).join(''); }
    const lb = $('#leader-list'); if(lb){ lb.className='pro16-leader'; lb.innerHTML = rows.slice(0,3).map(([n,p])=>`<li><strong>${n}</strong><span>${p}</span></li>`).join(''); }
  }

  function confetti(){ const c=document.createElement('div'); c.className='pro16-confetti'; for(let i=0;i<36;i++){ const p=document.createElement('i'); p.style.left=Math.random()*100+'%'; p.style.animationDelay=Math.random()*.35+'s'; p.style.background=['#f7c948','#ff6a1a','#6ee7a1','#6aa6ff'][i%4]; c.appendChild(p);} document.body.appendChild(c); setTimeout(()=>c.remove(),2200); }
  function badge(){ const b=document.createElement('div'); b.className='pro16-badge'; b.innerHTML='<strong>Realizare deblocată!</strong><small>🔥 On Fire<br>Combo x5<br>+50 bani</small>'; document.body.appendChild(b); setTimeout(()=>b.remove(),3500); }
  function watchFx(){ const t=$('#toast'); if(!t) return; new MutationObserver(()=>{ const msg=t.textContent||''; if(/combo x5|on fire/i.test(msg)) badge(); if(/victorie|victory/i.test(msg)) confetti(); }).observe(t,{childList:true,subtree:true}); }

  function refresh(){
    setBranding();
    actionGroup('.ov-cta,.ctrl-row.shoot,.hero-cta,.pro15-final-actions,.pro14-final-actions,.pro12-final-actions');
    header(); cleanShop(); compSections(); leader();
    try{localStorage.setItem('bvai.pro16.audit', JSON.stringify({version:'pro-16', at:Date.now()}));}catch{}
  }

  document.addEventListener('DOMContentLoaded', ()=>{ refresh(); watchFx(); $$('#btn-hub,.tab').forEach(x=>x.addEventListener('click',()=>setTimeout(refresh,100))); setInterval(refresh,2500); console.info('Enhanced Pro 16 loaded'); });
})();