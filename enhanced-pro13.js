(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STATE_KEY = 'bvai.state.v4';
  const AUDIT_KEY = 'bvai.pro13.audit';

  const cosmetics = [
    ['ball_neon','Neon Ball','Minge neon arcade.','150 bani','Cumpără'],
    ['trail_fire','Fire Trail','Trail cu flacără.','200 bani','Cumpără'],
    ['ball_galaxy','Galaxy Ball','Minge cosmică.','300 bani','Echipează'],
    ['court_night','Night Court','Teren de noapte.','Echipat ✅','Echipat']
  ];
  const ranks = [[1,'Rookie'],[3,'Street Player'],[6,'Pro'],[10,'MVP'],[15,'Legend']];

  function read(k,f={}){try{return {...f,...(JSON.parse(localStorage.getItem(k))||{})}}catch{return {...f}}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
  function state(){const s=read(STATE_KEY,{});s.settings||={sound:true,vibration:true,effects:'High',lang:'RO'};return s}
  function rank(level){let out='Rookie';for(const [min,name] of ranks){if((level||1)>=min)out=name}return out}
  function setText(sel,v){const e=$(sel);if(e)e.textContent=v}

  function fixActions(){
    $$('.ov-cta,.ctrl-row.shoot,.hero-cta,.pro12-final-actions,.pro11-final-actions,.pro10-final-actions,.pro9-final-actions').forEach(el=>{el.classList.add('pro13-actions');el.setAttribute('aria-label','Acțiuni separate')});
    $('#shop-list')?.classList.add('pro13-clean');
    $$('#shop-list li').forEach(li=>{const wrap=li.querySelector('span')||li;const em=li.querySelector('em');const btn=li.querySelector('button');if(em)em.style.display='block';if(btn){btn.textContent='Cumpără în shop';btn.style.marginLeft='12px'}if(wrap)wrap.classList.add('pro13-stack')});
    $$('.pro12-card,.pro11-card,.pro10-card').forEach(card=>{card.querySelectorAll('button').forEach(btn=>{if(btn.textContent.trim()==='Echipat'&&card.textContent.includes('Echipat ✅'))btn.textContent='✓'})});
  }

  function renderRank(){
    const panel=$('.tab-panel[data-panel="career"]'); if(!panel)return;
    let sec=$('#pro13-rank'); const s=state();
    if(!sec){sec=document.createElement('section');sec.id='pro13-rank';sec.className='pro13-section pro13-rank';panel.prepend(sec)}
    sec.innerHTML=`<div class="pro13-avatar">⛹️‍♀️</div><div><div class="pro13-rank-name">Nivel ${s.level||1} · ${rank(s.level)}</div><small>Nivel 1-2: Rookie · Nivel 3-5: Street Player · Nivel 6-9: Pro · Nivel 10-14: MVP · Nivel 15+: Legend</small><br><span class="pro13-rank-pill">XP ${s.xp||0} / ${$('#xp-need')?.textContent||100}</span></div>`;
  }

  function renderCosmetics(){
    const panel=$('.tab-panel[data-panel="shop"]'); if(!panel)return;
    let sec=$('#pro13-cosmetics'); if(!sec){sec=document.createElement('section');sec.id='pro13-cosmetics';sec.className='pro13-section';panel.appendChild(sec)}
    sec.innerHTML=`<h3>Cosmetice</h3><div class="pro13-grid">${cosmetics.map(([id,name,desc,price,action])=>`<article class="pro13-card"><strong>${name} — ${price}</strong><small>${desc}</small><div class="pro13-row"><span class="pro13-pill ${price.includes('Echipat')?'pro13-owned':''}">${price}</span><button class="pro13-btn" ${action==='Echipat'?'disabled':''}>${action}</button></div></article>`).join('')}</div>`;
  }

  function renderTournament(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel)return;
    let sec=$('#pro13-tour'); if(!sec){sec=document.createElement('section');sec.id='pro13-tour';sec.className='pro13-section pro13-tour';($('#tour-bracket')||panel.lastElementChild)?.before(sec)}
    sec.innerHTML=`<h3>Turneu</h3><div class="pro13-grid"><article class="pro13-card won"><strong>✅ Runda 1 — Rookie Bot</strong><small>Câștigată</small></article><article class="pro13-card current"><strong>▶ Runda 2 — Sniper AI</strong><small>Curentă</small></article><article class="pro13-card locked"><strong>🔒 Finală — Legend AI</strong><small>Deblocată după runda 2</small></article></div>`;
  }

  function renderPractice(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel)return;
    let sec=$('#pro13-practice'); if(!sec){sec=document.createElement('section');sec.id='pro13-practice';sec.className='pro13-section';($('#pro13-tour')||panel.lastElementChild)?.after(sec)}
    sec.innerHTML=`<h3>Practice Goals</h3><div class="pro13-grid"><article class="pro13-card"><strong>⬜ 3 perfect shots</strong><small>Recompensă: +25 XP</small></article><article class="pro13-card"><strong>⬜ 2 bank shots</strong><small>Învață ricoșeul din panou.</small></article><article class="pro13-card"><strong>⬜ Combo x3</strong><small>Ține seria de coșuri.</small></article></div>`;
  }

  function renderBossRush(){
    const panel=$('.tab-panel[data-panel="comp"]'); if(!panel)return;
    let sec=$('#pro13-boss'); if(!sec){sec=document.createElement('section');sec.id='pro13-boss';sec.className='pro13-section';($('#pro13-practice')||panel.lastElementChild)?.after(sec)}
    sec.innerHTML=`<h3>Boss Rush</h3><article class="pro13-card pro13-boss"><strong>Boss Rush</strong><small class="pro13-route">Rookie Bot → Sniper AI → Bank Boss → Legend AI</small><small>O singură viață. Recompensă: +500 bani, +100 fani, badge Boss Slayer.</small></article>`;
  }

  function renderSettings(){
    const panel=$('.tab-panel[data-panel="career"]'); if(!panel)return;
    let sec=$('#pro13-settings'); if(!sec){sec=document.createElement('section');sec.id='pro13-settings';sec.className='pro13-section';panel.appendChild(sec)}
    const s=state();
    sec.innerHTML=`<h3>Settings</h3><div class="pro13-settings"><div class="pro13-setting"><span>Sunet</span><button class="pro13-switch" data-set="sound">${s.settings.sound?'ON':'OFF'}</button></div><div class="pro13-setting"><span>Vibrație</span><button class="pro13-switch" data-set="vibration">${s.settings.vibration?'ON':'OFF'}</button></div><div class="pro13-setting"><span>Efecte</span><button class="pro13-switch" data-set="effects">${s.settings.effects==='High'?'HIGH':'LOW'}</button></div><div class="pro13-setting"><span>Limbă</span><button class="pro13-switch" data-set="lang">${s.settings.lang||'RO'}</button></div></div><button class="pro11-reset" id="pro13-reset">Reset progres</button>`;
    sec.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>toggle(b.dataset.set));
    $('#pro13-reset').onclick=()=>{if(confirm('Ești sigur?')){localStorage.removeItem(STATE_KEY);location.reload()}};
  }
  function toggle(k){const s=state();if(k==='effects')s.settings.effects=s.settings.effects==='High'?'Low':'High';else if(k==='lang')s.settings.lang=s.settings.lang==='RO'?'EN':'RO';else s.settings[k]=!s.settings[k];save(STATE_KEY,s);refresh()}

  function bigFx(t){const w=$('.court-wrap');if(!w)return;let f=$('#pro13-bigfx');if(!f){f=document.createElement('div');f.id='pro13-bigfx';f.className='pro13-bigfx';w.appendChild(f)}f.textContent=t;f.classList.remove('show');void f.offsetWidth;f.classList.add('show');try{if(state().settings.vibration)navigator.vibrate?.([30,30,70])}catch{}}
  function badge(){let p=document.createElement('div');p.className='pro13-badge';p.innerHTML='<strong>Realizare deblocată!</strong><small>🔥 On Fire<br>Combo x5<br>+50 bani</small>';document.body.appendChild(p);setTimeout(()=>p.remove(),3500)}
  function observeFx(){const t=$('#toast');if(!t)return;new MutationObserver(()=>{const msg=t.textContent||'';if(/PERFECT/i.test(msg)){bigFx('PERFECT!');$('.court-wrap')?.classList.add('pro13-perfect');setTimeout(()=>$('.court-wrap')?.classList.remove('pro13-perfect'),300)}if(/Combo x5|ON FIRE/i.test(msg)){bigFx('ON FIRE x5');badge()}if(/LEGEND|Combo x10/i.test(msg)){bigFx('LEGEND x10')}}).observe(t,{childList:true,subtree:true})}

  function leaderboardTabs(){const panel=$('.tab-panel[data-panel="leader"]');if(!panel||$('#pro13-leader-tabs'))return;const tabs=document.createElement('div');tabs.id='pro13-leader-tabs';tabs.className='pro13-mode-tabs';tabs.innerHTML='<button class="active">Clasic</button><button>Blitz</button><button>Sudden Death</button><button>Boss Rush</button>';panel.insertBefore(tabs,panel.querySelector('#leader-list')||panel.firstChild)}
  function updateBrand(){document.title='🏀 Basket vs AI — Enhanced Pro 13';const em=$('.brand-text em');if(em)em.textContent='Enhanced Pro 13';const foot=$('.footer .muted');if(foot){foot.textContent='v2.8 · Enhanced Pro 13';foot.classList.add('pro13-version')}};

  function refresh(){fixActions();renderRank();renderCosmetics();renderTournament();renderPractice();renderBossRush();renderSettings();leaderboardTabs();updateBrand();save(AUDIT_KEY,{version:'pro-13',stickyTextFixed:true,finalLocked:true,practiceSpaced:true,rank:true,cosmeticsUniform:true,bossRush:true,settingsSwitches:true,effects:true,leaderboardModes:true})}
  function bind(){observeFx();$('#btn-hub')?.addEventListener('click',()=>setTimeout(refresh,100));$$('.tab').forEach(x=>x.addEventListener('click',()=>setTimeout(refresh,100)));setInterval(refresh,5000)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{refresh();bind();console.info('Enhanced Pro 13 loaded')}):(()=>{refresh();bind();console.info('Enhanced Pro 13 loaded')})();
})();