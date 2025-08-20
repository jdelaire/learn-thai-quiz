(function() {
  'use strict';

  var defaultElements = { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' };

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
        try {
          var symbolAnchor = document.getElementById('symbol');
          if (symbolAnchor && !document.querySelector('.vowel-note')) {
            var tip = document.createElement('div');
            tip.className = 'vowel-note';
            tip.setAttribute('role', 'note');
            tip.textContent = 'Note: The consonant ก (goo gai) may appear as a placeholder to show where the vowel attaches; it is not part of the answer.';
            symbolAnchor.insertAdjacentElement('afterend', tip);
          }
        } catch (e) {}
        Utils.fetchJSON('data/vowels.json')
          .then(function(data){
            ThaiQuiz.setupQuiz({
              elements: defaultElements,
              pickRound: function() {
                var answer = Utils.pickRandom(data);
                var choices = Utils.pickUniqueChoices(data, 4, Utils.byProp('sound'), answer);
                return { answer: answer, choices: choices, symbolText: answer.symbol };
              },
              renderSymbol: function(answer, els) {
                try {
                  var raw = String(answer.symbol || '');
                  // Insert ko kai (\u0E01) directly; wrapping breaks shaping in Safari
                  var out = raw.replace(/-/g, '\u0E01');
                  els.symbolEl.textContent = out;
                  els.symbolEl.setAttribute('aria-label', 'Thai vowel symbol: ' + (answer.symbol || ''));
                } catch (e) {}
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
            ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
              data: data,
              answerKey: 'phonetic',
              labelPrefix: 'Number and Thai: ',
              buildSymbol: function(a){ return { english: String(a.number || ''), thai: a.thai || '' }; }
            })));
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

          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: pool,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: englishOf(a), thai: a.thai || '' }; }
          })));
        }).catch(function(err){ handleDataLoadError(err); });
      }
    },

    tones: {
      title: 'Thai Tone Markers',
      subtitle: 'Choose the resulting tone from consonant class, tone marker, and vowel length',
      bodyClass: 'questions-quiz',
      init: function() {
        Utils.fetchJSON('data/tones.json')
          .then(function(data){
            ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
              data: data,
              answerKey: 'phonetic',
              labelPrefix: 'Class + Marker + Length: ',
              buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '' }; }
            })));
          })
          .catch(function(err){ handleDataLoadError(err); });
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

          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: '
          })));
        }).catch(function(err){ handleDataLoadError(err); });
      }
    },

    verbs: {
      title: '🚀 Common Action Verbs',
      subtitle: 'Choose the correct phonetic for the Thai verb',
      bodyClass: 'questions-quiz',
      init: function() {
        try {
          var footer = document.querySelector('.footer');
          if (footer) {
            var tip = document.createElement('div');
            tip.className = 'pro-tip';
            tip.innerHTML = '<small>• Common combos: "tham ŋaan" (work), "àap-náam" (shower)<br>• Use "bpai/maa" for go/come; add places with "thîi" (at)</small>';
            footer.appendChild(tip);
          }
        } catch (e) {}

        var emojiForVerb = (function(){
          var matcher = null;
          return function(item){
            try {
              if (!matcher) return '';
              return matcher(String(item && item.english || ''));
            } catch (e) { return ''; }
          };
        })();

        Utils.fetchJSONs([
          'data/emoji-rules/verbs.json',
          'data/verbs.json',
          'data/verbs-examples.json'
        ]).then(function(results){
          var rules = results[0] || [];
          var matcher = Utils.buildEmojiMatcher(rules);
          emojiForVerb = function(item){ try { return matcher(String(item && item.english || '')); } catch (e) { return ''; } };
          var data = results[1] || [];
          var examples = results[2] || {};
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: emojiForVerb(a) }; }
          })));
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
            ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
              data: data,
              answerKey: 'phonetic',
              labelPrefix: 'English and Thai: '
            })));
          })
          .catch(function(err){ handleDataLoadError(err); });
      }
    },

    classifiers: {
      title: 'Thai Classifiers Quiz',
      subtitle: 'Choose the correct phonetic for the Thai classifier',
      bodyClass: 'classifiers-quiz',
      init: function() {
        try {
          var footer = document.querySelector('.footer');
          if (footer) {
            var tip = document.createElement('div');
            tip.className = 'pro-tip';
            tip.innerHTML = '<small>Structure: <strong>[noun] + [number] + [classifier]</strong><br>"nɯ̀ŋ" (one) is often omitted in casual speech.</small>';
            footer.appendChild(tip);
          }
        } catch (e) {}

        var emojiForClassifier = (function(){
          var matcher = null;
          return function(item){
            try { return matcher ? matcher(String(item && item.english || '')) : ''; } catch (e) { return ''; }
          };
        })();

        Utils.fetchJSONs([
          'data/emoji-rules/classifiers.json',
          'data/classifiers.json',
          'data/classifiers-examples.json'
        ])
          .then(function(results){
            var rules = results[0] || [];
            var matcher = Utils.buildEmojiMatcher(rules);
            emojiForClassifier = function(item){ try { return matcher(String(item && item.english || '')); } catch (e) { return ''; } };
            var data = results[1] || [];
            var examples = results[2] || {};
            ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
              data: data,
              examples: examples,
              answerKey: 'phonetic',
              labelPrefix: 'English and Thai: ',
              buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: emojiForClassifier(a) }; }
            })));
          })
          .catch(function(err){ handleDataLoadError(err); });
      }
    },

    jobs: {
      title: '🕵🏻‍♂️👨‍💼 Thai Jobs Quiz',
      subtitle: 'Choose the correct phonetic for the Thai job or occupation',
      bodyClass: 'jobs-quiz',
      init: function() {
        var emojiForJob = (function(){
          var matcher = null;
          return function(item){
            try { return matcher ? matcher(String(item && item.english || '')) : ''; } catch (e) { return ''; }
          };
        })();

        Utils.fetchJSONs([
          'data/emoji-rules/jobs.json',
          'data/jobs.json'
        ])
          .then(function(results){
            var rules = results[0] || [];
            var matcher = Utils.buildEmojiMatcher(rules);
            emojiForJob = function(item){ try { return matcher(String(item && item.english || '')); } catch (e) { return ''; } };
            var data = results[1] || [];
            ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
              data: data,
              answerKey: 'phonetic',
              labelPrefix: 'English and Thai: ',
              buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: emojiForJob(a) }; }
            })));
          })
          .catch(function(err){ handleDataLoadError(err); });
      }
    },

    foods: {
      title: '🍛 Common Thai Foods',
      subtitle: 'Choose the correct phonetic for the Thai food, fruit, or cooking method',
      bodyClass: 'foods-quiz',
      init: function() {
        var emojiForFood = (function(){
          var matcher = null;
          return function(item){
            try { return matcher ? matcher(String(item && item.english || '')) : ''; } catch (e) { return ''; }
          };
        })();

        Utils.fetchJSONs([
          'data/emoji-rules/foods.json',
          'data/foods.json',
          'data/foods-examples.json'
        ]).then(function(results){
          var rules = results[0] || [];
          var matcher = Utils.buildEmojiMatcher(rules);
          emojiForFood = function(item){ try { return matcher(String(item && item.english || '')); } catch (e) { return ''; } };
          var data = results[1] || [];
          var examples = results[2] || {};
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            exampleKey: function(a){ return a.id || a.english; },
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: emojiForFood(a) }; }
          })));
        }).catch(function(err){ handleDataLoadError(err); });
      }
    },

    rooms: {
      title: '🏠 Thai Rooms Quiz',
      subtitle: 'Choose the correct phonetic for the Thai room or house term',
      bodyClass: 'rooms-quiz',
      init: function() {
        try {
          var footer = document.querySelector('.footer');
          if (footer) {
            var tip = document.createElement('div');
            tip.className = 'pro-tip';
            tip.innerHTML = '<small>• Use "hɔ̂ɔŋ" (room) before specific room names<br>• "nai" means "in" - phǒm yùu nai hɔ̂ɔŋ nɔɔn (I\'m in the bedroom)<br>• "thîi" means "at" - rao nâŋ lên thîi rá-biiang (We sit on the balcony)</small>';
            footer.appendChild(tip);
          }
        } catch (e) {}

        var emojiForRoom = (function(){
          var matcher = null;
          return function(item){
            try { return matcher ? matcher(String(item && item.english || '')) : ''; } catch (e) { return ''; }
          };
        })();

        Utils.fetchJSONs([
          'data/emoji-rules/rooms.json',
          'data/rooms.json',
          'data/rooms-examples.json'
        ]).then(function(results){
          var rules = results[0] || [];
          var matcher = Utils.buildEmojiMatcher(rules);
          emojiForRoom = function(item){ try { return matcher(String(item && item.english || '')); } catch (e) { return ''; } };
          var data = results[1] || [];
          var examples = results[2] || {};
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            exampleKey: function(a){ return a.id || a.english; },
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: emojiForRoom(a) }; }
          })));
        }).catch(function(err){ handleDataLoadError(err); });
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
