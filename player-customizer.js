(() => {
  const PROFILE_KEY = 'basket-vs-ai-player-profile';
  const defaultProfile = { gender: 'male', avatar: 'dunk', number: 23, name: 'MVP' };
  const safeNumber = (value) => Math.max(0, Math.min(99, Number.parseInt(value, 10) || 0));

  function loadProfile() {
    try { return { ...defaultProfile, ...(JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}) }; }
    catch { return { ...defaultProfile }; }
  }

  function saveProfile(profile) {
    const next = { ...defaultProfile, ...profile, number: safeNumber(profile.number) };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('bvai:player-profile', { detail: next }));
    syncHeaderAvatar(next);
    return next;
  }

  function label(en, ro) {
    const lang = localStorage.getItem('basket-vs-ai-language') || document.documentElement.lang || 'en';
    return String(lang).startsWith('ro') ? ro : en;
  }

  function syncHeaderAvatar(profile = loadProfile()) {
    const avatar = document.querySelector('.player-card .avatar');
    if (!avatar) return;
    avatar.dataset.playerAvatar = profile.avatar;
    avatar.textContent = profile.gender === 'female' ? '⚡' : '🔥';
    const rank = document.getElementById('playerRank');
    if (rank && !rank.dataset.baseRank) rank.dataset.baseRank = rank.textContent;
    const meta = document.getElementById('careerMeta');
    if (meta && !meta.dataset.numberPatched) {
      meta.dataset.numberPatched = '1';
      const observer = new MutationObserver(() => {
        const p = loadProfile();
        if (!meta.textContent.includes(`#${p.number}`)) meta.textContent = `${meta.textContent} · #${p.number}`;
      });
      observer.observe(meta, { childList: true, characterData: true, subtree: true });
    }
    if (meta && !meta.textContent.includes(`#${profile.number}`)) meta.textContent = `${meta.textContent} · #${profile.number}`;
  }

  function render() {
    if (document.getElementById('playerCustomizer')) return;
    const host = document.querySelector('.player-card') || document.getElementById('homeScreen');
    if (!host) return;
    const profile = loadProfile();
    const panel = document.createElement('section');
    panel.id = 'playerCustomizer';
    panel.className = 'player-customizer';
    panel.innerHTML = `
      <div class="pc-head">
        <strong>${label('Player identity', 'Identitate jucător')}</strong>
        <span>${label('Avatar · gender · number', 'Avatar · gen · număr')}</span>
      </div>
      <div class="pc-grid">
        <label><span>${label('Gender', 'Gen')}</span><select id="pcGender"><option value="male">${label('Male', 'Masculin')}</option><option value="female">${label('Female', 'Feminin')}</option></select></label>
        <label><span>${label('Number', 'Număr')}</span><input id="pcNumber" type="number" min="0" max="99" value="${profile.number}" /></label>
      </div>
      <div class="pc-avatars" aria-label="Avatar selection">
        <button type="button" data-avatar="dunk"><span class="pc-avatar-art dunk" data-num="${profile.number}"><i class="ball"></i></span><span>Dunk #23</span></button>
        <button type="button" data-avatar="action"><span class="pc-avatar-art action" data-num="${profile.number}"><i class="ball"></i></span><span>Action</span></button>
        <button type="button" data-avatar="male"><span class="pc-avatar-art male" data-num="${profile.number}"></span><span>${label('Male', 'Masculin')}</span></button>
        <button type="button" data-avatar="female"><span class="pc-avatar-art female" data-num="${profile.number}"></span><span>${label('Female', 'Feminin')}</span></button>
      </div>`;
    host.insertAdjacentElement('afterend', panel);

    const gender = panel.querySelector('#pcGender');
    const number = panel.querySelector('#pcNumber');
    gender.value = profile.gender;
    number.value = profile.number;

    const syncActive = () => {
      const p = loadProfile();
      panel.querySelectorAll('[data-avatar]').forEach((btn) => btn.classList.toggle('active', btn.dataset.avatar === p.avatar));
      panel.querySelectorAll('.pc-avatar-art').forEach((art) => art.dataset.num = p.number);
      number.value = p.number;
      gender.value = p.gender;
    };

    const update = (patch) => {
      const next = saveProfile({ ...loadProfile(), ...patch });
      syncActive();
      showSaved(next);
    };

    let savedTimer = null;
    function showSaved(profile) {
      clearTimeout(savedTimer);
      const head = panel.querySelector('.pc-head span');
      const old = head.textContent;
      head.textContent = `${label('Saved', 'Salvat')} · #${profile.number}`;
      savedTimer = setTimeout(() => head.textContent = old, 1100);
    }

    gender.addEventListener('change', () => {
      const current = loadProfile();
      const nextAvatar = gender.value === 'female' && current.avatar === 'male' ? 'female' : gender.value === 'male' && current.avatar === 'female' ? 'male' : current.avatar;
      update({ gender: gender.value, avatar: nextAvatar });
    });
    number.addEventListener('input', () => update({ number: safeNumber(number.value) }));
    panel.querySelectorAll('[data-avatar]').forEach((btn) => btn.addEventListener('click', () => {
      const avatar = btn.dataset.avatar;
      const inferredGender = avatar === 'female' ? 'female' : avatar === 'male' ? 'male' : gender.value;
      update({ avatar, gender: inferredGender });
    }));

    syncActive();
    syncHeaderAvatar(profile);
  }

  window.BVAI_getPlayerProfile = loadProfile;
  window.BVAI_savePlayerProfile = saveProfile;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
