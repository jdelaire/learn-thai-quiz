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

    const state = {
      currentAnswer: null,
      questionsAnswered: 0,
      correctAnswers: 0,
      autoAdvanceTimerId: null
    };

    function updateStats() {
      const accuracy = state.questionsAnswered > 0
        ? Math.round((state.correctAnswers / state.questionsAnswered) * 100)
        : 0;
      statsEl.textContent = `Questions: ${state.questionsAnswered} | Correct: ${state.correctAnswers} | Accuracy: ${accuracy}%`;
    }

    function pickQuestion() {
      if (state.autoAdvanceTimerId != null) {
        clearTimeout(state.autoAdvanceTimerId);
        state.autoAdvanceTimerId = null;
      }
      feedbackEl.textContent = '';
      nextBtn.style.display = 'none';
      optionsEl.innerHTML = '';

      const round = (typeof config.pickRound === 'function') ? config.pickRound(state) : null;
      if (!round || !round.answer || !Array.isArray(round.choices)) {
        return;
      }

      const answer = round.answer;
      const choices = shuffle(round.choices.slice());
      state.currentAnswer = answer;

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
        if (typeof config.renderButtonContent === 'function') {
          const content = config.renderButtonContent(choice, state);
          if (typeof content === 'string' && /<[^>]+>/.test(content)) {
            btn.innerHTML = content;
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

          if (isCorrect) {
            state.correctAnswers++;
            feedbackEl.textContent = '✅ Correct!';
            nextBtn.style.display = 'inline-block';

            if (state.autoAdvanceTimerId != null) {
              clearTimeout(state.autoAdvanceTimerId);
            }
            state.autoAdvanceTimerId = setTimeout(() => {
              state.autoAdvanceTimerId = null;
              pickQuestion();
            }, 1500);
          } else {
            feedbackEl.textContent = '❌ Try again!';
          }

          updateStats();

          if (typeof config.onAnswered === 'function') {
            try { config.onAnswered({ correct: isCorrect, choice, answer, state }); } catch (_) {}
          }
        };

        optionsEl.appendChild(btn);
      });
    }

    if (config.enableKeyboard !== false) {
      document.addEventListener('keydown', (e) => {
        if (/^[1-9]$/.test(e.key)) {
          const buttons = optionsEl.querySelectorAll('button');
          const index = parseInt(e.key, 10) - 1;
          if (buttons[index]) {
            buttons[index].click();
          }
        } else if (e.key === 'Enter' && nextBtn.style.display !== 'none') {
          nextBtn.click();
        }
      });
    }

    nextBtn.onclick = pickQuestion;

    // Initialize
    pickQuestion();
    updateStats();

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

// Inject Airbnb-style app chrome (top app bar for quizzes, bottom navigation for all pages)
(function() {
  try {
    var body = document.body;
    if (!body) return;

    // Bottom navigation
    if (!document.querySelector('.bottom-nav')) {
      var nav = document.createElement('nav');
      nav.className = 'bottom-nav';
      var items = [
        { href: 'index.html', label: 'Home', icon: '🏠' },
        { href: 'consonant-quiz.html', label: 'ABC', icon: '🔤' },
        { href: 'vowel-quiz.html', label: 'Vowels', icon: '🔡' },
        { href: 'color-quiz.html', label: 'Colors', icon: '🎨' },
        { href: 'time-quiz.html', label: 'Time', icon: '⏰' }
      ];
      var current = (location.pathname || '').split('/').pop() || 'index.html';
      items.forEach(function(item) {
        var a = document.createElement('a');
        a.href = item.href;
        a.setAttribute('aria-label', item.label);
        if (current === item.href || (!current && item.href === 'index.html')) {
          a.classList.add('active');
        }
        a.innerHTML = '<span class="icon" aria-hidden="true">' + item.icon + '</span><span class="label">' + item.label + '</span>';
        nav.appendChild(a);
      });
      body.appendChild(nav);
      body.classList.add('with-bottom-nav');
    }

    // Top app bar on quiz pages
    var isQuiz = /(consonant-quiz|vowel-quiz|color-quiz|numbers-quiz|time-quiz|questions-quiz)\b/.test(body.className || '');
    if (isQuiz && !document.querySelector('.top-app-bar')) {
      var titleEl = document.querySelector('h1');
      var title = (titleEl && titleEl.textContent ? titleEl.textContent : (document.title || 'Thai Quiz')).trim();
      var bar = document.createElement('div');
      bar.className = 'top-app-bar';
      var back = document.createElement('a');
      back.href = 'index.html';
      back.className = 'top-back';
      back.setAttribute('aria-label', 'Back to home');
      back.innerHTML = '←';
      var t = document.createElement('div');
      t.className = 'top-title';
      t.textContent = title;
      bar.appendChild(back);
      bar.appendChild(t);
      body.insertBefore(bar, body.firstChild);
      body.classList.add('with-top-bar');
    }
  } catch (e) {}
})();