(function() {
  'use strict';

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

        fetch('data/consonants.json')
          .then(function(r){ return r.json(); })
          .then(function(data){
            ThaiQuiz.setupQuiz({
              elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' },
              pickRound: function(state) {
                var answer = data[Math.floor(Math.random() * data.length)];
                var choices = [answer];
                var numChoices = state.correctAnswers >= 30 ? 6 : 4;
                while (choices.length < numChoices) {
                  var rand = data[Math.floor(Math.random() * data.length)];
                  if (!choices.find(function(c) { return c.name === rand.name; })) choices.push(rand);
                }
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
        fetch('data/vowels.json')
          .then(function(r){ return r.json(); })
          .then(function(data){
            ThaiQuiz.setupQuiz({
              elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' },
              pickRound: function() {
                var answer = data[Math.floor(Math.random() * data.length)];
                var choices = [answer];
                while (choices.length < 4) {
                  var rand = data[Math.floor(Math.random() * data.length)];
                  if (!choices.includes(rand)) choices.push(rand);
                }
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
        var baseColors = JSON.parse(`[
  {"english":"white","thai":"สีขาว","phonetic":"sǐi khǎaw","hex":"#ecf0f1"},
  {"english":"black","thai":"สีดำ","phonetic":"sǐi dam","hex":"#2d3436"},
  {"english":"red","thai":"สีแดง","phonetic":"sǐi dɛɛŋ","hex":"#e74c3c"},
  {"english":"yellow","thai":"สีเหลือง","phonetic":"sǐi lɯ̌aŋ","hex":"#f1c40f"},
  {"english":"green","thai":"สีเขียว","phonetic":"sǐi khǐaw","hex":"#2ecc71"},
  {"english":"sky blue","thai":"สีฟ้า","phonetic":"sǐi fáa","hex":"#3498db"},
  {"english":"dark blue","thai":"สีน้ำเงิน","phonetic":"sǐi náam-ŋəən","hex":"#2c3e50"},
  {"english":"orange","thai":"สีส้ม","phonetic":"sǐi sôm","hex":"#e67e22"},
  {"english":"pink","thai":"สีชมพู","phonetic":"sǐi chom-phuu","hex":"#e91e63"},
  {"english":"purple","thai":"สีม่วง","phonetic":"sǐi mûaŋ","hex":"#8e44ad"},
  {"english":"brown","thai":"สีน้ำตาล","phonetic":"sǐi náam-dtaan","hex":"#8d6e63"},
  {"english":"gray","thai":"สีเทา","phonetic":"sǐi thaw","hex":"#95a5a6"}
]`);

        var modifiers = JSON.parse(`[
  {"english":"light","thai":"อ่อน","phonetic":"ɔ̀ɔn"},
  {"english":"dark","thai":"เข้ม","phonetic":"khêm"}
]`);

        function hexToRgb(hex) {
          var h = hex.replace('#', '');
          var bigint = parseInt(h, 16);
          return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
        }
        function rgbToHex(r, g, b) {
          var toHex = function(x) { return x.toString(16).padStart(2, '0'); };
          return '#' + toHex(Math.max(0, Math.min(255, Math.round(r)))) + toHex(Math.max(0, Math.min(255, Math.round(g)))) + toHex(Math.max(0, Math.min(255, Math.round(b))));
        }
        function rgbToHsl(r, g, b) {
          r /= 255; g /= 255; b /= 255;
          var max = Math.max(r, g, b), min = Math.min(r, g, b);
          var h, s, l = (max + min) / 2;
          if (max === min) { h = s = 0; }
          else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
          }
          return { h: h, s: s, l: l };
        }
        function hslToRgb(h, s, l) {
          var r, g, b;
          if (s === 0) { r = g = b = l; }
          else {
            var hue2rgb = function(p, q, t) {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1/6) return p + (q - p) * 6 * t;
              if (t < 1/2) return q;
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
            };
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
          }
          return { r: r * 255, g: g * 255, b: b * 255 };
        }
        function adjustLightness(hex, delta) {
          var rgb = hexToRgb(hex);
          var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          var newL = Math.max(0, Math.min(1, hsl.l + delta));
          var nrgb = hslToRgb(hsl.h, hsl.s, newL);
          return rgbToHex(nrgb.r, nrgb.g, nrgb.b);
        }
        function getDisplayHex(baseHex, modifier) {
          if (!modifier) return baseHex;
          if (/^light$/i.test(modifier.english)) return adjustLightness(baseHex, 0.25);
          if (/^dark$/i.test(modifier.english)) return adjustLightness(baseHex, -0.25);
          return baseHex;
        }
        function buildColorPhrase(base, maybeModifier) {
          var hasBuiltInShade = /(^|\s)(dark|light)\s/i.test(base.english);
          var useModifier = !!maybeModifier && !hasBuiltInShade;
          var thai = useModifier ? (base.thai + ' ' + maybeModifier.thai) : base.thai;
          var phonetic = useModifier ? (base.phonetic + ' ' + maybeModifier.phonetic) : base.phonetic;
          var english = useModifier ? (maybeModifier.english + ' ' + base.english) : base.english;
          var hex = useModifier ? getDisplayHex(base.hex, maybeModifier) : base.hex;
          return { english: english, thai: thai, phonetic: phonetic, hex: hex };
        }

        ThaiQuiz.setupQuiz({
          elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' },
          pickRound: function() {
            var base = baseColors[Math.floor(Math.random() * baseColors.length)];
            var maybeModifier = Math.random() < 0.55 ? modifiers[Math.floor(Math.random() * modifiers.length)] : null;
            var answer = buildColorPhrase(base, maybeModifier);
            var choices = [answer];
            while (choices.length < 4) {
              var b = baseColors[Math.floor(Math.random() * baseColors.length)];
              var m = Math.random() < 0.45 ? modifiers[Math.floor(Math.random() * modifiers.length)] : null;
              var choice = buildColorPhrase(b, m);
              if (!choices.find(function(c) { return c.phonetic === choice.phonetic; })) choices.push(choice);
            }
            return { answer: answer, choices: choices, symbolText: answer.thai, symbolStyle: { color: answer.hex }, symbolAriaLabel: 'Thai color phrase: ' + answer.thai };
          },
          renderButtonContent: function(choice) { return choice.phonetic; },
          ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.phonetic; },
          isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; }
        });
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

        fetch('data/numbers.json')
          .then(function(r){ return r.json(); })
          .then(function(data){
            ThaiQuiz.setupQuiz({
              elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' },
              pickRound: function() {
                var answer = data[Math.floor(Math.random() * data.length)];
                var choices = [answer];
                while (choices.length < 4) {
                  var rand = data[Math.floor(Math.random() * data.length)];
                  if (!choices.find(function(c) { return c.phonetic === rand.phonetic; })) choices.push(rand);
                }
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
        Promise.all([
          fetch('data/time-keywords.json').then(function(r){ return r.json(); }),
          fetch('data/time-formats.json').then(function(r){ return r.json(); }),
          fetch('data/time-examples.json').then(function(r){ return r.json(); })
        ]).then(function(results){
          var keyWords = results[0];
          var timeFormats = results[1];
          var examples = results[2];

          function englishOf(item) {
            return item.english || item.note || item.translation || '';
          }

          var pool = keyWords.concat(timeFormats, examples);

          ThaiQuiz.setupQuiz({
            elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' },
            pickRound: function() {
              var answer = pool[Math.floor(Math.random() * pool.length)];
              var choices = [answer];
              while (choices.length < 4) {
                var rand = pool[Math.floor(Math.random() * pool.length)];
                if (!choices.find(function(c) { return c.phonetic === rand.phonetic; })) choices.push(rand);
              }
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
          fetch('data/questions.json').then(function(r){ return r.json(); }),
          fetch('data/questions-examples.json').then(function(r){ return r.json(); })
        ]).then(function(results){
          var data = results[0];
          var examples = results[1] || {};

          ThaiQuiz.setupQuiz({
            elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' },
            pickRound: function() {
              var answer = data[Math.floor(Math.random() * data.length)];
              var choices = [answer];
              while (choices.length < 4) {
                var rand = data[Math.floor(Math.random() * data.length)];
                if (!choices.find(function(c) { return c.phonetic === rand.phonetic; })) choices.push(rand);
              }
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
                  var next = document.getElementById('nextBtn');
                  if (next && next.style.display !== 'none') next.click();
                }, 3000);
              } catch (e) {}
            }
          });
        }).catch(function(err){ handleDataLoadError(err); });
      }
    }
  };

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