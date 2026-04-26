(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  function setOpponent(name){
    const label = $('.sb-side.ai .sb-label') || $('.pro11-ai-name');
    if(label) label.textContent = name;
    try{ localStorage.setItem('currentOpponent', name); }catch{}
  }

  function closeAllBlockingLayers(){
    $$('#hub,#help,#overlay,#pro15-final,#pro15-final-static,#pro15-lose-static,.pro15-final,.pro14-final,.pro13-final,.pro12-final,.after-box').forEach(el => {
      if(!el) return;
      if(el.id === 'overlay') { el.hidden = true; el.classList.add('hidden'); el.style.display = 'none'; }
      else if(el.id === 'hub') { el.hidden = true; el.dataset.open = 'false'; el.classList.add('hidden'); }
      else if(el.tagName === 'DIALOG') { try{ el.close(); }catch{} el.classList.add('hidden'); }
      else { el.hidden = true; el.classList.add('hidden'); el.style.display = 'none'; }
      el.style.pointerEvents = 'none';
    });
  }

  function nextOpponent(){
    const round = Number(localStorage.getItem('tournamentRound') || '1');
    if(round === 1){ setOpponent('Sniper AI'); localStorage.setItem('tournamentRound','2'); }
    else if(round === 2){ setOpponent('Legend AI'); localStorage.setItem('tournamentRound','3'); }
    else { setOpponent('Rookie Bot'); localStorage.setItem('tournamentRound','1'); }
    closeAllBlockingLayers();
    setTimeout(() => {
      const go = $('#ov-go');
      const play = $('#btn-play');
      if(go && !go.offsetParent && play) play.click();
      else (go || play)?.click();
    }, 60);
  }

  function stabilize(){
    let st = $('#pro17-direct-hotfix-css');
    if(!st){ st = document.createElement('style'); st.id = 'pro17-direct-hotfix-css'; document.head.appendChild(st); }
    st.textContent = `
      html,body{overflow-x:hidden!important;scroll-behavior:auto!important;}
      [hidden],.hidden{display:none!important;pointer-events:none!important;}
      #hub[hidden],#hub.hidden,#hub:not([data-open="true"]){display:none!important;pointer-events:none!important;}
      #help:not([open]){display:none!important;pointer-events:none!important;}
      #overlay[hidden],#overlay.hidden{display:none!important;pointer-events:none!important;}
      #pro15-final[hidden],#pro15-final-static[hidden],#pro15-lose-static[hidden]{display:none!important;pointer-events:none!important;}
      #pro15-final,.pro15-final:not([hidden]){z-index:2147483000!important;pointer-events:auto!important;}
      #pro15-final button,.pro15-final:not([hidden]) button{position:relative!important;z-index:2147483001!important;pointer-events:auto!important;}
      #bvai-v3-stage,#bvai-v3-stage canvas,#bvai-v3-graphics{pointer-events:none!important;}
      .court-wrap{transform:none!important;contain:layout paint!important;}
      .hero,.setup,.arena,.footer{transform:translateZ(0);}
      @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}
    `;
  }

  function bind(){
    window.nextOpponent = nextOpponent;
    window.closeEndScreen = closeAllBlockingLayers;
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button,.btn,[role="button"]');
      if(!btn) return;
      const text = (btn.textContent || '').trim().toLowerCase();
      if(text.includes('următorul adversar') || text.includes('urmatorul adversar') || text.includes('joacă următorul meci') || text.includes('joaca urmatorul meci') || btn.dataset.nextOpponent === '1'){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        nextOpponent();
      }
    }, true);
  }

  function markStaticButtons(){
    $$('#pro15-final-static button,.pro15-final button').forEach(btn => {
      const text = (btn.textContent || '').toLowerCase();
      if(text.includes('următorul') || text.includes('urmatorul')){
        btn.type = 'button';
        btn.dataset.nextOpponent = '1';
        btn.style.pointerEvents = 'auto';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    stabilize();
    bind();
    markStaticButtons();
    setTimeout(markStaticButtons, 500);
    setInterval(markStaticButtons, 1500);
    console.info('Pro 17 direct hotfix loaded');
  });
})();