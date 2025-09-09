(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.quiz = NS.quiz || {};
  var common = (NS.util && NS.util.common) || {};
  var renderers = (NS.ui && NS.ui.renderers) || {};
  var prog = (NS.quiz && NS.quiz.progressive) || {};
  var error = (NS.core && NS.core.error) || {};
  var logError = error.logError || function(){};

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

    return {
      pickRound: function(state){
        if (!Array.isArray(data) || data.length === 0) return null;
        const currentChoices = prog.getChoicesCountForState(state, progressiveDifficulty, choices);
        // Avoid repeating the immediately previous question (by answerKey)
        var prev = state && state.currentAnswer;
        var prevKey = prev && prev[answerKey];
        var candidatePool = data;
        if (prevKey != null && data.length > 1) {
          candidatePool = data.filter(function(it){ return it && it[answerKey] !== prevKey; });
          if (candidatePool.length === 0) candidatePool = data;
        }
        const answer = common.pickRandom(candidatePool);
        const uniqueChoices = common.pickUniqueChoices(data, currentChoices, common.byProp(answerKey), answer);
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
      renderButtonContent: function(choice){ return choice && choice[answerKey]; },
      shouldHideHints: function(){ return false; },
      ariaLabelForChoice: function(choice){ return common.i18n.answerPrefix + (choice && choice[answerKey]); },
      isCorrect: function(choice, answer){ return (choice && choice[answerKey]) === (answer && answer[answerKey]); },
      onAnswered: function(ctx){
        if (!examples) return;
        const correct = ctx && ctx.correct;
        if (!correct) return;
        try {
          const fb = document.getElementById('feedback');
          const ans = ctx && ctx.answer || {};
          const key = (typeof exampleKeyFn === 'function') ? exampleKeyFn(ans) : (ans && ans.english);
          const ex = examples[key];
          renderers.renderExample(fb, ex);
        } catch (e) { logError(e, 'quiz.factories.onAnswered'); }
      }
    };
  }

  NS.quiz.factories = { createStandardQuiz: createStandardQuiz, createQuizWithProgressiveDifficulty: createQuizWithProgressiveDifficulty };
})(window);

