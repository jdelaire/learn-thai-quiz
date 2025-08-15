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

  // New functionality for improved index page

  // Search functionality
  const searchInput = document.getElementById('quiz-search');
  const quizCards = document.querySelectorAll('.quiz-card');
  
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      
      quizCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const category = card.getAttribute('data-category');
        const name = card.getAttribute('data-name');
        
        const matches = title.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       category.includes(searchTerm) ||
                       name.includes(searchTerm);
        
        card.style.display = matches ? '' : 'none';
      });
      
      // Update category counts
      updateCategoryCounts();
    });
  }

  // View toggle functionality
  const viewButtons = document.querySelectorAll('.view-btn');
  viewButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const view = this.getAttribute('data-view');
      
      // Update active button
      viewButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Update body class
      if (view === 'list') {
        document.body.classList.add('list-view');
      } else {
        document.body.classList.remove('list-view');
      }
      
      // Save preference
      localStorage.setItem('preferredView', view);
    });
  });

  // Restore view preference
  const savedView = localStorage.getItem('preferredView');
  if (savedView === 'list') {
    document.body.classList.add('list-view');
    document.querySelector('[data-view="list"]')?.classList.add('active');
    document.querySelector('[data-view="grid"]')?.classList.remove('active');
  }

  // Category collapse/expand functionality
  const categoryHeaders = document.querySelectorAll('.category-header');
  categoryHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      const contentId = this.getAttribute('aria-controls');
      const content = document.getElementById(contentId);
      
      if (content) {
        this.setAttribute('aria-expanded', !expanded);
        content.style.display = expanded ? 'none' : 'block';
        
        // Save state
        localStorage.setItem(`category-${contentId}`, !expanded);
      }
    });
  });

  // Restore category states
  categoryHeaders.forEach(header => {
    const contentId = header.getAttribute('aria-controls');
    const savedState = localStorage.getItem(`category-${contentId}`);
    
    if (savedState === 'false') {
      header.setAttribute('aria-expanded', 'false');
      const content = document.getElementById(contentId);
      if (content) content.style.display = 'none';
    }
  });

  // Progress tracking functionality
  function updateProgressBars() {
    const quizData = {
      'consonant': { total: 44, key: 'consonantProgress' },
      'vowel': { total: 32, key: 'vowelProgress' },
      'colors': { total: 15, key: 'colorProgress' },
      'numbers': { total: 30, key: 'numberProgress' },
      'time': { total: 25, key: 'timeProgress' }
    };

    quizCards.forEach(card => {
      const quizName = card.getAttribute('data-name');
      const quizInfo = quizData[quizName];
      
      if (quizInfo) {
        const progress = JSON.parse(localStorage.getItem(quizInfo.key) || '{"correct":0,"total":0}');
        const percentage = progress.total > 0 ? Math.round((progress.correct / quizInfo.total) * 100) : 0;
        
        // Update progress bar
        const progressBar = card.querySelector('.progress-bar');
        if (progressBar) {
          progressBar.style.width = percentage + '%';
        }
        
        // Update stats
        const statItems = card.querySelectorAll('.stat-item');
        if (statItems.length > 1) {
          statItems[1].textContent = percentage + '% complete';
        }
      }
    });
  }

  // Update progress on page load
  updateProgressBars();

  // Update category counts based on visible cards
  function updateCategoryCounts() {
    const categories = document.querySelectorAll('.category-section');
    
    categories.forEach(category => {
      const content = category.querySelector('.category-content');
      const visibleCards = content.querySelectorAll('.quiz-card:not([style*="display: none"])');
      const countElement = category.querySelector('.category-count');
      
      if (countElement) {
        const count = visibleCards.length;
        countElement.textContent = count + ' quiz' + (count !== 1 ? 'zes' : '');
      }
    });
  }

  // Smooth scroll to quiz when clicking featured cards
  const featuredCards = document.querySelectorAll('.featured-card');
  featuredCards.forEach(card => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      const href = this.getAttribute('onclick').match(/href='([^']+)'/)[1];
      window.location.href = href;
    });
  });

})();