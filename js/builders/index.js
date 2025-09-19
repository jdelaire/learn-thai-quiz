(function(global){
  'use strict';

  // Single source of Utils/defaultElements for this module
  const Utils = global.Utils;
  const defaultElements = Utils.defaultElements;

  function makeStandardQuizBuilder(urls, transform) {
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

  function symbolEnglishThaiEmoji(item, englishOverride) {
    try {
      var english = typeof englishOverride === 'function' ? englishOverride(item) : (item && item.english) || '';
      return { english: english || '', thai: (item && item.thai) || '', emoji: (item && item.emoji) || '' };
    } catch (_) {
      return { english: '', thai: '', emoji: '' };
    }
  }
  function symbolEnglishThaiEmojiWith(overrideFn) {
    return function(item){ return symbolEnglishThaiEmoji(item, overrideFn); };
  }
  function exampleKeyIdOrEnglish(item) { return (item && (item.id || item.english)) || ''; }
  function exampleKeyEnglish(item) { return (item && item.english) || ''; }
  function configSimple(results, overrides) {
    const data = (results && results[0]) || [];
    return Object.assign({ data: data }, overrides || {});
  }
  function configWithExamples(results, overrides) {
    const data = (results && results[0]) || [];
    const examples = (results && results[1]) || {};
    return Object.assign({ data: data, examples: examples }, overrides || {});
  }

  const QuizBuilders = {
    'final-consonants': function() {
      return Utils.fetchJSONCached('data/final-consonants.json').then(function(data){
        return function init(){
          var base = Utils.createQuizWithProgressiveDifficulty({ data: data, answerKey: 'final' });
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: 'final-consonants' }, base, {
            renderSymbol: function(answer, els) { Utils.ErrorHandler.safe(Utils.renderConsonantSymbol)(els.symbolEl, answer.symbol); },
            ariaLabelForChoice: function(choice) {
              return Utils.i18n.answerPrefix + choice.final;
            },
            onAnswered: function(ctx) {
              if (!ctx || !ctx.correct) return;
              try {
                var ans = ctx.answer || {};
                var line = '';
                if (ans.exampleThai) {
                  line = ans.exampleThai;
                  if (ans.phonetic) line += ' — ' + ans.phonetic;
                } else if (ans.phonetic) {
                  line = ans.phonetic;
                }
                Utils.renderExample(document.getElementById('feedback'), { text: line, highlight: { english: '', thai: ans.exampleThai || '', phonetic: ans.phonetic || '' } });
              } catch (e) { Utils.logError && Utils.logError(e, 'final-consonants.onAnswered'); }
            }
          }));
        };
      });
    },
    'consonant-clusters': function() {
      return Utils.fetchJSONCached('data/consonant-clusters.json').then(function(data) {
        return function init(){
          var base = Utils.createQuizWithProgressiveDifficulty({
            data: data,
            answerKey: 'sounds',
            buildSymbol: function(item) {
              var type = item && item.type;
              var englishLabel = '';
              if (type === 'true') englishLabel = 'True cluster (อักษรควบแท้)';
              else if (type === 'fake') englishLabel = 'Fake cluster (อักษรควบไม่แท้)';
              else englishLabel = (item && item.english) || '';
              return {
                english: englishLabel,
                thai: (item && item.cluster) || '',
                emoji: (item && item.emoji) || ''
              };
            }
          });
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: 'consonant-clusters' }, base, {
            ariaLabelForChoice: function(choice) {
              var value = choice && choice.sounds;
              return Utils.i18n.answerPrefix + (value ? (value + ' sound') : '');
            },
            onAnswered: function(ctx) {
              if (!ctx || !ctx.correct) return;
              try {
                var ans = ctx.answer || {};
                var pieces = [];
                if (ans && ans.cluster) {
                  var typeLabel = ans.type === 'fake' ? 'Fake cluster' : (ans.type === 'true' ? 'True cluster' : 'Cluster');
                  var clusterLine = typeLabel + ': ' + ans.cluster;
                  if (ans.sounds) clusterLine += ' → ' + ans.sounds;
                  pieces.push(clusterLine);
                }
                if (ans && (ans.exampleThai || ans.examplePhonetic)) {
                  var exampleLine = ans.exampleThai || '';
                  if (ans.examplePhonetic) {
                    exampleLine += (exampleLine ? ' — ' : '') + ans.examplePhonetic;
                  }
                  pieces.push(exampleLine);
                }
                var feedbackText = pieces.join('\n');
                Utils.renderExample(document.getElementById('feedback'), {
                  text: feedbackText,
                  highlight: {
                    english: ans && ans.sounds || '',
                    thai: ans && (ans.exampleThai || ans.cluster || ''),
                    phonetic: ans && (ans.examplePhonetic || '')
                  }
                });
              } catch (e) {
                if (Utils.logError) Utils.logError(e, 'consonant-clusters.onAnswered');
              }
            }
          }));
        };
      });
    },
    consonants: function() {
      Utils.ErrorHandler.safe(Utils.insertConsonantLegend)();
      return Utils.fetchJSONCached('data/consonants.json').then(function(data){
        return function init(){
          var base = Utils.createQuizWithProgressiveDifficulty({ data: data, answerKey: 'name' });
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: 'consonants' }, base, {
            renderSymbol: function(answer, els) { Utils.ErrorHandler.safe(Utils.renderConsonantSymbol)(els.symbolEl, answer.symbol); },
            ariaLabelForChoice: function(choice) {
              return Utils.i18n.answerPrefix + choice.name + ' (' + choice.meaning + ')';
            },
            decorateButton: function(btn, choice) {
              Utils.ErrorHandler.safeDOM(function() { btn.classList.add(choice.class + '-class'); })();
              var span = document.createElement('span');
              span.className = 'emoji';
              span.textContent = choice.emoji;
              btn.insertBefore(span, btn.firstChild);
            },
            onAnswered: function(ctx) {
              if (!ctx || !ctx.correct) return;
              try {
                var ans = ctx.answer || {};
                var eng = String(ans.meaning || '');
                var th = String(ans.symbol || '');
                var ph = String(ans.name || '');
                var text = '';
                if (eng || th || ph) {
                  text = (eng || '') + (th ? (' → ' + th) : '') + (ph ? (' — ' + ph) : '');
                }
                Utils.renderExample(document.getElementById('feedback'), { text: text, highlight: { english: eng, thai: th, phonetic: ph } });
              } catch (e) { Utils.logError && Utils.logError(e, 'consonants.onAnswered'); }
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
              // Avoid repeating the previous phonetic answer
              var prevPhonetic = state && state.currentAnswer && state.currentAnswer.phonetic;
              var attempt = 0;
              var answer;
              while (attempt < 10) {
                const base = Utils.pickRandom(baseColors);
                const maybeModifier = Math.random() < 0.55 ? Utils.pickRandom(modifiers) : null;
                const candidate = buildColorPhrase(base, maybeModifier);
                if (!prevPhonetic || candidate.phonetic !== prevPhonetic) { answer = candidate; break; }
                attempt++;
                if (attempt >= 10) { answer = candidate; break; }
              }
              const currentChoices = Utils.getChoicesCountForState(state, undefined, 4);
              const choices = [answer];
              while (choices.length < currentChoices) {
                const b = Utils.pickRandom(baseColors);
                const m = Math.random() < 0.45 ? Utils.pickRandom(modifiers) : null;
                const choice = buildColorPhrase(b, m);
                if (!choices.find(function(c) { return c.phonetic === choice.phonetic; })) choices.push(choice);
              }
              return { answer: answer, choices: choices, symbolText: answer.thai, symbolStyle: { color: answer.hex }, symbolAriaLabel: (Utils.i18n.labelColorPhrasePrefix || 'Thai color phrase: ') + answer.thai };
            },
            renderButtonContent: function(choice) { return choice.phonetic; },
            ariaLabelForChoice: function(choice) { return Utils.i18n.answerPrefix + choice.phonetic; },
            isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; },
            onAnswered: function(ctx) {
              if (!ctx || !ctx.correct) return;
              try {
                var ans = ctx.answer || {};
                var text = (ans.english || '') + ' → ' + (ans.thai || '') + (ans.phonetic ? (' — ' + ans.phonetic) : '');
                Utils.renderExample(document.getElementById('feedback'), { text: text, highlight: { english: ans.english || '', thai: ans.thai || '', phonetic: ans.phonetic || '' } });
              } catch (e) { Utils.logError && Utils.logError(e, 'colors.onAnswered'); }
            }
          });
        };
      });
    },

    numbers: makeStandardQuizBuilder('data/numbers.json', function(results) {
      return configSimple(results, { labelPrefix: Utils.i18n.labelNumberThaiPrefix, buildSymbol: function(a){ return { english: String(a.number || ''), thai: a.thai || '' }; } });
    }),

    time: makeStandardQuizBuilder(['data/time-keywords.json','data/time-formats.json','data/time-examples.json'], function(results) {
      const keyWords = results[0] || [];
      const timeFormats = results[1] || [];
      const examples = results[2] || {};
      function englishOf(item) { return item.english || item.note || item.translation || ''; }
      const pool = keyWords.concat(timeFormats);
      return { data: pool, examples: examples, exampleKey: function(a){ return englishOf(a); }, buildSymbol: function(a){ return { english: englishOf(a), thai: a.thai || '' }; }, progressiveDifficulty: { choicesThresholds: [ { correctAnswers: 20, choices: 5 }, { correctAnswers: 40, choices: 6 }, { correctAnswers: 60, choices: 7 }, { correctAnswers: 80, choices: 8 } ] } };
    }),

    tones: makeStandardQuizBuilder('data/tones.json', function(results) {
      return configSimple(results, { labelPrefix: Utils.i18n.labelClassMarkerLengthPrefix, buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '' }; } });
    }),

    questions: makeStandardQuizBuilder(['data/questions.json','data/questions-examples.json'], function(results) {
      return configWithExamples(results);
    }),

    verbs: makeStandardQuizBuilder(['data/verbs.json','data/verbs-examples.json'], function(results) {
      return configWithExamples(results, { buildSymbol: symbolEnglishThaiEmoji });
    }),

    family: makeStandardQuizBuilder('data/family.json', function(results) {
      return configSimple(results);
    }),

    classifiers: makeStandardQuizBuilder(['data/classifiers.json','data/classifiers-examples.json'], function(results) {
      return configWithExamples(results, { buildSymbol: symbolEnglishThaiEmoji });
    }),

    jobs: makeStandardQuizBuilder(['data/jobs.json'], function(results) {
      return configSimple(results, { buildSymbol: symbolEnglishThaiEmoji });
    }),

    foods: makeStandardQuizBuilder(['data/foods.json','data/foods-examples.json'], function(results) {
      return configWithExamples(results, { exampleKey: exampleKeyIdOrEnglish, buildSymbol: symbolEnglishThaiEmoji });
    }),

    adjectives: makeStandardQuizBuilder(['data/adjectives.json','data/adjectives-examples.json'], function(results) {
      return configWithExamples(results, { exampleKey: exampleKeyIdOrEnglish, buildSymbol: symbolEnglishThaiEmoji });
    }),

    months: makeStandardQuizBuilder(['data/months-seasons.json','data/months-seasons-examples.json'], function(results) {
      return configWithExamples(results, { buildSymbol: symbolEnglishThaiEmoji, progressiveDifficulty: { choicesThresholds: [ { correctAnswers: 20, choices: 5 }, { correctAnswers: 40, choices: 6 }, { correctAnswers: 60, choices: 7 }, { correctAnswers: 80, choices: 8 } ], hideEmojiThreshold: 50 } });
    }),

    rooms: makeStandardQuizBuilder(['data/rooms.json','data/rooms-examples.json'], function(results) {
      return configWithExamples(results, { exampleKey: exampleKeyIdOrEnglish, buildSymbol: symbolEnglishThaiEmoji });
    }),

    tenses: makeStandardQuizBuilder(['data/tenses.json','data/tenses-examples.json'], function(results) {
      return configWithExamples(results, { buildSymbol: symbolEnglishThaiEmoji });
    }),

    days: makeStandardQuizBuilder('data/days.json', function(results) {
      return configSimple(results, { buildSymbol: symbolEnglishThaiEmojiWith(function(a){ return (a && a.english) ? (a.english + (a.planet ? ' (' + a.planet + ')' : '')) : ''; }) });
    }),

    prepositions: makeStandardQuizBuilder(['data/prepositions.json','data/prepositions-examples.json'], function(results) {
      return configWithExamples(results, { exampleKey: exampleKeyEnglish, buildSymbol: symbolEnglishThaiEmoji });
    }),

    countries: makeStandardQuizBuilder(['data/countries.json','data/countries-examples.json'], function(results) {
      return configWithExamples(results, { exampleKey: exampleKeyEnglish, buildSymbol: symbolEnglishThaiEmoji });
    }),

    greetings: makeStandardQuizBuilder(['data/greetings.json','data/greetings-examples.json'], function(results) {
      return configWithExamples(results, { buildSymbol: symbolEnglishThaiEmoji });
    }),

    'body-parts': makeStandardQuizBuilder(['data/body-parts.json','data/body-parts-examples.json'], function(results) {
      return configWithExamples(results, { exampleKey: exampleKeyEnglish, buildSymbol: symbolEnglishThaiEmoji });
    }),

    'vowel-changes': makeStandardQuizBuilder(['data/vowel-changes.json','data/vowel-changes-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        answerKey: 'thai',
        exampleKey: function(a){ return a.english || a.thai; },
        buildSymbol: function(a){
          var eng = (a && a.english) || '';
          var placeholder = String(eng).replace(/^Base\s+/, '').replace(/-/g, '\u0E01');
          return { english: placeholder, thai: '', emoji: '' };
        }
      };
    })
  };

  global.QuizBuilders = QuizBuilders;
})(window);
