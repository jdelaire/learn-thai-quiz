(function(global) {
  'use strict';

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function setupQuiz(config) {
    const elementsConfig = config.elements || {};
    const symbolEl = document.getElementById(elementsConfig.symbol);
    const optionsEl = document.getElementById(elementsConfig.options);
    const feedbackEl = document.getElementById(elementsConfig.feedback);
    const nextBtn = document.getElementById(elementsConfig.nextBtn);
    const statsEl = document.getElementById(elementsConfig.stats);

    if (!symbolEl || !optionsEl || !feedbackEl || !nextBtn || !statsEl) {
      return null;
    }

    // Sound preference helpers (persisted)
    const SOUND_KEY = 'thaiQuest.settings.sound';
    const SOUND_RATE_KEY = 'thaiQuest.settings.soundRate';
    function isSoundOn() {
      try {
        const v = (window.StorageService && window.StorageService.getItem(SOUND_KEY)) || '';
        return String(v).toLowerCase() === 'on';
      } catch (_) { return false; }
    }
    function setSoundOn(on) {
      try { window.StorageService && window.StorageService.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (_) {}
    }
    function getSoundRate() {
      try {
        var raw = (window.StorageService && window.StorageService.getItem(SOUND_RATE_KEY)) || '';
        var n = parseFloat(raw);
        if (!isFinite(n)) n = 0.8; // default: slightly slower
        if (n < 0.5) n = 0.5; if (n > 1.5) n = 1.5;
        return n;
      } catch (_) { return 0.8; }
    }
    function setSoundRate(rate) {
      try { window.StorageService && window.StorageService.setItem(SOUND_RATE_KEY, String(rate)); } catch (_) {}
    }
    function isVoiceSupported() {
      try { return !!(document && document.body && document.body.dataset && document.body.dataset.voiceSupported === '1'); } catch (_) { return false; }
    }

    function hasThaiVoice() {
      try {
        return !!(window.Utils && window.Utils.TTS && typeof window.Utils.TTS.pickThaiVoice === 'function' && window.Utils.TTS.pickThaiVoice());
      } catch (_) { return false; }
    }

    function getThaiVoiceInstallMessage() {
      try {
        var ua = (navigator && navigator.userAgent) ? String(navigator.userAgent) : '';
        var plat = (navigator && navigator.platform) ? String(navigator.platform) : '';
        var isIOS = /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(plat) && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 1);
        var isAndroid = /Android/i.test(ua);
        var isWindows = /Windows/i.test(ua);
        var isMac = !isIOS && /Mac OS X|Macintosh/i.test(ua);
        if (isIOS) return 'To enable audio: Settings → Accessibility → Spoken Content → Voices → Add New Voice → Thai';
        if (isAndroid) return 'To enable audio: Settings → System → Languages & input → Text‑to‑speech → Install voice data → Thai';
        if (isMac) return 'To enable audio: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → Thai';
        if (isWindows) return 'To enable audio: Settings → Time & Language → Speech → Manage voices → Add voices → Thai';
        return 'Thai voice not available. Install Thai TTS in your system settings.';
      } catch (_) {
        return 'Thai voice not available. Install Thai TTS in your system settings.';
      }
    }

    function insertSoundToggle() {
      try {
        const footer = document.querySelector('.footer');
        if (!footer || footer.querySelector('.sound-toggle') || footer.querySelector('.sound-help')) return;
        if (!isVoiceSupported()) return;

        // Gate on Thai voice availability. If absent, show a help tip instead of controls.
        var canSpeakThai = !!(window.Utils && window.Utils.TTS && window.Utils.TTS.isSupported && window.Utils.TTS.isSupported() && hasThaiVoice());
        if (!canSpeakThai) {
          var help = document.createElement('div');
          help.className = 'sound-help';
          help.textContent = getThaiVoiceInstallMessage();
          footer.appendChild(help);
          return;
        }
        // Controls wrapper to group sound toggles together
        const wrap = document.createElement('div');
        wrap.className = 'sound-controls';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip sound-toggle';
        const on = isSoundOn();
        btn.textContent = on ? '🔊 Sound: On' : '🔇 Sound: Off';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.addEventListener('click', function(){
          const nowOn = !isSoundOn();
          setSoundOn(nowOn);
          try { btn.textContent = nowOn ? '🔊 Sound: On' : '🔇 Sound: Off'; } catch (_) {}
          try { btn.setAttribute('aria-pressed', nowOn ? 'true' : 'false'); } catch (_) {}
          try { window.speechSynthesis && window.speechSynthesis.resume(); } catch (_) {}
        });
        wrap.appendChild(btn);

        // Speed toggle (cycles among clearer distinct rates)
        const speedBtn = document.createElement('button');
        speedBtn.type = 'button';
        speedBtn.className = 'chip sound-speed-toggle';
        var RATES = [0.6, 0.8, 1.0];
        function nearestRate(val){
          var r = parseFloat(val);
          if (!isFinite(r)) r = 0.8;
          var best = RATES[0]; var bestDiff = Math.abs(RATES[0] - r);
          for (var i=1;i<RATES.length;i++){ var d = Math.abs(RATES[i]-r); if (d < bestDiff) { best = RATES[i]; bestDiff = d; } }
          return best;
        }
        function labelFor(rate) { return 'Speed: ' + (rate.toFixed(1) + 'x'); }
        var current = nearestRate(getSoundRate());
        setSoundRate(current);
        speedBtn.textContent = labelFor(current);
        speedBtn.addEventListener('click', function(){
          var idx = 0;
          for (var i=0;i<RATES.length;i++){ if (Math.abs(RATES[i]-current) < 0.001) { idx = i; break; } }
          current = RATES[(idx + 1) % RATES.length];
          setSoundRate(current);
          try { speedBtn.textContent = labelFor(current); } catch (_) {}
          try { window.speechSynthesis && window.speechSynthesis.resume(); } catch (_) {}
        });
        wrap.appendChild(speedBtn);
        footer.appendChild(wrap);
      } catch (_) {}
    }

    // Ensure options container is focusable for scoped keyboard events
    Utils.ErrorHandler.safeDOM(function() {
      if (!optionsEl.hasAttribute('tabindex')) optionsEl.setAttribute('tabindex', '0');
    })();

    const quizId = (config && config.quizId) || (document && document.body && document.body.dataset && document.body.dataset.quizId) || null;
    // Initialize state from persisted progress when available
    const initialProgress = (global && global.Utils && typeof global.Utils.getQuizProgress === 'function' && quizId)
      ? global.Utils.getQuizProgress(quizId)
      : { questionsAnswered: 0, correctAnswers: 0 };

    const state = {
      currentAnswer: null,
      currentChoices: [],
      currentRound: null,
      currentRoundInfo: null,
      questionsAnswered: initialProgress.questionsAnswered || 0,
      correctAnswers: initialProgress.correctAnswers || 0,
      autoAdvanceTimerId: null,
      isAwaitingAnswer: true
    };

    function disableOtherButtons(exceptBtn) {
      Utils.ErrorHandler.safeDOM(function() {
        const buttons = optionsEl.querySelectorAll('button');
        buttons.forEach(function(b) {
          if (b !== exceptBtn) {
            b.disabled = true;
            try { b.setAttribute('aria-disabled', 'true'); } catch (_) {}
            try { b.tabIndex = -1; } catch (_) {}
          }
        });
      })();
    }

    function scheduleAutoAdvance(delayMs) {
      if (state.autoAdvanceTimerId != null) {
        clearTimeout(state.autoAdvanceTimerId);
      }
      state.autoAdvanceTimerId = setTimeout(() => {
        state.autoAdvanceTimerId = null;
        pickQuestion();
      }, delayMs);
    }

    function updateStats() {
      const accuracy = state.questionsAnswered > 0
        ? Math.round((state.correctAnswers / state.questionsAnswered) * 100)
        : 0;
      const baseText = `Questions: ${state.questionsAnswered} | Correct: ${state.correctAnswers} | Accuracy: ${accuracy}%`;
      let starsText = '';
      try {
        if (quizId && global && global.Utils && typeof global.Utils.computeStarRating === 'function' && typeof global.Utils.formatStars === 'function') {
          const stars = global.Utils.computeStarRating(state.correctAnswers, state.questionsAnswered);
          starsText = global.Utils.formatStars(stars) || '';
        }
      } catch (_) {}

      // Reset content and compose with a dedicated span for larger stars + tooltip
      Utils.ErrorHandler.safeDOM(function() {
        while (statsEl.firstChild) statsEl.removeChild(statsEl.firstChild);
      })();
      statsEl.appendChild(document.createTextNode(baseText));
      if (starsText) {
        statsEl.appendChild(document.createTextNode(' | '));
        const span = document.createElement('span');
        span.className = 'stats-stars';
        span.textContent = starsText;
        try {
          if (global && global.Utils && typeof global.Utils.getStarRulesTooltip === 'function') {
            span.title = global.Utils.getStarRulesTooltip();
            try {
              var label = (global.Utils && global.Utils.i18n && global.Utils.i18n.statsStarsAriaLabel) || 'Completion stars';
              span.setAttribute('aria-label', label);
            } catch (_) {}
          }
        } catch (_) {}
        statsEl.appendChild(span);
      }
    }

    function showNoDataMessage() {
      try {
        const msg = (global && global.Utils && global.Utils.i18n && global.Utils.i18n.noDataMessage) || 'No data available for this quiz.';
        symbolEl.textContent = msg;
        symbolEl.setAttribute('aria-label', msg);
        Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(optionsEl); })();
        nextBtn.style.display = 'none';
      } catch (_) {}
    }

    function maybeSpeakThaiFromAnswer(ans) {
      try {
        if (!isVoiceSupported()) return;
        if (!isSoundOn()) return;
        if (!(window.Utils && window.Utils.TTS && typeof window.Utils.TTS.speakThai === 'function' && window.Utils.TTS.isSupported && window.Utils.TTS.isSupported())) return;
        var text = '';
        try {
          if (ans && ans.thai) text = String(ans.thai);
          else if (ans && ans.exampleThai) text = String(ans.exampleThai);
          else if (ans && ans.symbol) text = String(ans.symbol);
          else text = '';
        } catch (_) { text = ''; }
        if (!text) return;
        window.Utils.TTS.speakThai(text, { rate: getSoundRate(), pitch: 1.0 });
      } catch (_) {}
    }

    function renderWithChoices(answer, choices, round, opts) {
      if (!answer || !Array.isArray(choices) || choices.length === 0) return;
      opts = opts || {};
      var resetFeedback = opts.resetFeedback !== false;
      var focusOptions = opts.focusOptions !== false;

      if (resetFeedback) {
        feedbackEl.textContent = '';
        Utils.ErrorHandler.safe(function(){ if (Utils && typeof Utils.dismissExampleOverlay === 'function') Utils.dismissExampleOverlay(); })();
      }

      nextBtn.style.display = 'none';
      Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(optionsEl); })();

      var symbolMeta = round || state.currentRoundInfo || {};
      if (typeof config.renderSymbol === 'function') {
        config.renderSymbol(answer, { symbolEl, optionsEl, feedbackEl, nextBtn, statsEl }, state);
      } else {
        if (symbolMeta && symbolMeta.symbolText != null) {
          symbolEl.textContent = String(symbolMeta.symbolText);
        }
        if (symbolMeta && symbolMeta.symbolAriaLabel) {
          symbolEl.setAttribute('aria-label', symbolMeta.symbolAriaLabel);
        }
        if (symbolMeta && symbolMeta.symbolStyle && typeof symbolMeta.symbolStyle === 'object') {
          try { Object.assign(symbolEl.style, symbolMeta.symbolStyle); } catch (_) {}
        }
      }

      choices.forEach(function(choice){
        const btn = document.createElement('button');
        Utils.ErrorHandler.safeDOM(function(){ btn.type = 'button'; })();
        if (typeof config.renderButtonContent === 'function') {
          const content = config.renderButtonContent(choice, state);
          if (content && typeof content === 'object' && 'nodeType' in content) {
            btn.appendChild(content);
          } else {
            btn.textContent = (content == null) ? '' : String(content);
          }
        } else {
          btn.textContent = String(choice);
        }

        if (typeof config.ariaLabelForChoice === 'function') {
          const aria = config.ariaLabelForChoice(choice, state);
          if (aria) btn.setAttribute('aria-label', aria);
        }

        if (typeof config.decorateButton === 'function') {
          config.decorateButton(btn, choice, state);
        }

        btn.onclick = function(){
          state.questionsAnswered++;
          const isCorrect = (typeof config.isCorrect === 'function')
            ? !!config.isCorrect(choice, answer, state)
            : (choice === answer);

          btn.classList.remove('answer-correct', 'answer-wrong');
          void btn.offsetWidth;

          if (isCorrect) {
            state.correctAnswers++;
            state.isAwaitingAnswer = false;
            feedbackEl.textContent = '';
            btn.classList.add('answer-correct');
            btn.addEventListener('animationend', function handle(){
              btn.classList.remove('answer-correct');
            }, { once: true });
            maybeSpeakThaiFromAnswer(answer);
            disableOtherButtons(btn);
            Utils.ErrorHandler.safeDOM(function(){ btn.onclick = null; })();
            nextBtn.style.display = 'none';
            const delay = (typeof config.onAnswered === 'function') ? 3000 : 1500;
            scheduleAutoAdvance(delay);
          } else {
            feedbackEl.textContent = '';
            btn.classList.add('answer-wrong');
            btn.addEventListener('animationend', function handle(){
              btn.classList.remove('answer-wrong');
            }, { once: true });
          }

          Utils.ErrorHandler.safe(function(){
            if (quizId && global && global.Utils && typeof global.Utils.saveQuizProgress === 'function') {
              global.Utils.saveQuizProgress(quizId, {
                questionsAnswered: state.questionsAnswered,
                correctAnswers: state.correctAnswers
              });
            }
          })();

          updateStats();

          if (typeof config.onAnswered === 'function') {
            Utils.ErrorHandler.wrap(config.onAnswered, 'quiz.js: onAnswered')({ correct: isCorrect, choice: choice, answer: answer, state: state });
          }
        };

        optionsEl.appendChild(btn);
      });

      if (focusOptions) {
        Utils.ErrorHandler.safeDOM(function(){ optionsEl.focus(); })();
      }
    }

    function pickQuestion() {
      if (state.autoAdvanceTimerId != null) {
        clearTimeout(state.autoAdvanceTimerId);
        state.autoAdvanceTimerId = null;
      }

      const round = (typeof config.pickRound === 'function') ? config.pickRound(state) : null;
      if (!round || !round.answer || !Array.isArray(round.choices)) {
        showNoDataMessage();
        return;
      }

      const answer = round.answer;
      const choices = shuffle(round.choices.slice());
      state.currentAnswer = answer;
      state.currentChoices = choices.slice();
      state.currentRound = round;
      state.currentRoundInfo = {
        symbolText: round.symbolText,
        symbolStyle: (round.symbolStyle && typeof round.symbolStyle === 'object') ? Object.assign({}, round.symbolStyle) : null,
        symbolAriaLabel: round.symbolAriaLabel || ''
      };
      state.isAwaitingAnswer = true;

      if (typeof config.onRoundStart === 'function') {
        Utils.ErrorHandler.wrap(config.onRoundStart, 'quiz.js: onRoundStart')({ answer: answer, choices: state.currentChoices, state: state });
      }

      renderWithChoices(state.currentAnswer, state.currentChoices, round, { resetFeedback: true, focusOptions: true });
    }

    function handlePhoneticLocaleChange() {
      if (state.autoAdvanceTimerId != null) return;
      if (!state.isAwaitingAnswer) return;
      if (!state.currentAnswer || !Array.isArray(state.currentChoices) || state.currentChoices.length === 0) return;
      renderWithChoices(state.currentAnswer, state.currentChoices, state.currentRound, { resetFeedback: false, focusOptions: false });
    }

    try { document.addEventListener('thaiQuest.phonetics.change', handlePhoneticLocaleChange); } catch (_) {}

    if (config.enableKeyboard !== false) {
      optionsEl.addEventListener('keydown', (e) => {
        if (/^[1-9]$/.test(e.key)) {
          const buttons = optionsEl.querySelectorAll('button');
          const index = parseInt(e.key, 10) - 1;
          if (buttons[index] && !buttons[index].disabled) {
            buttons[index].click();
          }
        }
        // Enter key handling removed since next button is hidden after correct answers
      });
    }

    nextBtn.onclick = pickQuestion;

    // Initialize
    pickQuestion();
    updateStats();
    insertSoundToggle();

    return {
      pickQuestion,
      getState: () => ({
        currentAnswer: state.currentAnswer,
        questionsAnswered: state.questionsAnswered,
        correctAnswers: state.correctAnswers
      })
    };
  }

  global.ThaiQuiz = {
    setupQuiz,
    shuffle
  };
})(window);
