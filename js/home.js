(function() {
  'use strict';
  
  // Generate and set all player card data
  // Function to handle player name editing (defined early for scope access)
  function editPlayerName(nameElement) {
    try {
      const currentName = Utils.getPlayerDisplayName();
      const customName = Utils.getPlayerCustomName();
      
      // Create input field
      const input = document.createElement('input');
      input.type = 'text';
      input.value = customName || currentName;
      input.className = 'player-name-edit';
      input.setAttribute('aria-label', 'Edit player name');
      input.setAttribute('maxlength', '20');
      
      // Style the input to match the player name
      const inputWidth = Math.max(nameElement.offsetWidth + 20, 150); // Minimum width of 150px
      input.style.cssText = `
        font-weight: 800;
        font-size: 1.15em;
        color: var(--color-text);
        background: transparent;
        border: 2px solid var(--color-accent);
        border-radius: 6px;
        padding: 2px 6px;
        outline: none;
        width: ${inputWidth}px;
        font-family: inherit;
      `;
      
      // Replace the text with input
      nameElement.textContent = '';
      nameElement.appendChild(input);
      input.focus();
      input.select();
      
      // Handle save on Enter or blur
      function saveName() {
        const newName = input.value.trim();
        if (newName && newName !== customName) {
          Utils.setPlayerCustomName(newName);
          nameElement.textContent = newName;
        } else if (!newName && customName) {
          // If cleared and there was a custom name, remove it
          Utils.setPlayerCustomName('');
          nameElement.textContent = Utils.getPlayerDisplayName();
        } else {
          // Restore original display
          nameElement.textContent = Utils.getPlayerDisplayName();
        }
        
        // Restore click functionality
        nameElement.style.cursor = 'pointer';
        nameElement.setAttribute('title', 'Click to edit your name');
        nameElement.setAttribute('role', 'button');
        nameElement.setAttribute('tabindex', '0');
        nameElement.setAttribute('aria-label', 'Player name - click to edit');
      }
      
      function cancelEdit() {
        nameElement.textContent = Utils.getPlayerDisplayName();
        // Restore click functionality
        nameElement.style.cursor = 'pointer';
        nameElement.setAttribute('title', 'Click to edit your name');
        nameElement.setAttribute('role', 'button');
        nameElement.setAttribute('tabindex', '0');
        nameElement.setAttribute('aria-label', 'Player name - click to edit');
      }
      
      input.addEventListener('blur', saveName);
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveName();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
        }
      });
      
    } catch (e) {
      Utils.logError(e, 'home.js: editPlayerName');
      // Restore original display on error
      nameElement.textContent = Utils.getPlayerDisplayName();
    }
  }

  try {
    // Player Display Name
    const playerNameEl = document.querySelector('.player-name');
    if (playerNameEl) {

      playerNameEl.textContent = Utils.getPlayerDisplayName();
      
      // Add edit functionality
      playerNameEl.style.cursor = 'pointer';
      playerNameEl.setAttribute('title', 'Click to edit your name');
      playerNameEl.setAttribute('role', 'button');
      playerNameEl.setAttribute('tabindex', '0');
      playerNameEl.setAttribute('aria-label', 'Player name - click to edit');
      
      // Add click event with multiple approaches to ensure it works
      playerNameEl.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        editPlayerName(playerNameEl);
        return false;
      };
      
      playerNameEl.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        editPlayerName(playerNameEl);
      });
      
      playerNameEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          editPlayerName(playerNameEl);
        }
      });
    }

    // Helper to refresh Level + XP header UI
    function updateHeaderLevelAndXP() {
      try {
        const playerLevel = Utils.getPlayerLevel();
        const playerLevelEl = document.querySelector('.player-level');
        if (playerLevelEl) {
          playerLevelEl.textContent = `Level ${playerLevel}`;
        }

        const currentXP = Utils.getPlayerXP();
        const maxXP = Utils.getPlayerMaxXP();
        const xpValueEl = document.querySelector('.xp-value');
        if (xpValueEl) {
          xpValueEl.textContent = `${Utils.formatNumber(currentXP)} / ${Utils.formatNumber(maxXP)}`;
        }

        const xpProgress = Utils.getXPProgressPercentage();
        const xpBarEl = document.querySelector('.xp-bar');
        const xpFillEl = document.querySelector('.xp-fill');
        if (xpBarEl && xpFillEl) {
          xpBarEl.setAttribute('aria-valuenow', xpProgress);
          xpFillEl.style.width = `${xpProgress}%`;
        }
      } catch (e) { Utils.logError(e, 'home.js: updateHeaderLevelAndXP'); }
    }

    // Player Avatar
    const playerAvatar = Utils.getPlayerAvatar();
    const playerAvatarEl = document.querySelector('.player-avatar');
    if (playerAvatarEl) {
      playerAvatarEl.src = playerAvatar;
    }

    updateHeaderLevelAndXP();

    // Player Metrics updater
    function updateHeaderMetrics() {
      try {
        const accuracy = Utils.getPlayerAccuracy();
        const quizzesCompleted = Utils.getQuizzesCompleted();
        const totalStars = Utils.getTotalStarsEarned();

        const metricValues = document.querySelectorAll('.metric-value');
        if (metricValues.length >= 3) {
          metricValues[0].textContent = `${accuracy}%`;
          metricValues[1].textContent = Utils.formatNumber(quizzesCompleted);
          metricValues[2].textContent = Utils.formatNumber(totalStars);
        }
      } catch (e) { Utils.logError(e, 'home.js: updateHeaderMetrics'); }
    }

    updateHeaderMetrics();

  } catch (e) { Utils.logError(e, 'home.js: player card data population'); }
  
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
        return Utils.ErrorHandler.safe(Utils.hexToRgba, hex)(hex, alpha);
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
  } catch (e) { Utils.logError(e, 'home.js: today/month widgets'); }

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
          q._titleLower.includes(term) ||
          q._descriptionLower.includes(term)
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

      const frag = document.createDocumentFragment();
      items.forEach(q => {
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.onclick = function() { window.location.href = q.href; };

        const h2 = document.createElement('h2');
        h2.textContent = q.title;

        const p = document.createElement('p');
        p.textContent = q.description;

        // Star rating based on local progress (0-3 stars)
        let starsWrap = document.createElement('div');
        starsWrap.className = 'star-rating';
        try {
          const starsCount = (typeof Utils.getQuizStars === 'function') ? Utils.getQuizStars(q.id) : 0;
          const starsText = (typeof Utils.formatStars === 'function') ? Utils.formatStars(starsCount) : '';
          starsWrap.textContent = starsText || '';
          if (starsText) {
            starsWrap.setAttribute('aria-label', 'Completion stars');
            if (typeof Utils.getStarRulesTooltip === 'function') {
              starsWrap.title = Utils.getStarRulesTooltip();
            }
          }
        } catch (_) {}

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
        card.appendChild(starsWrap);
        card.appendChild(features);
        card.appendChild(a);
        frag.appendChild(card);
      });
      quizListEl.appendChild(frag);
    }

    function updateUI() {
      renderQuizCards(filterQuizzes());
    }

    function debounce(fn, ms) {
      let t = null;
      return function() {
        const ctx = this; const args = arguments;
        if (t) clearTimeout(t);
        t = setTimeout(function(){ fn.apply(ctx, args); }, ms);
      };
    }

    const updateUIDebounced = debounce(updateUI, 120);

    function wireUpEvents() {
      if (searchInput) {
        searchInput.addEventListener('input', updateUIDebounced);
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
      Utils.fetchJSONCached('data/quizzes.json')
        .then(function(data){
          quizzes = Array.isArray(data) ? data : [];
          // Precompute lowercase fields for faster filtering
          quizzes.forEach(function(q){
            q._titleLower = (q.title || '').toLowerCase();
            q._descriptionLower = (q.description || '').toLowerCase();
          });
          // Sort quizzes alphabetically by title
          quizzes.sort(function(a, b) {
            return (a.title || '').localeCompare(b.title || '');
          });
          const categorySet = new Set();
          quizzes.forEach(q => (q.categories || []).forEach(c => categorySet.add(c)));
          categories = Array.from(categorySet).sort();
          renderCategoryChips();
          wireUpEvents();
          updateUI();
        })
        .catch(function(err){
          const error = document.createElement('div');
          error.className = 'empty';
          error.textContent = 'Failed to load quizzes.';
          quizListEl.appendChild(error);
          Utils.logError(err, 'home.js: failed to load data/quizzes.json');
        });
    })();

    // Development-only: reset local quiz progress
    try {
      const resetBtn = document.getElementById('reset-progress');
      if (resetBtn) {
        resetBtn.addEventListener('click', function(ev){
          Utils.ErrorHandler.safe(function() { ev.preventDefault(); })();
          Utils.ErrorHandler.wrap(Utils.resetAllProgress, 'home.js: resetAllProgress')();
          // Recompute header level/XP, metrics and re-render to reflect stars cleared
          updateHeaderLevelAndXP();
          updateHeaderMetrics();
          updateUI();
          
          // Refresh player name display (in case custom name was cleared)
          const playerNameEl = document.querySelector('.player-name');
          if (playerNameEl) {
            playerNameEl.textContent = Utils.getPlayerDisplayName();
          }
          Utils.ErrorHandler.safe(function() { alert('Local quiz progress has been reset.'); })();
        });
      }
    } catch (e) { Utils.logError(e, 'home.js: wire reset progress'); }
  } catch (e) { Utils.logError(e, 'home.js: init'); }
})();