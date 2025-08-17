(function() {
  'use strict';

  var defaultElements = { symbol: 'symbol', options: 'options', feedback: 'feedback', stats: 'stats' };

  function handleDataLoadError(err) {
    var fb = document.getElementById('feedback');
    if (fb) {
      var msg = 'Failed to load data.';
      if (window.location.protocol === 'file:') {
        msg += ' Open this site via a local server (e.g., python3 -m http.server) so JSON files can be fetched.';
      }
      fb.textContent = msg;
    }
    try { console.error('Data load error:', err); } catch (e) {}
  }

  // Centralized quiz configurations
  var ThaiQuizConfigs = {
    consonants: {
      title: 'Thai Consonant Quiz',
      subtitle: '',
      bodyClass: 'consonant-quiz',
      init: function() {
        // Insert legend above the symbol
        try {
          var symbolAnchor = document.getElementById('symbol');
          if (symbolAnchor && symbolAnchor.parentNode) {
            var legend = document.createElement('div');
            legend.className = 'legend';
            legend.innerHTML = '<span class="legend-item"><span class="legend-color middle-class"></span> Middle Class</span>' +
                               '<span class="legend-item"><span class="legend-color high-class"></span> High Class</span>' +
                               '<span class="legend-item"><span class="legend-color low-class"></span> Low Class</span>';
            symbolAnchor.parentNode.insertBefore(legend, symbolAnchor);
          }
        } catch (e) {}

        Utils.fetchJSON('data/consonants.json')
          .then(function(data){
            ThaiQuiz.setupQuiz({
              elements: defaultElements,
              pickRound: function(state) {
                var answer = data[Math.floor(Math.random() * data.length)];
                var choices = Utils.pickUniqueChoices(data, (state.correctAnswers >= 30 ? 6 : 4), Utils.byProp('name'), answer);
                return { answer: answer, choices: choices };
              },
              renderSymbol: function(answer, els) {
                els.symbolEl.textContent = answer.symbol;
                els.symbolEl.setAttribute('aria-label', 'Thai consonant symbol: ' + answer.symbol);
              },
              renderButtonContent: function(choice, state) {
                var hideEmojis = state.correctAnswers >= 50;
                return hideEmojis ? ('' + choice.name) : ('<span class="emoji">' + choice.emoji + '</span> ' + choice.name);
              },
              ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.name + ' (' + choice.meaning + ')'; },
              decorateButton: function(btn, choice) { btn.classList.add(choice.class + '-class'); },
              isCorrect: function(choice, answer) { return choice.name === answer.name; }
            });
          })
          .catch(function(err){ handleDataLoadError(err); });
      }
    },

    vowels: {
      title: 'Thai Vowel Quiz',
      subtitle: '',
      bodyClass: 'vowel-quiz',
      init: function() {
        Utils.fetchJSON('data/vowels.json')
          .then(function(data){
            ThaiQuiz.setupQuiz({
              elements: defaultElements,
              pickRound: function() {
                var answer = Utils.pickRandom(data);
                var choices = Utils.pickUniqueChoices(data, 4, Utils.byProp('sound'), answer);
                return { answer: answer, choices: choices, symbolText: answer.symbol };
              },
              renderButtonContent: function(choice) { return choice.sound; },
              isCorrect: function(choice, answer) { return choice.sound === answer.sound; }
            });
          })
          .catch(function(err){ handleDataLoadError(err); });
      }
    },

    colors: {
      title: 'Thai Color Quiz',
      subtitle: 'Choose the correct phonetic for the Thai color',
      bodyClass: 'color-quiz',
      init: function() {
        Utils.fetchJSONs(['data/colors-base.json', 'data/color-modifiers.json']).then(function(results){
          var baseColors = results[0] || [];
          var modifiers = results[1] || [];

          function buildColorPhrase(base, maybeModifier) {
            var hasBuiltInShade = /(^|\s)(dark|light)\s/i.test(base.english);
            var useModifier = !!maybeModifier && !hasBuiltInShade;
            var thai = useModifier ? (base.thai + ' ' + maybeModifier.thai) : base.thai;
            var phonetic = useModifier ? (base.phonetic + ' ' + maybeModifier.phonetic) : base.phonetic;
            var english = useModifier ? (maybeModifier.english + ' ' + base.english) : base.english;
            var hex = useModifier ? Utils.getDisplayHex(base.hex, maybeModifier) : base.hex;
            return { english: english, thai: thai, phonetic: phonetic, hex: hex };
          }

          ThaiQuiz.setupQuiz({
            elements: defaultElements,
            pickRound: function() {
              var base = Utils.pickRandom(baseColors);
              var maybeModifier = Math.random() < 0.55 ? Utils.pickRandom(modifiers) : null;
              var answer = buildColorPhrase(base, maybeModifier);
              var choices = [answer];
              while (choices.length < 4) {
                var b = Utils.pickRandom(baseColors);
                var m = Math.random() < 0.45 ? Utils.pickRandom(modifiers) : null;
                var choice = buildColorPhrase(b, m);
                if (!choices.find(function(c) { return c.phonetic === choice.phonetic; })) choices.push(choice);
              }
              return { answer: answer, choices: choices, symbolText: answer.thai, symbolStyle: { color: answer.hex }, symbolAriaLabel: 'Thai color phrase: ' + answer.thai };
            },
            renderButtonContent: function(choice) { return choice.phonetic; },
            ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.phonetic; },
            isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; }
          });
        }).catch(function(err){ handleDataLoadError(err); });
      }
    },

    numbers: {
      title: 'Thai Numbers Quiz',
      subtitle: 'Choose the correct phonetic for the Thai number',
      bodyClass: 'numbers-quiz',
      init: function() {
        try {
          var footer = document.querySelector('.footer');
          if (footer) {
            var tip = document.createElement('div');
            tip.className = 'pro-tip';
            tip.innerHTML = '<small>Pro tip: Insert a classifier after the number for counting. e.g., 2 bottles = <strong>สองขวด</strong> (<em>sɔ̌ɔŋ khùat</em>), 5 people = <strong>ห้าคน</strong> (<em>hâa khon</em>).</small>';
            footer.appendChild(tip);
          }
        } catch (e) {}

        Utils.fetchJSON('data/numbers.json')
          .then(function(data){
            ThaiQuiz.setupQuiz({
              elements: defaultElements,
              pickRound: function() {
                var answer = Utils.pickRandom(data);
                var choices = Utils.pickUniqueChoices(data, 4, Utils.byProp('phonetic'), answer);
                var symbolText = (answer.number || '') + '  ' + (answer.thai || '');
                var symbolAriaLabel = 'Number and Thai: ' + (answer.number || '') + (answer.thai ? ' ' + answer.thai : '');
                return { answer: answer, choices: choices, symbolText: symbolText, symbolAriaLabel: symbolAriaLabel };
              },
              renderSymbol: function(answer, els) {
                var num = answer.number || '';
                var thai = answer.thai || '';
                els.symbolEl.innerHTML = '' + num + (thai ? '<span class="secondary">' + thai + '</span>' : '');
                els.symbolEl.setAttribute('aria-label', 'Number and Thai: ' + num + (thai ? ' ' + thai : ''));
              },
              renderButtonContent: function(choice) { return choice.phonetic; },
              ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.phonetic; },
              isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; }
            });
          })
          .catch(function(err){ handleDataLoadError(err); });
      }
    },

    time: {
      title: 'Thai Time Quiz',
      subtitle: 'Choose the correct phonetic for the Thai time phrase',
      bodyClass: 'time-quiz',
      init: function() {
        Utils.fetchJSONs(['data/time-keywords.json','data/time-formats.json','data/time-examples.json']).then(function(results){
          var keyWords = results[0] || [];
          var timeFormats = results[1] || [];
          var examples = results[2] || [];

          function englishOf(item) {
            return item.english || item.note || item.translation || '';
          }

          var pool = keyWords.concat(timeFormats, examples);

          ThaiQuiz.setupQuiz({
            elements: defaultElements,
            pickRound: function() {
              var answer = Utils.pickRandom(pool);
              var choices = Utils.pickUniqueChoices(pool, 4, Utils.byProp('phonetic'), answer);
              var symbolAriaLabel = 'English and Thai: ' + englishOf(answer) + ' — ' + answer.thai;
              return { answer: answer, choices: choices, symbolAriaLabel: symbolAriaLabel };
            },
            renderSymbol: function(answer, els) {
              var english = englishOf(answer);
              var thai = answer.thai || '';
              els.symbolEl.innerHTML = '' + english + (thai ? '<span class="secondary">' + thai + '</span>' : '');
              els.symbolEl.setAttribute('aria-label', 'English and Thai: ' + english + (thai ? ' — ' + thai : ''));
            },
            renderButtonContent: function(choice) { return choice.phonetic; },
            ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.phonetic; },
            isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; }
          });
        }).catch(function(err){ handleDataLoadError(err); });
      }
    },

    questions: {
      title: 'Thai Questions Quiz',
      subtitle: 'Choose the correct phonetic for the Thai question word or pattern',
      bodyClass: 'questions-quiz',
      init: function() {
        try {
          var footer = document.querySelector('.footer');
          if (footer) {
            var tip = document.createElement('div');
            tip.className = 'pro-tip';
            tip.innerHTML = '<small>• Most yes/no questions end in “mái?”<br>• Add “khráp/khà” for politeness at the end<br>• Use “bâaŋ” after question words for “what kinds / which ones”<br>→ khun chɔ̂ɔp sǐi à-rai bâaŋ? (Which colors do you like?)</small>';
            footer.appendChild(tip);
          }
        } catch (e) {}

        Promise.all([
          Utils.fetchJSON('data/questions.json'),
          Utils.fetchJSON('data/questions-examples.json')
        ]).then(function(results){
          var data = results[0] || [];
          var examples = results[1] || {};

          ThaiQuiz.setupQuiz({
            elements: defaultElements,
            pickRound: function() {
              var answer = Utils.pickRandom(data);
              var choices = Utils.pickUniqueChoices(data, 4, Utils.byProp('phonetic'), answer);
              var symbolAriaLabel = 'English and Thai: ' + (answer.english || '') + ' — ' + (answer.thai || '');
              return { answer: answer, choices: choices, symbolAriaLabel: symbolAriaLabel };
            },
            renderSymbol: function(answer, els) {
              var thai = answer.thai || '';
              var english = answer.english || '';
              els.symbolEl.innerHTML = '' + english + (thai ? '<span class="secondary">' + thai + '</span>' : '');
              els.symbolEl.setAttribute('aria-label', 'English and Thai: ' + english + (thai ? ' — ' + thai : ''));
            },
            renderButtonContent: function(choice) { return choice.phonetic; },
            ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.phonetic; },
            isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; },
            onAnswered: function(ctx) {
              var correct = ctx.correct, answer = ctx.answer, state = ctx.state;
              if (!correct) return;
              try {
                var fb = document.getElementById('feedback');
                var ex = examples[answer.english];
                fb.innerHTML = ex ? '<div class="correct-line">✅ Correct!</div><div class="example" aria-label="Example sentence"><span class="label">Example</span><div class="text">' + ex + '</div></div>' : '<div class="correct-line">✅ Correct!</div>';
                if (state && state.autoAdvanceTimerId != null) {
                  clearTimeout(state.autoAdvanceTimerId);
                }
                state.autoAdvanceTimerId = setTimeout(function() {
                  if (typeof ctx.next === 'function') ctx.next();
                }, 3000);
              } catch (e) {}
            }
          });
        }).catch(function(err){ handleDataLoadError(err); });
      }
    },

    family: {
      title: 'Thai Family Quiz',
      subtitle: 'Choose the correct phonetic for the Thai family word',
      bodyClass: 'family-quiz',
      init: function() {
        Utils.fetchJSON('data/family.json')
          .then(function(data){
            ThaiQuiz.setupQuiz({
              elements: defaultElements,
              pickRound: function() {
                var answer = Utils.pickRandom(data);
                var choices = Utils.pickUniqueChoices(data, 4, Utils.byProp('phonetic'), answer);
                var symbolAriaLabel = 'English and Thai: ' + (answer.english || '') + ' — ' + (answer.thai || '');
                return { answer: answer, choices: choices, symbolAriaLabel: symbolAriaLabel };
              },
              renderSymbol: function(answer, els) {
                var english = answer.english || '';
                var thai = answer.thai || '';
                els.symbolEl.innerHTML = '' + english + (thai ? '<span class="secondary">' + thai + '</span>' : '');
                els.symbolEl.setAttribute('aria-label', 'English and Thai: ' + english + (thai ? ' — ' + thai : ''));
              },
              renderButtonContent: function(choice) { return choice.phonetic; },
              ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.phonetic; },
              isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; }
            });
          })
          .catch(function(err){ handleDataLoadError(err); });
      }
    }
  };

  function setText(id, text) {
    try { Utils.setText(id, text); } catch (e) {}
  }

  function initFromQuery() {
    try {
      var params = new URLSearchParams(window.location.search);
      var quizId = params.get('quiz') || '';
      var config = ThaiQuizConfigs[quizId];
      if (!config) {
        setText('page-title', 'Quiz not found');
        setText('page-subtitle', 'Unknown quiz: ' + quizId);
        return;
      }

      document.title = config.title;
      setText('page-title', config.title);
      setText('page-subtitle', config.subtitle || '');
      if (config.bodyClass) {
        document.body.classList.add(config.bodyClass);
      }

      // Initialize selected quiz
      config.init();
    } catch (e) {
      // no-op
    }
  }

  // Start
  initFromQuery();
})();