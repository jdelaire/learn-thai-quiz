(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.quiz = NS.quiz || {};
  var common = (NS.util && NS.util.common) || {};
  var renderers = (NS.ui && NS.ui.renderers) || {};
  var prog = (NS.quiz && NS.quiz.progressive) || {};
  var error = (NS.core && NS.core.error) || {};
  var logError = error.logError || function(){};
  var phonetics = (NS.quiz && NS.quiz.phonetics) || {};

  function createQuizWithProgressiveDifficulty(params) {
    const progressiveDifficulty = params.progressiveDifficulty === false ? null : (params.progressiveDifficulty || prog.DEFAULT_PROGRESSIVE_DIFFICULTY);
    return createStandardQuiz(Object.assign({}, params, { progressiveDifficulty: progressiveDifficulty }));
  }

  function createStandardQuiz(params) {
    const data = params && params.data || [];
    const examples = params && params.examples || null;
    const exampleKeyFn = params && params.exampleKey;
    const answerKey = (params && params.answerKey) || 'phonetic';
    const buildSymbol = (params && params.buildSymbol) || function(a){ return { english: String(a && a.english || ''), thai: String(a && a.thai || '') }; };
    const choices = (params && params.choices) || 4;
    const labelPrefix = (params && params.labelPrefix) || common.i18n.labelEnglishThaiPrefix;
    const progressiveDifficulty = params && params.progressiveDifficulty ? prog.createProgressiveDifficulty(params.progressiveDifficulty) : null;
    const isPhoneticAnswer = answerKey === 'phonetic';

    function bundleFor(item) {
      if (!item) return { canonical: '', display: '' };
      if (isPhoneticAnswer && typeof phonetics.getPhoneticBundle === 'function') {
        try {
          var bundle = phonetics.getPhoneticBundle(item);
          if (bundle && (bundle.canonical || bundle.display)) {
            return {
              canonical: String(bundle.canonical || ''),
              display: String(bundle.display || '')
            };
          }
        } catch (_) {}
      }
      var raw;
      try { raw = item[answerKey]; } catch (_) { raw = ''; }
      var str = (raw == null) ? '' : String(raw);
      return { canonical: str, display: str };
    }

    function getDisplay(item) {
      var bundle = bundleFor(item);
      return bundle.display;
    }

    function getCanonical(item) {
      var bundle = bundleFor(item);
      return bundle.canonical;
    }

    return {
      pickRound: function(state){
        if (!Array.isArray(data) || data.length === 0) return null;
        const currentChoices = prog.getChoicesCountForState(state, progressiveDifficulty, choices);
        // Avoid repeating the immediately previous question (by answerKey)
        var prev = state && state.currentAnswer;
        var prevKey = getCanonical(prev);
        var candidatePool = data;
        if (prevKey != null && prevKey !== '' && data.length > 1) {
          candidatePool = data.filter(function(it){ return getCanonical(it) !== prevKey; });
          if (candidatePool.length === 0) candidatePool = data;
        }
        const answer = common.pickRandom(candidatePool);
        const uniqueChoices = common.pickUniqueChoices(data, currentChoices, function(it){ return getCanonical(it); }, answer);
        return { answer: answer, choices: uniqueChoices };
      },
      renderSymbol: function(answer, els){
        try {
          const sym = buildSymbol(answer) || {};
          renderers.renderEnglishThaiSymbol(els.symbolEl, {
            english: String(sym.english || ''),
            thai: String(sym.thai || ''),
            emoji: String(sym.emoji || ''),
            ariaPrefix: labelPrefix
          });
        } catch (e) { logError(e, 'quiz.factories.renderSymbol'); }
      },
      renderButtonContent: function(choice){ return getDisplay(choice); },
      shouldHideHints: function(){ return false; },
      ariaLabelForChoice: function(choice){ return common.i18n.answerPrefix + getDisplay(choice); },
      isCorrect: function(choice, answer){ return getCanonical(choice) === getCanonical(answer); },
      onAnswered: function(ctx){
        const correct = ctx && ctx.correct;
        if (!correct) return;
        try {
          const fb = document.getElementById('feedback');
          var ex = null;
          var ans = ctx && ctx.answer || null;
          var bundle = bundleFor(ans);
          if (examples) {
            const key = (typeof exampleKeyFn === 'function') ? exampleKeyFn(ans || {}) : (ans && ans.english);
            ex = examples[key];
          }

          // Build a consistent fallback example if no dedicated example text exists
          if (!ex) {
            var englishText = '';
            try {
              if (ans && typeof ans.english === 'string' && ans.english) englishText = ans.english;
              else if (ans && ans.number != null) englishText = String(ans.number);
              else if (ans && typeof ans[answerKey] === 'string') englishText = ans[answerKey];
              else if (isPhoneticAnswer) englishText = bundle.canonical || '';
            } catch (_) {}

            var thaiText = '';
            try { thaiText = (ans && (ans.thai || ans.symbol)) ? String(ans.thai || ans.symbol) : ''; } catch (_) { thaiText = ''; }

            var phoneticText = '';
            try { phoneticText = bundle.display || ''; } catch (_) { phoneticText = ''; }

            if (englishText || thaiText || phoneticText) {
              var parts = [];
              if (englishText) parts.push(englishText);
              if (thaiText) parts.push('→ ' + thaiText);
              if (phoneticText) parts.push('— ' + phoneticText);
              ex = parts.join(' ');
            }
          }

          var highlight = { english: '', thai: '', phonetic: '' };
          try {
            var englishHighlight = '';
            if (ans) {
              if (ans.english != null) englishHighlight = String(ans.english);
              else if (ans.number != null) englishHighlight = String(ans.number);
              else if (typeof ans[answerKey] === 'string') englishHighlight = ans[answerKey];
              else if (isPhoneticAnswer) englishHighlight = bundle.display || bundle.canonical || '';
            }
            highlight.english = englishHighlight || '';
            highlight.thai = (ans && (ans.thai || ans.symbol)) ? String(ans.thai || ans.symbol) : '';
            highlight.phonetic = bundle.display || '';
          } catch (_) {}

          renderers.renderExample(fb, ex ? { text: ex, highlight: highlight } : ex);
        } catch (e) { logError(e, 'quiz.factories.onAnswered'); }
      }
    };
  }

  NS.quiz.factories = { createStandardQuiz: createStandardQuiz, createQuizWithProgressiveDifficulty: createQuizWithProgressiveDifficulty };
})(window);
