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

    const soundControls = (global && global.Utils && global.Utils.sound) || null;

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
            if (soundControls && typeof soundControls.maybeSpeakThaiFromAnswer === 'function') {
              soundControls.maybeSpeakThaiFromAnswer(answer);
            }
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
    if (soundControls && typeof soundControls.injectControls === 'function') {
      soundControls.injectControls();
    }

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
