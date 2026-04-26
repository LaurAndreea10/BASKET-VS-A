(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STATE_KEY = 'bvai.state.v4';
  const AUDIT_KEY = 'bvai.pro15.audit';

  function read(k,f={}){try{return {...f,...(JSON.parse(localStorage.getItem(k))||{})}}catch{return {...f}}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
  function state(){const s=read(STATE_KEY,{});s.settings||={sound:true,vibration:true,effects:'High',lang:'RO'};return s}
  function rank(level){level=Number(level||1);return level>=15?'Legend':level>=10?'MVP':level>=6?'Pro':level>=3?'Street Player':'Rookie'}

  function cleanUI(){
    $$('.ov-cta,.ctrl-row.shoot,.hero-cta,.pro14-final-actions,.pro13-actions,.pro12-final-actions,.pro11-final-actions,.pro10-final-actions,.pro9-final-actions').forEach(el=>{el.classList.add('pro15-actions');el.setAttribute('aria-label','Acțiuni separate')});
    $('.scoreboard')?.classList.add('pro15-scorefix');
    $('#shop-list')?.classList.add('pro15-clean-list');
    $$('#shop-list li').forEach(li=>{const em=li.querySelector('em');const btn=li.querySelector('button');const wrap=li.querySelector('span')||li;if(wrap)wrap.classList.add('pro15-stack');if(em)em.outerHTML=`<p>${em.textContent}</p>`;if(btn)btn.textContent='Cumpără în shop';});
    const ul=$('.hero-stats'); if(ul){const s=state();ul.classList.add('pro15-headerstats');ul.innerHTML=`<li><span class="k">Nivel</span><strong>${s.level||1} · ${rank(s.level)}</strong></li><li><span class="k">XP</span><strong>${s.xp||0} / 100</strong></li><li><span class="k">Fani</span><strong>${s.fans||0}</strong></li><li><span class="k">Best</span><strong>${s.bestScore||0}</strong></li>`;}
  }

  function renderPractice(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel)return;
    let sec=$('#pro15-practice'); if(!sec){sec=document.createElement('section');sec.id='pro15-practice';sec.className='pro15-section';($('#pro14-tour')||panel.lastElementChild)?.before(sec)}
    sec.innerHTML=`<h3>Practice Goals</h3><div class="pro15-grid"><article class="pro15-card"><strong>⬜ 3 perfect shots</strong><p>Recompensă: +25 XP</p></article><article class="pro15-card"><strong>⬜ 2 bank shots</strong><p>Învață ricoșeul din panou.</p></article><article class="pro15-card"><strong>⬜ Combo x3</strong><p>Ține seria de coșuri.</p></article></div>`;
  }
  function renderTournament(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel)return;
    let sec=$('#pro15-tour'); if(!sec){sec=document.createElement('section');sec.id='pro15-tour';sec.className='pro15-section';($('#pro14-tour')||panel.lastElementChild)?.before(sec)}
    sec.innerHTML=`<h3>Turneu</h3><div class="pro15-grid"><article class="pro15-card won"><strong>✅ Runda 1 — Rookie Bot</strong><p>Câștigată</p></article><article class="pro15-card current"><strong>▶ Runda 2 — Sniper AI</strong><p>Curentă</p></article><article class="pro15-card locked"><strong>🔒 Finală — Legend AI</strong><p>Deblocată după runda 2</p></article></div>`;
  }
  function renderBoss(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel)return;
    let sec=$('#pro15-boss'); if(!sec){sec=document.createElement('section');sec.id='pro15-boss';sec.className='pro15-section';($('#pro14-boss')||panel.lastElementChild)?.after(sec)}
    sec.innerHTML=`<h3>Boss Rush</h3><article class="pro15-card boss"><strong>Boss Rush</strong><div class="pro15-route"><span>Etapa 1: Rookie Bot</span><span>Etapa 2: Sniper AI</span><span>Etapa 3: Bank Boss</span><span>Final Boss: Legend AI</span></div><p>O singură viață.</p><p>Recompensă: +500 bani, +100 fani, badge Boss Slayer.</p><div class="pro15-row"><button class="btn primary">Joacă următorul meci</button></div></article>`;
  }
  function renderLeague(){
    const lg=$('#league-list'); if(!lg)return; lg.className='pro15-leader'; lg.innerHTML='<li><strong>Laura League</strong><span class="pts">12</span></li><li><strong>Rookie Bot</strong><span class="pts">10</span></li><li><strong>Sniper AI</strong><span class="pts">8</span></li><li><strong>Bank Boss</strong><span class="pts">6</span></li>';
    const lb=$('#leader-list'); if(lb){lb.className='pro15-leader'; lb.innerHTML='<li><strong>Laura League</strong><span class="pts">12</span></li><li><strong>Rookie Bot</strong><span class="pts">10</span></li><li><strong>Sniper AI</strong><span class="pts">8</span></li>';}
  }

  function confetti(){const c=document.createElement('div');c.className='pro15-confetti';for(let i=0;i<36;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.animationDelay=Math.random()*.4+'s';p.style.background=['#f7c948','#ff6a1a','#6ee7a1','#6aa6ff'][i%4];c.appendChild(p)}document.body.appendChild(c);setTimeout(()=>c.remove(),2200)}
  function showFinal(type='win'){
    let m=$('#pro15-final'); if(!m){m=document.createElement('div');m.id='pro15-final';m.className='pro15-final';document.body.appendChild(m)}
    const lose=type==='lose'; const title=lose?'ÎNFRÂNGERE':'VICTORIE!'; const score=lose?'Tu 22 - 28 Sniper AI':'Tu 34 - 26 Rookie Bot'; const rewards=lose?'+20 XP · +25 bani':'+45 XP · +90 bani · +12 fani'; const moment=lose?'Combo x4':'🔥 Combo x7'; const rating=lose?'B':'A';
    m.hidden=false; m.innerHTML=`<div class="pro15-final-box ${lose?'lose':''}"><h2>${title}</h2><div class="pro15-scoreline">${score}</div><div class="pro15-rating ${rating}">Rating <b>${rating}</b></div><div class="pro15-rewards">${rewards}</div><div class="pro15-moment"><strong>Cel mai bun moment:</strong><br>${moment}</div><div class="pro15-final-actions pro15-actions"><button class="btn primary" id="pro15-again">${lose?'Revanșă':'Joacă din nou'}</button><button class="btn ghost" id="pro15-hub">Hub</button><button class="btn ghost" id="pro15-mode">${lose?'Schimbă modul':'Următorul adversar'}</button></div></div>`;
    if(!lose) confetti();
    $('#pro15-hub').onclick=()=>{m.hidden=true;$('#btn-hub')?.click()};$('#pro15-again').onclick=()=>{m.hidden=true;$('#btn-play')?.click()};$('#pro15-mode').onclick=()=>{m.hidden=true;document.querySelector('.setup')?.scrollIntoView({behavior:'smooth'})};
  }
  function observeFinal(){new MutationObserver(()=>{const b=$('.after-box');if(!b||b.dataset.pro15)return;b.dataset.pro15='1';showFinal(/înfrângere|defeat|lose/i.test(b.textContent||'')?'lose':'win')}).observe(document.body,{childList:true,subtree:true})}
  function badge(){let p=document.createElement('div');p.className='pro15-badge';p.innerHTML='<strong>Realizare deblocată!</strong><small>🔥 On Fire<br>Combo x5<br>+50 bani</small>';document.body.appendChild(p);setTimeout(()=>p.remove(),3500)}
  function observeFx(){const t=$('#toast');if(!t)return;new MutationObserver(()=>{const msg=t.textContent||'';if(/Combo x5|ON FIRE/i.test(msg))badge();if(/VICTORIE|Victory/i.test(msg))confetti()}).observe(t,{childList:true,subtree:true})}

  function updateBrand(){document.title='🏀 Basket vs AI — Enhanced Pro 15';const em=$('.brand-text em');if(em)em.textContent='Enhanced Pro 15';const foot=$('.footer .muted');if(foot){foot.textContent='v3.0 · Enhanced Pro 15';foot.classList.add('pro15-version')}}
  function refresh(){cleanUI();renderPractice();renderTournament();renderBoss();renderLeague();updateBrand();save(AUDIT_KEY,{version:'pro-15',stickyTextFixed:true,practiceRows:true,tournamentRows:true,leagueNoDupes:true,bossRows:true,finalButtons:true,confetti:true,footer:'v3.0'})}
  function bind(){observeFinal();observeFx();$('#btn-hub')?.addEventListener('click',()=>setTimeout(refresh,100));$$('.tab').forEach(x=>x.addEventListener('click',()=>setTimeout(refresh,100)));setInterval(refresh,5000)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{refresh();bind();console.info('Enhanced Pro 15 loaded')}):(()=>{refresh();bind();console.info('Enhanced Pro 15 loaded')})();
})();