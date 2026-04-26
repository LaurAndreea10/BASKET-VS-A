(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const MODE_LABELS = {
    classic:'Clasic', blitz:'Blitz', moving:'Coș mobil', wind:'Vânt haotic', bank:'Bank lab', sudden:'Sudden Death', practice:'Practice', bossrush:'Boss Rush'
  };
  const DIFF_LABELS = { easy:'Ușor', normal:'Normal', hard:'Greu', pro:'Pro' };

  function selected(name, fallback){
    return $(`input[name="${name}"]:checked`)?.value || localStorage.getItem(`selected_${name}`) || fallback;
  }

  function persistSelection(name){
    $$(`input[name="${name}"]`).forEach(input => {
      if(input.dataset.pro17ModeBound) return;
      input.dataset.pro17ModeBound = '1';
      input.addEventListener('change', () => {
        if(input.checked){
          try{ localStorage.setItem(`selected_${name}`, input.value); }catch{}
          applySelectionsToUi();
        }
      });
    });
  }

  function restoreSelection(name, fallback){
    const saved = localStorage.getItem(`selected_${name}`) || fallback;
    const input = $(`input[name="${name}"][value="${saved}"]`);
    if(input) input.checked = true;
  }

  function applySelectionsToUi(){
    const mode = selected('mode','classic');
    const diff = selected('diff','normal');
    const time = selected('time','60');
    const modeEl = $('#sb-mode'); if(modeEl) modeEl.textContent = MODE_LABELS[mode] || mode;
    const diffEl = $('#sb-diff'); if(diffEl) diffEl.textContent = DIFF_LABELS[diff] || diff;
    const timeEl = $('#sb-time'); if(timeEl && !document.body.dataset.matchRunning) timeEl.textContent = mode === 'blitz' ? '30' : time;
    document.body.dataset.selectedMode = mode;
    document.body.dataset.selectedDiff = diff;
    document.body.dataset.selectedTime = time;
  }

  function forceSelectionsBeforeStart(){
    restoreSelection('mode', localStorage.getItem('selected_mode') || document.body.dataset.selectedMode || 'classic');
    restoreSelection('diff', localStorage.getItem('selected_diff') || document.body.dataset.selectedDiff || 'normal');
    restoreSelection('time', localStorage.getItem('selected_time') || document.body.dataset.selectedTime || '60');
    applySelectionsToUi();
  }

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
      forceSelectionsBeforeStart();
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
    persistSelection('mode');
    persistSelection('diff');
    persistSelection('time');
    restoreSelection('mode','classic');
    restoreSelection('diff','normal');
    restoreSelection('time','60');
    applySelectionsToUi();

    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button,.btn,[role="button"]');
      if(!btn) return;
      const text = (btn.textContent || '').trim().toLowerCase();
      const isStart = btn.id === 'btn-play' || btn.id === 'ov-go' || text.includes('joacă meci') || text === 'start';
      if(isStart){
        forceSelectionsBeforeStart();
        document.body.dataset.matchRunning = '1';
        setTimeout(applySelectionsToUi, 80);
      }
      if(text.includes('următorul adversar') || text.includes('urmatorul adversar') || text.includes('joacă următorul meci') || text.includes('joaca urmatorul meci') || btn.dataset.nextOpponent === '1'){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        nextOpponent();
      }
    }, true);

    document.addEventListener('change', (ev) => {
      const el = ev.target;
      if(el?.matches?.('input[name="mode"],input[name="diff"],input[name="time"]')) applySelectionsToUi();
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