(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};
  var logError = (NS.core && NS.core.error && NS.core.error.logError) || function(){};

  function disableOtherButtons(optionsEl, exceptBtn) {
    try {
      if (!optionsEl) return;
      var buttons = optionsEl.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        var b = buttons[i];
        if (b !== exceptBtn) {
          b.disabled = true;
          try { b.setAttribute('aria-disabled', 'true'); } catch (_) {}
          try { b.tabIndex = -1; } catch (_) {}
        }
      }
    } catch (e) { logError(e, 'ui.quizui.disableOtherButtons'); }
  }

  function scheduleAutoAdvance(state, callback, delayMs) {
    try {
      if (!state) return;
      if (state.autoAdvanceTimerId != null) { clearTimeout(state.autoAdvanceTimerId); }
      state.autoAdvanceTimerId = setTimeout(function(){
        try { state.autoAdvanceTimerId = null; callback && callback(); } catch (e) { logError(e, 'ui.quizui.scheduleAutoAdvance.cb'); }
      }, Math.max(0, parseInt(delayMs, 10) || 0));
    } catch (e) { logError(e, 'ui.quizui.scheduleAutoAdvance'); }
  }

  function updateStats(statsEl, quizId, state) {
    try {
      if (!statsEl || !state) return;
      var qa = state.questionsAnswered || 0;
      var ca = state.correctAnswers || 0;
      var acc = qa > 0 ? Math.round((ca / qa) * 100) : 0;
      var baseText = 'Questions: ' + qa + ' | Correct: ' + ca + ' | Accuracy: ' + acc + '%';

      var starsText = '';
      try {
        if (quizId && global && global.Utils && typeof global.Utils.computeStarRating === 'function' && typeof global.Utils.formatStars === 'function') {
          var stars = global.Utils.computeStarRating(ca, qa);
          starsText = global.Utils.formatStars(stars) || '';
        }
      } catch (_) {}

      while (statsEl.firstChild) statsEl.removeChild(statsEl.firstChild);
      statsEl.appendChild(global.document.createTextNode(baseText));
      if (starsText) {
        statsEl.appendChild(global.document.createTextNode(' | '));
        var span = global.document.createElement('span');
        span.className = 'stats-stars';
        span.textContent = starsText;
        try {
          if (global && global.Utils && typeof global.Utils.getStarRulesTooltip === 'function') {
            span.title = global.Utils.getStarRulesTooltip();
            try { span.setAttribute('aria-label', (global.Utils.i18n && global.Utils.i18n.statsStarsAriaLabel) || 'Completion stars'); } catch (_) {}
          }
        } catch (_) {}
        statsEl.appendChild(span);
      }
    } catch (e) { logError(e, 'ui.quizui.updateStats'); }
  }

  NS.ui.quizui = { disableOtherButtons: disableOtherButtons, scheduleAutoAdvance: scheduleAutoAdvance, updateStats: updateStats };
})(window);

