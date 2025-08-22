(function() {
  'use strict';

  const defaultElements = { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' };

  function handleDataLoadError(err) {
    const fb = document.getElementById('feedback');
    if (fb) {
      let msg = 'Failed to load data.';
      if (window.location.protocol === 'file:') {
        msg += ' Open this site via a local server (e.g., python3 -m http.server) so JSON files can be fetched.';
      }
      fb.textContent = msg;
    }
    try { console.error('Data load error:', err); } catch (e) {}
  }

  // Data-driven configs: per-quiz builder functions
  const QuizBuilders = {
    consonants: function() {
      try { Utils.insertConsonantLegend(); } catch (e) {}
      return Utils.fetchJSONCached('data/consonants.json').then(function(data){
        return function init(){
          ThaiQuiz.setupQuiz({
            elements: defaultElements,
            pickRound: function(state) {
              const answer = data[Math.floor(Math.random() * data.length)];
              const choicesCount = (state.correctAnswers >= 30 ? 6 : 4);
              const choices = Utils.pickUniqueChoices(data, choicesCount, Utils.byProp('name'), answer);
              return { answer: answer, choices: choices };
            },
            renderSymbol: function(answer, els) {
              els.symbolEl.textContent = answer.symbol;
              els.symbolEl.setAttribute('aria-label', 'Thai consonant symbol: ' + answer.symbol);
            },
            renderButtonContent: function(choice, state) {
              const hideEmojis = state.correctAnswers >= 50;
              return hideEmojis ? ('' + choice.name) : ('<span class="emoji">' + choice.emoji + '</span> ' + choice.name);
            },
            ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.name + ' (' + choice.meaning + ')'; },
            decorateButton: function(btn, choice) { btn.classList.add(choice.class + '-class'); },
            isCorrect: function(choice, answer) { return choice.name === answer.name; }
          });
        };
      });
    },

    vowels: function() {
      return Utils.fetchJSONCached('data/vowels.json').then(function(data){
        return function init(){
          ThaiQuiz.setupQuiz({
            elements: defaultElements,
            pickRound: function() {
              const answer = Utils.pickRandom(data);
              const choices = Utils.pickUniqueChoices(data, 4, Utils.byProp('sound'), answer);
              return { answer: answer, choices: choices };
            },
            renderSymbol: function(answer, els) {
              try { Utils.renderVowelSymbol(els.symbolEl, answer.symbol); } catch (e) {}
            },
            renderButtonContent: function(choice) { return choice.sound; },
            isCorrect: function(choice, answer) { return choice.sound === answer.sound; }
          });
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
            pickRound: function() {
              const base = Utils.pickRandom(baseColors);
              const maybeModifier = Math.random() < 0.55 ? Utils.pickRandom(modifiers) : null;
              const answer = buildColorPhrase(base, maybeModifier);
              const choices = [answer];
              while (choices.length < 4) {
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
            ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.phonetic; },
            isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; }
          });
        };
      });
    },

    numbers: function() {
      return Utils.fetchJSONCached('data/numbers.json').then(function(data){
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            answerKey: 'phonetic',
            labelPrefix: 'Number and Thai: ',
            buildSymbol: function(a){ return { english: String(a.number || ''), thai: a.thai || '' }; }
          })));
        };
      });
    },

    time: function() {
      return Utils.fetchJSONs(['data/time-keywords.json','data/time-formats.json','data/time-examples.json']).then(function(results){
        const keyWords = results[0] || [];
        const timeFormats = results[1] || [];
        const examples = results[2] || [];
        function englishOf(item) { return item.english || item.note || item.translation || ''; }
        const pool = keyWords.concat(timeFormats, examples);
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: pool,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: englishOf(a), thai: a.thai || '' }; }
          })));
        };
      });
    },

    tones: function() {
      return Utils.fetchJSONCached('data/tones.json').then(function(data){
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            answerKey: 'phonetic',
            labelPrefix: 'Class + Marker + Length: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '' }; }
          })));
        };
      });
    },

    questions: function() {
      return Utils.fetchJSONs(['data/questions.json','data/questions-examples.json']).then(function(results){
        const data = results[0] || [];
        const examples = results[1] || {};
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: '
          })));
        };
      });
    },

    verbs: function() {
      return Utils.fetchJSONs(['data/emoji-rules/verbs.json','data/verbs.json','data/verbs-examples.json']).then(function(results){
        const rules = results[0] || [];
        const getEmoji = Utils.createEmojiGetter(rules);
        const data = results[1] || [];
        const examples = results[2] || {};
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: getEmoji(a && a.english) }; }
          })));
        };
      });
    },

    family: function() {
      return Utils.fetchJSONCached('data/family.json').then(function(data){
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: '
          })));
        };
      });
    },

    classifiers: function() {
      return Utils.fetchJSONs(['data/emoji-rules/classifiers.json','data/classifiers.json','data/classifiers-examples.json']).then(function(results){
        const rules = results[0] || [];
        const getEmoji = Utils.createEmojiGetter(rules);
        const data = results[1] || [];
        const examples = results[2] || {};
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: getEmoji(a && a.english) }; }
          })));
        };
      });
    },

    jobs: function() {
      return Utils.fetchJSONs(['data/emoji-rules/jobs.json','data/jobs.json']).then(function(results){
        const rules = results[0] || [];
        const getEmoji = Utils.createEmojiGetter(rules);
        const data = results[1] || [];
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: getEmoji(a && a.english) }; }
          })));
        };
      });
    },

    foods: function() {
      return Utils.fetchJSONs(['data/emoji-rules/foods.json','data/foods.json','data/foods-examples.json']).then(function(results){
        const rules = results[0] || [];
        const getEmoji = Utils.createEmojiGetter(rules);
        const data = results[1] || [];
        const examples = results[2] || {};
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            exampleKey: function(a){ return a.id || a.english; },
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: getEmoji(a && a.english) }; }
          })));
        };
      });
    },

    months: function() {
      return Utils.fetchJSONs(['data/emoji-rules/months-seasons.json','data/months-seasons.json','data/months-seasons-examples.json']).then(function(results){
        const rules = results[0] || [];
        const getEmoji = Utils.createEmojiGetter(rules);
        const data = results[1] || [];
        const examples = results[2] || {};
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: getEmoji(a && a.english) }; }
          })));
        };
      });
    },

    rooms: function() {
      return Utils.fetchJSONs(['data/emoji-rules/rooms.json','data/rooms.json','data/rooms-examples.json']).then(function(results){
        const rules = results[0] || [];
        const getEmoji = Utils.createEmojiGetter(rules);
        const data = results[1] || [];
        const examples = results[2] || {};
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            exampleKey: function(a){ return a.id || a.english; },
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: getEmoji(a && a.english) }; }
          })));
        };
      });
    },

    tenses: function() {
      return Utils.fetchJSONs(['data/emoji-rules/tenses.json','data/tenses.json','data/tenses-examples.json']).then(function(results){
        const rules = results[0] || [];
        const getEmoji = Utils.createEmojiGetter(rules);
        const data = results[1] || [];
        const examples = results[2] || {};
        return function init(){
          ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements }, Utils.createStandardQuiz({
            data: data,
            examples: examples,
            answerKey: 'phonetic',
            labelPrefix: 'English and Thai: ',
            buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '', emoji: getEmoji(a && a.english) }; }
          })));
        };
      });
    }
  };

  function setText(id, text) {
    try { Utils.setText(id, text); } catch (e) {}
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
        // Map categories to a default body class; allow overrides per builder if needed
        const bodyClassMap = {
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
          months: 'questions-quiz',
          tenses: 'questions-quiz'
        };
        const cls = bodyClassMap[quizId];
        if (cls) document.body.classList.add(cls);

        // Add per-quiz pro tips moved to metadata-free helpers for simplicity
        try {
          if (quizId === 'numbers') {
            Utils.insertProTip('Pro tip: Insert a classifier after the number for counting. e.g., 2 bottles = <strong>สองขวด</strong> (<em>sɔ̌ɔŋ khùat</em>), 5 people = <strong>ห้าคน</strong> (<em>hâa khon</em>).');
          } else if (quizId === 'questions') {
            Utils.insertProTip('• Most yes/no questions end in “mái?”<br>• Add “khráp/khà” for politeness at the end<br>• Use “bâaŋ” after question words for “what kinds / which ones”<br>→ khun chɔ̂ɔp sǐi à-rai bâaŋ? (Which colors do you like?)');
          } else if (quizId === 'verbs') {
            Utils.insertProTip('• Common combos: "tham ŋaan" (work), "àap-náam" (shower)<br>• Use "bpai/maa" for go/come; add places with "thîi" (at)');
          } else if (quizId === 'classifiers') {
            Utils.insertProTip('Structure: <strong>[noun] + [number] + [classifier]</strong><br>"nɯ̀ŋ" (one) is often omitted in casual speech.');
          } else if (quizId === 'rooms') {
            Utils.insertProTip('• Use "hɔ̂ɔŋ" (room) before specific room names<br>• "nai" means "in" - phǒm yùu nai hɔ̂ɔŋ nɔɔn (I\'m in the bedroom)<br>• "thîi" means "at" - rao nâŋ lên thîi rá-biiang (We sit on the balcony)');
          } else if (quizId === 'tenses') {
            Utils.insertProTip('Structure: <strong>[Subject] + [Time Marker] + [Verb] + [Particle]</strong>');
          } else if (quizId === 'vowels') {
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
        } catch (e) {}

        // Build and start the selected quiz
        const builder = QuizBuilders[quizId];
        if (!builder) {
          setText('page-title', 'Quiz not found');
          setText('page-subtitle', 'Unknown quiz: ' + quizId);
          return;
        }
        builder().then(function(initFn){
          try { initFn(); } catch (e) { handleDataLoadError(e); }
        }).catch(function(err){ handleDataLoadError(err); });
      }).catch(function(err){ handleDataLoadError(err); });
    } catch (e) {
      // no-op
    }
  }

  // Start
  initFromQuery();
})();
