(function(global){
  'use strict';

  // Single source of Utils/defaultElements for this module
  const Utils = global.Utils;
  const defaultElements = Utils.defaultElements;
  const compositeNs = (global.__TQ && global.__TQ.quiz && global.__TQ.quiz.composite) || null;
  const getPhoneticBundle = (Utils && typeof Utils.getPhoneticBundle === 'function')
    ? function(item){ try { return Utils.getPhoneticBundle(item); } catch (_) { return fallbackBundle(item); } }
    : fallbackBundle;

  function fallbackBundle(item) {
    if (!item) return { canonical: '', display: '' };
    var raw = '';
    try { raw = item.phonetic; } catch (_) { raw = ''; }
    raw = (raw == null) ? '' : String(raw);
    return { canonical: raw, display: raw };
  }

  function phoneticDisplay(item) {
    var bundle = getPhoneticBundle(item) || fallbackBundle(item);
    var display = '';
    try { display = bundle.display != null ? String(bundle.display) : ''; } catch (_) { display = ''; }
    if (!display) {
      try { display = bundle.canonical != null ? String(bundle.canonical) : ''; } catch (_) { display = ''; }
    }
    return display;
  }

  function phoneticCanonical(item) {
    var bundle = getPhoneticBundle(item) || fallbackBundle(item);
    var canonical = '';
    try { canonical = bundle.canonical != null ? String(bundle.canonical) : ''; } catch (_) { canonical = ''; }
    if (!canonical) {
      try { canonical = bundle.display != null ? String(bundle.display) : ''; } catch (_) { canonical = ''; }
    }
    return canonical;
  }

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

  function normalizeCompositeSource(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') return { quizId: entry };
    if (Array.isArray(entry)) return { data: entry };
    if (typeof entry === 'object') return Object.assign({}, entry);
    return null;
  }

  function normalizeCompositeSources(list) {
    if (!list) return [];
    const arr = Array.isArray(list) ? list : [list];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const normalized = normalizeCompositeSource(arr[i]);
      if (normalized) out.push(normalized);
    }
    return out;
  }

  function registerCompositeQuiz(quizId, options) {
    if (!quizId || !compositeNs || typeof compositeNs.createBuilder !== 'function') return null;
    const config = Object.assign({}, options || {});
    if (!config.sources && Array.isArray(config.compositeOf)) {
      config.sources = config.compositeOf;
    }
    config.sources = normalizeCompositeSources(config.sources);
    if (!config.sources.length) return null;

    config.quizId = quizId;
    config.utils = Utils;
    config.defaultElements = defaultElements;
    if (!config.quizParams || typeof config.quizParams !== 'object') config.quizParams = {};
    if (config.answerKey && !config.quizParams.answerKey) {
      config.quizParams.answerKey = config.answerKey;
    }
    if (!config.answerKey && config.quizParams && config.quizParams.answerKey) {
      config.answerKey = config.quizParams.answerKey;
    }
    if (!config.answerKey) {
      config.answerKey = 'phonetic';
      if (!config.quizParams.answerKey) config.quizParams.answerKey = 'phonetic';
    }
    delete config.compositeOf;

    const builder = compositeNs.createBuilder(config);
    if (builder) {
      QuizBuilders[quizId] = builder;
      return builder;
    }
    return null;
  }

  const QuizBuilders = {
    'consonant-clusters': function() {
      return Utils.fetchJSONCached('data/consonant-clusters.json').then(function(data){
        return function init(){
          var base = Utils.createQuizWithProgressiveDifficulty({ data: data, answerKey: 'sounds' });
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: 'consonant-clusters' }, base, {
            renderSymbol: function(answer, els) {
              try {
                var el = els.symbolEl;
                Utils.ErrorHandler.safeDOM(function(){ while (el.firstChild) el.removeChild(el.firstChild); })();
                el.textContent = String((answer && answer.cluster) || '');
                try { el.setAttribute('aria-label', 'Thai consonant cluster: ' + String((answer && answer.cluster) || '')); } catch (_) {}
              } catch (e) { Utils.logError && Utils.logError(e, 'consonant-clusters.renderSymbol'); }
            },
            onAnswered: function(ctx) {
              if (!ctx || !ctx.correct) return;
              try {
                var ans = ctx.answer || {};
                var text = '';
                var ansPhonetic = phoneticDisplay(ans);
                if (ans.english || ans.thai || ansPhonetic) {
                  text = (ans.english || '');
                  if (ans.thai) text += (text ? ' → ' : '') + ans.thai;
                  if (ansPhonetic) text += (text ? ' — ' : '') + ansPhonetic;
                }
                var typeLabel = (ans && ans.type === 'fake') ? 'Fake cluster' : 'True cluster';
                text = text ? (text + ' — ' + typeLabel) : typeLabel;
                Utils.renderExample(document.getElementById('feedback'), { text: text, highlight: { english: ans.english || '', thai: ans.thai || '', phonetic: ansPhonetic || '' } });
              } catch (e) { Utils.logError && Utils.logError(e, 'consonant-clusters.onAnswered'); }
            }
          }));
        };
      });
    },
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
                var ansPhonetic = phoneticDisplay(ans);
                var line = '';
                if (ans.exampleThai) {
                  line = ans.exampleThai;
                  if (ansPhonetic) line += ' — ' + ansPhonetic;
                } else if (ansPhonetic) {
                  line = ansPhonetic;
                }
                Utils.renderExample(document.getElementById('feedback'), { text: line, highlight: { english: '', thai: ans.exampleThai || '', phonetic: ansPhonetic || '' } });
              } catch (e) { Utils.logError && Utils.logError(e, 'final-consonants.onAnswered'); }
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
          var base = Utils.createQuizWithProgressiveDifficulty({ data: data, answerKey: 'phonetic' });
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
          const english = useModifier ? (maybeModifier.english + ' ' + base.english) : base.english;
          const hex = useModifier ? Utils.getDisplayHex(base.hex, maybeModifier) : base.hex;

          function joinParts(a, b) {
            var left = (a || '').trim();
            var right = (b || '').trim();
            if (left && right) return left + ' ' + right;
            return left || right || '';
          }

          const baseBundle = getPhoneticBundle(base) || fallbackBundle(base);
          var phoneticCanonical = baseBundle.canonical || baseBundle.display || '';
          var phoneticsMap = null;

          if (useModifier) {
            const modifierBundle = getPhoneticBundle(maybeModifier) || fallbackBundle(maybeModifier);
            phoneticCanonical = joinParts(baseBundle.canonical || baseBundle.display, modifierBundle.canonical || modifierBundle.display);

            var localeCandidates = {};
            function collectLocales(map) {
              if (!map) return;
              for (var key in map) {
                if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
                var norm = (Utils && typeof Utils.normalizePhoneticLocale === 'function') ? Utils.normalizePhoneticLocale(key) : String(key || '');
                if (!norm) continue;
                localeCandidates[norm] = true;
              }
            }
            collectLocales(base.phonetics);
            collectLocales(maybeModifier && maybeModifier.phonetics);
            var quizLocaleGetter = (Utils && typeof Utils.getQuizPhoneticLocale === 'function') ? Utils.getQuizPhoneticLocale : null;
            var preferred = quizLocaleGetter ? quizLocaleGetter('colors') : '';
            if (preferred) {
              var normPreferred = (Utils && typeof Utils.normalizePhoneticLocale === 'function') ? Utils.normalizePhoneticLocale(preferred) : preferred;
              if (normPreferred) localeCandidates[normPreferred] = true;
            }
            localeCandidates.en = true;

            var mapOut = {};
            var hasLocale = false;
            for (var locale in localeCandidates) {
              if (!Object.prototype.hasOwnProperty.call(localeCandidates, locale)) continue;
              if (!locale) continue;
              var basePart = (Utils && typeof Utils.getPhoneticForLocale === 'function') ? Utils.getPhoneticForLocale(base, locale) : (base.phonetics && base.phonetics[locale]) || base.phonetic || '';
              var modifierPart = (Utils && typeof Utils.getPhoneticForLocale === 'function') ? Utils.getPhoneticForLocale(maybeModifier, locale) : (maybeModifier && ((maybeModifier.phonetics && maybeModifier.phonetics[locale]) || maybeModifier.phonetic)) || '';
              var combined = joinParts(basePart, modifierPart);
              if (combined) {
                mapOut[locale] = combined;
                hasLocale = true;
              }
            }
            if (hasLocale) phoneticsMap = mapOut;
          } else if (base.phonetics) {
            phoneticsMap = base.phonetics;
          }

          var phrase = { english: english, thai: thai, phonetic: phoneticCanonical, hex: hex };
          if (phoneticsMap) phrase.phonetics = phoneticsMap;
          return phrase;
        }
        return function init(){
          ThaiQuiz.setupQuiz({
            elements: defaultElements,
            pickRound: function(state) {
              // Avoid repeating the previous phonetic answer
              var prevPhonetic = phoneticCanonical(state && state.currentAnswer);
              var attempt = 0;
              var answer;
              while (attempt < 10) {
                const base = Utils.pickRandom(baseColors);
                const maybeModifier = Math.random() < 0.55 ? Utils.pickRandom(modifiers) : null;
                const candidate = buildColorPhrase(base, maybeModifier);
                if (!prevPhonetic || phoneticCanonical(candidate) !== prevPhonetic) { answer = candidate; break; }
                attempt++;
                if (attempt >= 10) { answer = candidate; break; }
              }
              const currentChoices = Utils.getChoicesCountForState(state, undefined, 4);
              const choices = [answer];
              while (choices.length < currentChoices) {
                const b = Utils.pickRandom(baseColors);
                const m = Math.random() < 0.45 ? Utils.pickRandom(modifiers) : null;
                const choice = buildColorPhrase(b, m);
                if (!choices.find(function(c) { return phoneticCanonical(c) === phoneticCanonical(choice); })) choices.push(choice);
              }
              return { answer: answer, choices: choices, symbolText: answer.thai, symbolStyle: { color: answer.hex }, symbolAriaLabel: (Utils.i18n.labelColorPhrasePrefix || 'Thai color phrase: ') + answer.thai };
            },
            renderButtonContent: function(choice) { return phoneticDisplay(choice); },
            ariaLabelForChoice: function(choice) { return Utils.i18n.answerPrefix + phoneticDisplay(choice); },
            isCorrect: function(choice, answer) { return phoneticCanonical(choice) === phoneticCanonical(answer); },
            onAnswered: function(ctx) {
              if (!ctx || !ctx.correct) return;
              try {
                var ans = ctx.answer || {};
                var ansPhonetic = phoneticDisplay(ans);
                var text = (ans.english || '') + ' → ' + (ans.thai || '') + (ansPhonetic ? (' — ' + ansPhonetic) : '');
                Utils.renderExample(document.getElementById('feedback'), { text: text, highlight: { english: ans.english || '', thai: ans.thai || '', phonetic: ansPhonetic || '' } });
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

    'sara-ai-mai-muan': makeStandardQuizBuilder(['data/sara-ai-mai-muan.json','data/sara-ai-mai-muan-examples.json'], function(results) {
      return configWithExamples(results, {
        answerKey: 'thaiDisplay',
        buildSymbol: function(item) {
          return {
            english: (item && item.english) || '',
            thai: '',
            emoji: (item && item.emoji) || ''
          };
        }
      });
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

  QuizBuilders.registerComposite = registerCompositeQuiz;
  global.QuizBuilders = QuizBuilders;
})(window);
