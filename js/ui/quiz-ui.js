(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};
  var logError = (NS.core && NS.core.error && NS.core.error.logError) || function(){};
  var MAX_QUESTIONS = 100;

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
      var utils = (global && global.Utils) || {};
      var maxQuestions = Math.max(1, parseInt(state.maxQuestions, 10) || MAX_QUESTIONS);
      var qa = Math.max(0, Math.min(maxQuestions, parseInt(state.questionsAnswered, 10) || 0));
      var ca = Math.max(0, Math.min(qa, parseInt(state.correctAnswers, 10) || 0));
      var acc = qa > 0 ? Math.round((ca / qa) * 100) : 0;
      var baseText = 'Questions: ' + qa + '/' + maxQuestions + ' | Correct: ' + ca + ' | Accuracy: ' + acc + '%';

      var computeStars = (typeof utils.computeStarRating === 'function') ? utils.computeStarRating : function(){ return 0; };
      var formatStars = (typeof utils.formatStars === 'function') ? utils.formatStars : function(){ return '☆☆☆'; };
      var getTooltip = (typeof utils.getStarRulesTooltip === 'function') ? utils.getStarRulesTooltip : function(){ return ''; };
      var starsCount = quizId ? computeStars(ca, qa) : 0;
      var starsText = formatStars(starsCount) || '';

      while (statsEl.firstChild) statsEl.removeChild(statsEl.firstChild);
      statsEl.appendChild(global.document.createTextNode(baseText));
      if (starsText) {
        statsEl.appendChild(global.document.createTextNode(' | '));
        var span = global.document.createElement('span');
        span.className = 'stats-stars';
        span.textContent = starsText;
        try {
          var tip = getTooltip();
          if (tip) {
            span.title = tip;
            try { span.setAttribute('aria-label', (utils.i18n && utils.i18n.statsStarsAriaLabel) || 'Completion stars'); } catch (_) {}
          }
        } catch (_) {}
        statsEl.appendChild(span);
      }
    } catch (e) { logError(e, 'ui.quizui.updateStats'); }
  }

  NS.ui.quizui = { disableOtherButtons: disableOtherButtons, scheduleAutoAdvance: scheduleAutoAdvance, updateStats: updateStats };
})(window);

