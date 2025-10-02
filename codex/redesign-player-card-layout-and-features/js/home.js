(function() {
  'use strict';
  
  function setPlayerNameInteractiveAttrs(el) {
    if (!el) return;
    el.style.cursor = 'pointer';
    el.setAttribute('title', 'Click to edit your name');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    try {
      var label = (Utils && Utils.i18n && Utils.i18n.playerNameEditLabel) || 'Player name - click to edit';
      el.setAttribute('aria-label', label);
    } catch (_) { el.setAttribute('aria-label', 'Player name - click to edit'); }
  }

  function restorePlayerNameInteractivity(el) {
    setPlayerNameInteractiveAttrs(el);
  }

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
        restorePlayerNameInteractivity(nameElement);

        // Refresh avatar to reflect new initial (player card only)
        try {
          const playerAvatarEl = document.querySelector('.player-avatar');
          if (playerAvatarEl) {
            const newAvatar = Utils.getPlayerAvatar();
            if (newAvatar) playerAvatarEl.src = newAvatar;
          }
        } catch (e) { Utils.logError(e, 'home.js: refresh avatar after name edit'); }
      }
      
      function cancelEdit() {
        nameElement.textContent = Utils.getPlayerDisplayName();
        // Restore click functionality
        restorePlayerNameInteractivity(nameElement);
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

  let quizzesMetaCache = null;
  let quizzesMetaPromise = null;
  let lastResumeQuizId = null;

  function loadQuizzesMeta(){
    if (quizzesMetaCache) return Promise.resolve(quizzesMetaCache);
    if (!quizzesMetaPromise) {
      quizzesMetaPromise = Utils.fetchJSONCached('data/quizzes.json').then(function(list){
        const arr = Array.isArray(list) ? list : [];
        const map = Object.create(null);
        for (let i = 0; i < arr.length; i++) {
          const it = arr[i];
          if (it && it.id) map[it.id] = it;
        }
        quizzesMetaCache = { list: arr, map: map };
        return quizzesMetaCache;
      }).catch(function(err){
        quizzesMetaPromise = null;
        throw err;
      });
    }
    return quizzesMetaPromise;
  }

  try {
    const playerCard = document.querySelector('.player-card');
    const dom = {
      card: playerCard,
      name: playerCard ? playerCard.querySelector('.player-name') : document.querySelector('.player-name'),
      level: playerCard ? playerCard.querySelector('.player-level') : document.querySelector('.player-level'),
      xpValue: playerCard ? playerCard.querySelector('.xp-value') : document.querySelector('.xp-value'),
      xpBar: playerCard ? playerCard.querySelector('.xp-bar') : document.querySelector('.xp-bar'),
      metrics: playerCard ? playerCard.querySelectorAll('.metric-value') : document.querySelectorAll('.metric-value'),
      today: playerCard ? playerCard.querySelector('.player-today') : document.querySelector('.player-today'),
      resume: playerCard ? playerCard.querySelector('.player-resume') : document.querySelector('.player-resume'),
      avatar: playerCard ? playerCard.querySelector('.player-avatar') : document.querySelector('.player-avatar')
    };

    // Player Display Name
    const playerNameEl = dom.name;
    if (playerNameEl) {

      playerNameEl.textContent = Utils.getPlayerDisplayName();
      
      // Add edit functionality
      setPlayerNameInteractiveAttrs(playerNameEl);
      
      // Single click handler
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
        const playerLevelEl = dom.level;
        if (playerLevelEl) {
          playerLevelEl.textContent = `Level ${playerLevel}`;
        }

        const currentXP = Utils.getPlayerXP();
        const maxXP = Utils.getPlayerMaxXP();
        const xpValueEl = dom.xpValue;
        if (xpValueEl) {
          xpValueEl.textContent = `${Utils.formatNumber(currentXP)} / ${Utils.formatNumber(maxXP)}`;
        }

        const xpProgress = Utils.getXPProgressPercentage();
        const xpBarEl = dom.xpBar;
        if (xpBarEl) {
          xpBarEl.setAttribute('aria-valuenow', xpProgress);
          try {
            const clamped = Math.max(0, Math.min(100, Number(xpProgress) || 0));
            xpBarEl.style.setProperty('--xp-progress', (clamped * 3.6) + 'deg');
          } catch (_) {}
        }

        // Update avatars so visuals evolve with level/XP
        const avatarURI = Utils.getPlayerAvatar();
        const playerAvatarEl = dom.avatar;
        if (playerAvatarEl && avatarURI) {
          playerAvatarEl.src = avatarURI;
          try { playerAvatarEl.alt = `Player avatar`; } catch (_) {}
        }
        // Footer/socials avatar remains static by design
      } catch (e) { Utils.logError(e, 'home.js: updateHeaderLevelAndXP'); }
    }

    updateHeaderLevelAndXP();

    // Player Metrics updater
    function updateHeaderMetrics() {
      try {
        const accuracy = Utils.getPlayerAccuracy();
        const quizzesCompleted = Utils.getQuizzesCompleted();
        const totalStars = Utils.getTotalStarsEarned();

        const metricValues = dom.metrics;
        if (metricValues.length >= 3) {
          metricValues[0].textContent = `${accuracy}%`;
          metricValues[1].textContent = Utils.formatNumber(quizzesCompleted);
          metricValues[2].textContent = Utils.formatNumber(totalStars);
        }
      } catch (e) { Utils.logError(e, 'home.js: updateHeaderMetrics'); }
    }

    updateHeaderMetrics();

    // Render resume quick link (below today card, above metrics)
    function renderResumeQuickLink() {
      try {
        const playerCard = dom.card || document.querySelector('.player-card');
        if (!playerCard) return;
        const metricsEl = playerCard.querySelector('.player-metrics');

        let resumeEl = dom.resume || playerCard.querySelector('.player-resume');
        if (!resumeEl) {
          resumeEl = document.createElement('div');
          resumeEl.className = 'player-resume';
          resumeEl.hidden = true;
          if (metricsEl && metricsEl.nextSibling) {
            playerCard.insertBefore(resumeEl, metricsEl.nextSibling);
          } else if (metricsEl) {
            playerCard.appendChild(resumeEl);
          } else {
            playerCard.appendChild(resumeEl);
          }
          dom.resume = resumeEl;
        } else if (metricsEl && resumeEl.previousElementSibling !== metricsEl) {
          playerCard.insertBefore(resumeEl, metricsEl.nextSibling);
        }

        const latest = (Utils && typeof Utils.getLatestAttempt === 'function') ? Utils.getLatestAttempt() : null;
        if (!latest || !latest.quizId) {
          lastResumeQuizId = null;
          resumeEl.hidden = true;
          Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(resumeEl); })();
          return;
        }

        if (latest.quizId === lastResumeQuizId && resumeEl.childNodes.length > 0) {
          resumeEl.hidden = false;
          return;
        }

        lastResumeQuizId = latest.quizId;

        // Resolve quiz metadata (title and href)
        loadQuizzesMeta()
          .then(function(metaBundle){
            const map = metaBundle && metaBundle.map;
            const meta = (map && map[latest.quizId]) || { id: latest.quizId, title: latest.quizId, href: 'quiz.html?quiz=' + latest.quizId };

            Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(resumeEl); })();

            const label = document.createElement('div');
            label.className = 'resume-label';
            label.textContent = 'Next quiz';

            const a = document.createElement('a');
            a.className = 'resume-link';
            a.href = meta.href || ('quiz.html?quiz=' + latest.quizId);
            a.textContent = meta.title || latest.quizId;
            a.setAttribute('aria-label', 'Continue ' + (meta.title || latest.quizId));

            resumeEl.appendChild(label);
            resumeEl.appendChild(a);
            
            resumeEl.hidden = false;
          })
          .catch(function(err){
            // Fallback to link without nice title
            try {
              Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(resumeEl); })();
              const label = document.createElement('div');
              label.className = 'resume-label';
              label.textContent = 'Next quiz';
              const a = document.createElement('a');
              a.className = 'resume-link';
              a.href = 'quiz.html?quiz=' + latest.quizId;
              a.textContent = 'Continue ' + latest.quizId;
              a.setAttribute('aria-label', 'Continue ' + latest.quizId);
              resumeEl.appendChild(label);
              resumeEl.appendChild(a);
              resumeEl.hidden = false;
            } catch (_) {}
            lastResumeQuizId = null;
            Utils.logError(err, 'home.js: renderResumeQuickLink fetch quizzes');
          });
      } catch (e) { Utils.logError(e, 'home.js: renderResumeQuickLink'); }
    }

    // Refresh player card when returning to the page or when progress/name changes
    (function wirePlayerCardRefreshers(){
      try {
        function rerenderHeader() {
          updateHeaderLevelAndXP();
          updateHeaderMetrics();
          renderResumeQuickLink();
        }

        // Fires on bfcache restore and normal navigation back to this page
        window.addEventListener('pageshow', function(){ rerenderHeader(); });

        // When tab regains focus
        window.addEventListener('focus', function(){ rerenderHeader(); });

        // When page becomes visible again
        document.addEventListener('visibilitychange', function(){ if (!document.hidden) rerenderHeader(); });

        // Cross-tab updates to localStorage (progress or custom name)
        window.addEventListener('storage', function(ev){
          try {
            var key = (ev && ev.key) || '';
            if (!key || key.indexOf('thaiQuest.progress.') === 0 || key === 'thaiQuestCustomName') {
              rerenderHeader();
            }
          } catch (_) { rerenderHeader(); }
        });
      } catch (e) { Utils.logError(e, 'home.js: wire player card refreshers'); }
    })();

    // Initial render of resume quick link
    renderResumeQuickLink();

  } catch (e) { Utils.logError(e, 'home.js: player card data population'); }
  
  // What's New (changelog) popover
  try {
    const wnButton = document.getElementById('wn-button');
    const wnPopover = document.getElementById('wn-popover');
    const wnDot = wnButton && wnButton.querySelector('.wn-dot');
    const wnList = wnPopover && wnPopover.querySelector('.wn-list');
    const wnLoading = wnPopover && wnPopover.querySelector('.loading');
    const wnClose = wnPopover && wnPopover.querySelector('.wn-close');
    const wnMarkSeen = wnPopover && wnPopover.querySelector('.wn-mark-seen');

    if (wnButton && wnPopover && wnList) {
      const STORAGE_KEY = 'thaiQuest.lastSeenChangelogAt';
      let lastSeen = (window.StorageService && window.StorageService.getItem(STORAGE_KEY)) || '';
      let entries = [];
      let newestEntryMs = 0;

      function parseDateMs(iso) {
        const s = String(iso == null ? '' : iso).trim();
        if (!s) return 0;
        // Handle millisecond epoch strings explicitly for robustness
        if (/^\d{8,}$/.test(s)) {
          const n = parseInt(s, 10);
          return isFinite(n) ? n : 0;
        }
        const t = Date.parse(s);
        return isFinite(t) ? t : 0;
      }

      function formatRelative(ms) {
        try {
          const rtf = (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat)
            ? new Intl.RelativeTimeFormat(navigator.language || 'en', { numeric: 'auto' })
            : null;
          const now = Date.now();
          const diffSec = Math.round((ms - now) / 1000);
          const absSec = Math.abs(diffSec);
          if (!rtf) {
            if (absSec < 60) return 'just now';
            const absMin = Math.round(absSec / 60);
            if (absMin < 60) return absMin + ' min ago';
            const absHr = Math.round(absMin / 60);
            if (absHr < 24) return absHr + ' hr ago';
            const absDay = Math.round(absHr / 24);
            return absDay + ' d ago';
          }
          if (absSec < 60) return 'just now';
          const minutes = Math.round(diffSec / 60);
          const absMin = Math.abs(minutes);
          if (absMin < 60) return rtf.format(minutes, 'minute');
          const hours = Math.round(minutes / 60);
          const absHr = Math.abs(hours);
          if (absHr < 24) return rtf.format(hours, 'hour');
          const days = Math.round(hours / 24);
          const absDay = Math.abs(days);
          if (absDay < 7) return rtf.format(days, 'day');
          const weeks = Math.round(days / 7);
          if (Math.abs(weeks) < 5) return rtf.format(weeks, 'week');
          const months = Math.round(days / 30);
          return rtf.format(months, 'month');
        } catch (_) { return ''; }
      }

      function closePopover() {
        wnPopover.hidden = true;
        wnButton.setAttribute('aria-expanded', 'false');
      }

      function openPopover() {
        wnPopover.hidden = false;
        wnButton.setAttribute('aria-expanded', 'true');
        // Focus close for keyboard accessibility if available
        if (wnClose && typeof wnClose.focus === 'function') {
          try { wnClose.focus(); } catch (_) {}
        }
      }

      function render(entriesSorted, quizMap) {
        // Clear
        while (wnList.firstChild) wnList.removeChild(wnList.firstChild);

        if (!Array.isArray(entriesSorted) || entriesSorted.length === 0) {
          const li = document.createElement('li');
          li.className = 'wn-item';
          li.textContent = 'All caught up!';
          wnList.appendChild(li);
          return;
        }

        const limit = 10;
        entriesSorted.slice(0, limit).forEach(function(entry){
          const li = document.createElement('li');
          li.className = 'wn-item';
          const metaWrap = document.createElement('div');
          metaWrap.className = 'meta';
          const dateMs = parseDateMs(entry.date);
          metaWrap.textContent = formatRelative(dateMs);

          const quiz = quizMap[entry.id] || {};
          const a = document.createElement('a');
          a.href = quiz.href || '#';
          a.textContent = quiz.title || entry.id;
          a.addEventListener('click', function(){
            // Mark seen on click-through
            try {
              if (window.StorageService) window.StorageService.setItem(STORAGE_KEY, String(newestEntryMs));
              if (wnDot) wnDot.hidden = true;
            } catch (_) {}
          });

          li.appendChild(a);
          li.appendChild(metaWrap);
          wnList.appendChild(li);
        });
      }

      function computeDot() {
        try {
          const last = parseDateMs(lastSeen);
          const hasNew = entries.some(function(e){ return parseDateMs(e.date) > last; });
          if (wnDot) wnDot.hidden = !hasNew;
        } catch (_) {}
      }

      // Wire events
      wnButton.addEventListener('click', function(){
        const isOpen = !wnPopover.hidden;
        if (isOpen) { closePopover(); } else { openPopover(); }
      });

      if (wnClose) {
        wnClose.addEventListener('click', function(){ closePopover(); });
      }

      if (wnMarkSeen) {
        wnMarkSeen.addEventListener('click', function(){
          try {
            if (newestEntryMs > 0 && window.StorageService) {
              window.StorageService.setItem(STORAGE_KEY, String(newestEntryMs));
            }
            lastSeen = String(newestEntryMs);
            if (wnDot) wnDot.hidden = true;
          } catch (e) { Utils.logError(e, 'home.js: wn mark seen'); }
        });
      }

      // Close on outside click / Escape
      document.addEventListener('click', function(ev){
        try {
          if (!wnPopover.hidden) {
            const target = ev.target;
            if (target instanceof Element) {
              const within = target.closest('#wn-popover') || target.closest('#wn-button');
              if (!within) closePopover();
            }
          }
        } catch (_) {}
      });
      document.addEventListener('keydown', function(ev){
        if (ev.key === 'Escape' && !wnPopover.hidden) closePopover();
      });

      // Load data and render
      Utils.fetchJSONs(['data/quizzes.json', 'data/changelog.json'])
        .then(function(arr){
          const quizList = Array.isArray(arr[0]) ? arr[0] : [];
          const cl = (arr[1] && Array.isArray(arr[1].entries)) ? arr[1].entries : [];

          const quizMap = Object.create(null);
          quizList.forEach(function(q){ quizMap[q.id] = q; });

          entries = cl.slice().sort(function(a, b){ return parseDateMs(b.date) - parseDateMs(a.date); });
          newestEntryMs = entries.length ? parseDateMs(entries[0].date) : 0;

          // Hide loading indicator once data has been resolved
          if (wnLoading) { try { wnLoading.style.display = 'none'; } catch (_) {} }
          render(entries, quizMap);
          computeDot();
        })
        .catch(function(err){
          // Hide loading indicator even on error
          if (wnLoading) { try { wnLoading.style.display = 'none'; } catch (_) {} }
          Utils.logError(err, 'home.js: wn load changelog');
        });
    }
  } catch (e) { Utils.logError(e, 'home.js: whats-new setup'); }
  
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

    // Populate combined today info inside player card (single line each)
    const pDayMonthThaiEl = document.getElementById('player-daymonth-thai');
    const pDayMonthPhonEl = document.getElementById('player-daymonth-phonetic');
    if (pDayMonthThaiEl && pDayMonthPhonEl) {
      pDayMonthThaiEl.textContent = thaiWeekdays[day] + ' · ' + thaiMonths[month];
      pDayMonthPhonEl.textContent = phoneticWeekdays[day] + ' · ' + phoneticMonths[month];
    }
  } catch (e) { Utils.logError(e, 'home.js: today/month widgets'); }

  try {
    const quizListEl = document.getElementById('quiz-list');
    if (!quizListEl) return;

    const searchInput = document.getElementById('search-input');
    const categoryFilters = document.getElementById('category-filters');
    const filtersRoot = document.getElementById('filters');
    const viewToggle = document.getElementById('view-toggle');

    const STORAGE_HOME_FILTER_CATEGORY = 'thaiQuest.home.filter.category';
    const STORAGE_HOME_VIEW_MODE = 'thaiQuest.home.viewMode';
    const STORAGE_HOME_QUEST_COLLAPSED_PREFIX = 'thaiQuest.home.questCollapsed.';
    const MODE_BROWSE = 'browse';
    const MODE_QUEST = 'quest';

    let quizzes = [];
    let quizMetaById = Object.create(null);
    let categories = [];
    let selectedCategoryFilter = '';
    let isQuizzesLoaded = false;

    const collapsedQuestState = Object.create(null);

    let questsData = null;
    let questsLoadPromise = null;
    let questsLoadError = null;

    let viewMode = MODE_BROWSE;
    let modeStored = false;
    try {
      const storedMode = (window.StorageService && window.StorageService.getItem(STORAGE_HOME_VIEW_MODE)) || '';
      if (storedMode === MODE_QUEST) viewMode = MODE_QUEST;
      if (storedMode) modeStored = true;
    } catch (_) {}
    if (!modeStored) viewMode = MODE_QUEST;

    function updateViewToggleUI() {
      if (!viewToggle) return;
      const chips = viewToggle.querySelectorAll('.view-chip');
      for (let i = 0; i < chips.length; i++) {
        const chip = chips[i];
        const mode = chip && chip.dataset ? chip.dataset.mode : '';
        const isActive = mode === viewMode || (!mode && viewMode === MODE_BROWSE);
        if (isActive) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
        try { chip.setAttribute('aria-pressed', isActive ? 'true' : 'false'); } catch (_) {}
      }
    }

    function updateFiltersVisibility() {
      const hide = viewMode === MODE_QUEST;
      if (filtersRoot) {
        if (hide) {
          filtersRoot.setAttribute('aria-hidden', 'true');
        } else {
          filtersRoot.removeAttribute('aria-hidden');
        }
      }
      if (searchInput) {
        try { searchInput.disabled = hide; } catch (_) {}
      }
      if (categoryFilters) {
        const chipButtons = categoryFilters.querySelectorAll('.chip');
        for (let i = 0; i < chipButtons.length; i++) {
          const btn = chipButtons[i];
          if (!btn) continue;
          if (typeof btn.disabled === 'boolean') {
            btn.disabled = hide;
          } else if (hide) {
            btn.setAttribute('tabindex', '-1');
          } else {
            btn.removeAttribute('tabindex');
          }
        }
        if (hide) {
          categoryFilters.setAttribute('aria-hidden', 'true');
        } else {
          categoryFilters.removeAttribute('aria-hidden');
        }
      }
      try {
        if (document && document.body && document.body.classList) {
          document.body.classList.toggle('quest-mode', hide);
        }
      } catch (_) {}
    }

    function getQuestCollapsedStored(questId) {
      if (!questId) return null;
      try {
        const key = STORAGE_HOME_QUEST_COLLAPSED_PREFIX + questId;
        const stored = window.StorageService && window.StorageService.getItem(key);
        if (stored === '1') return true;
        if (stored === '0') return false;
        return null;
      } catch (_) {
        return null;
      }
    }

    function getQuestCollapsedRaw(questId) {
      if (!questId) return null;
      if (!(questId in collapsedQuestState)) {
        collapsedQuestState[questId] = getQuestCollapsedStored(questId);
      }
      return collapsedQuestState[questId];
    }

    function isQuestCollapsed(questId) {
      return getQuestCollapsedRaw(questId) === true;
    }

    function setQuestCollapsed(questId, collapsed) {
      if (!questId) return;
      collapsedQuestState[questId] = collapsed === true;
      const key = STORAGE_HOME_QUEST_COLLAPSED_PREFIX + questId;
      try {
        window.StorageService && window.StorageService.setItem(key, collapsed ? '1' : '0');
      } catch (_) {}
    }

    function ensureQuestData() {
      if (questsData) return Promise.resolve(questsData);
      if (questsLoadPromise) return questsLoadPromise;
      questsLoadPromise = Utils.fetchJSONCached('data/quests.json')
        .then(function(data){
          questsLoadPromise = null;
          questsLoadError = null;
          questsData = Array.isArray(data) ? data : [];
          return questsData;
        })
        .catch(function(err){
          questsLoadPromise = null;
          questsLoadError = err;
          questsData = null;
          Utils.logError(err, 'home.js: failed to load data/quests.json');
          throw err;
        });
      return questsLoadPromise;
    }

    function isQuizCompleted(quizId) {
      try {
        const stars = Utils.getQuizStars ? Utils.getQuizStars(quizId) : 0;
        return stars > 0;
      } catch (_) {
        return false;
      }
    }

    function computeQuestStatus(quest) {
      const steps = Array.isArray(quest && quest.steps) ? quest.steps : [];
      const details = [];
      let totalQuizzes = 0;
      let completedQuizzes = 0;
      let nextQuiz = null;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i] || {};
        const ids = Array.isArray(step.quizIds) ? step.quizIds.filter(function(id){ return !!id; }) : [];
        const quizzesInStep = [];
        let completedInStep = 0;
        for (let j = 0; j < ids.length; j++) {
          const id = ids[j];
          const meta = quizMetaById[id] || {};
          const label = meta.title || id;
          const href = meta.href || ('quiz.html?quiz=' + id);
          let answered = 0;
          let cap = 100;
          let starCount = 0;
          let starDisplay = '';
          try {
            const progress = Utils.getQuizProgress ? Utils.getQuizProgress(id) : { questionsAnswered: 0 };
            answered = progress && progress.questionsAnswered != null ? parseInt(progress.questionsAnswered, 10) || 0 : 0;
          } catch (_) { answered = 0; }
          try {
            cap = Utils.getQuestionCap ? Utils.getQuestionCap() : 100;
          } catch (_) { cap = 100; }
          try {
            starCount = Utils.getQuizStars ? Utils.getQuizStars(id) : 0;
            if (Utils && typeof Utils.formatStars === 'function' && starCount >= 0) {
              starDisplay = Utils.formatStars(starCount);
            }
          } catch (_) { starCount = 0; }
          const cappedAnswered = Math.max(0, Math.min(cap, answered));
          const done = starCount > 0;
          quizzesInStep.push({
            id: id,
            title: label,
            href: href,
            complete: done,
            answered: cappedAnswered,
            cap: cap,
            stars: starCount,
            starText: starDisplay,
            progressLabel: 'Questions: ' + cappedAnswered + '/' + cap,
            starsLabel: 'Stars: ' + starCount + '/3'
          });
          totalQuizzes += 1;
          if (done) {
            completedInStep += 1;
            completedQuizzes += 1;
          } else if (!nextQuiz) {
            nextQuiz = { id: id, title: label, href: href };
          }
        }
        const isComplete = quizzesInStep.length > 0 && completedInStep === quizzesInStep.length;
        details.push({
          title: step.title || ('Stage ' + (i + 1)),
          quizzes: quizzesInStep,
          hasQuizzes: quizzesInStep.length > 0,
          complete: isComplete,
          completedCount: completedInStep
        });
      }

      return {
        total: totalQuizzes,
        completed: completedQuizzes,
        nextQuiz: nextQuiz,
        steps: details
      };
    }

    function buildQuestStatusMap(quests) {
      const statusById = Object.create(null);
      const questsById = Object.create(null);
      for (let i = 0; i < quests.length; i++) {
        const quest = quests[i] || {};
        const questId = quest.id || ('quest-' + i);
        questsById[questId] = quest;
        statusById[questId] = computeQuestStatus(quest);
      }
      return { statusById: statusById, questsById: questsById };
    }

    function createQuestCard(quest, questId, status, context) {
      let isPreview = !!quest.preview;
      const requiredQuestId = quest.requiresQuestId || quest.unlocksAfter || '';

      if (isPreview && requiredQuestId) {
        const reqStatus = context.statusById[requiredQuestId];
        if (reqStatus && reqStatus.total > 0 && reqStatus.completed >= reqStatus.total) {
          isPreview = false;
        }
      }

      const card = document.createElement('div');
      card.className = 'quest-card';
      if (isPreview) card.className += ' preview';

      const header = document.createElement('div');
      header.className = 'quest-header';
      const titleEl = document.createElement('div');
      titleEl.className = 'quest-title';
      const prefix = quest.emoji ? quest.emoji + ' ' : '';
      titleEl.textContent = prefix + (quest.title || 'Quest');
      header.appendChild(titleEl);
      if (quest.tagline && !isPreview) {
        const tagline = document.createElement('div');
        tagline.className = 'quest-tagline';
        tagline.textContent = quest.tagline;
        header.appendChild(tagline);
      }
      card.appendChild(header);

      if (quest.goal) {
        const goal = document.createElement('p');
        goal.className = 'quest-goal';
        goal.textContent = 'Goal: ' + quest.goal;
        card.appendChild(goal);
      }

      if (isPreview) {
        const steps = Array.isArray(quest.steps) ? quest.steps : [];
        const topics = document.createElement('ul');
        topics.className = 'quest-preview-topics';
        for (let s = 0; s < steps.length; s++) {
          const step = steps[s] || {};
          if (!step.title) continue;
          const li = document.createElement('li');
          li.textContent = step.title;
          topics.appendChild(li);
        }
        if (topics.children.length) card.appendChild(topics);

        const overlay = document.createElement('div');
        overlay.className = 'quest-lock-overlay';
        try { overlay.setAttribute('aria-hidden', 'true'); } catch (_) {}
        const overlayMsg = document.createElement('div');
        overlayMsg.className = 'quest-lock-message';
        const questName = quest.title || 'this quest';
        if (requiredQuestId && context.questsById[requiredQuestId] && context.questsById[requiredQuestId].title) {
          overlayMsg.textContent = 'Finish ' + context.questsById[requiredQuestId].title + ' to unlock ' + questName + '.';
        } else {
          overlayMsg.textContent = questName + ' is coming soon.';
        }
        overlay.appendChild(overlayMsg);
        card.appendChild(overlay);
        return card;
      }

      const progress = document.createElement('div');
      progress.className = 'quest-progress';
      if (status.total > 0) {
        const clamped = Math.min(status.completed, status.total);
        progress.textContent = clamped + ' / ' + status.total + ' quizzes complete';
        try { progress.setAttribute('aria-label', 'Quest progress: ' + clamped + ' of ' + status.total + ' quizzes complete'); } catch (_) {}
      } else {
        progress.textContent = 'No quizzes assigned yet.';
      }
      card.appendChild(progress);

      const isQuestComplete = status.total > 0 && status.completed >= status.total;
      let collapsePreference = getQuestCollapsedRaw(questId);
      if (isQuestComplete) {
        if (collapsePreference == null) {
          setQuestCollapsed(questId, true);
          collapsePreference = true;
        }
      } else {
        collapsePreference = false;
      }

      const isCollapsed = collapsePreference === true;
      if (isCollapsed) card.classList.add('collapsed');

      if (isQuestComplete) {
        const collapseBtn = document.createElement('button');
        collapseBtn.type = 'button';
        collapseBtn.className = 'quest-collapse-btn';
        const expanded = !isCollapsed;
        collapseBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        collapseBtn.textContent = isCollapsed ? 'Show details' : 'Hide details';
        collapseBtn.classList.add(isCollapsed ? 'collapsed' : 'expanded');
        collapseBtn.addEventListener('click', function(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          const next = !isQuestCollapsed(questId);
          setQuestCollapsed(questId, next);
          updateUI();
        });
        card.appendChild(collapseBtn);
      }

      const chipsWrap = document.createElement('div');
      chipsWrap.className = 'quest-steps';
      const nextQuizId = status.nextQuiz ? status.nextQuiz.id : '';
      let nextUnlocked = !nextQuizId;

      for (let s = 0; s < status.steps.length; s++) {
        const stepInfo = status.steps[s];
        const quizzes = Array.isArray(stepInfo.quizzes) ? stepInfo.quizzes : [];
        for (let q = 0; q < quizzes.length; q++) {
          const quiz = quizzes[q];
          const link = document.createElement('a');
          let linkClass = 'quest-quiz';
          if (quiz.complete) linkClass += ' complete';
          let isLocked = false;
          if (!quiz.complete) {
            if (!nextQuizId) {
              isLocked = false;
            } else if (!nextUnlocked && quiz.id === nextQuizId) {
              isLocked = false;
              nextUnlocked = true;
            } else if (!nextUnlocked) {
              isLocked = true;
            } else {
              isLocked = true;
            }
          }
          if (!quiz.complete && !isLocked && quiz.id === nextQuizId) linkClass += ' next';
          if (isLocked) linkClass += ' locked';
          link.className = linkClass;
          link.href = quiz.href;

          const textWrap = document.createElement('span');
          textWrap.className = 'quest-quiz-text';
          const titleSpan = document.createElement('span');
          titleSpan.className = 'quest-quiz-title';
          titleSpan.textContent = quiz.title;
          textWrap.appendChild(titleSpan);
          const metaSpan = document.createElement('span');
          metaSpan.className = 'quest-quiz-meta';
          let starInfo = quiz.starsLabel;
          if (quiz.starText) starInfo += ' ' + quiz.starText;
          metaSpan.textContent = quiz.progressLabel + ' • ' + starInfo;
          textWrap.appendChild(metaSpan);
          link.appendChild(textWrap);
          try {
            const labelPrefix = quiz.complete ? 'Review ' : 'Open ';
            const ariaDetails = quiz.progressLabel + ', Stars ' + quiz.stars + ' of 3';
            link.setAttribute('aria-label', labelPrefix + quiz.title + ' (' + ariaDetails + ')');
            link.title = quiz.title;
            if (isLocked) link.setAttribute('aria-disabled', 'true');
          } catch (_) {}
          if (isLocked) {
            try { link.tabIndex = -1; } catch (_) {}
          }
          chipsWrap.appendChild(link);
        }
      }

      const actions = document.createElement('div');
      actions.className = 'quest-actions';
      if (status.total > 0) {
        if (status.completed >= status.total) {
          const done = document.createElement('span');
          done.className = 'quest-finished';
          done.textContent = 'Quest complete! 🎉';
          actions.appendChild(done);
        } else if (status.nextQuiz) {
          const btn = document.createElement('a');
          btn.className = 'start-btn quest-action-btn';
          btn.href = status.nextQuiz.href;
          const startText = status.completed === 0 ? 'Start quest' : 'Continue';
          btn.textContent = startText;
          try { btn.setAttribute('aria-label', startText + ' with ' + status.nextQuiz.title); } catch (_) {}
          actions.appendChild(btn);
        }
      }

      if (!isCollapsed) {
        if (chipsWrap.children.length) card.appendChild(chipsWrap);
        card.appendChild(actions);
      }

      return card;
    }

    function renderQuestCards() {
      Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(quizListEl); })();

      if (questsLoadError) {
        const error = document.createElement('div');
        error.className = 'empty';
        error.textContent = 'Failed to load quests.';
        quizListEl.appendChild(error);
        return;
      }

      if (!questsData) {
        const loading = document.createElement('div');
        loading.className = 'empty';
        loading.textContent = 'Loading quests…';
        quizListEl.appendChild(loading);
        ensureQuestData()
          .then(function(){ if (viewMode === MODE_QUEST) renderQuestCards(); })
          .catch(function(){ if (viewMode === MODE_QUEST) renderQuestCards(); });
        return;
      }

      const quests = Array.isArray(questsData) ? questsData : [];
      if (!quests.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'Quests coming soon!';
        quizListEl.appendChild(empty);
        return;
      }

      const statusMap = buildQuestStatusMap(quests);
      const frag = document.createDocumentFragment();
      for (let i = 0; i < quests.length; i++) {
        const quest = quests[i] || {};
        const questId = quest.id || ('quest-' + i);
        const status = statusMap.statusById[questId] || { total: 0, completed: 0, nextQuiz: null, steps: [] };
        const card = createQuestCard(quest, questId, status, statusMap);
        frag.appendChild(card);
      }

      quizListEl.appendChild(frag);
    }

    function renderCategoryChips() {
      if (!categoryFilters) return;
      Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(categoryFilters); })();

      const categoryCounts = {};
      for (let i = 0; i < quizzes.length; i++) {
        const quiz = quizzes[i];
        const cats = quiz && Array.isArray(quiz.categories) ? quiz.categories : [];
        for (let j = 0; j < cats.length; j++) {
          const cat = cats[j];
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      }

      const allChip = document.createElement('button');
      allChip.type = 'button';
      allChip.className = 'chip';
      allChip.textContent = 'All (' + quizzes.length + ')';
      allChip.dataset.value = '';
      if (!selectedCategoryFilter) allChip.classList.add('active');
      categoryFilters.appendChild(allChip);

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = cat + ' (' + (categoryCounts[cat] || 0) + ')';
        chip.dataset.value = cat;
        if (selectedCategoryFilter && selectedCategoryFilter === cat) chip.classList.add('active');
        categoryFilters.appendChild(chip);
      }
    }

    function filterQuizzes() {
      const term = (searchInput && searchInput.value || '').toLowerCase().trim();
      const activeChip = categoryFilters ? categoryFilters.querySelector('.chip.active') : null;
      const activeCategory = activeChip ? (activeChip.dataset.value || '') : '';

      return quizzes.filter(function(q){
        const matchesTerm = !term || (
          q._titleLower.indexOf(term) !== -1 ||
          q._descriptionLower.indexOf(term) !== -1
        );
        const matchesCategory = !activeCategory || (q.categories && q.categories.indexOf(activeCategory) !== -1);
        return matchesTerm && matchesCategory;
      });
    }

    function renderQuizCards(items) {
      Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(quizListEl); })();
      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No quizzes found.';
        quizListEl.appendChild(empty);
        return;
      }

      const frag = document.createDocumentFragment();
      for (let i = 0; i < items.length; i++) {
        const q = items[i];
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.onclick = function() { window.location.href = q.href; };

        const h2 = document.createElement('h2');
        h2.textContent = q.title;

        const p = document.createElement('p');
        p.textContent = q.description;

        const starsWrap = document.createElement('div');
        starsWrap.className = 'star-rating';
        try {
          const starsCount = Utils.getQuizStars(q.id);
          const starsText = Utils.formatStars(starsCount);
          starsWrap.textContent = starsText || '';
          if (starsText) {
            try {
              var sl = (Utils && Utils.i18n && Utils.i18n.statsStarsAriaLabel) || 'Completion stars';
              starsWrap.setAttribute('aria-label', sl);
            } catch (_) {
              starsWrap.setAttribute('aria-label', 'Completion stars');
            }
            starsWrap.title = Utils.getStarRulesTooltip();
          }
        } catch (_) {}

        const features = document.createElement('ul');
        features.className = 'features';
        const bulletList = Array.isArray(q.bullets) ? q.bullets : [];
        for (let b = 0; b < bulletList.length; b++) {
          const li = document.createElement('li');
          li.textContent = '✅ ' + bulletList[b];
          features.appendChild(li);
        }

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
      }
      quizListEl.appendChild(frag);
    }

    function updateUI() {
      if (!isQuizzesLoaded && viewMode === MODE_BROWSE) {
        Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(quizListEl); })();
        const loading = document.createElement('div');
        loading.className = 'empty';
        loading.textContent = 'Loading quizzes…';
        quizListEl.appendChild(loading);
        return;
      }
      if (viewMode === MODE_QUEST) {
        renderQuestCards();
      } else {
        renderQuizCards(filterQuizzes());
      }
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

    function setViewMode(mode, options) {
      const next = mode === MODE_QUEST ? MODE_QUEST : MODE_BROWSE;
      const force = options && options.force;
      const changed = viewMode !== next || !!force;
      viewMode = next;
      if (!(options && options.skipStorage)) {
        try { window.StorageService && window.StorageService.setItem(STORAGE_HOME_VIEW_MODE, next); } catch (_) {}
      }
      updateViewToggleUI();
      updateFiltersVisibility();
      if (changed) updateUI();
    }

    function wireUpEvents() {
      if (searchInput) {
        searchInput.addEventListener('input', function(){
          if (viewMode !== MODE_BROWSE) return;
          updateUIDebounced();
        });
      }
      if (categoryFilters) {
        categoryFilters.addEventListener('click', function(ev) {
          if (viewMode !== MODE_BROWSE) return;
          const target = ev.target;
          if (!(target instanceof Element)) return;
          const chip = target.closest('.chip');
          if (!chip) return;
          const currentlyActive = categoryFilters.querySelector('.chip.active');
          if (currentlyActive) currentlyActive.classList.remove('active');
          chip.classList.add('active');
          try {
            selectedCategoryFilter = String(chip.dataset.value || '');
            window.StorageService && window.StorageService.setItem(STORAGE_HOME_FILTER_CATEGORY, selectedCategoryFilter);
          } catch (_) { selectedCategoryFilter = String(chip.dataset.value || ''); }
          updateUI();
        });
      }
      if (viewToggle) {
        viewToggle.addEventListener('click', function(ev) {
          const target = ev.target;
          if (!(target instanceof Element)) return;
          const chip = target.closest('.view-chip');
          if (!chip) return;
          const mode = chip.dataset.mode || MODE_BROWSE;
          setViewMode(mode);
        });
      }
    }

    updateViewToggleUI();
    updateFiltersVisibility();
    updateUI();

    (function init(){
      Utils.fetchJSONCached('data/quizzes.json')
        .then(function(data){
          const rawList = Array.isArray(data) ? data : [];
          quizMetaById = Object.create(null);
          const visibleList = [];
          for (let i = 0; i < rawList.length; i++) {
            const q = rawList[i];
            if (!q) continue;
            q._titleLower = (q.title || '').toLowerCase();
            q._descriptionLower = (q.description || '').toLowerCase();
            if (q.id) quizMetaById[q.id] = q;
            if (q.visible === false) continue;
            visibleList.push(q);
          }
          quizzes = visibleList;
          quizzes.sort(function(a, b) {
            return (a.title || '').localeCompare(b.title || '');
          });
          const categorySet = {};
          for (let i = 0; i < quizzes.length; i++) {
            const quiz = quizzes[i];
            const cats = quiz && Array.isArray(quiz.categories) ? quiz.categories : [];
            for (let j = 0; j < cats.length; j++) {
              categorySet[cats[j]] = true;
            }
          }
          categories = Object.keys(categorySet).sort();
          try {
            const savedCat = (window.StorageService && window.StorageService.getItem(STORAGE_HOME_FILTER_CATEGORY)) || '';
            if (savedCat && categories.indexOf(savedCat) !== -1) selectedCategoryFilter = savedCat;
          } catch (_) {}
          renderCategoryChips();
          updateFiltersVisibility();
          wireUpEvents();
          isQuizzesLoaded = true;
          setViewMode(viewMode, { skipStorage: true, force: true });
        })
        .catch(function(err){
          const error = document.createElement('div');
          error.className = 'empty';
          error.textContent = 'Failed to load quizzes.';
          quizListEl.appendChild(error);
          Utils.logError(err, 'home.js: failed to load data/quizzes.json');
        });
    })();

  } catch (e) { Utils.logError(e, 'home.js: init'); }
})();
