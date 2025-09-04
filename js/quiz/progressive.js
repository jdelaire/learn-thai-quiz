(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.quiz = NS.quiz || {};
  var error = (NS.core && NS.core.error) || {};
  var logError = error.logError || function(){};

  const DEFAULT_PROGRESSIVE_DIFFICULTY = {
    choicesThresholds: [
      { correctAnswers: 20, choices: 5 },
      { correctAnswers: 40, choices: 6 },
      { correctAnswers: 60, choices: 7 },
      { correctAnswers: 80, choices: 8 }
    ]
  };

  function createProgressiveDifficulty(config){
    return Object.assign({}, DEFAULT_PROGRESSIVE_DIFFICULTY, config || {});
  }

  function getChoicesCountForState(state, progressiveDifficulty, baseChoices) {
    try {
      var currentChoices = (typeof baseChoices === 'number' && baseChoices > 0) ? baseChoices : 4;
      if (progressiveDifficulty === false || progressiveDifficulty === null) return currentChoices;
      var pd = (progressiveDifficulty === undefined) ? DEFAULT_PROGRESSIVE_DIFFICULTY : createProgressiveDifficulty(progressiveDifficulty || {});
      if (pd && state && typeof state.correctAnswers === 'number' && Array.isArray(pd.choicesThresholds)) {
        var correctCount = state.correctAnswers;
        for (var i = pd.choicesThresholds.length - 1; i >= 0; i--) {
          var threshold = pd.choicesThresholds[i];
          if (correctCount >= threshold.correctAnswers) { currentChoices = threshold.choices; break; }
        }
      }
      return currentChoices;
    } catch (e) { logError(e, 'quiz.progressive.getChoicesCountForState'); return (typeof baseChoices === 'number' && baseChoices > 0) ? baseChoices : 4; }
  }

  NS.quiz.progressive = {
    DEFAULT_PROGRESSIVE_DIFFICULTY: DEFAULT_PROGRESSIVE_DIFFICULTY,
    createProgressiveDifficulty: createProgressiveDifficulty,
    getChoicesCountForState: getChoicesCountForState
  };
})(window);

