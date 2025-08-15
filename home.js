(function() {
  const thaiWeekdays = ['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'];
  const phoneticWeekdays = ['wan aa-thít','wan jan','wan ang-khaan','wan phút','wan phá-rʉ́-hàt','wan sùk','wan sǎo'];
  try {
    const now = new Date();
    const day = now.getDay();
    const month = now.getMonth();

    const thaiEl = document.getElementById('weekday-thai');
    const phonEl = document.getElementById('weekday-phonetic');
    if (thaiEl && phonEl) {
      const dayColorPhonetics = ['sǐi dɛɛŋ','sǐi lɯ̌aŋ','sǐi chom-phuu','sǐi khǐaw','sǐi sôm','sǐi fáa','sǐi mûaŋ'];
      thaiEl.textContent = thaiWeekdays[day];
      phonEl.textContent = phoneticWeekdays[day] + ' (' + dayColorPhonetics[day] + ')';
      const dayColors = ['#e74c3c','#f1c40f','#e91e63','#2ecc71','#e67e22','#3498db','#8e44ad'];
      thaiEl.style.color = dayColors[day];
      phonEl.style.color = dayColors[day];
    }

    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const phoneticMonths = ['má-gà-raa-khom','gum-phaa-pan','mii-naa-khom','mee-sǎa-yon','phrɯ́t-sà-phaa-khom','mí-thù-naa-yon','gà-rá-gà-daa-khom','sǐŋ-hǎa-khom','gan-yaa-yon','dtù-laa-khom','phrɯ́t-sà-jì-gaa-yon','than-waa-khom'];
    const monthThaiEl = document.getElementById('month-thai');
    const monthPhonEl = document.getElementById('month-phonetic');
    if (monthThaiEl && monthPhonEl) {
      monthThaiEl.textContent = thaiMonths[month];
      monthPhonEl.textContent = phoneticMonths[month];
    }
  } catch (e) {}

  // Catalog registry
  const quizzes = [
    { id: 'consonants', title: 'Consonant Quiz', emoji: '🔤', href: 'consonant-quiz.html',
      description: 'All 44 consonants with tones', tags: ['Alphabet'], difficulty: 'Beginner' },
    { id: 'vowels', title: 'Vowel Quiz', emoji: '🔤', href: 'vowel-quiz.html',
      description: '32 vowels with patterns', tags: ['Alphabet'], difficulty: 'Beginner' },
    { id: 'colors', title: 'Color Quiz', emoji: '🎨', href: 'color-quiz.html',
      description: 'Base colors + modifiers', tags: ['Vocabulary'], difficulty: 'Beginner' },
    { id: 'numbers', title: 'Numbers Quiz', emoji: '🔢', href: 'numbers-quiz.html',
      description: '0–10, tens, hundreds', tags: ['Numbers & Time'], difficulty: 'Beginner' },
    { id: 'time', title: 'Time Quiz', emoji: '⏰', href: 'time-quiz.html',
      description: 'Keywords and formats', tags: ['Numbers & Time'], difficulty: 'Beginner' }
  ];

  function getLocalProgress() {
    try {
      const raw = localStorage.getItem('thaiQuizProgress');
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function setLocalProgress(progress) {
    try {
      localStorage.setItem('thaiQuizProgress', JSON.stringify(progress));
    } catch (_) {}
  }

  // Simple API for quizzes to call (optional future use)
  window.ThaiQuizProgress = {
    markVisited: function(quizId) {
      const p = getLocalProgress();
      p[quizId] = p[quizId] || {};
      p[quizId].lastVisitedAt = Date.now();
      setLocalProgress(p);
    }
  };

  function createCard(q) {
    const a = document.createElement('a');
    a.className = 'quiz-card';
    a.href = q.href;
    a.setAttribute('role', 'listitem');
    a.setAttribute('aria-label', q.title);

    const h2 = document.createElement('h2');
    h2.innerHTML = (q.emoji ? (q.emoji + ' ') : '') + q.title;

    const p = document.createElement('p');
    p.textContent = q.description || '';

    const badges = document.createElement('div');
    badges.className = 'badges';
    (q.tags || []).forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      badges.appendChild(span);
    });
    if (q.difficulty) {
      const diff = document.createElement('span');
      diff.className = 'tag subtle';
      diff.textContent = q.difficulty;
      badges.appendChild(diff);
    }

    const start = document.createElement('span');
    start.className = 'start-btn';
    start.textContent = 'Start';

    a.appendChild(h2);
    a.appendChild(p);
    a.appendChild(badges);
    a.appendChild(start);
    return a;
  }

  function renderList(containerId, list) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    list.forEach(q => el.appendChild(createCard(q)));
  }

  function uniqueTags(list) {
    const set = new Set();
    list.forEach(q => (q.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }

  function setupFilters() {
    const filtersEl = document.getElementById('quiz-filters');
    if (!filtersEl) return;
    const tags = uniqueTags(quizzes);
    const allBtn = document.createElement('button');
    allBtn.className = 'chip active';
    allBtn.textContent = 'All';
    allBtn.dataset.tag = '';
    filtersEl.appendChild(allBtn);
    tags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = tag;
      btn.dataset.tag = tag;
      filtersEl.appendChild(btn);
    });
  }

  function applySearchAndFilter() {
    const searchEl = document.getElementById('quiz-search');
    const filtersEl = document.getElementById('quiz-filters');
    const q = (searchEl && searchEl.value || '').toLowerCase().trim();
    const active = filtersEl ? filtersEl.querySelector('.chip.active') : null;
    const tag = active ? (active.dataset.tag || '') : '';

    const filtered = quizzes.filter(item => {
      const matchesText = !q || [item.title, item.description, ...(item.tags || [])]
        .filter(Boolean)
        .join(' ').toLowerCase().includes(q);
      const matchesTag = !tag || (item.tags || []).includes(tag);
      return matchesText && matchesTag;
    });

    renderList('quiz-list', filtered);
  }

  function setupSearchAndFilterHandlers() {
    const searchEl = document.getElementById('quiz-search');
    if (searchEl) {
      searchEl.addEventListener('input', applySearchAndFilter);
    }
    const filtersEl = document.getElementById('quiz-filters');
    if (filtersEl) {
      filtersEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button.chip');
        if (!btn) return;
        filtersEl.querySelectorAll('button.chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applySearchAndFilter();
      });
    }
  }

  function setupContinueSection() {
    const progress = getLocalProgress();
    const entries = Object.entries(progress)
      .map(([quizId, meta]) => ({ quizId, meta }))
      .filter(it => it.meta && it.meta.lastVisitedAt);
    entries.sort((a, b) => b.meta.lastVisitedAt - a.meta.lastVisitedAt);

    const recentIds = entries.slice(0, 6).map(it => it.quizId);
    const recentQuizzes = quizzes.filter(q => recentIds.includes(q.id));

    const section = document.getElementById('continue-section');
    if (!section) return;
    if (recentQuizzes.length === 0) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    renderList('continue-list', recentQuizzes);
  }

  function initCatalog() {
    setupFilters();
    setupSearchAndFilterHandlers();
    applySearchAndFilter();
    setupContinueSection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalog);
  } else {
    initCatalog();
  }
})();