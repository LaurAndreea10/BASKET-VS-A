(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STATE_KEY = 'bvai.state.v4';
  const AUDIT_KEY = 'bvai.pro12.audit';

  const COS = [
    ['ball_neon','🏀 Neon Ball','150 bani','Minge neon arcade.'],
    ['trail_fire','🔥 Fire Trail','200 bani','Trail cu flacără.'],
    ['ball_galaxy','🌌 Galaxy Ball','300 bani','Minge cosmică.'],
    ['court_night','🌃 Night Court','400 bani','Teren de noapte.']
  ];

  function read(k,f={}){try{return {...f,...(JSON.parse(localStorage.getItem(k))||{})}}catch{return {...f}}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
  function state(){const s=read(STATE_KEY,{});s.cosmetics||={owned:[],equipped:null};s.settings||={sound:true,vibration:true,effects:'High',lang:'RO'};return s}
  function write(s){save(STATE_KEY,s)}
  function aiName(){const mode=$('input[name="mode"]:checked')?.value||'classic',diff=$('input[name="diff"]:checked')?.value||'normal';if(mode==='bossrush')return'Boss Rush';if(mode==='practice')return'Practice';if(mode==='wind')return'Wind Hacker';if(mode==='bank')return'Bank Boss';if(diff==='pro')return'Legend AI';if(diff==='hard')return'Sniper AI';return'Rookie Bot'}
  function toast(t,k=''){const e=$('#toast');if(!e)return;e.textContent=t;e.className=`toast ${k}`.trim();e.hidden=false;requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>e.classList.remove('show'),1600)}

  function injectBossRush(){const f=$('.chipset');if(!f||$('input[name="mode"][value="bossrush"]'))return;const l=document.createElement('label');l.innerHTML='<input type="radio" name="mode" value="bossrush"><span>Boss Rush</span>';f.appendChild(l);const p=document.createElement('p');p.className='pro9-mode-note';p.textContent='Boss Rush: învinge Rookie Bot, Sniper AI, Bank Boss și Legend AI la rând. O singură viață.';f.appendChild(p)}

  function fixStickyText(){
    $$('.ov-cta,.ctrl-row.shoot,.hero-cta,.pro11-final-actions,.pro10-final-actions,.pro9-final-actions').forEach(el=>el.classList.add('pro12-actions'));
    $('#shop-list')?.classList.add('pro12-clean');
    $$('#shop-list li').forEach(li=>{const em=li.querySelector('em');const btn=li.querySelector('button');if(em)em.style.display='block';if(btn)btn.textContent='Cumpără în shop';});
  }

  function visibleCosmetics(){
    const panel=$('.tab-panel[data-panel="shop"]');if(!panel)return;
    let sec=$('#pro12-cosmetics-visible');
    if(!sec){sec=document.createElement('section');sec.id='pro12-cosmetics-visible';sec.className='pro12-section';panel.appendChild(sec)}
    const s=state();
    sec.innerHTML=`<h3>Cosmetice</h3><div class="pro12-grid">${COS.map(([id,n,p,d])=>{const owned=s.cosmetics.owned.includes(id),eq=s.cosmetics.equipped===id;return`<article class="pro12-card"><strong>${n} — ${p}</strong><small>${d}</small><div class="pro12-row"><span class="pro12-pill ${owned?'pro12-owned':''}">${eq?'Echipat ✅':owned?'Deținut':p}</span><button class="pro12-btn" data-pro12-cos="${id}" ${eq?'disabled':''}>${eq?'Echipat':owned?'Echipează':'Cumpără'}</button></div></article>`}).join('')}</div>`;
    sec.querySelectorAll('[data-pro12-cos]').forEach(b=>b.onclick=()=>buyCos(b.dataset.pro12Cos));
  }
  function buyCos(id){const price={ball_neon:150,trail_fire:200,ball_galaxy:300,court_night:400}[id]||0;const s=state();if(!s.cosmetics.owned.includes(id)){if((s.money||0)<price)return toast('Fonduri insuficiente','bad');s.money=(s.money||0)-price;s.cosmetics.owned.push(id)}s.cosmetics.equipped=id;write(s);toast('Cosmetic echipat','gold');refresh()}

  function visibleSettings(){const panel=$('.tab-panel[data-panel="career"]');if(!panel)return;let sec=$('#pro12-settings-visible');if(!sec){sec=document.createElement('section');sec.id='pro12-settings-visible';sec.className='pro12-section';panel.appendChild(sec)}const s=state();sec.innerHTML=`<h3>Settings</h3><div class="pro12-settings"><div class="pro12-setting"><span>Sunet</span><button class="pro12-btn" data-set="sound">${s.settings.sound?'On':'Off'}</button></div><div class="pro12-setting"><span>Vibrație</span><button class="pro12-btn" data-set="vibration">${s.settings.vibration?'On':'Off'}</button></div><div class="pro12-setting"><span>Efecte</span><button class="pro12-btn" data-set="effects">${s.settings.effects}</button></div><div class="pro12-setting"><span>Limbă</span><button class="pro12-btn" data-set="lang">${s.settings.lang}</button></div></div><button class="pro11-reset" id="pro12-reset">Reset progres</button>`;sec.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>toggle(b.dataset.set));$('#pro12-reset').onclick=()=>{if(confirm('Ești sigur?')){localStorage.removeItem(STATE_KEY);location.reload()}}}
  function toggle(k){const s=state();if(k==='effects')s.settings.effects=s.settings.effects==='High'?'Low':'High';else if(k==='lang')s.settings.lang=s.settings.lang==='RO'?'EN':'RO';else s.settings[k]=!s.settings[k];write(s);refresh()}

  function visiblePractice(){const panel=$('.tab-panel[data-panel="comp"]');if(!panel)return;let sec=$('#pro12-practice-visible');if(!sec){sec=document.createElement('section');sec.id='pro12-practice-visible';sec.className='pro12-section';panel.appendChild(sec)}sec.innerHTML=`<h3>Practice Goals</h3><div class="pro12-grid"><article class="pro12-card"><strong>⬜ 3 perfect shots</strong><small>Recompensă: +25 XP la completarea antrenamentului.</small></article><article class="pro12-card"><strong>⬜ 2 bank shots</strong><small>Învață ricoșeul din panou.</small></article><article class="pro12-card"><strong>⬜ combo x3</strong><small>Ține seria de coșuri.</small></article></div>`}

  function rating(score,combo,perfect){if(score>=30&&combo>=7&&perfect>=5)return'LEGEND';if(score>=30)return'S';if(score>=20)return'A';if(score>=10)return'B';return'C'}
  function showFinal(data){let m=$('#pro12-final');if(!m){m=document.createElement('div');m.id='pro12-final';m.className='pro12-final';document.body.appendChild(m)}m.hidden=false;const r=data.rating;const moment=data.combo>=7?`🔥 Combo x${data.combo}`:data.perfect>=5?'✨ 5 perfect shots':'🏀 Ritm constant';m.innerHTML=`<div class="pro12-final-box"><h2>${data.title}</h2><div class="pro12-scoreline">Tu ${data.you} - ${data.ai} ${data.opp}</div><div class="pro12-rating ${r}">Rating <b>${r}</b></div><div class="pro12-rewards">+${data.xp} XP · +${data.money} bani · +${data.fans} fani</div><div class="pro12-moment"><strong>Cel mai bun moment:</strong><br>${moment}</div><div class="pro12-final-grid"><div class="pro12-stat"><span>Perfecte</span><b>${data.perfect}</b></div><div class="pro12-stat"><span>Inel</span><b>${data.rim}</b></div><div class="pro12-stat"><span>Bank</span><b>${data.bank}</b></div><div class="pro12-stat"><span>Combo max</span><b>${data.combo}</b></div></div><div class="pro12-final-actions"><button class="btn primary" id="pro12-again">Joacă din nou</button><button class="btn ghost" id="pro12-hub">Hub</button><button class="btn ghost" id="pro12-next">Următorul adversar</button></div></div>`;$('#pro12-hub').onclick=()=>{m.hidden=true;$('#btn-hub')?.click()};$('#pro12-again').onclick=()=>{m.hidden=true;$('#btn-play')?.click()};$('#pro12-next').onclick=()=>{m.hidden=true;$('#btn-play')?.click()};if(r==='S'||r==='LEGEND')bigFx(r)}
  function observeFinal(){new MutationObserver(()=>{const b=$('.after-box');if(!b||b.dataset.pro12)return;b.dataset.pro12='1';const score=(b.querySelector('p strong')?.textContent||'0-0').split('-');const vals=$$('.after-stat strong',b).map(x=>x.textContent);const you=parseInt(score[0])||0,ai=parseInt(score[1])||0,perfect=parseInt(vals[1])||0,bank=parseInt(vals[2])||0,combo=parseInt(vals[3])||0;showFinal({title:you>ai?'VICTORIE!':you===ai?'EGAL':'ÎNFRÂNGERE',you,ai,opp:aiName(),xp:45,money:90,fans:12,perfect,rim:parseInt($('#rb-rim')?.textContent)||0,bank,combo,rating:rating(you,combo,perfect)})}).observe(document.body,{childList:true,subtree:true})}

  function badgePopup(name='🔥 On Fire',desc='Combo x5'){let p=document.createElement('div');p.className='pro12-badge';p.innerHTML=`<strong>Realizare deblocată!</strong><small>${name}<br>${desc}<br>+50 bani</small>`;document.body.appendChild(p);setTimeout(()=>p.remove(),3500)}
  function bigFx(t){const w=$('.court-wrap');if(!w)return;let f=$('#pro12-bigfx');if(!f){f=document.createElement('div');f.id='pro12-bigfx';f.className='pro12-bigfx';w.appendChild(f)}f.textContent=t;f.classList.remove('show');void f.offsetWidth;f.classList.add('show');try{if(state().settings.vibration)navigator.vibrate?.([30,30,70])}catch{}}
  function observeFx(){const t=$('#toast');if(!t)return;new MutationObserver(()=>{const msg=t.textContent||'';if(/PERFECT/i.test(msg)){bigFx('PERFECT!');$('.court-wrap')?.classList.add('pro12-perfect');setTimeout(()=>$('.court-wrap')?.classList.remove('pro12-perfect'),300)}if(/Combo x5|ON FIRE/i.test(msg)){bigFx('ON FIRE x5');badgePopup()}if(/Combo x10|LEGEND/i.test(msg))bigFx('LEGEND x10')}).observe(t,{childList:true,subtree:true})}

  function updateFooter(){const foot=$('.footer .muted');if(foot){foot.textContent='v2.7 · Enhanced Pro 12';foot.classList.add('pro12-version')}}
  function refresh(){fixStickyText();visibleCosmetics();visibleSettings();visiblePractice();updateFooter();save(AUDIT_KEY,{version:'pro-12',stickyTextFixed:true,cosmeticsVisible:true,settingsVisible:true,practiceVisible:true,bossRush:true,finalImproved:true,badgePopup:true,effects:true})}
  function bind(){injectBossRush();observeFinal();observeFx();$('#btn-hub')?.addEventListener('click',()=>setTimeout(refresh,100));$$('.tab').forEach(x=>x.addEventListener('click',()=>setTimeout(refresh,100)));setInterval(refresh,5000)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{refresh();bind();console.info('Enhanced Pro 12 loaded')}):(()=>{refresh();bind();console.info('Enhanced Pro 12 loaded')})();
})();