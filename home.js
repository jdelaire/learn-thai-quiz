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
      const accent = dayColors[day];
      thaiEl.style.color = accent;
      phonEl.style.color = accent;

      function hexToRgba(hex, alpha) {
        try {
          let c = hex.replace('#','');
          if (c.length === 3) c = c.split('').map(x => x + x).join('');
          const r = parseInt(c.substring(0,2), 16);
          const g = parseInt(c.substring(2,4), 16);
          const b = parseInt(c.substring(4,6), 16);
          const a = typeof alpha === 'number' ? alpha : 1;
          return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        } catch(e) { return hex; }
      }

      const todayCard = document.querySelector('.today-card');
      if (todayCard) {
        todayCard.style.borderColor = hexToRgba(accent, 0.75);
        todayCard.style.boxShadow = '0 10px 25px ' + hexToRgba(accent, 0.25);
        const separator = todayCard.querySelector('.sep');
        if (separator) {
          separator.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, ' + hexToRgba(accent, 0.7) + ' 50%, rgba(0,0,0,0) 100%)';
        }
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
     * Central registry of quizzes so the homepage scales as more are added.
     */
    const quizzes = [
      {
        id: 'consonants',
        title: '🔤 Consonant Quiz',
        href: 'consonant-quiz.html',
        description: 'Learn all 44 Thai consonants with pronunciation, meanings, and tone classes.',
        bullets: ['Color-coded tone classes','Emoji associations','Progress tracking'],
        categories: ['Alphabet','Beginner']
      },
      {
        id: 'vowels',
        title: '🔤 Vowel Quiz',
        href: 'vowel-quiz.html',
        description: 'Practice 32 Thai vowels with sound patterns and example words.',
        bullets: ['Vowel symbols','Sound patterns'],
        categories: ['Alphabet','Beginner']
      },
      {
        id: 'colors',
        title: '🎨 Color Quiz',
        href: 'color-quiz.html',
        description: 'Practice Thai colors including light/dark modifiers with phonetics.',
        bullets: ['Base colors','Light/Dark modifiers'],
        categories: ['Vocabulary']
      },
      {
        id: 'numbers',
        title: '🔢 Numbers Quiz',
        href: 'numbers-quiz.html',
        description: 'Practice Thai numbers with phonetics, from 0 to the millions.',
        bullets: ['Basic 0–10','Teens and Tens','Hundreds & Thousands'],
        categories: ['Vocabulary','Beginner']
      },
      {
        id: 'time',
        title: '⏰ Time Quiz',
        href: 'time-quiz.html',
        description: 'Telling time in Thai: keywords, formats, and common phrases.',
        bullets: ['Key words (นาที, โมง, ทุ่ม, ครึ่ง, ตรง)','AM/PM patterns (ตี…, …โมงเช้า, …ทุ่ม)','Practical sentences'],
        categories: ['Phrases']
      },
      {
        id: 'questions',
        title: '❓ Questions Quiz',
        href: 'questions-quiz.html',
        description: 'Asking questions in Thai: core words and common patterns.',
        bullets: ['Question words (อะไร, ใคร, ที่ไหน, เมื่อไหร่, ทำไม)','Patterns (…ไหม, …ได้ไหม, เคย…ไหม)','How much/how many'],
        categories: ['Phrases','Beginner']
      }
    ];

    // Build category set from quizzes
    const categorySet = new Set();
    quizzes.forEach(q => q.categories.forEach(c => categorySet.add(c)));
    const categories = Array.from(categorySet).sort();

    const searchInput = document.getElementById('search-input');
    const categoryFilters = document.getElementById('category-filters');

    function renderCategoryChips() {
      if (!categoryFilters) return;
      categoryFilters.innerHTML = '';

      const allChip = document.createElement('button');
      allChip.type = 'button';
      allChip.className = 'chip active';
      allChip.textContent = 'All';
      allChip.dataset.value = '';
      categoryFilters.appendChild(allChip);

      categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = cat;
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
          q.description.toLowerCase().includes(term) ||
          q.bullets.some(b => b.toLowerCase().includes(term))
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
        empty.textContent = 'No quizzes match your search. Try a different term or category.';
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

        const features = document.createElement('div');
        features.className = 'features';
        const ul = document.createElement('ul');
        q.bullets.forEach(b => {
          const li = document.createElement('li');
          li.textContent = '✅ ' + b;
          ul.appendChild(li);
        });
        features.appendChild(ul);

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

    renderCategoryChips();
    wireUpEvents();
    updateUI();
  } catch (e) {}
})();