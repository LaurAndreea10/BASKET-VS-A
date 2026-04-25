(() => {
  const LANG_KEY = 'basket-vs-ai-language';
  const tr = {
    en: {
      howToPlay: 'How to play', reset: 'Reset', eyebrow: 'Career arcade basketball', heroTitle: 'Beat the AI. Build your legend.', heroCopy: 'A faster, cleaner version of Basket vs AI with polished visuals, responsive controls, career rewards, and a clearer portfolio-ready structure.', playMatch: '▶ Play match', career: '📊 Career', mode: 'Mode', difficulty: 'Difficulty', time: 'Time', classic: 'Classic', blitz: 'Blitz', moving: 'Moving hoop', chaos: 'Chaos wind', easy: 'Easy', normal: 'Normal', hard: 'Hard', pro: 'Pro', you: 'You', shotHint: 'Hold shoot, aim, then release.', power: 'Power', shoot: 'SHOOT', exitMatch: 'Exit match', careerDashboard: 'Career dashboard', close: 'Close', level: 'Level', cash: 'Cash', fans: 'Fans', bestScore: 'Best score', upgrades: 'Upgrades', achievements: 'Achievements', helpDesktop: '<strong>Desktop:</strong> hold Space or the SHOOT button to charge power.', helpAim: 'Use A/D or arrow keys to aim before releasing.', helpMobile: '<strong>Mobile:</strong> hold SHOOT and use the left/right buttons.', helpRewards: 'Wins give XP, cash, and fans. Spend cash on upgrades.'
    },
    ro: {
      howToPlay: 'Cum se joacă', reset: 'Resetare', eyebrow: 'Baschet arcade cu mod carieră', heroTitle: 'Învinge AI-ul. Construiește-ți legenda.', heroCopy: 'O versiune mai rapidă și mai curată pentru Basket vs AI, cu design modern, controale responsive, recompense de carieră și structură potrivită pentru portofoliu.', playMatch: '▶ Joacă meci', career: '📊 Carieră', mode: 'Mod', difficulty: 'Dificultate', time: 'Timp', classic: 'Clasic', blitz: 'Blitz', moving: 'Coș mobil', chaos: 'Vânt haotic', easy: 'Ușor', normal: 'Normal', hard: 'Greu', pro: 'Pro', you: 'Tu', shotHint: 'Ține apăsat pe aruncare, țintește, apoi eliberează.', power: 'Putere', shoot: 'ARUNCĂ', exitMatch: 'Ieși din meci', careerDashboard: 'Panou carieră', close: 'Închide', level: 'Nivel', cash: 'Bani', fans: 'Fani', bestScore: 'Cel mai bun scor', upgrades: 'Îmbunătățiri', achievements: 'Realizări', helpDesktop: '<strong>Desktop:</strong> ține apăsat Space sau butonul ARUNCĂ pentru a încărca puterea.', helpAim: 'Folosește A/D sau săgețile pentru a ținti înainte să eliberezi.', helpMobile: '<strong>Mobil:</strong> ține apăsat ARUNCĂ și folosește butoanele stânga/dreapta.', helpRewards: 'Victoriile oferă XP, bani și fani. Cheltuie banii pe îmbunătățiri.'
    }
  };

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (tr[lang] && tr[lang][key]) node.innerHTML = tr[lang][key];
    });
    const toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.textContent = lang === 'en' ? 'RO' : 'EN';
      toggle.setAttribute('aria-label', lang === 'en' ? 'Schimbă limba în română' : 'Change language to English');
    }
    const title = lang === 'ro' ? '🏀 Basket vs AI — Carieră îmbunătățită' : '🏀 Basket vs AI — Enhanced Career';
    document.title = title;
  }

  function init() {
    setLang(getLang());
    const toggle = document.getElementById('langToggle');
    if (!toggle) return;
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const next = getLang() === 'en' ? 'ro' : 'en';
      setLang(next);
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = next === 'ro' ? 'Limba română activată' : 'English enabled';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1800);
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
