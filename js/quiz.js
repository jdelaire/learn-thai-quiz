(function(global) {
  'use strict';

  function getQuestionCap() {
    try {
      if (global.__TQ && typeof global.__TQ.getQuestionCap === 'function') {
        return global.__TQ.getQuestionCap();
      }
    } catch (_) {}
    return 100;
  }

  function clampToCap(value, cap) {
    var limit = cap || getQuestionCap();
    return Math.max(0, Math.min(limit, parseInt(value, 10) || 0));
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function setupQuiz(config) {
    config = config || {};
    const questionCap = getQuestionCap();
    const utils = (global && global.Utils) || {};
    const bodyDataset = (global.document && global.document.body && global.document.body.dataset) || {};
    const phoneticsSupported = bodyDataset && bodyDataset.phoneticsSupported === '1';
    const phoneticLocalesAttr = bodyDataset && bodyDataset.phoneticLocales || '';
    const defaultElements = utils.defaultElements || {};
    const elementsConfig = Object.assign({}, defaultElements, config.elements || {});
    const symbolEl = document.getElementById(elementsConfig.symbol);
    const optionsEl = document.getElementById(elementsConfig.options);
    const feedbackEl = document.getElementById(elementsConfig.feedback);
    const nextBtn = document.getElementById(elementsConfig.nextBtn);
    const statsEl = document.getElementById(elementsConfig.stats);

    if (!symbolEl || !optionsEl || !feedbackEl || !nextBtn || !statsEl) {
      return null;
    }

    const defaultSoundControls = {
      injectControls: function(){},
      maybeSpeakThaiFromAnswer: function(){ return false; },
      isSoundOn: function(){ return false; },
      setSoundOn: function(){},
      getRate: function(){ return 0.8; },
      setRate: function(){}
    };
    const soundControls = (utils && utils.sound) || defaultSoundControls;
    const phoneticControls = (utils && utils.phoneticsUI && typeof utils.phoneticsUI.injectControls === 'function')
      ? utils.phoneticsUI
      : { injectControls: function(){} };
    const fallbackQuizUI = {
      disableOtherButtons: function(){},
      scheduleAutoAdvance: function(state, callback){
        if (!state) return;
        try {
          if (state.autoAdvanceTimerId != null) {
            clearTimeout(state.autoAdvanceTimerId);
            state.autoAdvanceTimerId = null;
          }
        } catch (_) {}
        if (typeof callback === 'function') callback();
      },
      updateStats: function(){ }
    };
    const quizUI = (utils && utils.quizUI) || fallbackQuizUI;

    // Ensure options container is focusable for scoped keyboard events
    Utils.ErrorHandler.safeDOM(function() {
      if (!optionsEl.hasAttribute('tabindex')) optionsEl.setAttribute('tabindex', '0');
    })();

    const quizId = (config && config.quizId) || (document && document.body && document.body.dataset && document.body.dataset.quizId) || null;
    // Initialize state from persisted progress when available
    const initialProgress = (global && global.Utils && typeof global.Utils.getQuizProgress === 'function' && quizId)
      ? global.Utils.getQuizProgress(quizId)
      : { questionsAnswered: 0, correctAnswers: 0 };
    const initialQuestions = clampToCap(initialProgress.questionsAnswered, questionCap);
    const initialCorrect = Math.max(0, Math.min(initialQuestions, parseInt(initialProgress.correctAnswers, 10) || 0));

    const state = {
      currentAnswer: null,
      currentChoices: [],
      currentRound: null,
      currentRoundInfo: null,
      questionsAnswered: initialQuestions,
      correctAnswers: initialCorrect,
      autoAdvanceTimerId: null,
      isAwaitingAnswer: true,
      maxQuestions: questionCap
    };

    var restartButton = null;
    function ensureRestartButton() {
      if (!quizId || restartButton) return;
      var footer = document.querySelector('.footer');
      if (!footer) return;
      restartButton = document.createElement('button');
      restartButton.type = 'button';
      restartButton.className = 'chip restart-quiz';
      restartButton.textContent = 'Restart Quizz';
      restartButton.setAttribute('aria-label', 'Restart quiz progress');
      restartButton.style.display = 'none';
      restartButton.addEventListener('click', function(){
        restartQuizProgress();
      });
      footer.appendChild(restartButton);
    }

    function updateRestartButtonVisibility() {
      ensureRestartButton();
      if (!restartButton) return;
      restartButton.style.display = state.questionsAnswered >= questionCap ? '' : 'none';
    }

    function restartQuizProgress() {
      try {
        if (state.autoAdvanceTimerId != null) {
          clearTimeout(state.autoAdvanceTimerId);
          state.autoAdvanceTimerId = null;
        }
      } catch (_) {}
      state.currentAnswer = null;
      state.currentChoices = [];
      state.currentRound = null;
      state.currentRoundInfo = null;
      state.questionsAnswered = 0;
      state.correctAnswers = 0;
      state.isAwaitingAnswer = true;
      Utils.ErrorHandler.safeDOM(function(){ feedbackEl.textContent = ''; })();
      Utils.ErrorHandler.safeDOM(function(){ nextBtn.style.display = 'none'; })();
      Utils.ErrorHandler.safe(function(){
        if (quizId && global && global.Utils && typeof global.Utils.saveQuizProgress === 'function') {
          global.Utils.saveQuizProgress(quizId, { questionsAnswered: 0, correctAnswers: 0 });
        }
      })();
      quizUI.updateStats(statsEl, quizId, state);
      updateRestartButtonVisibility();
      pickQuestion();
    }

    ensureRestartButton();

    function showNoDataMessage() {
      try {
        const msg = (global && global.Utils && global.Utils.i18n && global.Utils.i18n.noDataMessage) || 'No data available for this quiz.';
        symbolEl.textContent = msg;
        symbolEl.setAttribute('aria-label', msg);
        Utils.ErrorHandler.safeDOM(function(){ Utils.clearChildren(optionsEl); })();
        nextBtn.style.display = 'none';
        updateRestartButtonVisibility();
      } catch (_) {}
    }

    function createChoiceButton(choice, answer) {
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
        var previousQuestions = state.questionsAnswered;
        var shouldCountQuestion = previousQuestions < questionCap;
        if (shouldCountQuestion) {
          state.questionsAnswered = Math.min(questionCap, previousQuestions + 1);
        }
        const isCorrect = (typeof config.isCorrect === 'function')
          ? !!config.isCorrect(choice, answer, state)
          : (choice === answer);

        btn.classList.remove('answer-correct', 'answer-wrong');
        void btn.offsetWidth;

        if (isCorrect) {
          if (shouldCountQuestion && state.correctAnswers < questionCap) {
            state.correctAnswers = Math.min(questionCap, state.correctAnswers + 1);
          }
          state.isAwaitingAnswer = false;
          feedbackEl.textContent = '';
          btn.classList.add('answer-correct');
          btn.addEventListener('animationend', function handle(){
            btn.classList.remove('answer-correct');
          }, { once: true });
          try { soundControls.maybeSpeakThaiFromAnswer(answer); } catch (_) {}
          quizUI.disableOtherButtons(optionsEl, btn);
          Utils.ErrorHandler.safeDOM(function(){ btn.onclick = null; })();
          nextBtn.style.display = 'none';
          const delay = (typeof config.onAnswered === 'function') ? 3000 : 1500;
          quizUI.scheduleAutoAdvance(state, pickQuestion, delay);
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
              questionsAnswered: Math.min(state.questionsAnswered, questionCap),
              correctAnswers: Math.min(state.correctAnswers, questionCap)
            });
          }
        })();

        quizUI.updateStats(statsEl, quizId, state);
        updateRestartButtonVisibility();

        if (typeof config.onAnswered === 'function') {
          Utils.ErrorHandler.wrap(config.onAnswered, 'quiz.js: onAnswered')({ correct: isCorrect, choice: choice, answer: answer, state: state });
        }
      };

      return btn;
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
        optionsEl.appendChild(createChoiceButton(choice, answer));
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

    function handlePhoneticLocaleChange(evt) {
      try {
        if (evt && evt.detail && evt.detail.quizId && quizId && evt.detail.quizId !== quizId) return;
      } catch (_) {}
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
    quizUI.updateStats(statsEl, quizId, state);
    updateRestartButtonVisibility();
    try { soundControls.injectControls(); } catch (_) {}
    try {
      phoneticControls.injectControls({
        quizId: quizId,
        supported: phoneticsSupported,
        locales: phoneticLocalesAttr
      });
    } catch (_) {}

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
