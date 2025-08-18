(function() {
  'use strict';
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
      const accent = dayColors[day];
      thaiEl.style.color = accent;
      phonEl.style.color = accent;

      function hexToRgba(hex, alpha) {
        try { return Utils.hexToRgba(hex, alpha); } catch(e) { return hex; }
      }

      const todayCard = document.querySelector('.today-card');
      if (todayCard) {
        // Keep default CSS border/shadow to match other cards on all devices
        // const separator = todayCard.querySelector('.sep');
        // if (separator) {
        //   separator.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, ' + hexToRgba(accent, 0.7) + ' 50%, rgba(0,0,0,0) 100%)';
        // }
      }
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

  try {
    const quizListEl = document.getElementById('quiz-list');
    if (!quizListEl) return;

    /**
     * Quizzes metadata loaded from JSON so homepage scales as more are added.
     */
    let quizzes = [];
    let categories = [];

    const searchInput = document.getElementById('search-input');
    const categoryFilters = document.getElementById('category-filters');

    function renderCategoryChips() {
      if (!categoryFilters) return;
      categoryFilters.innerHTML = '';

      // Count quizzes in each category
      const categoryCounts = {};
      quizzes.forEach(q => {
        (q.categories || []).forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      });

      const allChip = document.createElement('button');
      allChip.type = 'button';
      allChip.className = 'chip active';
      allChip.textContent = 'All (' + quizzes.length + ')';
      allChip.dataset.value = '';
      categoryFilters.appendChild(allChip);

      categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = cat + ' (' + (categoryCounts[cat] || 0) + ')';
        chip.dataset.value = cat;
        categoryFilters.appendChild(chip);
      });
    }

    function filterQuizzes() {
      const term = (searchInput && searchInput.value || '').toLowerCase().trim();
      const activeChip = categoryFilters ? categoryFilters.querySelector('.chip.active') : null;
      const activeCategory = activeChip ? (activeChip.dataset.value || '') : '';

      return quizzes.filter(q => {
        const matchesTerm = !term || (
          q.title.toLowerCase().includes(term) ||
          q.description.toLowerCase().includes(term)
        );
        const matchesCategory = !activeCategory || q.categories.includes(activeCategory);
        return matchesTerm && matchesCategory;
      });
    }

    function renderQuizCards(items) {
      quizListEl.innerHTML = '';
      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No quizzes found.';
        quizListEl.appendChild(empty);
        return;
      }

      items.forEach(q => {
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.onclick = function() { window.location.href = q.href; };

        const h2 = document.createElement('h2');
        h2.textContent = q.title;

        const p = document.createElement('p');
        p.textContent = q.description;

        const features = document.createElement('ul');
        features.className = 'features';
        q.bullets.forEach(b => {
          const li = document.createElement('li');
          li.textContent = '✅ ' + b;
          features.appendChild(li);
        });

        const a = document.createElement('a');
        a.href = q.href;
        a.className = 'start-btn';
        a.textContent = 'Start';

        card.appendChild(h2);
        card.appendChild(p);
        card.appendChild(features);
        card.appendChild(a);
        quizListEl.appendChild(card);
      });
    }

    function updateUI() {
      renderQuizCards(filterQuizzes());
    }

    function wireUpEvents() {
      if (searchInput) {
        searchInput.addEventListener('input', updateUI);
      }
      if (categoryFilters) {
        categoryFilters.addEventListener('click', function(ev) {
          const target = ev.target;
          if (!(target instanceof Element)) return;
          const chip = target.closest('.chip');
          if (!chip) return;
          const currentlyActive = categoryFilters.querySelector('.chip.active');
          if (currentlyActive) currentlyActive.classList.remove('active');
          chip.classList.add('active');
          updateUI();
        });
      }
    }

    (function init(){
      Utils.fetchJSON('../data/quizzes.json')
        .then(function(data){
          quizzes = Array.isArray(data) ? data : [];
          const categorySet = new Set();
          quizzes.forEach(q => (q.categories || []).forEach(c => categorySet.add(c)));
          categories = Array.from(categorySet).sort();
          renderCategoryChips();
          wireUpEvents();
          updateUI();
        })
        .catch(function(){
          const error = document.createElement('div');
          error.className = 'empty';
          error.textContent = 'Failed to load quizzes.';
          quizListEl.appendChild(error);
        });
    })();
  } catch (e) {}
})();