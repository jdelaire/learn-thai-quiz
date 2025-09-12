(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.util = NS.util || {};
  var ErrorHandler = (NS.core && NS.core.error && NS.core.error.ErrorHandler) || { safe: function(fn){ return function(){ try { return fn.apply(this, arguments); } catch (_) { return null; } }; } };

  function byProp(propName) { return function(obj){ return obj && obj[propName]; }; }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    if (text) {
      el.textContent = text;
      el.style.display = '';
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  const i18n = {
    answerPrefix: 'Answer: ',
    exampleLabel: 'Example',
    labelEnglishThaiPrefix: 'English and Thai: ',
    labelNumberThaiPrefix: 'Number and Thai: ',
    labelClassMarkerLengthPrefix: 'Class + Marker + Length: ',
    labelVowelSymbolPrefix: 'Thai vowel symbol: ',
    labelConsonantSymbolPrefix: 'Thai consonant symbol: ',
    labelColorPhrasePrefix: 'Thai color phrase: ',
    statsStarsAriaLabel: 'Completion stars',
    noDataMessage: 'No data available for this quiz.'
  };

  function getBodyClass(quizId) {
    const map = {
      consonants: 'consonant-quiz',
      vowels: 'vowel-quiz',
      colors: 'color-quiz',
      numbers: 'numbers-quiz',
      time: 'time-quiz',
      tones: 'questions-quiz',
      questions: 'questions-quiz',
      verbs: 'questions-quiz',
      family: 'family-quiz',
      classifiers: 'classifiers-quiz',
      rooms: 'rooms-quiz',
      jobs: 'jobs-quiz',
      foods: 'foods-quiz',
      months: 'questions-quiz',
      tenses: 'questions-quiz',
      days: 'questions-quiz',
      'body-parts': 'questions-quiz',
      prepositions: 'questions-quiz',
      countries: 'questions-quiz',
      'final-consonants': 'questions-quiz'
    };
    return map[quizId] || null;
  }

  function pickRandom(array) { return array[Math.floor(Math.random() * array.length)]; }

  function pickUniqueChoices(pool, count, keyFn, seed) {
    const choices = [];
    const usedKeys = new Set();
    if (seed != null) {
      choices.push(seed);
      const seedKey = ErrorHandler.safe(keyFn, null)(seed);
      if (seedKey != null) usedKeys.add(String(seedKey));
    }
    while (choices.length < count && choices.length < pool.length) {
      const candidate = pickRandom(pool);
      const key = ErrorHandler.safe(keyFn, null)(candidate);
      if (key == null) continue;
      const keyStr = String(key);
      if (!usedKeys.has(keyStr)) {
        usedKeys.add(keyStr);
        choices.push(candidate);
      }
    }
    return choices;
  }

  var defaultElements = { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' };

  function clearChildren(parent) {
    try {
      if (!parent) return;
      while (parent.firstChild) parent.removeChild(parent.firstChild);
    } catch (_) {}
  }

  NS.util.common = {
    byProp: byProp,
    setText: setText,
    i18n: i18n,
    getBodyClass: getBodyClass,
    pickRandom: pickRandom,
    pickUniqueChoices: pickUniqueChoices,
    defaultElements: defaultElements,
    clearChildren: clearChildren
  };
})(window);

