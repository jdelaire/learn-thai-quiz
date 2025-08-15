(function() {
  // Quiz data structure - easily expandable for new quizzes
  const quizData = [
    {
      id: 'consonant-quiz',
      title: 'Consonant Quiz',
      icon: '🔤',
      category: 'alphabet',
      description: 'Learn all 44 Thai consonants with pronunciation, meanings, and tone classes.',
      features: [
        'Color-coded tone classes',
        'Emoji associations',
        'Progress tracking'
      ],
      difficulty: 3,
      url: 'consonant-quiz.html'
    },
    {
      id: 'vowel-quiz',
      title: 'Vowel Quiz',
      icon: '🔤',
      category: 'alphabet',
      description: 'Practice 32 Thai vowels with sound patterns and example words.',
      features: [
        'Vowel symbols',
        'Sound patterns',
        'Example words'
      ],
      difficulty: 2,
      url: 'vowel-quiz.html'
    },
    {
      id: 'color-quiz',
      title: 'Color Quiz',
      icon: '🎨',
      category: 'vocabulary',
      description: 'Practice Thai colors including light/dark modifiers with phonetics.',
      features: [
        'Base colors',
        'Light/Dark modifiers',
        'Visual associations'
      ],
      difficulty: 1,
      url: 'color-quiz.html'
    },
    {
      id: 'numbers-quiz',
      title: 'Numbers Quiz',
      icon: '🔢',
      category: 'time',
      description: 'Practice Thai numbers with phonetics, from 0 to the millions.',
      features: [
        'Basic 0–10',
        'Teens and Tens',
        'Hundreds & Thousands'
      ],
      difficulty: 2,
      url: 'numbers-quiz.html'
    },
    {
      id: 'time-quiz',
      title: 'Time Quiz',
      icon: '⏰',
      category: 'time',
      description: 'Telling time in Thai: keywords, formats, and common phrases.',
      features: [
        'Key words (นาที, โมง, ทุ่ม, ครึ่ง, ตรง)',
        'AM/PM patterns (ตี…, …โมงเช้า, …ทุ่ม)',
        'Practical sentences'
      ],
      difficulty: 3,
      url: 'time-quiz.html'
    }
  ];

  // Category labels
  const categoryLabels = {
    'alphabet': 'Alphabet',
    'vocabulary': 'Vocabulary',
    'time': 'Time & Numbers'
  };

  // State management
  let currentFilter = 'all';
  let searchQuery = '';
  let filteredQuizzes = [...quizData];

  // Initialize the page
  function init() {
    initializeToday();
    renderQuizzes();
    setupEventListeners();
    updateStats();
  }

  // Today/Date functionality (existing)
  function initializeToday() {
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
  }

  // Render quiz cards
  function renderQuizzes() {
    const quizGrid = document.getElementById('quiz-grid');
    const noResults = document.getElementById('no-results');
    
    if (!quizGrid) return;

    if (filteredQuizzes.length === 0) {
      quizGrid.style.display = 'none';
      noResults.style.display = 'block';
      return;
    }

    quizGrid.style.display = 'grid';
    noResults.style.display = 'none';

    quizGrid.innerHTML = filteredQuizzes.map(quiz => `
      <div class="quiz-card" onclick="window.location.href='${quiz.url}'" data-quiz-id="${quiz.id}">
        <div class="quiz-card-header">
          <span class="quiz-icon">${quiz.icon}</span>
          <h3 class="quiz-title">${quiz.title}</h3>
          <span class="quiz-category">${categoryLabels[quiz.category]}</span>
        </div>
        
        <p class="quiz-description">${quiz.description}</p>
        
        <div class="quiz-features">
          <ul>
            ${quiz.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
        
        <div class="quiz-card-footer">
          <div class="quiz-difficulty">
            Difficulty
            <div class="difficulty-dots">
              ${Array.from({length: 3}, (_, i) => `
                <div class="difficulty-dot ${i < quiz.difficulty ? 'filled' : ''}"></div>
              `).join('')}
            </div>
          </div>
          <a href="${quiz.url}" class="start-btn" onclick="event.stopPropagation()">Start Quiz</a>
        </div>
      </div>
    `).join('');
  }

  // Filter quizzes based on search and category
  function filterQuizzes() {
    filteredQuizzes = quizData.filter(quiz => {
      const matchesCategory = currentFilter === 'all' || quiz.category === currentFilter;
      const matchesSearch = searchQuery === '' || 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });

    renderQuizzes();
    updateStats();
  }

  // Setup event listeners
  function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('quiz-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterQuizzes();
      });
    }

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        filterTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        
        currentFilter = tab.dataset.category;
        filterQuizzes();
      });
    });
  }

  // Update statistics
  function updateStats() {
    const totalQuizzesEl = document.getElementById('total-quizzes');
    const completedTodayEl = document.getElementById('completed-today');

    if (totalQuizzesEl) {
      totalQuizzesEl.textContent = filteredQuizzes.length;
    }

    if (completedTodayEl) {
      // Get completed quizzes from localStorage (you can implement this based on your tracking system)
      const completedToday = getCompletedQuizzesToday();
      completedTodayEl.textContent = completedToday;
    }
  }

  // Get completed quizzes for today (placeholder - implement based on your tracking system)
  function getCompletedQuizzesToday() {
    try {
      const today = new Date().toDateString();
      const completed = JSON.parse(localStorage.getItem('quizCompletedToday') || '{}');
      return Object.keys(completed[today] || {}).length;
    } catch (e) {
      return 0;
    }
  }

  // Export functions for potential external use
  window.quizManager = {
    addQuiz: (quiz) => {
      quizData.push(quiz);
      filterQuizzes();
    },
    removeQuiz: (quizId) => {
      const index = quizData.findIndex(q => q.id === quizId);
      if (index > -1) {
        quizData.splice(index, 1);
        filterQuizzes();
      }
    },
    getQuizData: () => [...quizData],
    refreshQuizzes: () => {
      filterQuizzes();
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();