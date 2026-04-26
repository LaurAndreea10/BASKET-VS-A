(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STATE_KEY = 'bvai.state.v4';
  const AUDIT_KEY = 'bvai.pro14.audit';

  function read(k,f={}){try{return {...f,...(JSON.parse(localStorage.getItem(k))||{})}}catch{return {...f}}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
  function state(){const s=read(STATE_KEY,{});s.settings||={sound:true,vibration:true,effects:'High',lang:'RO'};return s}
  function rank(level){level=Number(level||1);return level>=15?'Legend':level>=10?'MVP':level>=6?'Pro':level>=3?'Street Player':'Rookie'}

  function cleanActions(){
    $$('.ov-cta,.ctrl-row.shoot,.hero-cta,.pro12-final-actions,.pro13-actions,.pro11-final-actions,.pro10-final-actions,.pro9-final-actions').forEach(el=>{el.classList.add('pro14-actions');el.setAttribute('aria-label','Acțiuni separate')});
    $('#shop-list')?.classList.add('pro14-clean');
    $$('#shop-list li').forEach(li=>{const em=li.querySelector('em');const btn=li.querySelector('button');if(em)em.style.display='block';if(btn)btn.textContent='Cumpără în shop';});
    $$('.pro13-card,.pro12-card').forEach(card=>{const btn=card.querySelector('button');if(btn&&card.textContent.includes('Echipat ✅'))btn.textContent='✓'});
  }

  function headerStats(){
    const ul=$('.hero-stats'); if(!ul)return; const s=state(); ul.classList.add('pro14-headerstats');
    ul.innerHTML=`<li><span class="k">Nivel</span><strong class="rankline">${s.level||1} · ${rank(s.level)}</strong></li><li><span class="k">XP</span><strong>${s.xp||0} / 100</strong></li><li><span class="k">Fani</span><strong>${s.fans||0}</strong></li><li><span class="k">Best</span><strong>${s.bestScore||0}</strong></li>`;
  }

  function renderTournament(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel)return;
    let sec=$('#pro14-tour'); if(!sec){sec=document.createElement('section');sec.id='pro14-tour';sec.className='pro14-section';($('#tour-bracket')||panel.lastElementChild)?.before(sec)}
    sec.innerHTML=`<h3>Turneu</h3><div class="pro14-grid"><article class="pro14-card won"><strong>✅ Runda 1 — Rookie Bot</strong><small>Câștigată</small></article><article class="pro14-card current"><strong>▶ Runda 2 — Sniper AI</strong><small>Curentă</small></article><article class="pro14-card locked"><strong>🔒 Finală — Legend AI</strong><small>Deblocată după runda 2</small></article></div>`;
  }

  function renderPractice(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel)return;
    let sec=$('#pro14-practice'); if(!sec){sec=document.createElement('section');sec.id='pro14-practice';sec.className='pro14-section';($('#pro14-tour')||panel.lastElementChild)?.after(sec)}
    sec.innerHTML=`<h3>Practice Goals</h3><div class="pro14-grid"><article class="pro14-card"><strong>⬜ 3 perfect shots</strong><small>Recompensă: +25 XP</small></article><article class="pro14-card"><strong>⬜ 2 bank shots</strong><small>Învață ricoșeul din panou.</small></article><article class="pro14-card"><strong>⬜ Combo x3</strong><small>Ține seria de coșuri.</small></article></div>`;
  }

  function renderBossRush(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel)return;
    let sec=$('#pro14-boss'); if(!sec){sec=document.createElement('section');sec.id='pro14-boss';sec.className='pro14-section';($('#pro14-practice')||panel.lastElementChild)?.after(sec)}
    sec.innerHTML=`<h3>Boss Rush</h3><article class="pro14-card boss"><strong>Boss Rush</strong><div class="pro14-route"><span>Etapa 1: Rookie Bot</span><span>Etapa 2: Sniper AI</span><span>Etapa 3: Bank Boss</span><span>Final Boss: Legend AI</span></div><small>O singură viață. Recompensă: +500 bani, +100 fani, badge Boss Slayer.</small></article>`;
  }

  function renderLeaderboard(){
    const panel=$('.tab-panel[data-panel="leader"]'); if(!panel)return;
    let tabs=$('#pro14-leader-tabs'); if(!tabs){tabs=document.createElement('div');tabs.id='pro14-leader-tabs';tabs.className='pro14-mode-tabs';tabs.innerHTML='<button class="active">Clasic</button><button>Blitz</button><button>Sudden Death</button><button>Boss Rush</button>';panel.insertBefore(tabs,panel.querySelector('#leader-list')||panel.firstChild)}
    const ol=$('#leader-list'); if(ol){ol.className='pro14-leader';ol.innerHTML='<li><strong>Laura League</strong><span class="pts">12</span></li><li><strong>Rookie Bot</strong><span class="pts">10</span></li><li><strong>Sniper AI</strong><span class="pts">8</span></li>'}
  }

  function renderSettings(){
    const panel=$('.tab-panel[data-panel="career"]'); if(!panel)return; const s=state();
    let sec=$('#pro14-settings'); if(!sec){sec=document.createElement('section');sec.id='pro14-settings';sec.className='pro14-section';panel.appendChild(sec)}
    sec.innerHTML=`<h3>Settings</h3><div class="pro13-settings"><div class="pro13-setting"><span>Sunet</span><div class="pro14-switch-group"><button class="pro14-switch ${s.settings.sound?'':'off'}" data-set="sound">${s.settings.sound?'ON':'OFF'}</button></div></div><div class="pro13-setting"><span>Vibrație</span><div class="pro14-switch-group"><button class="pro14-switch ${s.settings.vibration?'':'off'}" data-set="vibration">${s.settings.vibration?'ON':'OFF'}</button></div></div><div class="pro13-setting"><span>Efecte</span><div class="pro14-switch-group"><button class="pro14-switch ${s.settings.effects==='Low'?'off':''}" data-set="effects">LOW</button><button class="pro14-switch ${s.settings.effects==='High'?'':'off'}" data-set="effects">HIGH</button></div></div><div class="pro13-setting"><span>Limbă</span><div class="pro14-switch-group"><button class="pro14-switch ${s.settings.lang==='RO'?'':'off'}" data-set="lang-ro">RO</button><button class="pro14-switch ${s.settings.lang==='EN'?'':'off'}" data-set="lang-en">EN</button></div></div></div><button class="pro11-reset" id="pro14-reset">Reset progres</button>`;
    sec.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>toggle(b.dataset.set));
    $('#pro14-reset').onclick=()=>{if(confirm('Ești sigur?')){localStorage.removeItem(STATE_KEY);location.reload()}};
  }
  function toggle(k){const s=state();if(k==='effects')s.settings.effects=s.settings.effects==='High'?'Low':'High';else if(k==='lang-ro')s.settings.lang='RO';else if(k==='lang-en')s.settings.lang='EN';else s.settings[k]=!s.settings[k];save(STATE_KEY,s);refresh()}

  function showFinal(type='win'){
    let m=$('#pro14-final'); if(!m){m=document.createElement('div');m.id='pro14-final';m.className='pro14-final';document.body.appendChild(m)}
    const lose=type==='lose'; const title=lose?'ÎNFRÂNGERE':'VICTORIE!'; const score=lose?'Tu 22 - 28 Sniper AI':'Tu 34 - 26 Rookie Bot'; const rewards=lose?'+20 XP · +25 bani':'+45 XP · +90 bani · +12 fani'; const moment=lose?'Combo x4':'🔥 Combo x7'; const rating=lose?'B':'A';
    m.hidden=false; m.innerHTML=`<div class="pro14-final-box ${lose?'lose':''}"><h2>${title}</h2><div class="pro14-scoreline">${score}</div><div class="pro14-rating ${rating}">Rating <b>${rating}</b></div><div class="pro14-rewards">${rewards}</div><div class="pro14-moment"><strong>Cel mai bun moment:</strong><br>${moment}</div><div class="pro14-final-actions pro14-actions"><button class="btn primary" id="pro14-again">${lose?'Revanșă':'Joacă din nou'}</button><button class="btn ghost" id="pro14-hub">Hub</button><button class="btn ghost" id="pro14-mode">${lose?'Schimbă modul':'Următorul adversar'}</button></div></div>`;
    $('#pro14-hub').onclick=()=>{m.hidden=true;$('#btn-hub')?.click()};$('#pro14-again').onclick=()=>{m.hidden=true;$('#btn-play')?.click()};$('#pro14-mode').onclick=()=>{m.hidden=true;document.querySelector('.setup')?.scrollIntoView({behavior:'smooth'})};
  }
  function observeFinal(){new MutationObserver(()=>{const b=$('.after-box');if(!b||b.dataset.pro14)return;b.dataset.pro14='1';const text=b.textContent||'';showFinal(/înfrângere|defeat|lose/i.test(text)?'lose':'win')}).observe(document.body,{childList:true,subtree:true})}

  function bigFx(t){const w=$('.court-wrap');if(!w)return;let f=$('#pro14-bigfx');if(!f){f=document.createElement('div');f.id='pro14-bigfx';f.className='pro14-bigfx';w.appendChild(f)}f.textContent=t;f.classList.remove('show');void f.offsetWidth;f.classList.add('show');try{if(state().settings.vibration)navigator.vibrate?.([30,30,70])}catch{}}
  function badge(){let p=document.createElement('div');p.className='pro14-badge';p.innerHTML='<strong>Realizare deblocată!</strong><small>🔥 On Fire<br>Combo x5<br>+50 bani</small>';document.body.appendChild(p);setTimeout(()=>p.remove(),3500)}
  function observeFx(){const t=$('#toast');if(!t)return;new MutationObserver(()=>{const msg=t.textContent||'';if(/PERFECT/i.test(msg))bigFx('PERFECT!');if(/Combo x5|ON FIRE/i.test(msg)){bigFx('ON FIRE x5');badge()}if(/LEGEND|Combo x10/i.test(msg))bigFx('LEGEND x10')}).observe(t,{childList:true,subtree:true})}

  function updateBrand(){document.title='🏀 Basket vs AI — Enhanced Pro 14';const em=$('.brand-text em');if(em)em.textContent='Enhanced Pro 14';const foot=$('.footer .muted');if(foot){foot.textContent='v2.9 · Enhanced Pro 14';foot.classList.add('pro14-version')}};
  function refresh(){cleanActions();headerStats();renderTournament();renderPractice();renderBossRush();renderLeaderboard();renderSettings();updateBrand();save(AUDIT_KEY,{version:'pro-14',stickyTextFixed:true,tournamentSpaced:true,practiceCards:true,bossPremium:true,defeatFinal:true,ratingEffects:true,leaderboardClean:true,settingsToggles:true,headerStats:true})}
  function bind(){observeFinal();observeFx();$('#btn-hub')?.addEventListener('click',()=>setTimeout(refresh,100));$$('.tab').forEach(x=>x.addEventListener('click',()=>setTimeout(refresh,100)));setInterval(refresh,5000)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{refresh();bind();console.info('Enhanced Pro 14 loaded')}):(()=>{refresh();bind();console.info('Enhanced Pro 14 loaded')})();
})();