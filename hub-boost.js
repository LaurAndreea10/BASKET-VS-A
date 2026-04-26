(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STORE = 'bvai.zero.final.v5';
  const money = () => {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}').money ?? 150; } catch { return 150; }
  };
  function card(title, text, tag = '') {
    return `<div class="card"><strong>${title}</strong><p>${text}</p>${tag ? `<span class="tag">${tag}</span>` : ''}</div>`;
  }
  function section(title, body) {
    return `<div class="section boosted"><h3>${title}</h3>${body}</div>`;
  }
  function enhanceCareer() {
    const p = $('#career');
    if (!p || p.dataset.boosted === '1') return;
    p.dataset.boosted = '1';
    p.insertAdjacentHTML('beforeend',
      section('Avatar și rang', `<div class="grid">${card('⛹️‍♀️ Laura #10', 'Nivel 1-2: Rookie · 3-5: Street Player · 6-9: Pro · 10-14: MVP · 15+: Legend', 'Rookie')}${card('Identitate', 'Gen: Fată<br>Nume: Laura<br>Număr tricou: 10<br>Se salvează automat și apare pe tricou.', 'Profil')}</div>`) +
      section('Badge-uri', `<div class="grid">${card('🏀 First Bucket','Primul coș marcat.','Locked')}${card('✨ Perfect 5','5 perfecte într-un meci sau progres total.','Locked')}${card('🏦 Bank Artist','10 bank shots.','Locked')}${card('👑 AI Crusher','Câștigă la Pro.','Locked')}${card('🏆 Tournament King','Câștigă turneul.','Locked')}${card('🌟 Legend','Ajungi la nivel 10.','Locked')}</div>`) +
      section('Salvare progres localStorage', `<div class="grid">${card('✓ Progres','Nivel, XP, bani, fani și best score se salvează local.')}${card('✓ Gameplay','Upgrade-uri, skin-uri, realizări și daily progress rămân după refresh.')}${card('✓ Competiții','Turneu, Boss Rush și misiuni zilnice au progres separat.')}${card('✓ Setări','Sunet, vibrație, efecte și limbă pregătite pentru extindere.')}</div>`)
    );
  }
  function enhanceShop() {
    const p = $('#shop');
    if (!p || p.dataset.boosted === '1') return;
    p.dataset.boosted = '1';
    p.insertAdjacentHTML('beforeend',
      section('Mingi', `<div class="grid">${card('Classic Ball','Mingea standard.','Owned')}${card('🏀 Neon Ball','Look arcade luminos.','220$')}${card('🔥 Fire Ball','Perfectă pentru combo-uri.','360$')}${card('🥇 Gold Ball','Skin premium de status.','520$')}${card('🌌 Galaxy Ball','Ediție cosmică Pro.','680$')}</div>`) +
      section('Terenuri', `<div class="grid">${card('Arena','Sala de bază.','Owned')}${card('🏙️ Street Court','Teren urban, contrast puternic.','260$')}${card('🌃 Night Court','Cinematic dark mode.','320$')}${card('Cyber Court','Look futurist pentru update viitor.','420$')}</div>`) +
      section('Trail-uri și rame profil', `<div class="grid">${card('✨ Star Trail','Scântei stelare la aruncări perfecte.','460$')}${card('🔥 Flame Trail','Flacără la combo-uri mari.','300$')}${card('🧊 Ice Trail','Trail rece pentru perfect shots.','300$')}${card('Basic Frame','Rama standard.','Owned')}${card('Pro Frame','Rama portocalie.','250$')}${card('MVP Frame','Rama aurie.','500$')}${card('Legend Frame','Rama final boss.','900$')}</div>`) +
      section('Portofel', `<div class="grid">${card('Bani disponibili', `${money()} bani`, 'Wallet')}${card('Regulă shop','Cumpără sau echipează direct din cardurile funcționale de sus.','Activ')}</div>`)
    );
  }
  function enhanceLeader() {
    const p = $('#leader');
    if (!p || p.dataset.boosted === '1') return;
    p.dataset.boosted = '1';
    p.insertAdjacentHTML('beforeend',
      section('Moduri leaderboard', `<div class="grid">${card('Clasic','Scor total, acuratețe și combo max.','Top local')}${card('Blitz','Timp scurt, scor rapid.','30s')}${card('Sudden Death','Prima ratare încheie jocul.','Hard')}${card('Boss Rush','Lanț de adversari cu o singură viață.','Boss')}</div>`) +
      section('Ghost Best', `<div class="grid">${card('Țintă personală','În meci apare obiectivul tău best local ca referință.')}${card('Laura League','Laura 12 · Rookie Bot 10 · Sniper AI 8 · Bank Boss 6','Ligă')}</div>`)
    );
  }
  function enhanceComp() {
    const p = $('#comp');
    if (!p || p.dataset.boosted === '1') return;
    p.dataset.boosted = '1';
    p.insertAdjacentHTML('beforeend',
      section('Practice Goals', `<div class="grid">${card('⬜ 3 perfect shots','Recompensă: +25 XP','0 / 3')}${card('⬜ 2 bank shots','Învață ricoșeul din panou.','0 / 2')}${card('⬜ Combo x3','Ține seria de coșuri.','0 / 1')}</div>`) +
      section('Implementări premium integrate', `<div class="grid">${card('✓ Tutorial interactiv','Primele aruncări au ghidaj, zonă aurie și bonus perfect.')}${card('✓ Upgrade-uri reale','Stabilitate, Focus, Power Control, Bank Master și Clutch afectează gameplay-ul.')}${card('✓ AI cu personalități','Rookie Bot, Sniper AI, Bank Boss și Legend AI.')}${card('✓ Combo spectaculos','ON FIRE, COMBO x5 și multiplicator pregătite pentru UI.')}${card('✓ Skin-uri vizibile','Mingi, terenuri și trail-uri se pot echipa.')}${card('✓ Boss fight','Boss Rush cu adversari în lanț și recompensă mare.')}${card('✓ Replay / slow motion','Perfect shot are flash și particule.')}${card('✓ Feedback după meci','Victorie/înfrângere cu XP, bani și progres.')}</div>`) +
      section('Boss Rush extins', `<div class="grid">${card('Etapa 1: Rookie Bot','Încălzire, ratează des.','Easy')}${card('Etapa 2: Sniper AI','Foarte bun la perfect shots.','Hard')}${card('Etapa 3: Bank Boss','Bonus la bank shots.','Bank')}${card('Final Boss: Legend AI','Clutch, presiune mare și ritm rapid.','Boss')}${card('Recompensă','+500 bani, +100 fani, badge Boss Slayer.','Final')}</div>`)
    );
  }
  function boost() { enhanceCareer(); enhanceShop(); enhanceLeader(); enhanceComp(); }
  document.addEventListener('click', e => {
    if (e.target.closest('#openHub,.tab')) setTimeout(boost, 50);
  });
  window.addEventListener('load', () => setTimeout(boost, 300));
  setTimeout(boost, 700);
})();
