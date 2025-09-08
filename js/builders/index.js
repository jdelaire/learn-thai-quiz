(function(global){
  'use strict';

  function makeStandardQuizBuilder(urls, transform) {
    const Utils = global.Utils;
    const defaultElements = Utils.defaultElements;
    return function() {
      try {
        const list = Array.isArray(urls) ? urls : [urls];
        return Utils.fetchJSONs(list).then(function(results){
          const params = (typeof transform === 'function') ? (transform(results) || {}) : {};
          return function init(){
            ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createQuizWithProgressiveDifficulty(params)));
          };
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }

  const Utils = global.Utils;
  const defaultElements = Utils.defaultElements;

  const QuizBuilders = {
    consonants: function() {
      Utils.ErrorHandler.safe(Utils.insertConsonantLegend)();
      return Utils.fetchJSONCached('data/consonants.json').then(function(data){
        return function init(){
          var base = Utils.createQuizWithProgressiveDifficulty({ data: data, answerKey: 'name' });
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: 'consonants' }, base, {
            renderSymbol: function(answer, els) {
              els.symbolEl.textContent = answer.symbol;
              els.symbolEl.setAttribute('aria-label', 'Thai consonant symbol: ' + answer.symbol);
            },
            ariaLabelForChoice: function(choice) {
              return Utils.i18n.answerPrefix + choice.name + ' (' + choice.meaning + ')';
            },
            decorateButton: function(btn, choice) {
              Utils.ErrorHandler.safeDOM(function() { btn.classList.add(choice.class + '-class'); })();
              var span = document.createElement('span');
              span.className = 'emoji';
              span.textContent = choice.emoji;
              btn.insertBefore(span, btn.firstChild);
            }
          }));
        };
      });
    },

    vowels: function() {
      return Utils.fetchJSONCached('data/vowels.json').then(function(data){
        return function init(){
          var base = Utils.createQuizWithProgressiveDifficulty({ data: data, answerKey: 'sound' });
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: 'vowels' }, base, {
            renderSymbol: function(answer, els) { Utils.ErrorHandler.safe(Utils.renderVowelSymbol)(els.symbolEl, answer.symbol); }
          }));
        };
      });
    },

    colors: function() {
      return Utils.fetchJSONs(['data/colors-base.json', 'data/color-modifiers.json']).then(function(results){
        const baseColors = results[0] || [];
        const modifiers = results[1] || [];
        function buildColorPhrase(base, maybeModifier) {
          const hasBuiltInShade = /(^|\s)(dark|light)\s/i.test(base.english);
          const useModifier = !!maybeModifier && !hasBuiltInShade;
          const thai = useModifier ? (base.thai + ' ' + maybeModifier.thai) : base.thai;
          const phonetic = useModifier ? (base.phonetic + ' ' + maybeModifier.phonetic) : base.phonetic;
          const english = useModifier ? (maybeModifier.english + ' ' + base.english) : base.english;
          const hex = useModifier ? Utils.getDisplayHex(base.hex, maybeModifier) : base.hex;
          return { english: english, thai: thai, phonetic: phonetic, hex: hex };
        }
        return function init(){
          ThaiQuiz.setupQuiz({
            elements: defaultElements,
            pickRound: function(state) {
              const base = Utils.pickRandom(baseColors);
              const maybeModifier = Math.random() < 0.55 ? Utils.pickRandom(modifiers) : null;
              const answer = buildColorPhrase(base, maybeModifier);
              const currentChoices = Utils.getChoicesCountForState(state, undefined, 4);
              const choices = [answer];
              while (choices.length < currentChoices) {
                const b = Utils.pickRandom(baseColors);
                const m = Math.random() < 0.45 ? Utils.pickRandom(modifiers) : null;
                const choice = buildColorPhrase(b, m);
                if (!choices.find(function(c) { return c.phonetic === choice.phonetic; })) choices.push(choice);
              }
              return { answer: answer, choices: choices, symbolText: answer.thai, symbolStyle: { color: answer.hex }, symbolAriaLabel: 'Thai color phrase: ' + answer.thai };
            },
            renderButtonContent: function(choice) { return choice.phonetic; },
            ariaLabelForChoice: function(choice) { return Utils.i18n.answerPrefix + choice.phonetic; },
            isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; }
          });
        };
      });
    },

    numbers: makeStandardQuizBuilder('data/numbers.json', function(results) {
      const data = results[0] || [];
      return { data: data, labelPrefix: Utils.i18n.labelNumberThaiPrefix, buildSymbol: function(a){ return { english: String(a.number || ''), thai: a.thai || '' }; } };
    }),

    time: makeStandardQuizBuilder(['data/time-keywords.json','data/time-formats.json','data/time-examples.json'], function(results) {
      const keyWords = results[0] || [];
      const timeFormats = results[1] || [];
      const examples = results[2] || [];
      function englishOf(item) { return item.english || item.note || item.translation || ''; }
      const pool = keyWords.concat(timeFormats, examples);
      return { data: pool, buildSymbol: function(a){ return { english: englishOf(a), thai: a.thai || '' }; }, progressiveDifficulty: { choicesThresholds: [ { correctAnswers: 20, choices: 5 }, { correctAnswers: 40, choices: 6 }, { correctAnswers: 60, choices: 7 }, { correctAnswers: 80, choices: 8 } ] } };
    }),

    tones: makeStandardQuizBuilder('data/tones.json', function(results) {
      const data = results[0] || [];
      return { data: data, labelPrefix: Utils.i18n.labelClassMarkerLengthPrefix, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '' }; } };
    }),

    questions: makeStandardQuizBuilder(['data/questions.json','data/questions-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples };
    }),

    verbs: makeStandardQuizBuilder(['data/verbs.json','data/verbs-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    family: makeStandardQuizBuilder('data/family.json', function(results) {
      const data = results[0] || [];
      return { data: data };
    }),

    classifiers: makeStandardQuizBuilder(['data/classifiers.json','data/classifiers-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    jobs: makeStandardQuizBuilder(['data/jobs.json'], function(results) {
      const data = results[0] || [];
      return { data: data, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    foods: makeStandardQuizBuilder(['data/foods.json','data/foods-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, exampleKey: function(a){ return a.id || a.english; }, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    adjectives: makeStandardQuizBuilder(['data/adjectives.json','data/adjectives-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, exampleKey: function(a){ return a.id || a.english; }, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    months: makeStandardQuizBuilder(['data/months-seasons.json','data/months-seasons-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }, progressiveDifficulty: { choicesThresholds: [ { correctAnswers: 20, choices: 5 }, { correctAnswers: 40, choices: 6 }, { correctAnswers: 60, choices: 7 }, { correctAnswers: 80, choices: 8 } ], hideEmojiThreshold: 50 } };
    }),

    rooms: makeStandardQuizBuilder(['data/rooms.json','data/rooms-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, exampleKey: function(a){ return a.id || a.english; }, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    tenses: makeStandardQuizBuilder(['data/tenses.json','data/tenses-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    days: makeStandardQuizBuilder('data/days.json', function(results) {
      const data = results[0] || [];
      return { data: data, buildSymbol: function(a){ var eng = (a && a.english) ? (a.english + (a.planet ? ' (' + a.planet + ')' : '')) : ''; return { english: eng, thai: (a && a.thai) || '', emoji: (a && a.emoji) || '' }; } };
    }),

    prepositions: makeStandardQuizBuilder(['data/prepositions.json'], function(results) {
      const data = results[0] || [];
      return { data: data, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    countries: makeStandardQuizBuilder(['data/countries.json','data/countries-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, exampleKey: function(a){ return a.english; }, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    greetings: makeStandardQuizBuilder(['data/greetings.json','data/greetings-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    'body-parts': makeStandardQuizBuilder(['data/body-parts.json'], function(results) {
      const data = results[0] || [];
      return { data: data, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    }),

    'vowel-changes': makeStandardQuizBuilder(['data/vowel-changes.json','data/vowel-changes-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return { data: data, examples: examples, exampleKey: function(a){ return a.english || a.thai; }, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; } };
    })
  };

  global.QuizBuilders = QuizBuilders;
})(window);

