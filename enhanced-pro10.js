(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STATE_KEY = 'bvai.state.v4';
  const PROFILE_KEY = 'bvai.player.profile.v1';
  const AUDIT_KEY = 'bvai.pro10.audit';

  const UPG = [
    ['stability','Perfect Assist','Zona aurie este cu 5% mai mare.',100,5],
    ['power','Power Control','Bara de putere se mișcă mai lent.',120,5],
    ['focus','Wind Shield','Vântul te afectează mai puțin.',150,5],
    ['bank','Bank Master','Bank shot-urile dau bonus mai mare.',180,4],
    ['clutch','Clutch Mode','Bonus în ultimele 10 secunde.',220,3]
  ];
  const COS = [
    ['ball_neon','🏀 Neon Ball','Minge neon arcade.',150],
    ['trail_fire','🔥 Fire Trail','Trail cu flacără.',200],
    ['ball_galaxy','🌌 Galaxy Ball','Minge cosmică.',300],
    ['court_night','🌃 Night Court','Teren de noapte.',400]
  ];
  const TOUR = [
    ['rookie','Runda 1','Rookie Bot'],
    ['sniper','Runda 2','Sniper AI'],
    ['legend','Finală','Legend AI']
  ];

  function read(k,f={}){try{return {...f,...(JSON.parse(localStorage.getItem(k))||{})}}catch{return {...f}}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
  function state(){const s=read(STATE_KEY,{});s.upgrades||={};s.cosmetics||={owned:[],equipped:null};s.tournamentProgress??=0;s.pro10||={};if((s.money||0)<100&&!s.pro10Starter){s.money=(s.money||0)+300;s.pro10Starter=true}return s}
  function write(s){save(STATE_KEY,s)}
  function profile(){return read(PROFILE_KEY,{name:'Laura',gender:'girl',number:10})}
  function rank(l){l=Number(l||1);return l>=15?'Legend':l>=10?'MVP':l>=6?'Pro':l>=3?'Street Player':'Rookie'}
  function cost(base,lvl){return Math.round(base*Math.pow(1.5,lvl))}
  function setText(sel,v){const e=$(sel);if(e)e.textContent=v}
  function aiName(){const mode=$('input[name="mode"]:checked')?.value||'classic',diff=$('input[name="diff"]:checked')?.value||'normal';if(mode==='practice')return'Practice';if(mode==='wind')return'Wind Hacker';if(mode==='bank')return'Bank Boss';if(diff==='pro')return'Legend AI';if(diff==='hard')return'Sniper AI';return'Rookie Bot'}
  function toast(t,k=''){const e=$('#toast');if(!e)return;e.textContent=t;e.className=`toast ${k}`.trim();e.hidden=false;requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>e.classList.remove('show'),1600)}

  function injectModes(){const f=$('.chipset');if(!f)return;if(!$('input[name="mode"][value="sudden"]')){const l=document.createElement('label');l.innerHTML='<input type="radio" name="mode" value="sudden"><span>Sudden Death</span>';f.appendChild(l)}if(!$('input[name="mode"][value="practice"]')){const l=document.createElement('label');l.innerHTML='<input type="radio" name="mode" value="practice"><span>Practice</span>';f.appendChild(l)}if(!$('#pro10-mode-note')){const p=document.createElement('p');p.id='pro10-mode-note';p.className='pro9-mode-note';p.textContent='Practice: fără AI și fără timp. Sudden Death: ratezi = game over.';f.appendChild(p)}}
  function updateScoreboard(){const lab=$('.sb-side.ai .sb-label');if(lab){lab.textContent=aiName();lab.classList.add('pro10-ai-name')}const mode=$('input[name="mode"]:checked')?.value||'classic';if(mode==='practice'){setText('#sb-diff','Practice · fără AI');setText('#sb-time','∞')}}
  function fixText(){
    $$('.ov-cta,.ctrl-row.shoot').forEach(el=>{el.style.display='flex';el.style.gap='12px';el.setAttribute('aria-label','Acțiuni separate')});
    $('#shop-list')?.classList.add('pro10-clean');
    $$('#shop-list li').forEach(li=>{const btn=li.querySelector('button');if(btn)btn.textContent='Cumpără în shop';});
  }

  function renderRank(){const panel=$('.tab-panel[data-panel="career"]');if(!panel)return;let sec=$('#pro10-rank');const p=profile(),s=state();if(!sec){sec=document.createElement('section');sec.id='pro10-rank';sec.className='pro10-section pro10-rank';panel.prepend(sec)}sec.innerHTML=`<div class="pro10-avatar">${p.gender==='boy'?'⛹️‍♂️':'⛹️‍♀️'}</div><div><div class="pro10-rank-name">${p.name||'Player'} #${p.number||10}</div><small>Nivel 1-2 Rookie · 3-5 Street Player · 6-9 Pro · 10-14 MVP · 15+ Legend</small><br><span class="pro10-rank-pill">Nivel ${s.level||1} · ${rank(s.level)} · XP ${s.xp||0} / ${$('#xp-need')?.textContent||250}</span></div>`}
  function renderShop(){const panel=$('.tab-panel[data-panel="shop"]');if(!panel)return;let s=state();let sec=$('#pro10-shop');if(!sec){sec=document.createElement('section');sec.id='pro10-shop';sec.className='pro10-section';panel.prepend(sec)}sec.innerHTML=`<h3>Upgrade-uri funcționale</h3><div class="pro10-grid">${UPG.map(([id,n,d,b,max])=>{const lvl=s.upgrades[id]||0,price=cost(b,lvl),owned=lvl>=max;return`<article class="pro10-card"><strong>${n} Lv.${lvl+1}</strong><small>${d}</small><div class="pro10-row"><span class="pro10-pill ${owned?'pro10-owned':''}">${owned?'Deținut ✅':price+' bani'}</span><button class="pro10-btn" data-buy="${id}" ${owned?'disabled':''}>${owned?'MAX':'Cumpără'}</button></div></article>`}).join('')}</div>`;sec.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyUpgrade(b.dataset.buy));
    let cos=$('#pro10-cos');if(!cos){cos=document.createElement('section');cos.id='pro10-cos';cos.className='pro10-section';sec.after(cos)}s=state();cos.innerHTML=`<h3>Cosmetice</h3><div class="pro10-grid">${COS.map(([id,n,d,p])=>{const owned=s.cosmetics.owned.includes(id),eq=s.cosmetics.equipped===id;return`<article class="pro10-card"><strong>${n}</strong><small>${d}</small><div class="pro10-row"><span class="pro10-pill ${owned?'pro10-owned':''}">${eq?'Echipat ✅':owned?'Deținut':p+' bani'}</span><button class="pro10-btn" data-cos="${id}" ${eq?'disabled':''}>${eq?'Echipat':owned?'Echipează':'Cumpără'}</button></div></article>`}).join('')}</div>`;cos.querySelectorAll('[data-cos]').forEach(b=>b.onclick=()=>buyCos(b.dataset.cos));}
  function buyUpgrade(id){const item=UPG.find(x=>x[0]===id);const s=state();if(!item)return;const lvl=s.upgrades[id]||0,price=cost(item[3],lvl);if((s.money||0)<price)return toast('Fonduri insuficiente','bad');s.money-=price;s.upgrades[id]=lvl+1;write(s);toast(`Cumpărat: ${item[1]}`,'gold');refresh()}
  function buyCos(id){const item=COS.find(x=>x[0]===id);if(!item)return;const s=state();if(!s.cosmetics.owned.includes(id)){if((s.money||0)<item[3])return toast('Fonduri insuficiente','bad');s.money-=item[3];s.cosmetics.owned.push(id)}s.cosmetics.equipped=id;write(s);toast(`Cosmetic echipat: ${item[1]}`,'gold');refresh()}

  function renderTournament(){const panel=$('.tab-panel[data-panel="comp"]');if(!panel)return;let sec=$('#pro10-tour');if(!sec){sec=document.createElement('section');sec.id='pro10-tour';sec.className='pro10-section pro10-tour';($('#tour-bracket')||panel.lastElementChild)?.before(sec)}const s=state(),cur=s.tournamentProgress||0;sec.innerHTML=`<h3>Progres turneu</h3><div class="pro10-grid">${TOUR.map((r,i)=>{const cls=i<cur?'won':i===cur?'current':'locked';const icon=i<cur?'✅':i===cur?'▶':'🔒';return`<article class="pro10-card ${cls}"><strong>${icon} ${r[1]}</strong><small>vs ${r[2]}</small><div class="pro10-row"><span class="pro10-pill">${i<cur?'Câștigată':i===cur?'Curentă':'Blocată'}</span></div></article>`}).join('')}</div><small class="muted">Finală câștigată: +300 bani, +50 fani, badge Tournament King.</small>`}
  function resetButton(){const panel=$('.tab-panel[data-panel="career"]');if(!panel||$('#pro10-reset'))return;const b=document.createElement('button');b.id='pro10-reset';b.className='pro10-reset';b.textContent='Reset progres';b.onclick=()=>{if(confirm('Ești sigur?')){localStorage.removeItem(STATE_KEY);toast('Progres resetat','bad');setTimeout(()=>location.reload(),500)}};panel.appendChild(b)}

  function rating(score,combo,perfect){if(score>=30&&combo>=7&&perfect>=5)return'LEGEND';if(score>=30)return'S';if(score>=20)return'A';if(score>=10)return'B';return'C'}
  function showFinal(data){let m=$('#pro10-final');if(!m){m=document.createElement('div');m.id='pro10-final';m.className='pro10-final';document.body.appendChild(m)}m.hidden=false;m.innerHTML=`<div class="pro10-final-box"><h2>${data.title}</h2><div class="pro10-scoreline">Tu ${data.you} - ${data.ai} ${data.opp}</div><div class="pro10-final-grid"><div class="pro10-stat"><span>XP</span><b>+${data.xp}</b></div><div class="pro10-stat"><span>Bani</span><b>+${data.money}</b></div><div class="pro10-stat"><span>Fani</span><b>+${data.fans}</b></div><div class="pro10-stat"><span>Perfecte</span><b>${data.perfect}</b></div><div class="pro10-stat"><span>Inel</span><b>${data.rim}</b></div><div class="pro10-stat"><span>Bank</span><b>${data.bank}</b></div><div class="pro10-stat"><span>Combo max</span><b>${data.combo}</b></div><div class="pro10-stat"><span>Scor</span><b>${data.you}</b></div></div><div class="pro10-rating">Rating <b>${data.rating}</b></div><div class="pro10-final-actions"><button class="btn primary" id="pro10-again">Joacă din nou</button><button class="btn ghost" id="pro10-hub">Deschide hub</button><button class="btn ghost" id="pro10-next">Următorul adversar</button></div></div>`;$('#pro10-hub').onclick=()=>{m.hidden=true;$('#btn-hub')?.click()};$('#pro10-again').onclick=()=>{m.hidden=true;$('#btn-play')?.click()};$('#pro10-next').onclick=()=>{m.hidden=true;nextOpponent();$('#btn-play')?.click()}}
  function nextOpponent(){const s=state();s.tournamentProgress=Math.min(TOUR.length-1,(s.tournamentProgress||0)+1);write(s);refresh()}
  function observeFinal(){new MutationObserver(()=>{const b=$('.after-box');if(!b||b.dataset.pro10)return;b.dataset.pro10='1';const score=(b.querySelector('p strong')?.textContent||'0-0').split('-');const vals=$$('.after-stat strong',b).map(x=>x.textContent);const you=parseInt(score[0])||0,ai=parseInt(score[1])||0,perfect=parseInt(vals[1])||0,bank=parseInt(vals[2])||0,combo=parseInt(vals[3])||0;showFinal({title:you>ai?'VICTORIE!':you===ai?'EGAL':'ÎNFRÂNGERE',you,ai,opp:aiName(),xp:45,money:90,fans:12,perfect,rim:parseInt($('#rb-rim')?.textContent)||0,bank,combo,rating:rating(you,combo,perfect)})}).observe(document.body,{childList:true,subtree:true})}

  function fx(t){const w=$('.court-wrap');if(!w)return;let f=$('#pro10-bigfx');if(!f){f=document.createElement('div');f.id='pro10-bigfx';f.className='pro10-bigfx';w.appendChild(f)}f.textContent=t;f.classList.remove('show');void f.offsetWidth;f.classList.add('show');try{navigator.vibrate?.([30,30,70])}catch{}}
  function observeFx(){const t=$('#toast');if(!t)return;new MutationObserver(()=>{const msg=t.textContent||'';if(/PERFECT/i.test(msg)){fx('PERFECT!');$('.court-wrap')?.classList.add('pro10-perfect');setTimeout(()=>$('.court-wrap')?.classList.remove('pro10-perfect'),300)}if(/Combo x5|ON FIRE/i.test(msg))fx('ON FIRE x5');if(/Combo x10|LEGEND/i.test(msg))fx('LEGEND x10')}).observe(t,{childList:true,subtree:true})}

  function refresh(){const s=state();setText('#kpi-money',Number(s.money||0).toLocaleString('ro-RO'));setText('#hs-xp',Number(s.xp||0).toLocaleString('ro-RO'));renderRank();renderShop();renderTournament();resetButton();fixText();updateScoreboard();const foot=$('.footer .muted');if(foot){foot.textContent='v2.5 · Enhanced Pro 10';foot.classList.add('pro10-version')}save(AUDIT_KEY,{version:'pro-10',final:true,cosmetics:true,practice:true,tournament:true,rating:true,stickyTextFixed:true,effects:true,reset:true})}
  function bind(){injectModes();observeFinal();observeFx();$('#btn-hub')?.addEventListener('click',()=>setTimeout(refresh,100));$$('.tab').forEach(x=>x.addEventListener('click',()=>setTimeout(refresh,100)));$('#btn-play')?.addEventListener('click',()=>setTimeout(updateScoreboard,100));$$('input[name="mode"],input[name="diff"]').forEach(x=>x.addEventListener('change',updateScoreboard));setInterval(refresh,4000)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{refresh();bind();console.info('Enhanced Pro 10 loaded')}):(()=>{refresh();bind();console.info('Enhanced Pro 10 loaded')})();
})();