(() => {
  'use strict';
  function cleanup(){
    document.title = 'Basket vs AI — Stable v1';
    const badge = document.getElementById('versionBadge');
    if (badge) badge.remove();
    const note = document.querySelector('.note');
    if (note) note.innerHTML = '<b>Basket vs AI — Stable v1</b>';
    document.documentElement.dataset.bvaiVersion = 'stable-v1';
  }
  window.addEventListener('load', cleanup);
  setTimeout(cleanup, 300);
  setTimeout(cleanup, 1200);
})();
