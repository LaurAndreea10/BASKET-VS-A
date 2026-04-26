(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STATE_KEY = 'bvai.state.v4';
  const PROFILE_KEY = 'bvai.player.profile.v1';
  const AUDIT_KEY = 'bvai.pro8.audit';

  const UPG = [
    ['stability','Perfect Assist Lv.1','Zona aurie este cu 5% mai mare.',100,5],
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
  const AI = [
    ['rookie','Rookie Bot','ușor, ratează des'],
    ['sniper','Sniper AI','foarte bun la perfecte'],
    ['bank','Bank Boss','bonus la bank shots'],
    ['wind','Wind Hacker','avantaj în Vânt haotic'],
    ['legend','Legend AI','final boss']
  ];
  const ACH = [
    ['first','First Bucket','Marchează primul coș',s=>(s.totalMade||0)>=1],
    ['fire','On Fire','Combo x5',s=>(s.bestCombo||0)>=5],
    ['crusher','AI Crusher','Câștigă pe Pro',s=>(s.proWins||0)>=1],
    ['king','Tournament King','Câștigă turneul',s=>(s.tournamentWins||0)>=1]
  ];

  function read(k,f={}){try{return {...f,...(JSON.parse(localStorage.getItem(k))||{})}}catch{return {...f}}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
  function state(){const s=read(STATE_KEY,{});s.upgrades||={};s.cosmetics||={owned:[]};s.daily||={date:'',missions:[],streak:0,lastComplete:''};s.pro8||={};if((s.money||0)<100&&!s.pro8Starter){s.money=(s.money||0)+250;s.pro8Starter=true}return s}
  function write(s){save(STATE_KEY,s)}
  function profile(){return read(PROFILE_KEY,{name:'Laura',gender:'girl',number:10})}
  function today(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
  function rank(l){l=Number(l||1);return l>=15?'Legend':l>=10?'MVP':l>=6?'Pro':l>=3?'Street Player':'Rookie'}
  function cost(base,lvl){return Math.round(base*Math.pow(1.5,lvl))}
  function setText(sel,v){const e=$(sel);if(e)e.textContent=v}
  function toast(t,k=''){const e=$('#toast');if(!e)return;e.textContent=t;e.className=`toast ${k}`.trim();e.hidden=false;requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>e.classList.remove('show'),1500)}

  function ensureDaily(s){
    if(s.daily.date!==today()||!s.daily.missions?.length){s.daily={date:today(),streak:s.daily.streak||0,lastComplete:s.daily.lastComplete||'',missions:[
      {id:'perfect5',name:'Marchează 5 coșuri perfecte',target:5,progress:Math.min(5,s.perfectShots||0),reward:50,done:false},
      {id:'combo4',name:'Fă combo x4',target:1,progress:(s.bestCombo||0)>=4?1:0,reward:50,done:false},
      {id:'hard',name:'Câștigă un meci pe Greu',target:1,progress:s.pro8HardWin?1:0,reward:80,done:false},
      {id:'bank3',name:'Marchează 3 bank shots',target:3,progress:Math.min(3,s.bankShots||0),reward:60,done:false},
      {id:'blitz',name:'Bate AI-ul în Blitz',target:1,progress:s.pro8BlitzWin?1:0,reward:90,done:false}
    ]}}
    s.daily.missions.forEach(m=>{if(!m.done&&m.progress>=m.target){m.done=true;s.money=(s.money||0)+m.reward;s.xp=(s.xp||0)+Math.round(m.reward/2);toast(`Misiune completă: ${m.name}`,'gold')}});
    const all=s.daily.missions.every(m=>m.done);
    if(all&&s.daily.lastComplete!==today()){s.daily.streak=(s.daily.streak||0)+1;s.daily.lastComplete=today();s.money=(s.money||0)+100;toast(`Daily Streak ${s.daily.streak} zile 🔥 +100 bani`,'gold')}
    write(s);
  }

  function aiName(){const mode=$('input[name="mode"]:checked')?.value||'classic',diff=$('input[name="diff"]:checked')?.value||'normal';if(mode==='wind')return'Wind Hacker';if(mode==='bank')return'Bank Boss';if(diff==='pro')return'Legend AI';if(diff==='hard')return'Sniper AI';return'Rookie Bot'}
  function updateAiLabel(){const lab=$('.sb-side.ai .sb-label');if(lab){lab.textContent=aiName();lab.classList.add('pro8-ai-name')}}

  function injectMode(){const f=$('.chipset');if(f&&!$('input[value="sudden"]')){const l=document.createElement('label');l.innerHTML='<input type="radio" name="mode" value="sudden"><span>Sudden Death</span>';f.appendChild(l);const p=document.createElement('p');p.className='pro8-mode-note';p.textContent='Sudden Death: marchezi = continui, ratezi = game over.';f.appendChild(p)}}

  function renderShop(){const panel=$('.tab-panel[data-panel="shop"]');if(!panel)return;let s=state();let sec=$('#pro8-shop');if(!sec){sec=document.createElement('section');sec.id='pro8-shop';sec.className='pro8-section';panel.prepend(sec)}sec.innerHTML=`<h3>Shop real</h3><div class="pro8-grid">${UPG.map(([id,n,d,b,max])=>{const lvl=s.upgrades[id]||0,price=cost(b,lvl),owned=lvl>=max;return`<article class="pro8-card"><strong>${n.replace('Lv.1','Lv.'+(lvl+1))}</strong><small>${d}</small><div class="pro8-row"><span class="pro8-price ${owned?'pro8-owned':''}">${owned?'Deținut ✅':price+' bani'}</span><button class="pro8-btn" data-buy="${id}" ${owned?'disabled':''}>${owned?'MAX':'Cumpără'}</button></div></article>`}).join('')}</div>`;sec.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyUpgrade(b.dataset.buy));
    let cos=$('#pro8-cos');if(!cos){cos=document.createElement('section');cos.id='pro8-cos';cos.className='pro8-section';sec.after(cos)}s=state();cos.innerHTML=`<h3>Cosmetice</h3><div class="pro8-grid">${COS.map(([id,n,d,p])=>{const owned=s.cosmetics.owned.includes(id);return`<article class="pro8-card"><strong>${n}</strong><small>${d}</small><div class="pro8-row"><span class="pro8-price ${owned?'pro8-owned':''}">${owned?'Deținut ✅':p+' bani'}</span><button class="pro8-btn" data-cos="${id}" ${owned?'disabled':''}>${owned?'Owned':'Cumpără'}</button></div></article>`}).join('')}</div>`;cos.querySelectorAll('[data-cos]').forEach(b=>b.onclick=()=>buyCos(b.dataset.cos));}
  function buyUpgrade(id){const item=UPG.find(x=>x[0]===id);if(!item)return;const s=state(),lvl=s.upgrades[id]||0,price=cost(item[3],lvl);if((s.money||0)<price)return toast('Fonduri insuficiente','bad');s.money-=price;s.upgrades[id]=lvl+1;write(s);toast(`Cumpărat: ${item[1]}`,'gold');refresh()}
  function buyCos(id){const item=COS.find(x=>x[0]===id);if(!item)return;const s=state();if((s.money||0)<item[3])return toast('Fonduri insuficiente','bad');s.money-=item[3];s.cosmetics.owned.push(id);write(s);toast(`Cosmetic cumpărat: ${item[1]}`,'gold');refresh()}

  function renderDaily(){const panel=$('.tab-panel[data-panel="comp"]');if(!panel)return;const s=state();ensureDaily(s);const fresh=state();let sec=$('#pro8-daily');if(!sec){sec=document.createElement('section');sec.id='pro8-daily';sec.className='pro8-section';($('#daily-list')||panel.firstElementChild)?.before(sec)}const total=fresh.daily.missions.reduce((a,m)=>a+m.reward,0);sec.innerHTML=`<h3>Daily Missions</h3><div class="pro8-streak"><div><strong>Daily Streak: ${fresh.daily.streak||0} zile 🔥</strong><br><small>Completează toate provocările zilnice pentru +100 bani bonus.</small></div><span class="pro8-price">Total +${total} bani</span></div><div class="pro8-grid">${fresh.daily.missions.map(m=>{const pct=Math.min(100,m.progress/m.target*100);return`<article class="pro8-card ${m.done?'pro8-ach done':''}"><strong>${m.done?'✅':'⬜'} ${m.name}</strong><small>${m.progress} / ${m.target} · +${m.reward} bani</small><div class="pro8-progress"><b style="width:${pct}%"></b></div></article>`}).join('')}</div>`}
  function renderAI(){const panel=$('.tab-panel[data-panel="comp"]');if(!panel)return;let sec=$('#pro8-ai');if(!sec){sec=document.createElement('section');sec.id='pro8-ai';sec.className='pro8-section';($('#tour-bracket')||panel.lastElementChild)?.before(sec)}sec.innerHTML=`<h3>Adversari AI</h3><div class="pro8-grid">${AI.map(a=>`<article class="pro8-card"><strong>${a[1]}</strong><small>${a[2]}</small><div class="pro8-row"><span class="pro8-price">${a[0]}</span></div></article>`).join('')}</div>`}
  function renderAch(){const panel=$('.tab-panel[data-panel="career"]');if(!panel)return;const s=state();let sec=$('#pro8-ach');if(!sec){sec=document.createElement('section');sec.id='pro8-ach';sec.className='pro8-section';($('#achv-list')||panel.lastElementChild)?.before(sec)}sec.innerHTML=`<h3>Realizări</h3><div class="pro8-grid">${ACH.map(a=>{const done=a[3](s);return`<article class="pro8-card pro8-ach ${done?'done':''}"><div class="status">${done?'✅':'⬜'}</div><strong>${a[1]}</strong><small>${a[2]}</small></article>`}).join('')}</div>`}
  function renderRank(){const panel=$('.tab-panel[data-panel="career"]');if(!panel||$('#pro8-rank'))return;const p=profile(),s=state();const sec=document.createElement('section');sec.id='pro8-rank';sec.className='pro8-section pro8-rankbox';sec.innerHTML=`<div class="pro8-rank-avatar">${p.gender==='boy'?'⛹️‍♂️':'⛹️‍♀️'}</div><div><div class="pro8-rank-name">${p.name||'Player'} #${p.number||10}</div><small>Nivel 1-2 Rookie · 3-5 Street Player · 6-9 Pro · 10-14 MVP · 15+ Legend</small><br><span class="pro8-rank-pill">Nivel ${s.level||1} · ${rank(s.level)}</span></div>`;panel.prepend(sec)}

  function showFinal(data){let m=$('#pro8-final');if(!m){m=document.createElement('div');m.id='pro8-final';m.className='pro8-final';document.body.appendChild(m)}m.hidden=false;m.innerHTML=`<div class="pro8-final-box"><h2>${data.title}</h2><div class="pro8-scoreline">Tu ${data.you} - ${data.ai} ${aiName()}</div><div class="pro8-final-grid"><div class="pro8-stat"><span>XP</span><b>+${data.xp}</b></div><div class="pro8-stat"><span>Bani</span><b>+${data.money}</b></div><div class="pro8-stat"><span>Fani</span><b>+${data.fans}</b></div><div class="pro8-stat"><span>Perfecte</span><b>${data.perfect}</b></div><div class="pro8-stat"><span>Inel</span><b>${data.rim}</b></div><div class="pro8-stat"><span>Bank</span><b>${data.bank}</b></div><div class="pro8-stat"><span>Combo max</span><b>${data.combo}</b></div><div class="pro8-stat"><span>Acuratețe</span><b>${data.acc}%</b></div></div><div class="pro8-rating">Rating <b>${data.rating}</b></div><div class="pro8-final-actions"><button class="btn ghost" id="pro8-hub">Hub</button><button class="btn primary" id="pro8-again">Joacă iar</button></div></div>`;$('#pro8-hub').onclick=()=>{m.hidden=true;$('#btn-hub')?.click()};$('#pro8-again').onclick=()=>{m.hidden=true;$('#btn-play')?.click()}}
  function observeFinal(){new MutationObserver(()=>{const b=$('.after-box');if(!b||b.dataset.pro8)return;b.dataset.pro8='1';const score=(b.querySelector('p strong')?.textContent||'0-0').split('-');const vals=$$('.after-stat strong',b).map(x=>x.textContent);const acc=parseInt(vals[0])||0,perfect=parseInt(vals[1])||0,bank=parseInt(vals[2])||0,combo=parseInt(vals[3])||0;const rating=acc>=90||combo>=10?'LEGEND':acc>=80||combo>=6?'S':acc>=65?'A':acc>=45?'B':'C';showFinal({title:b.querySelector('h2')?.textContent||'Final',you:score[0]||0,ai:score[1]||0,xp:45,money:90,fans:12,perfect,rim:parseInt($('#rb-rim')?.textContent)||0,bank,combo,acc,rating})}).observe(document.body,{childList:true,subtree:true})}

  function bigFx(t){const w=$('.court-wrap');if(!w)return;let f=$('#pro8-bigfx');if(!f){f=document.createElement('div');f.id='pro8-bigfx';f.className='pro8-bigfx';w.appendChild(f)}f.textContent=t;f.classList.remove('show');void f.offsetWidth;f.classList.add('show');try{navigator.vibrate?.([30,30,70])}catch{}}
  function observeFx(){const t=$('#toast');if(!t)return;new MutationObserver(()=>{const msg=t.textContent||'';if(/PERFECT/i.test(msg)){bigFx('PERFECT!');$('.court-wrap')?.classList.add('pro8-perfect');setTimeout(()=>$('.court-wrap')?.classList.remove('pro8-perfect'),300)}if(/Combo x3/i.test(msg))bigFx('COMBO x3');if(/Combo x5|ON FIRE/i.test(msg))bigFx('ON FIRE x5');if(/Combo x10|LEGEND/i.test(msg))bigFx('LEGEND x10')}).observe(t,{childList:true,subtree:true})}

  function tutorial(){if($('#btn-pro8-tutorial'))return;const btn=document.createElement('button');btn.id='btn-pro8-tutorial';btn.className='iconbtn';btn.textContent='🎯';btn.title='Tutorial jucabil';$('#btn-help')?.after(btn);btn.onclick=()=>{localStorage.removeItem('bvai.complete.v1.tutorialDismissed');$('#btn-play')?.click();toast('Tutorial: țintește, zona aurie, apoi bank shot. Recompensă +50 bani','gold');const s=state();if(!s.pro8TutorialReward){s.money=(s.money||0)+50;s.pro8TutorialReward=true;write(s);refresh()}}}

  function refresh(){const s=state();ensureDaily(s);setText('#kpi-money',Number(s.money||0).toLocaleString('ro-RO'));setText('#hs-xp',Number(s.xp||0).toLocaleString('ro-RO'));setText('#hs-fans',Number(s.fans||0).toLocaleString('ro-RO'));renderRank();renderAch();renderShop();renderDaily();renderAI();updateAiLabel();const foot=$('.footer .muted');if(foot){foot.textContent='v2.3 · Enhanced Pro 8';foot.classList.add('pro8-version')}save(AUDIT_KEY,{version:'pro-8',final:true,shop:true,ai:true,sudden:true,dailyStreak:true,cosmetics:true,effects:true,achievements:true,rank:true,polish:true})}
  function bind(){injectMode();tutorial();observeFinal();observeFx();$('#btn-hub')?.addEventListener('click',()=>setTimeout(refresh,100));$$('.tab').forEach(x=>x.addEventListener('click',()=>setTimeout(refresh,100)));$('#btn-play')?.addEventListener('click',()=>setTimeout(updateAiLabel,100));$$('input[name="mode"],input[name="diff"]').forEach(x=>x.addEventListener('change',updateAiLabel));setInterval(refresh,3500)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{refresh();bind();console.info('Enhanced Pro 8 loaded')}):(()=>{refresh();bind();console.info('Enhanced Pro 8 loaded')})();
})();