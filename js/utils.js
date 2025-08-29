(function(global) {
  'use strict';

  // Centralized error handling system
  const ErrorHandler = {
    // Wrap a function with error handling and logging
    wrap: function(fn, context, fallback = null) {
      return function(...args) {
        try {
          return fn.apply(this, args);
        } catch (error) {
          logError(error, context);
          return fallback;
        }
      };
    },

    // Safe execution with fallback value
    safe: function(fn, fallback = null) {
      return function(...args) {
        try {
          return fn.apply(this, args);
        } catch {
          return fallback;
        }
      };
    },

    // Async-safe wrapper for promises
    wrapAsync: function(fn, context) {
      return function(...args) {
        return fn.apply(this, args).catch(function(error) {
          logError(error, context);
          throw error;
        });
      };
    },

    // Safe DOM operations
    safeDOM: function(operation, fallback = null) {
      return function(...args) {
        try {
          return operation.apply(this, args);
        } catch {
          return fallback;
        }
      };
    }
  };

  function logError(error, context) {
    try {
      if (context) {
        console.error('[ThaiQuest]', context, error);
      } else {
        console.error('[ThaiQuest]', error);
      }
    } catch (_) {}
  }
  
  function fetchJSON(url) {
    return fetch(url).then(function(r) { if (!r.ok) { throw new Error('HTTP ' + r.status + ' for ' + url); } return r.json(); });
  }

  // Simple in-memory cache for JSON fetches
  const __jsonCache = Object.create(null);
  function fetchJSONCached(url) {
    try {
      if (__jsonCache[url]) return __jsonCache[url];
      __jsonCache[url] = fetchJSON(url).catch(function(err){ delete __jsonCache[url]; throw err; });
      return __jsonCache[url];
    } catch (e) { logError(e, 'Utils.fetchJSONCached'); return fetchJSON(url); }
  }

  function fetchJSONs(urls) {
    return Promise.all(urls.map(fetchJSONCached));
  }

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function pickUniqueChoices(pool, count, keyFn, seed) {
    const choices = [];
    const usedKeys = new Set();

    if (seed != null) {
      choices.push(seed);
      const seedKey = ErrorHandler.safe(keyFn, null)(seed);
      if (seedKey != null) {
        usedKeys.add(String(seedKey));
      }
    }

    while (choices.length < count && choices.length < pool.length) {
      const candidate = pickRandom(pool);
      const key = ErrorHandler.safe(keyFn, null)(candidate);
      if (key == null) continue;
      const keyStr = String(key);
      if (!usedKeys.has(keyStr)) {
        usedKeys.add(keyStr);
        choices.push(candidate);
      }
    }

    return choices;
  }

  function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) {
      h = h.split('').map(function(x){ return x + x; }).join('');
    }
    const bigint = parseInt(h, 16);
    if (isNaN(bigint)) return { r: 0, g: 0, b: 0 };
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  function rgbToHex(r, g, b) {
    function toHex(x) { return Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'); }
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h, s: s, l: l };
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  function adjustLightness(hex, delta) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const newL = Math.max(0, Math.min(1, hsl.l + delta));
    const nrgb = hslToRgb(hsl.h, hsl.s, newL);
    return rgbToHex(nrgb.r, nrgb.g, nrgb.b);
  }

  function getDisplayHex(baseHex, modifier) {
    if (!modifier) return baseHex;
    const eng = String(modifier.english || '');
    if (/^light$/i.test(eng)) return adjustLightness(baseHex, 0.25);
    if (/^dark$/i.test(eng)) return adjustLightness(baseHex, -0.25);
    return baseHex;
  }

  function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    const a = (typeof alpha === 'number') ? alpha : 1;
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a + ')';
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    if (text) {
      el.textContent = text;
      el.style.display = '';
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  function byProp(propName) {
    return function(obj) { return obj && obj[propName]; };
  }

  // i18n labels and body class helper
  const i18n = {
    answerPrefix: 'Answer: ',
    exampleLabel: 'Example',
    labelEnglishThaiPrefix: 'English and Thai: ',
    labelNumberThaiPrefix: 'Number and Thai: ',
    labelClassMarkerLengthPrefix: 'Class + Marker + Length: ',
    noDataMessage: 'No data available for this quiz.'
  };

  function getBodyClass(quizId) {
    const map = {
      consonants: 'consonant-quiz',
      vowels: 'vowel-quiz',
      colors: 'color-quiz',
      numbers: 'numbers-quiz',
      time: 'time-quiz',
      tones: 'questions-quiz',
      questions: 'questions-quiz',
      verbs: 'questions-quiz',
      family: 'family-quiz',
      classifiers: 'classifiers-quiz',
      rooms: 'rooms-quiz',
      jobs: 'jobs-quiz',
      foods: 'foods-quiz',
      months: 'questions-quiz',
      tenses: 'questions-quiz',
      days: 'questions-quiz',
      'body-parts': 'questions-quiz',
      prepositions: 'questions-quiz'
    };
    return map[quizId] || null;
  }

  // Default progressive difficulty configuration (4→5→6→7→8 at 20/40/60/80)
  const DEFAULT_PROGRESSIVE_DIFFICULTY = {
    choicesThresholds: [
      { correctAnswers: 20, choices: 5 },
      { correctAnswers: 40, choices: 6 },
      { correctAnswers: 60, choices: 7 },
      { correctAnswers: 80, choices: 8 }
    ]
  };

  // Helper to create progressive difficulty config with defaults
  function createProgressiveDifficulty(config = {}) {
    return Object.assign({}, DEFAULT_PROGRESSIVE_DIFFICULTY, config);
  }

  // Compute number of choices based on state and progressiveDifficulty (falls back to defaults)
  function getChoicesCountForState(state, progressiveDifficulty, baseChoices) {
    try {
      var currentChoices = (typeof baseChoices === 'number' && baseChoices > 0) ? baseChoices : 4;
      // If explicitly disabled, keep base choices
      if (progressiveDifficulty === false || progressiveDifficulty === null) return currentChoices;
      // Normalize PD (undefined → defaults, object → merged with defaults)
      var pd = (progressiveDifficulty === undefined)
        ? DEFAULT_PROGRESSIVE_DIFFICULTY
        : createProgressiveDifficulty(progressiveDifficulty || {});

      if (pd && state && typeof state.correctAnswers === 'number' && Array.isArray(pd.choicesThresholds)) {
        var correctCount = state.correctAnswers;
        for (var i = pd.choicesThresholds.length - 1; i >= 0; i--) {
          var threshold = pd.choicesThresholds[i];
          if (correctCount >= threshold.correctAnswers) {
            currentChoices = threshold.choices;
            break;
          }
        }
      }
      return currentChoices;
    } catch (e) {
      logError(e, 'Utils.getChoicesCountForState');
      return (typeof baseChoices === 'number' && baseChoices > 0) ? baseChoices : 4;
    }
  }

  // Helper to create a quiz with progressive difficulty enabled by default
  function createQuizWithProgressiveDifficulty(params) {
    // Enable progressive difficulty by default unless explicitly disabled
    const progressiveDifficulty = params.progressiveDifficulty === false ? null : 
      (params.progressiveDifficulty || DEFAULT_PROGRESSIVE_DIFFICULTY);
    
    return createStandardQuiz({
      ...params,
      progressiveDifficulty
    });
  }

  // Creates a standard quiz configuration block for ThaiQuiz.setupQuiz
  // params: { data, examples?, exampleKey?(answer)->string, answerKey='phonetic', buildSymbol(answer) -> { english, thai, emoji? }, choices=4, labelPrefix='English and Thai: ', progressiveDifficulty? }
  function createStandardQuiz(params) {
    const data = params && params.data || [];
    const examples = params && params.examples || null;
    const exampleKeyFn = params && params.exampleKey;
    const answerKey = (params && params.answerKey) || 'phonetic';
    const buildSymbol = (params && params.buildSymbol) || function(a){ return { english: String(a && a.english || ''), thai: String(a && a.thai || '') }; };
    const choices = (params && params.choices) || 4;
    const labelPrefix = (params && params.labelPrefix) || ((global && global.Utils && global.Utils.i18n && global.Utils.i18n.labelEnglishThaiPrefix) || 'English and Thai: ');
    const progressiveDifficulty = params && params.progressiveDifficulty ? createProgressiveDifficulty(params.progressiveDifficulty) : null;

    return {
      pickRound: function(state) {
        if (!Array.isArray(data) || data.length === 0) return null;
        const currentChoices = getChoicesCountForState(state, progressiveDifficulty, choices);
        const answer = pickRandom(data);
        const uniqueChoices = pickUniqueChoices(data, currentChoices, byProp(answerKey), answer);
        return { answer: answer, choices: uniqueChoices };
      },
      renderSymbol: function(answer, els, state) {
        try {
          const sym = buildSymbol(answer) || {};
          
          renderEnglishThaiSymbol(els.symbolEl, {
            english: String(sym.english || ''),
            thai: String(sym.thai || ''),
            emoji: String(sym.emoji || ''),
            ariaPrefix: labelPrefix
          });
        } catch (e) { logError(e, 'Utils.createStandardQuiz.renderSymbol'); }
      },
      renderButtonContent: function(choice, state) { 
        return choice && choice[answerKey];
      },
      // Helper function to check if hints should be hidden based on progressive difficulty
      shouldHideHints: function(state) {
        return false; // Hints are always shown now
      },
      ariaLabelForChoice: function(choice, state) { 
        return ((global && global.Utils && global.Utils.i18n && global.Utils.i18n.answerPrefix) || 'Answer: ') + (choice && choice[answerKey]);
      },
      isCorrect: function(choice, answer) { return (choice && choice[answerKey]) === (answer && answer[answerKey]); },
      onAnswered: function(ctx) {
        if (!examples) return;
        const correct = ctx && ctx.correct;
        if (!correct) return;
        ErrorHandler.wrap(function() {
          const fb = document.getElementById('feedback');
          const ans = ctx && ctx.answer || {};
          const key = ErrorHandler.safe(exampleKeyFn, ans.english)(ans);
          const ex = examples[key];
          renderExample(fb, ex);
        }, 'Utils.createStandardQuiz.onAnswered')();
      }
    };
  }

  // Deprecated: emoji rules have been migrated to per-item data (kept as no-ops for backward compatibility)
  function buildEmojiMatcher() { return function(){ return ''; }; }

  // Simple validation helpers (console-only)
  function validateDataset(items, requiredKeys) {
    try {
      let missing = 0;
      for (let i = 0; i < (items || []).length; i++) {
        for (let j = 0; j < (requiredKeys || []).length; j++) {
          if (items[i][requiredKeys[j]] == null) { missing++; break; }
        }
      }
      if (missing > 0) console.warn('[validateDataset] Missing required keys in', missing, 'items');
    } catch (e) { logError(e, 'Utils.validateDataset'); }
  }

  function validateExamples(items, examples, key) {
    try {
      if (!examples || typeof examples !== 'object') return;
      const k = key || 'english';
      const set = Object.create(null);
      for (let i = 0; i < (items || []).length; i++) {
        const val = String(items[i][k] || '');
        set[val] = true;
      }
      const unknown = [];
      Object.keys(examples).forEach(function(exKey){ if (!set[exKey]) unknown.push(exKey); });
      if (unknown.length) console.warn('[validateExamples] Unmatched example keys:', unknown.slice(0, 10).join(', '), (unknown.length > 10 ? '…' : ''));
    } catch (e) { logError(e, 'Utils.validateExamples'); }
  }

  // Renders a common "English + Thai (+ optional emoji)" symbol layout and sets ARIA label
  function renderEnglishThaiSymbol(symbolEl, params) {
    try {
      const english = String((params && params.english) || '');
      const thai = String((params && params.thai) || '');
      const emoji = String((params && params.emoji) || '');
      const ariaPrefix = String((params && params.ariaPrefix) || ((global && global.Utils && global.Utils.i18n && global.Utils.i18n.labelEnglishThaiPrefix) || 'English and Thai: '));

      // Clear previous content
      while (symbolEl.firstChild) symbolEl.removeChild(symbolEl.firstChild);

      if (emoji) {
        const emojiLine = document.createElement('div');
        emojiLine.className = 'emoji-line';
        emojiLine.setAttribute('aria-hidden', 'true');
        emojiLine.textContent = emoji;
        symbolEl.appendChild(emojiLine);
      }

      // English text node
      symbolEl.appendChild(document.createTextNode(english));

      if (thai) {
        const sep = document.createElement('span');
        sep.className = 'secondary';
        sep.textContent = thai;
        symbolEl.appendChild(sep);
      }

      symbolEl.setAttribute('aria-label', ariaPrefix + english + (thai ? ' — ' + thai : ''));
    } catch (e) { logError(e, 'Utils.renderEnglishThaiSymbol'); }
  }

  // Renders an example block into the feedback element
  function renderExample(feedbackEl, exampleText) {
    try {
      // Clear previous content
      while (feedbackEl.firstChild) feedbackEl.removeChild(feedbackEl.firstChild);

      if (!exampleText) return;

      const card = document.createElement('div');
      card.className = 'example';
      card.setAttribute('aria-label', 'Example sentence');

      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = ((global && global.Utils && global.Utils.i18n && global.Utils.i18n.exampleLabel) || 'Example');

      const text = document.createElement('div');
      text.className = 'text';
      text.textContent = String(exampleText);

      card.appendChild(label);
      card.appendChild(text);
      feedbackEl.appendChild(card);
    } catch (e) { logError(e, 'Utils.renderExample'); }
  }

  // New helpers for data-driven configs and shared UI snippets
  function createEmojiGetter() { return function(){ return ''; }; }

  function loadEmojiGetter() { return Promise.resolve(function(){ return ''; }); }

  function insertProTip(text) {
    try {
      const footer = document.querySelector('.footer');
      if (footer && text) {
        const tip = document.createElement('div');
        tip.className = 'pro-tip';
        tip.innerHTML = '<small>' + text + '</small>';
        footer.appendChild(tip);
      }
    } catch (e) { logError(e, 'Utils.insertProTip'); }
  }

  function insertConsonantLegend() {
    try {
      const symbolAnchor = document.getElementById('symbol');
      if (symbolAnchor && symbolAnchor.parentNode && !document.querySelector('.legend-chips')) {
        const legend = document.createElement('div');
        legend.className = 'legend legend-chips';
        var chips = [
          { text: 'Middle Class', cls: 'middle-class' },
          { text: 'High Class', cls: 'high-class' },
          { text: 'Low Class', cls: 'low-class' }
        ];
        chips.forEach(function(c){
          var span = document.createElement('span');
          span.className = 'class-chip ' + c.cls;
          span.textContent = c.text;
          legend.appendChild(span);
        });
        symbolAnchor.parentNode.insertBefore(legend, symbolAnchor);
      }
    } catch (e) { logError(e, 'Utils.insertConsonantLegend'); }
  }

  function renderVowelSymbol(symbolEl, symbol) {
    try {
      const raw = String(symbol || '');
      const out = raw.replace(/-/g, '\u0E01');
      symbolEl.textContent = out;
      symbolEl.setAttribute('aria-label', 'Thai vowel symbol: ' + raw);
    } catch (e) { logError(e, 'Utils.renderVowelSymbol'); }
  }

  // Provide a shared default elements config
  var defaultElements = { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' };

  // Generate a unique PlayerID using browser fingerprinting and local storage
  function generatePlayerID() {
    try {
      // Check if we already have a stored ID
      let playerID = localStorage.getItem('thaiQuestPlayerID');
      
      if (!playerID) {
        // Create a fingerprint from browser characteristics
        const fingerprint = [
          navigator.userAgent,
          navigator.language,
          screen.width + 'x' + screen.height,
          new Date().getTimezoneOffset(),
          navigator.hardwareConcurrency || 'unknown',
          navigator.platform,
          navigator.cookieEnabled ? 'cookies' : 'no-cookies'
        ].join('|');
        
        // Generate a hash from the fingerprint
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Create a readable ID (e.g., "Player_ABC123")
        const hashStr = Math.abs(hash).toString(36).toUpperCase();
        playerID = `Player_${hashStr}`;
        
        // Store it for future use
        localStorage.setItem('thaiQuestPlayerID', playerID);
      }
      
      return playerID;
    } catch (e) {
      logError(e, 'Utils.generatePlayerID');
      // Fallback to a simple timestamp-based ID
      return `Player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
  }

  // Get the display name for the player (custom name or fallback to generated ID)
  function getPlayerDisplayName() {
    try {
      const customName = localStorage.getItem('thaiQuestCustomName');
      if (customName && customName.trim()) {
        return customName.trim();
      }
      return generatePlayerID();
    } catch (e) {
      logError(e, 'Utils.getPlayerDisplayName');
      return generatePlayerID();
    }
  }

  // Set a custom player name
  function setPlayerCustomName(name) {
    try {
      const trimmedName = (name || '').trim();
      if (trimmedName) {
        localStorage.setItem('thaiQuestCustomName', trimmedName);
      } else {
        localStorage.removeItem('thaiQuestCustomName');
      }
      return true;
    } catch (e) {
      logError(e, 'Utils.setPlayerCustomName');
      return false;
    }
  }

  // Get the custom player name (returns null if not set)
  function getPlayerCustomName() {
    try {
      const customName = localStorage.getItem('thaiQuestCustomName');
      return customName && customName.trim() ? customName.trim() : null;
    } catch (e) {
      logError(e, 'Utils.getPlayerCustomName');
      return null;
    }
  }

  // ---- Leveling & XP from stars ----
  // Parameters for the power-law curve XP_total(L) = A * L^p (L is a non-negative integer level index)
  const XP_CURVE = { A: 80, p: 1.9 };

  function xpTotalForLevel(levelIndex) {
    try {
      const L = Math.max(0, parseInt(levelIndex, 10) || 0);
      return XP_CURVE.A * Math.pow(L, XP_CURVE.p);
    } catch (e) {
      logError(e, 'Utils.xpTotalForLevel');
      return 0;
    }
  }

  function xpDeltaForLevel(levelIndex) {
    try {
      const L = Math.max(0, parseInt(levelIndex, 10) || 0);
      return xpTotalForLevel(L + 1) - xpTotalForLevel(L);
    } catch (e) {
      logError(e, 'Utils.xpDeltaForLevel');
      return XP_CURVE.A;
    }
  }

  function getXPForStars(stars) {
    try {
      const n = Math.max(0, Math.min(3, parseInt(stars, 10) || 0));
      if (n === 3) return 40;
      if (n === 2) return 20;
      if (n === 1) return 10;
      return 0;
    } catch (e) {
      logError(e, 'Utils.getXPForStars');
      return 0;
    }
  }

  function getTotalXPFromStars() {
    try {
      // Prefer aggregated cache to avoid recomputation
      const agg = aggregateGlobalStatsFromStorage();
      return agg.totalXPFromStars;
    } catch (e) {
      logError(e, 'Utils.getTotalXPFromStars');
      return 0;
    }
  }

  function getLevelIndexFromTotalXP(totalXP) {
    try {
      const x = Math.max(0, Number(totalXP) || 0);
      const L = Math.floor(Math.pow(x / XP_CURVE.A, 1 / XP_CURVE.p));
      return Math.max(0, L);
    } catch (e) {
      logError(e, 'Utils.getLevelIndexFromTotalXP');
      return 0;
    }
  }

  // Player-facing values derived from stars and the XP curve
  function getPlayerLevel() {
    try {
      const totalXP = getTotalXPFromStars();
      const levelIndex = getLevelIndexFromTotalXP(totalXP);
      // Display levels start at 1
      return levelIndex + 1;
    } catch (e) {
      logError(e, 'Utils.getPlayerLevel');
      return 1;
    }
  }

  function getPlayerXP() {
    try {
      const totalXP = getTotalXPFromStars();
      const levelIndex = getLevelIndexFromTotalXP(totalXP);
      const base = xpTotalForLevel(levelIndex);
      const inLevel = Math.max(0, Math.round(totalXP - base));
      return inLevel;
    } catch (e) {
      logError(e, 'Utils.getPlayerXP');
      return 0;
    }
  }

  function getPlayerMaxXP() {
    try {
      const totalXP = getTotalXPFromStars();
      const levelIndex = getLevelIndexFromTotalXP(totalXP);
      return Math.max(1, Math.round(xpDeltaForLevel(levelIndex)));
    } catch (e) {
      logError(e, 'Utils.getPlayerMaxXP');
      return Math.max(1, Math.round(XP_CURVE.A));
    }
  }

  // ---- Aggregated global stats derived from per-quiz progress ----
  function getAllSavedProgress() {
    try {
      const entries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || key.indexOf('thaiQuest.progress.') !== 0) continue;
        const quizId = key.substring('thaiQuest.progress.'.length);
        try {
          const raw = localStorage.getItem(key);
          const data = JSON.parse(raw || '{}');
          const questionsAnswered = Math.max(0, parseInt(data && data.questionsAnswered, 10) || 0);
          const correctAnswers = Math.max(0, parseInt(data && data.correctAnswers, 10) || 0);
          entries.push({ quizId: quizId, questionsAnswered: questionsAnswered, correctAnswers: correctAnswers });
        } catch (_) {}
      }
      return entries;
    } catch (e) {
      logError(e, 'Utils.getAllSavedProgress');
      return [];
    }
  }

  function aggregateGlobalStatsFromStorage() {
    try {
      const progressEntries = getAllSavedProgress();
      let totalQuestionsAnswered = 0;
      let totalCorrectAnswers = 0;
      let quizzesCompleted = 0;
      let totalStarsEarned = 0;
      let totalXPFromStars = 0;

      for (let i = 0; i < progressEntries.length; i++) {
        const p = progressEntries[i];
        totalQuestionsAnswered += p.questionsAnswered;
        totalCorrectAnswers += p.correctAnswers;
        if (p.correctAnswers >= 100) quizzesCompleted += 1;
        try {
          const s = computeStarRating(p.correctAnswers, p.questionsAnswered);
          totalStarsEarned += s;
          totalXPFromStars += getXPForStars(s);
        } catch (_) {}
      }

      const totalAccuracy = totalQuestionsAnswered > 0
        ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
        : 0;

      return {
        totalQuestionsAnswered: totalQuestionsAnswered,
        totalCorrectAnswers: totalCorrectAnswers,
        totalAccuracy: totalAccuracy,
        quizzesCompleted: quizzesCompleted,
        totalStarsEarned: totalStarsEarned,
        totalXPFromStars: totalXPFromStars
      };
    } catch (e) {
      logError(e, 'Utils.aggregateGlobalStatsFromStorage');
      return { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, totalAccuracy: 0, quizzesCompleted: 0, totalStarsEarned: 0, totalXPFromStars: 0 };
    }
  }

  function getPlayerAccuracy() {
    try {
      const agg = aggregateGlobalStatsFromStorage();
      return agg.totalAccuracy;
    } catch (e) {
      logError(e, 'Utils.getPlayerAccuracy');
      return 0;
    }
  }

  function getQuizzesCompleted() {
    try {
      const agg = aggregateGlobalStatsFromStorage();
      return agg.quizzesCompleted;
    } catch (e) {
      logError(e, 'Utils.getQuizzesCompleted');
      return 0;
    }
  }

  function getTotalXPEarned() {
    try {
      const storedTotal = localStorage.getItem('thaiQuestTotalXPEarned');
      return storedTotal ? parseInt(storedTotal, 10) : 1450;
    } catch (e) {
      logError(e, 'Utils.getTotalXPEarned');
      return 1450;
    }
  }

  function getTotalStarsEarned() {
    try {
      const agg = aggregateGlobalStatsFromStorage();
      return agg.totalStarsEarned;
    } catch (e) {
      logError(e, 'Utils.getTotalStarsEarned');
      return 0;
    }
  }

  function getTotalXPFromStarsCached() {
    try {
      const agg = aggregateGlobalStatsFromStorage();
      return agg.totalXPFromStars;
    } catch (e) {
      logError(e, 'Utils.getTotalXPFromStarsCached');
      return 0;
    }
  }

  function getPlayerAvatar() {
    try {
      const storedAvatar = localStorage.getItem('thaiQuestPlayerAvatar');
      return storedAvatar || 'https://placehold.co/80x80/png';
    } catch (e) {
      logError(e, 'Utils.getPlayerAvatar');
      return 'https://placehold.co/80x80/png';
    }
  }

  // Helper function to format numbers with commas
  function formatNumber(num) {
    try {
      return num.toLocaleString();
    } catch (e) {
      return String(num);
    }
  }

  // Helper function to calculate XP progress percentage
  function getXPProgressPercentage() {
    try {
      const currentXP = getPlayerXP();
      const maxXP = getPlayerMaxXP();
      return Math.min(100, Math.max(0, Math.round((currentXP / maxXP) * 100)));
    } catch (e) {
      logError(e, 'Utils.getXPProgressPercentage');
      return 45;
    }
  }

  // ---- Quiz progress persistence (localStorage) ----
  function getQuizProgress(quizId) {
    try {
      if (!quizId) return { questionsAnswered: 0, correctAnswers: 0 };
      const key = 'thaiQuest.progress.' + quizId;
      const raw = localStorage.getItem(key);
      if (!raw) return { questionsAnswered: 0, correctAnswers: 0 };
      const data = JSON.parse(raw);
      const qa = parseInt(data && data.questionsAnswered, 10) || 0;
      const ca = parseInt(data && data.correctAnswers, 10) || 0;
      return { questionsAnswered: qa, correctAnswers: ca };
    } catch (e) {
      logError(e, 'Utils.getQuizProgress');
      return { questionsAnswered: 0, correctAnswers: 0 };
    }
  }

  function saveQuizProgress(quizId, stateLike) {
    try {
      if (!quizId) return;
      const key = 'thaiQuest.progress.' + quizId;
      const payload = {
        questionsAnswered: Math.max(0, parseInt(stateLike && stateLike.questionsAnswered, 10) || 0),
        correctAnswers: Math.max(0, parseInt(stateLike && stateLike.correctAnswers, 10) || 0)
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      logError(e, 'Utils.saveQuizProgress');
    }
  }

  function computeStarRating(correctAnswers, questionsAnswered) {
    try {
      const c = Math.max(0, parseInt(correctAnswers, 10) || 0);
      const q = Math.max(0, parseInt(questionsAnswered, 10) || 0);
      if (c < 100) return 0;
      const acc = q > 0 ? (c / q) * 100 : 0;
      if (acc > 95) return 3;
      if (acc > 85) return 2;
      if (acc > 75) return 1;
      return 0;
    } catch (e) {
      logError(e, 'Utils.computeStarRating');
      return 0;
    }
  }

  function formatStars(stars) {
    const n = Math.max(0, Math.min(3, parseInt(stars, 10) || 0));
    const filled = '★'.repeat(n);
    const empty = '☆'.repeat(3 - n);
    return filled + empty;
  }

  function getQuizStars(quizId) {
    try {
      const p = getQuizProgress(quizId);
      return computeStarRating(p.correctAnswers, p.questionsAnswered);
    } catch (e) {
      logError(e, 'Utils.getQuizStars');
      return 0;
    }
  }

  function resetAllProgress() {
    ErrorHandler.wrap(function() {
      const toDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.indexOf('thaiQuest.progress.') === 0) toDelete.push(key);
      }
      toDelete.forEach(function(k){ 
        ErrorHandler.safe(function() { localStorage.removeItem(k); })();
      });
      
      // Also clear custom player name
      ErrorHandler.safe(function() { localStorage.removeItem('thaiQuestCustomName'); })();
    }, 'Utils.resetAllProgress')();
  }

  function getStarRulesTooltip() {
    return 'Star rules: 3★ = 100 right with >95% accuracy; 2★ = 100 right with >85% accuracy; 1★ = 100 right with >75% accuracy; 0★ otherwise.';
  }

  global.Utils = {
    fetchJSON: fetchJSON,
    fetchJSONCached: fetchJSONCached,
    fetchJSONs: fetchJSONs,
    pickRandom: pickRandom,
    pickUniqueChoices: pickUniqueChoices,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    adjustLightness: adjustLightness,
    getDisplayHex: getDisplayHex,
    hexToRgba: hexToRgba,
    setText: setText,
    byProp: byProp,
    createStandardQuiz: createStandardQuiz,
    buildEmojiMatcher: buildEmojiMatcher,
    validateDataset: validateDataset,
    validateExamples: validateExamples,
    renderEnglishThaiSymbol: renderEnglishThaiSymbol,
    renderExample: renderExample,
    logError: logError,
    // Error handling system
    ErrorHandler: ErrorHandler,
    // New helpers
    createEmojiGetter: createEmojiGetter,
    loadEmojiGetter: loadEmojiGetter,
    insertProTip: insertProTip,
    insertConsonantLegend: insertConsonantLegend,
    renderVowelSymbol: renderVowelSymbol,
    // Progressive difficulty helpers
    createProgressiveDifficulty: createProgressiveDifficulty,
    DEFAULT_PROGRESSIVE_DIFFICULTY: DEFAULT_PROGRESSIVE_DIFFICULTY,
    getChoicesCountForState: getChoicesCountForState,
    createQuizWithProgressiveDifficulty: createQuizWithProgressiveDifficulty,
    // i18n and class map
    i18n: i18n,
    getBodyClass: getBodyClass,
    // shared default elements
    defaultElements: defaultElements,
    // Player ID generation
    generatePlayerID: generatePlayerID,
    // Player name management
    getPlayerDisplayName: getPlayerDisplayName,
    setPlayerCustomName: setPlayerCustomName,
    getPlayerCustomName: getPlayerCustomName,
    // Player data functions
    getPlayerLevel: getPlayerLevel,
    getPlayerXP: getPlayerXP,
    getPlayerMaxXP: getPlayerMaxXP,
    // XP curve & stars → XP
    XP_CURVE: XP_CURVE,
    xpTotalForLevel: xpTotalForLevel,
    xpDeltaForLevel: xpDeltaForLevel,
    getXPForStars: getXPForStars,
    getTotalXPFromStars: getTotalXPFromStars,
    getTotalXPFromStarsCached: getTotalXPFromStarsCached,
    getPlayerAccuracy: getPlayerAccuracy,
    getQuizzesCompleted: getQuizzesCompleted,
    getTotalXPEarned: getTotalXPEarned,
    getTotalStarsEarned: getTotalStarsEarned,
    getPlayerAvatar: getPlayerAvatar,
    formatNumber: formatNumber,
    getXPProgressPercentage: getXPProgressPercentage,
    // Progress persistence exports
    getAllSavedProgress: getAllSavedProgress,
    aggregateGlobalStatsFromStorage: aggregateGlobalStatsFromStorage,
    getQuizProgress: getQuizProgress,
    saveQuizProgress: saveQuizProgress,
    computeStarRating: computeStarRating,
    formatStars: formatStars,
    getQuizStars: getQuizStars,
    resetAllProgress: resetAllProgress,
    getStarRulesTooltip: getStarRulesTooltip
  };
})(window);