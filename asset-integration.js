(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const VERSION = 'assets-cover-v1';

  function ensureHeadAssets() {
    document.title = '🏀 Basket vs AI — Cover v3';

    const head = document.head;
    const defs = [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `favicon.svg?v=${VERSION}` }],
      ['link', { rel: 'apple-touch-icon', href: `favicon.svg?v=${VERSION}` }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'Basket vs AI — Învinge AI-ul. Construiește-ți legenda.' }],
      ['meta', { property: 'og:description', content: 'Aruncă perfect, urcă în ligă, deblochează upgrade-uri și învinge adversari AI cu personalitate.' }],
      ['meta', { property: 'og:image', content: `https://laurandreea10.github.io/BASKET-VS-AI/og-cover.svg?v=${VERSION}` }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:image', content: `https://laurandreea10.github.io/BASKET-VS-AI/og-cover.svg?v=${VERSION}` }]
    ];

    defs.forEach(([tag, attrs]) => {
      const key = attrs.property ? `${tag}[property="${attrs.property}"]` : attrs.name ? `${tag}[name="${attrs.name}"]` : `${tag}[rel="${attrs.rel}"]`;
      let el = $(key, head);
      if (!el) {
        el = document.createElement(tag);
        head.appendChild(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    });
  }

  function ensureStyles() {
    if ($('#asset-cover-style')) return;
    const style = document.createElement('style');
    style.id = 'asset-cover-style';
    style.textContent = `
      .brand-logo-img{width:44px!important;height:44px!important;object-fit:contain!important;border-radius:12px!important;display:block!important;filter:drop-shadow(0 0 14px rgba(255,122,42,.35))}
      .brand-mark{display:grid!important;place-items:center!important;overflow:visible!important;background:rgba(255,122,42,.08)!important;border:1px solid rgba(255,122,42,.22)!important;border-radius:14px!important}
      .asset-cover-card{position:relative;overflow:hidden;border:1px solid rgba(255,122,42,.25);border-radius:28px;background:linear-gradient(180deg,rgba(18,23,34,.92),rgba(7,10,18,.95));box-shadow:0 24px 90px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.04);margin:20px auto;width:100%;max-width:1040px;padding:18px}
      .asset-cover-card img{display:block;width:100%;height:auto;border-radius:22px;box-shadow:0 18px 70px rgba(0,0,0,.55)}
      .asset-cover-label{position:absolute;left:30px;top:30px;z-index:2;padding:8px 12px;border-radius:999px;background:rgba(7,10,18,.72);border:1px solid rgba(255,210,59,.38);color:#ffd23b;font:900 11px system-ui;letter-spacing:.14em;text-transform:uppercase;backdrop-filter:blur(8px)}
      .asset-identity-card{position:absolute;right:28px;top:28px;z-index:2;width:min(260px,28vw);min-width:190px;border-radius:22px;border:1px solid rgba(255,122,42,.32);background:rgba(8,11,19,.72);padding:18px;backdrop-filter:blur(12px);box-shadow:0 18px 60px rgba(0,0,0,.42)}
      .asset-identity-card h3{margin:0 0 10px;color:rgba(244,247,255,.62);font:900 12px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}
      .asset-identity-main{display:flex;align-items:center;gap:12px}.asset-identity-avatar{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#ffb85c,#ff7a2a 62%,#7a1f00);box-shadow:0 0 0 5px rgba(255,122,42,.08),0 0 24px rgba(255,122,42,.35)}
      .asset-identity-card strong{display:block;color:#fff;font-size:24px;letter-spacing:-.04em}.asset-identity-card strong span{color:#ff7a2a}.asset-identity-card p{margin:3px 0 0;color:rgba(244,247,255,.72)}
      .asset-xp-row{display:flex;justify-content:space-between;margin-top:16px;color:rgba(244,247,255,.66);font-weight:800}.asset-xp-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);overflow:hidden;margin-top:6px}.asset-xp-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4ad9ff,#ffd23b,#ff7a2a)}
      .perfect-shot-guide{opacity:1!important;visibility:visible!important;display:flex!important;bottom:116px!important;z-index:2147482000!important}.perfect-shot-guide .txt{font-size:14px!important;top:-24px!important}.perfect-shot-guide .rail{height:12px!important}.perfect-shot-guide .zone{height:30px!important}
      .hero-art.asset-hero-art{display:block!important}.hero-art.asset-hero-art canvas{display:none!important}.hero-art.asset-hero-art::before{content:'';display:block;aspect-ratio:16/10;background:url('og-cover.svg?v=${VERSION}') center/cover no-repeat;border-radius:24px;border:1px solid rgba(255,122,42,.22);box-shadow:0 22px 70px rgba(0,0,0,.45)}
      @media(max-width:760px){.asset-identity-card{position:relative;right:auto;top:auto;width:auto;margin-top:12px}.asset-cover-label{position:static;display:inline-flex;margin-bottom:12px}.asset-cover-card{padding:12px}}
    `;
    document.head.appendChild(style);
  }

  function integrateLogo() {
    const brandMark = $('.brand-mark');
    if (brandMark && !$('.brand-logo-img', brandMark)) {
      brandMark.innerHTML = `<img class="brand-logo-img" src="logo.svg?v=${VERSION}" alt="Basket vs AI logo">`;
    } else if ($('.brand-logo-img')) {
      $('.brand-logo-img').src = `logo.svg?v=${VERSION}`;
    }
  }

  function integrateHeroCover() {
    const heroArt = $('.hero-art');
    if (heroArt) heroArt.classList.add('asset-hero-art');

    const hero = $('#hero') || $('.hero');
    if (!hero || $('#asset-cover-card')) return;

    const card = document.createElement('section');
    card.id = 'asset-cover-card';
    card.className = 'asset-cover-card';
    card.innerHTML = `
      <div class="asset-cover-label">Cover page · Perfect guide vizibil</div>
      <img src="og-cover.svg?v=${VERSION}" alt="Basket vs AI cover page cu linie PERFECT și identitate completă">
      <aside class="asset-identity-card" aria-label="Identitate jucător">
        <h3>Identitate</h3>
        <div class="asset-identity-main"><div class="asset-identity-avatar">🏀</div><div><strong>Laura <span>#10</span></strong><p>Nivel 1 • Rookie</p></div></div>
        <div class="asset-xp-row"><span>XP</span><b>0 / 100</b></div><div class="asset-xp-bar"><i></i></div>
        <div class="asset-xp-row"><span>Fani</span><b>0</b></div>
      </aside>
    `;
    hero.insertAdjacentElement('afterend', card);
  }

  function improveHeroCopy() {
    const h1 = $('.hero .display');
    if (h1) h1.innerHTML = 'Învinge AI-ul.<br>Construiește-ți legenda<span style="color:#ff7a2a">.</span>';
    const lede = $('.hero .lede');
    if (lede) lede.textContent = 'Aruncă perfect, urcă în ligă, deblochează upgrade-uri și învinge adversari AI cu personalitate.';
  }

  function forcePerfectGuideVisible() {
    const wrap = $('.court-wrap') || $('.arena');
    if (!wrap) return;
    let guide = $('.perfect-shot-guide', wrap);
    if (!guide) {
      guide = document.createElement('div');
      guide.className = 'perfect-shot-guide';
      guide.innerHTML = '<div class="txt">PERFECT</div><div class="rail"></div><div class="zone"></div>';
      wrap.appendChild(guide);
    }
  }

  function init() {
    ensureHeadAssets();
    ensureStyles();
    integrateLogo();
    improveHeroCopy();
    integrateHeroCover();
    forcePerfectGuideVisible();
    console.info('Attached assets integrated:', VERSION);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
