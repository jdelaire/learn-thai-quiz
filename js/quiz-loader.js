(function() {
  'use strict';

  const defaultElements = Utils.defaultElements;

  function handleDataLoadError(err) {
    const fb = document.getElementById('feedback');
    if (fb) {
      let msg = 'Failed to load data.';
      if (window.location.protocol === 'file:') {
        msg += ' Open this site via a local server (e.g., python3 -m http.server) so JSON files can be fetched.';
      }
      fb.textContent = msg;
    }
    Utils.logError(err, 'quiz-loader.js: handleDataLoadError');
  }

  // Helper to build standard data-driven quizzes with minimal duplication
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

  // Data-driven configs moved to window.QuizBuilders in js/builders/index.js
  const QuizBuilders = {
    consonants: function() {
      Utils.ErrorHandler.safe(Utils.insertConsonantLegend)();
      return Utils.fetchJSONCached('data/consonants.json').then(function(data){
        return function init(){
          try {
            var base = Utils.createQuizWithProgressiveDifficulty({
              data: data,
              answerKey: 'name'
            });
            ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: 'consonants' }, base, {
              renderSymbol: function(answer, els) {
                els.symbolEl.textContent = answer.symbol;
                els.symbolEl.setAttribute('aria-label', 'Thai consonant symbol: ' + answer.symbol);
              },
              ariaLabelForChoice: function(choice) {
                var prefix = (Utils && Utils.i18n && Utils.i18n.answerPrefix) || 'Answer: ';
                return prefix + choice.name + ' (' + choice.meaning + ')';
              },
              decorateButton: function(btn, choice) {
                Utils.ErrorHandler.safeDOM(function() {
                  btn.classList.add(choice.class + '-class');
                })();
                var span = document.createElement('span');
                span.className = 'emoji';
                span.textContent = choice.emoji;
                btn.insertBefore(span, btn.firstChild);
              }
              // isCorrect uses answerKey default
            }));
          } catch (e) { handleDataLoadError(e); }
        };
      });
    },

    vowels: function() {
      return Utils.fetchJSONCached('data/vowels.json').then(function(data){
        return function init(){
          try {
            var base = Utils.createQuizWithProgressiveDifficulty({
              data: data,
              answerKey: 'sound'
            });
            ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: 'vowels' }, base, {
              renderSymbol: function(answer, els) {
                Utils.ErrorHandler.safe(Utils.renderVowelSymbol)(els.symbolEl, answer.symbol);
              }
            }));
          } catch (e) { handleDataLoadError(e); }
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
              return {
                answer: answer, choices: choices,
                symbolText: answer.thai,
                symbolStyle: { color: answer.hex },
                symbolAriaLabel: 'Thai color phrase: ' + answer.thai
              };
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
      return {
        data: data,
        labelPrefix: Utils.i18n.labelNumberThaiPrefix,
        buildSymbol: function(a){ return { english: String(a.number || ''), thai: a.thai || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    time: makeStandardQuizBuilder(['data/time-keywords.json','data/time-formats.json','data/time-examples.json'], function(results) {
      const keyWords = results[0] || [];
      const timeFormats = results[1] || [];
      const examples = results[2] || [];
      function englishOf(item) { return item.english || item.note || item.translation || ''; }
      const pool = keyWords.concat(timeFormats, examples);
      return {
        data: pool,
        buildSymbol: function(a){ return { english: englishOf(a), thai: a.thai || '' }; },
        progressiveDifficulty: {
          choicesThresholds: [
            { correctAnswers: 20, choices: 5 },
            { correctAnswers: 40, choices: 6 },
            { correctAnswers: 60, choices: 7 },
            { correctAnswers: 80, choices: 8 }
          ]
        }
      };
    }),

    tones: makeStandardQuizBuilder('data/tones.json', function(results) {
      const data = results[0] || [];
      return {
        data: data,
        labelPrefix: Utils.i18n.labelClassMarkerLengthPrefix,
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    questions: makeStandardQuizBuilder(['data/questions.json','data/questions-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples
        // Progressive difficulty enabled by default
      };
    }),

    verbs: makeStandardQuizBuilder(['data/verbs.json','data/verbs-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    family: makeStandardQuizBuilder('data/family.json', function(results) {
      const data = results[0] || [];
      return {
        data: data
        // Progressive difficulty enabled by default
      };
    }),

    classifiers: makeStandardQuizBuilder(['data/classifiers.json','data/classifiers-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    jobs: makeStandardQuizBuilder(['data/jobs.json'], function(results) {
      const data = results[0] || [];
      return {
        data: data,
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    foods: makeStandardQuizBuilder(['data/foods.json','data/foods-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        exampleKey: function(a){ return a.id || a.english; },
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    adjectives: makeStandardQuizBuilder(['data/adjectives.json','data/adjectives-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        exampleKey: function(a){ return a.id || a.english; },
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    months: makeStandardQuizBuilder(['data/months-seasons.json','data/months-seasons-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; },
        progressiveDifficulty: {
          choicesThresholds: [
            { correctAnswers: 20, choices: 5 },
            { correctAnswers: 40, choices: 6 },
            { correctAnswers: 60, choices: 7 },
            { correctAnswers: 80, choices: 8 }
          ],
          hideEmojiThreshold: 50
        }
      };
    }),

    rooms: makeStandardQuizBuilder(['data/rooms.json','data/rooms-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        exampleKey: function(a){ return a.id || a.english; },
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    tenses: makeStandardQuizBuilder(['data/tenses.json','data/tenses-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    days: makeStandardQuizBuilder('data/days.json', function(results) {
      const data = results[0] || [];
      return {
        data: data,
        buildSymbol: function(a){
          var eng = (a && a.english) ? (a.english + (a.planet ? ' (' + a.planet + ')' : '')) : '';
          return { english: eng, thai: (a && a.thai) || '', emoji: (a && a.emoji) || '' };
        }
        // Progressive difficulty enabled by default
      };
    }),

    prepositions: makeStandardQuizBuilder(['data/prepositions.json'], function(results) {
      const data = results[0] || [];
      return {
        data: data,
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    // Countries — English/Thai/phonetic with optional flag emoji
    countries: makeStandardQuizBuilder(['data/countries.json','data/countries-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        exampleKey: function(a){ return a.english; },
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    // Thai Greetings — basic phrases with examples and emoji hints
    greetings: makeStandardQuizBuilder(['data/greetings.json','data/greetings-examples.json'], function(results) {
      const data = results[0] || [];
      const examples = results[1] || {};
      return {
        data: data,
        examples: examples,
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    }),

    // Body Parts in Thai — standard vocab quiz with emoji hints
    'body-parts': makeStandardQuizBuilder(['data/body-parts.json'], function(results) {
      const data = results[0] || [];
      return {
        data: data,
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: (a && a.emoji) || '' }; }
        // Progressive difficulty enabled by default
      };
    })
  };

  function setText(id, text) {
    Utils.ErrorHandler.safe(Utils.setText)(id, text);
  }

  function initFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      const quizId = params.get('quiz') || '';
      if (!quizId) {
        setText('page-title', 'Quiz not found');
        setText('page-subtitle', 'Unknown quiz: ' + quizId);
        return;
      }

      // Load metadata from data/quizzes.json to drive page chrome
      Utils.fetchJSONCached('data/quizzes.json').then(function(list){
        const meta = (Array.isArray(list) ? list : []).find(function(it){ return it && it.id === quizId; }) || null;
        if (!meta) {
          setText('page-title', 'Quiz not found');
          setText('page-subtitle', 'Unknown quiz: ' + quizId);
          return;
        }

        document.title = (meta.title || 'ThaiQuest') + ' — ThaiQuest';
        setText('page-title', meta.title || 'ThaiQuest');
        setText('page-subtitle', meta.description || '');
        try {
          var metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', meta.description || 'ThaiQuest quiz: practice Thai with interactive, accessible quizzes.');
        } catch (e) {}
        // Map categories to a default body class; allow overrides via metadata
        var cls = (meta && meta.bodyClass) || Utils.getBodyClass(quizId);
        if (cls) document.body.classList.add(cls);
        // Always add a generic per-quiz class as a fallback (e.g., foods -> foods-quiz)
        try {
          if (quizId) {
            document.body.classList.add(quizId + '-quiz');
            document.body.dataset.quizId = quizId;
          }
        } catch (e) {}

        // Add per-quiz pro tips, prefer metadata if provided
        try {
          if (meta && meta.proTip) {
            Utils.insertProTip(meta.proTip);
          } else {
             if (quizId === 'vowels') {
              // Friendly note specific to vowel shaping
              try {
                const symbolAnchor = document.getElementById('symbol');
                if (symbolAnchor && !document.querySelector('.vowel-note')) {
                  const tip = document.createElement('div');
                  tip.className = 'vowel-note';
                  tip.setAttribute('role', 'note');
                  tip.textContent = 'Note: The consonant ก (goo gai) may appear as a placeholder to show where the vowel attaches; it is not part of the answer.';
                  symbolAnchor.insertAdjacentElement('afterend', tip);
                }
              } catch (e) {}
            }
          }
        } catch (e) {}

        // Build and start the selected quiz
        const builder = QuizBuilders[quizId];
        if (!builder) {
          // Fallback: try to load data/<quizId>.json as a standard quiz dataset
          try {
            Utils.fetchJSONCached('data/' + quizId + '.json').then(function(data){
              if (!Array.isArray(data) || data.length === 0) {
                setText('page-title', 'Quiz not found');
                setText('page-subtitle', 'Unknown quiz: ' + quizId);
                return;
              }
              try {
                ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: quizId }, Utils.createQuizWithProgressiveDifficulty({
                  data: data
                })));
              } catch (e) { handleDataLoadError(e); }
            }).catch(function(){
              setText('page-title', 'Quiz not found');
              setText('page-subtitle', 'Unknown quiz: ' + quizId);
            });
          } catch (e) {
            setText('page-title', 'Quiz not found');
            setText('page-subtitle', 'Unknown quiz: ' + quizId);
          }
          return;
        }
        builder().then(function(initFn){
          Utils.ErrorHandler.wrap(initFn, 'quiz-loader.js: initFn', null)();
        }).catch(function(err){ handleDataLoadError(err); });
      }).catch(function(err){ handleDataLoadError(err); });
    } catch (e) {
      // no-op
    }
  }

  // Start
  initFromQuery();
})();
