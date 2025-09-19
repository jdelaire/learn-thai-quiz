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
    function insertSoundToggle() {
      try {
        const footer = document.querySelector('.footer');
        if (!footer || footer.querySelector('.sound-toggle')) return;
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
        });
        footer.appendChild(btn);

        // Optional speed toggle (Slow <-> Normal)
        const speedBtn = document.createElement('button');
        speedBtn.type = 'button';
        speedBtn.className = 'chip sound-speed-toggle';
        function labelFor(rate) { return (rate <= 0.85) ? '🐢 Speed: Slow' : '🏃 Speed: Normal'; }
        function normalize(rate) { var r = parseFloat(rate); if (!isFinite(r)) r = 0.8; if (r <= 0.85) return 0.8; return 1.0; }
        let current = normalize(getSoundRate());
        speedBtn.textContent = labelFor(current);
        speedBtn.addEventListener('click', function(){
          current = (current <= 0.85) ? 1.0 : 0.8;
          setSoundRate(current);
          try { speedBtn.textContent = labelFor(current); } catch (_) {}
        });
        footer.appendChild(speedBtn);
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
      questionsAnswered: initialProgress.questionsAnswered || 0,
      correctAnswers: initialProgress.correctAnswers || 0,
      autoAdvanceTimerId: null
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
        if (!isSoundOn()) return;
        if (!(window.Utils && window.Utils.TTS && typeof window.Utils.TTS.speakThai === 'function' && window.Utils.TTS.isSupported && window.Utils.TTS.isSupported())) return;
        var text = '';
        try { text = (ans && (ans.thai || ans.symbol)) ? String(ans.thai || ans.symbol) : ''; } catch (_) { text = ''; }
        if (!text) return;
        window.Utils.TTS.speakThai(text, { rate: getSoundRate(), pitch: 1.0 });
      } catch (_) {}
    }

    function pickQuestion() {
      if (state.autoAdvanceTimerId != null) {
        clearTimeout(state.autoAdvanceTimerId);
        state.autoAdvanceTimerId = null;
      }
      // Ensure any lingering example overlay is removed before rendering a new question
      Utils.ErrorHandler.safe(function(){ if (Utils && typeof Utils.dismissExampleOverlay === 'function') Utils.dismissExampleOverlay(); })();
      feedbackEl.textContent = '';
      nextBtn.style.display = 'none';
      Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(optionsEl); })();

      const round = (typeof config.pickRound === 'function') ? config.pickRound(state) : null;
      if (!round || !round.answer || !Array.isArray(round.choices)) {
        showNoDataMessage();
        return;
      }

      const answer = round.answer;
      const choices = shuffle(round.choices.slice());
      state.currentAnswer = answer;

      if (typeof config.onRoundStart === 'function') {
        Utils.ErrorHandler.wrap(config.onRoundStart, 'quiz.js: onRoundStart')({ answer: answer, choices: choices, state: state });
      }

      if (typeof config.renderSymbol === 'function') {
        config.renderSymbol(answer, { symbolEl, optionsEl, feedbackEl, nextBtn, statsEl }, state);
      } else {
        // Fallback rendering if provided by round
        if (round.symbolText != null) {
          symbolEl.textContent = String(round.symbolText);
        }
        if (round.symbolAriaLabel) {
          symbolEl.setAttribute('aria-label', round.symbolAriaLabel);
        }
        if (round.symbolStyle && typeof round.symbolStyle === 'object') {
          Object.assign(symbolEl.style, round.symbolStyle);
        }
      }

      choices.forEach((choice) => {
        const btn = document.createElement('button');
        Utils.ErrorHandler.safeDOM(function() {
          btn.type = 'button';
        })();
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

        btn.onclick = () => {
          state.questionsAnswered++;
          const isCorrect = (typeof config.isCorrect === 'function')
            ? !!config.isCorrect(choice, answer, state)
            : (choice === answer);

          btn.classList.remove('answer-correct', 'answer-wrong');
          void btn.offsetWidth;

          if (isCorrect) {
            state.correctAnswers++;
            feedbackEl.textContent = '';
            btn.classList.add('answer-correct');
            btn.addEventListener('animationend', function handle() {
              btn.classList.remove('answer-correct');
            }, { once: true });
            // Speak Thai of the correct answer when enabled
            maybeSpeakThaiFromAnswer(answer);
            // Disable other options until next question
            disableOtherButtons(btn);
            // Also prevent re-clicks on the correct button during the delay
            Utils.ErrorHandler.safeDOM(function() {
              btn.onclick = null;
            })();
            // Don't show next button - auto-advance only
            nextBtn.style.display = 'none';

            // Use longer delay (3 seconds) for quizzes that show examples
            const delay = (typeof config.onAnswered === 'function') ? 3000 : 1500;
            scheduleAutoAdvance(delay);
          } else {
            feedbackEl.textContent = '';
            btn.classList.add('answer-wrong');
            btn.addEventListener('animationend', function handle() {
              btn.classList.remove('answer-wrong');
            }, { once: true });
          }

          // Persist progress after each answer
          Utils.ErrorHandler.safe(function() {
            if (quizId && global && global.Utils && typeof global.Utils.saveQuizProgress === 'function') {
              global.Utils.saveQuizProgress(quizId, {
                questionsAnswered: state.questionsAnswered,
                correctAnswers: state.correctAnswers
              });
            }
          })();

          updateStats();

          if (typeof config.onAnswered === 'function') {
            Utils.ErrorHandler.wrap(config.onAnswered, 'quiz.js: onAnswered')({ correct: isCorrect, choice, answer, state });
          }
        };

        optionsEl.appendChild(btn);
      });

      Utils.ErrorHandler.safeDOM(function() {
        optionsEl.focus();
      })();
    }

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
