(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STORE = 'bvai.zero.final.v5';
  const PACK_STORE = 'bvai.progression.pack.v1';

  const defaultPack = {
    skillPoints: 1,
    skills: { precision: 0, focus: 0, clutch: 0, style: 0, stamina: 0, bank: 0 },
    ownedCharacterSkins: { rookie: true, street: false, pro: false, champion: false, legend: false },
    equippedCharacterSkin: 'rookie',
    weekly: { wins: 0, perfect: 0, boss: 0 },
    storyStage: 'rookie',
    finalChampionshipUnlocked: false,
    finalChampionDefeated: false
  };

  const aiLadder = [
    { name: 'Rookie Bot', level: 1, icon: '🤖', tag: 'Rookie', desc: 'Ratează des. Bun pentru început.' },
    { name: 'Street Bot', level: 2, icon: '🏙️', tag: 'Street', desc: 'Ritm rapid și scor constant.' },
    { name: 'Sniper AI', level: 3, icon: '🎯', tag: 'Perfect', desc: 'Foarte bun la aruncări perfecte.' },
    { name: 'Bank Boss', level: 5, icon: '🏦', tag: 'Bank', desc: 'Folosește panoul și primește bonus.' },
    { name: 'Wind Hacker', level: 7, icon: '💨', tag: 'Wind', desc: 'Are avantaj în vânt haotic.' },
    { name: 'Clutch Pro', level: 9, icon: '⏱️', tag: 'Clutch', desc: 'Devine periculos în ultimele 10 secunde.' },
    { name: 'Champion AI', level: 12, icon: '🏆', tag: 'Champion', desc: 'Campionul ligii Pro.' },
    { name: 'Legend AI', level: 15, icon: '👑', tag: 'Legend', desc: 'Boss final cu presiune maximă.' }
  ];

  const story = [
    { id: 'rookie', title: 'Rookie', level: 1, desc: 'Începi în sala locală. Scop: învinge Rookie Bot și strânge primele perfecte.' },
    { id: 'pro', title: 'Pro', level: 6, desc: 'Ajungi în liga orașului. Se deblochează Bank Boss și Wind Hacker.' },
    { id: 'champion', title: 'Champion', level: 12, desc: 'Intri în campionat. Champion AI cere consistență și combo-uri.' },
    { id: 'legend', title: 'Legend', level: 15, desc: 'Finala legendară. Legend AI este boss-ul final.' }
  ];

  const skills = [
    { key: 'precision', title: 'Precision', desc: 'Zona PERFECT devine mai iertătoare.', max: 5 },
    { key: 'focus', title: 'Focus', desc: 'Vântul afectează mai puțin mingea.', max: 5 },
    { key: 'clutch', title: 'Clutch', desc: 'Ultimele 10 secunde oferă bonus mai mare.', max: 3 },
    { key: 'style', title: 'Style', desc: 'Mai mulți bani din victorii și combo-uri.', max: 4 },
    { key: 'stamina', title: 'Stamina', desc: 'Bara de putere devine mai controlabilă.', max: 5 },
    { key: 'bank', title: 'Bank IQ', desc: 'Bank shots dau bonus mai mare.', max: 4 }
  ];

  const characterSkins = [
    { key: 'rookie', title: 'Rookie Fit', price: 0, desc: 'Echipamentul de început.', tag: 'Owned' },
    { key: 'street', title: 'Street Player Fit', price: 280, desc: 'Look urban pentru liga de stradă.', tag: 'Lv 3' },
    { key: 'pro', title: 'Pro Fit', price: 420, desc: 'Maiou premium pentru liga Pro.', tag: 'Lv 6' },
    { key: 'champion', title: 'Champion Fit', price: 650, desc: 'Skin de campion cu accent auriu.', tag: 'Lv 12' },
    { key: 'legend', title: 'Legend Fit', price: 900, desc: 'Skin final boss pentru jucător.', tag: 'Lv 15' }
  ];

  function getBase() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; }
  }
  function getPack() {
    try { return Object.assign(structuredClone ? structuredClone(defaultPack) : JSON.parse(JSON.stringify(defaultPack)), JSON.parse(localStorage.getItem(PACK_STORE) || '{}')); }
    catch { return JSON.parse(JSON.stringify(defaultPack)); }
  }
  function savePack(pack) { localStorage.setItem(PACK_STORE, JSON.stringify(pack)); }
  function level() { return Number(getBase().level || 1); }
  function money() { return Number(getBase().money || 150); }
  function rankForLevel(lv) { return lv >= 15 ? 'Legend' : lv >= 12 ? 'Champion' : lv >= 6 ? 'Pro' : 'Rookie'; }
  function card(title, body, tag = '') { return `<div class="card"><strong>${title}</strong><p>${body}</p>${tag ? `<span class="tag">${tag}</span>` : ''}</div>`; }
  function section(title, body) { return `<div class="section progression"><h3>${title}</h3>${body}</div>`; }

  function cssOnce() {
    if ($('#progression-pack-style')) return;
    const style = document.createElement('style');
    style.id = 'progression-pack-style';
    style.textContent = `
      .progression .unlockGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .progression .locked{opacity:.55;filter:saturate(.45)}
      .progression .skillCard{background:#111722;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px}
      .progression .skillCard .row{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:10px}
      .progression .storyPath{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
      .progression .storyStep{background:#111722;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px;position:relative;overflow:hidden}
      .progression .storyStep.active{border-color:#ffd23b;box-shadow:0 0 22px rgba(255,210,59,.18)}
      .progression .skinPreview{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .progression .missionList{display:grid;gap:10px}
      .progression .tinyBar{height:8px;background:#0a0f18;border-radius:99px;margin-top:8px;overflow:hidden}
      .progression .tinyBar i{display:block;height:100%;background:linear-gradient(90deg,#4ad9ff,#ffd23b,#ff7a2a)}
      @media(max-width:760px){.progression .unlockGrid,.progression .storyPath,.progression .skinPreview{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function spendSkill(key) {
    const pack = getPack();
    const spec = skills.find(s => s.key === key);
    if (!spec || pack.skillPoints <= 0 || pack.skills[key] >= spec.max) return;
    pack.skillPoints -= 1;
    pack.skills[key] += 1;
    savePack(pack);
    renderAll(true);
  }

  function equipCharacterSkin(key) {
    const pack = getPack();
    const spec = characterSkins.find(s => s.key === key);
    if (!spec) return;
    const baseLevel = level();
    if (!pack.ownedCharacterSkins[key]) {
      const required = Number((spec.tag || 'Lv 1').replace(/\D/g, '') || 1);
      if (baseLevel < required) return alert('Skin blocat până la nivelul ' + required + '.');
      if (money() < spec.price) return alert('Nu ai destui bani pentru skin.');
      pack.ownedCharacterSkins[key] = true;
    }
    pack.equippedCharacterSkin = key;
    savePack(pack);
    document.documentElement.dataset.characterSkin = key;
    renderAll(true);
  }

  function renderCareer() {
    const panel = $('#career');
    if (!panel || $('#progressionStory')) return;
    const lv = level();
    const pack = getPack();
    const active = rankForLevel(lv).toLowerCase();
    const html =
      section('Poveste carieră: Rookie → Pro → Champion → Legend', `<div class="storyPath" id="progressionStory">${story.map(step => `<div class="storyStep ${active === step.id ? 'active' : ''} ${lv < step.level ? 'locked' : ''}"><strong>${lv >= step.level ? '✅' : '🔒'} ${step.title}</strong><p>${step.desc}</p><span class="tag">Lv ${step.level}+</span></div>`).join('')}</div>`) +
      section('Skill tree jucător', `<p>Skill points disponibile: <b>${pack.skillPoints}</b></p><div class="unlockGrid">${skills.map(s => `<div class="skillCard"><strong>${s.title} Lv ${pack.skills[s.key]}/${s.max}</strong><p>${s.desc}</p><div class="tinyBar"><i style="width:${(pack.skills[s.key] / s.max) * 100}%"></i></div><div class="row"><span class="tag">${pack.skills[s.key] >= s.max ? 'MAX' : 'Skill point'}</span><button data-skill="${s.key}" ${pack.skillPoints <= 0 || pack.skills[s.key] >= s.max ? 'disabled' : ''}>Upgrade</button></div></div>`).join('')}</div>`);
    panel.insertAdjacentHTML('beforeend', html);
  }

  function renderShop() {
    const panel = $('#shop');
    if (!panel || $('#characterSkinShop')) return;
    const lv = level();
    const pack = getPack();
    panel.insertAdjacentHTML('beforeend',
      section('Skin-uri personaj', `<div class="skinPreview" id="characterSkinShop">${characterSkins.map(s => {
        const req = Number((s.tag || 'Lv 1').replace(/\D/g, '') || 1);
        const owned = !!pack.ownedCharacterSkins[s.key];
        const equipped = pack.equippedCharacterSkin === s.key;
        const locked = lv < req;
        return `<div class="card ${locked ? 'locked' : ''}"><strong>${equipped ? '✅ ' : ''}${s.title}</strong><p>${s.desc}</p><div class="row"><span class="tag">${owned ? 'Owned' : locked ? s.tag : s.price + '$'}</span><button data-char-skin="${s.key}" ${locked ? 'disabled' : ''}>${equipped ? 'Echipat' : owned ? 'Echipează' : 'Cumpără'}</button></div></div>`;
      }).join('')}</div>`)
    );
  }

  function renderCompetitions() {
    const panel = $('#comp');
    if (!panel || $('#aiLadder')) return;
    const lv = level();
    const pack = getPack();
    const weekly = pack.weekly || defaultPack.weekly;
    panel.insertAdjacentHTML('beforeend',
      section('Adversari AI deblocați pe niveluri', `<div class="unlockGrid" id="aiLadder">${aiLadder.map(ai => `<div class="card ${lv < ai.level ? 'locked' : ''}"><strong>${ai.icon} ${ai.name}</strong><p>${ai.desc}</p><span class="tag">${lv >= ai.level ? 'Deblocat' : 'Lv ' + ai.level}</span></div>`).join('')}</div>`) +
      section('Misiuni zilnice și săptămânale', `<div class="missionList"><div class="mission">⬜ Daily: marchează 3 PERFECT <span class="tag">+90 bani</span><div class="tinyBar"><i style="width:0%"></i></div></div><div class="mission">⬜ Daily: câștigă un meci cu 10+ diferență <span class="tag">+160 bani</span><div class="tinyBar"><i style="width:0%"></i></div></div><div class="mission">⬜ Weekly: câștigă 10 meciuri <span class="tag">${weekly.wins}/10 · +500 bani</span><div class="tinyBar"><i style="width:${Math.min(100, weekly.wins * 10)}%"></i></div></div><div class="mission">⬜ Weekly: 30 aruncări perfecte <span class="tag">${weekly.perfect}/30 · +700 bani</span><div class="tinyBar"><i style="width:${Math.min(100, weekly.perfect / 30 * 100)}%"></i></div></div></div>`) +
      section('Campionat final / Boss final', `<div class="unlockGrid"><div class="card ${lv < 15 ? 'locked' : ''}"><strong>👑 Legend Championship</strong><p>Finala absolută: Rookie → Pro → Champion → Legend. Se deblochează la nivel 15.</p><span class="tag">${lv >= 15 ? 'Deblocat' : 'Lv 15'}</span></div><div class="card"><strong>🏆 Recompensă finală</strong><p>+1500 bani, +300 fani, Legend Frame și badge Champion Legend.</p><span class="tag">Final Boss</span></div></div>`)
    );
  }

  function renderLeader() {
    const panel = $('#leader');
    if (!panel || $('#storyLeague')) return;
    panel.insertAdjacentHTML('beforeend',
      section('Story League', `<ol class="leader" id="storyLeague"><li><strong>Rookie Division</strong><span>Lv 1+</span></li><li><strong>Pro Division</strong><span>Lv 6+</span></li><li><strong>Champion Division</strong><span>Lv 12+</span></li><li><strong>Legend Finals</strong><span>Lv 15+</span></li></ol>`)
    );
  }

  function renderAll(force = false) {
    cssOnce();
    if (force) $$('.progression').forEach(n => n.remove());
    renderCareer();
    renderShop();
    renderCompetitions();
    renderLeader();
    document.documentElement.dataset.progressionPack = 'v1';
  }

  document.addEventListener('click', e => {
    const skill = e.target.closest('[data-skill]');
    if (skill) { spendSkill(skill.dataset.skill); return; }
    const skin = e.target.closest('[data-char-skin]');
    if (skin) { equipCharacterSkin(skin.dataset.charSkin); return; }
    if (e.target.closest('#openHub,.tab,#endHub')) setTimeout(() => renderAll(false), 80);
  });
  window.addEventListener('load', () => setTimeout(renderAll, 500));
  setTimeout(renderAll, 900);
})();
