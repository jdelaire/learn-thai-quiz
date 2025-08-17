(function() {
  'use strict';

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

        var data = JSON.parse(`[
  {
    "symbol": "ก",
    "name": "gɔɔ gài",
    "meaning": "chicken",
    "emoji": "🐔",
    "class": "middle"
  },
  {
    "symbol": "ข",
    "name": "khɔ̌ɔ khài",
    "meaning": "egg",
    "emoji": "🥚",
    "class": "high"
  },
  {
    "symbol": "ฃ",
    "name": "khɔ̌ɔ khùat",
    "meaning": "bottle",
    "emoji": "🍾",
    "class": "high"
  },
  {
    "symbol": "ค",
    "name": "khɔɔ khwaay",
    "meaning": "water buffalo",
    "emoji": "🐃",
    "class": "low"
  },
  {
    "symbol": "ฅ",
    "name": "khɔɔ khon",
    "meaning": "human",
    "emoji": "👤",
    "class": "low"
  },
  {
    "symbol": "ฆ",
    "name": "khɔɔ rá-khaŋ",
    "meaning": "bell",
    "emoji": "🔔",
    "class": "low"
  },
  {
    "symbol": "ง",
    "name": "ŋɔɔ ŋuu",
    "meaning": "snake",
    "emoji": "🐍",
    "class": "low"
  },
  {
    "symbol": "จ",
    "name": "jɔɔ jaan",
    "meaning": "plate",
    "emoji": "🍽️",
    "class": "middle"
  },
  {
    "symbol": "ฉ",
    "name": "chɔ̌ɔ chìŋ",
    "meaning": "cymbal",
    "emoji": "🥁",
    "class": "high"
  },
  {
    "symbol": "ช",
    "name": "chɔɔ cháaŋ",
    "meaning": "elephant",
    "emoji": "🐘",
    "class": "low"
  },
  {
    "symbol": "ซ",
    "name": "sɔɔ sôo",
    "meaning": "chain",
    "emoji": "⛓️",
    "class": "low"
  },
  {
    "symbol": "ฌ",
    "name": "chɔɔ chəə",
    "meaning": "name of tree",
    "emoji": "🌳",
    "class": "low"
  },
  {
    "symbol": "ญ",
    "name": "yɔɔ phûu yǐŋ",
    "meaning": "female",
    "emoji": "👩",
    "class": "low"
  },
  {
    "symbol": "ฎ",
    "name": "dɔɔ chá-daa",
    "meaning": "head dress",
    "emoji": "👑",
    "class": "middle"
  },
  {
    "symbol": "ฏ",
    "name": "dtɔɔ bpà-dtàk",
    "meaning": "lance",
    "emoji": "⚔️",
    "class": "middle"
  },
  {
    "symbol": "ฐ",
    "name": "thɔ̌ɔ thɑ̌ɑn",
    "meaning": "pedestal",
    "emoji": "🏛️",
    "class": "high"
  },
  {
    "symbol": "ฑ",
    "name": "thɔɔ mon-thoo",
    "meaning": "Lady Montho",
    "emoji": "👸",
    "class": "low"
  },
  {
    "symbol": "ฒ",
    "name": "thɔɔ phûu-thâw",
    "meaning": "elderly",
    "emoji": "👴",
    "class": "low"
  },
  {
    "symbol": "ณ",
    "name": "nɔɔ neen",
    "meaning": "novice",
    "emoji": "🧘",
    "class": "low"
  },
  {
    "symbol": "ด",
    "name": "dɔɔ dèk",
    "meaning": "child",
    "emoji": "👶",
    "class": "middle"
  },
  {
    "symbol": "ต",
    "name": "dtɔɔ dtàw",
    "meaning": "turtle",
    "emoji": "🐢",
    "class": "middle"
  },
  {
    "symbol": "ถ",
    "name": "thɔ̌ɔ thŭŋ",
    "meaning": "bag",
    "emoji": "👜",
    "class": "high"
  },
  {
    "symbol": "ท",
    "name": "thɔɔ thá-hɑ̌an",
    "meaning": "soldier",
    "emoji": "💂",
    "class": "low"
  },
  {
    "symbol": "ธ",
    "name": "thɔɔ thoŋ",
    "meaning": "flag",
    "emoji": "🇹🇭",
    "class": "low"
  },
  {
    "symbol": "น",
    "name": "nɔɔ nǔu",
    "meaning": "mouse",
    "emoji": "🐭",
    "class": "low"
  },
  {
    "symbol": "บ",
    "name": "bɔɔ bai-máay",
    "meaning": "leaf",
    "emoji": "🍃",
    "class": "middle"
  },
  {
    "symbol": "ป",
    "name": "bpɔɔ bplaa",
    "meaning": "fish",
    "emoji": "🐟",
    "class": "middle"
  },
  {
    "symbol": "ผ",
    "name": "phɔ̌ɔ phɯ̂ŋ",
    "meaning": "bee",
    "emoji": "🐝",
    "class": "high"
  },
  {
    "symbol": "ฝ",
    "name": "fɔ̌ɔ făa",
    "meaning": "lid/cover",
    "emoji": "🔒",
    "class": "high"
  },
  {
    "symbol": "พ",
    "name": "phɔɔ phaan",
    "meaning": "offering tray",
    "emoji": "🏆",
    "class": "low"
  },
  {
    "symbol": "ฟ",
    "name": "fɔɔ fan",
    "meaning": "tooth",
    "emoji": "🦷",
    "class": "low"
  },
  {
    "symbol": "ภ",
    "name": "phɔɔ săm-phaw",
    "meaning": "junk",
    "emoji": "🚢",
    "class": "low"
  },
  {
    "symbol": "ม",
    "name": "mɔɔ máa",
    "meaning": "horse",
    "emoji": "🐎",
    "class": "low"
  },
  {
    "symbol": "ย",
    "name": "yɔɔ yák",
    "meaning": "giant",
    "emoji": "👹",
    "class": "high"
  },
  {
    "symbol": "ร",
    "name": "rɔɔ rɯa",
    "meaning": "boat",
    "emoji": "🚣",
    "class": "low"
  },
  {
    "symbol": "ล",
    "name": "lɔɔ liŋ",
    "meaning": "monkey",
    "emoji": "🐒",
    "class": "low"
  },
  {
    "symbol": "ว",
    "name": "wɔɔ wɛ̌ɛn",
    "meaning": "ring",
    "emoji": "💍",
    "class": "low"
  },
  {
    "symbol": "ศ",
    "name": "sɔ̌ɔ sǎa-laa",
    "meaning": "pavilion",
    "emoji": "🏛️",
    "class": "high"
  },
  {
    "symbol": "ษ",
    "name": "sɔ̌ɔ rɯɯ-sǐi",
    "meaning": "hermit",
    "emoji": "🧙",
    "class": "high"
  },
  {
    "symbol": "ส",
    "name": "sɔ̌ɔ sɯ̌a",
    "meaning": "tiger",
    "emoji": "🐯",
    "class": "high"
  },
  {
    "symbol": "ห",
    "name": "hɔ̌ɔ hìip",
    "meaning": "treasure chest",
    "emoji": "💎",
    "class": "high"
  },
  {
    "symbol": "ฬ",
    "name": "lɔɔ jù-laa",
    "meaning": "kite",
    "emoji": "🪁",
    "class": "low"
  },
  {
    "symbol": "อ",
    "name": "ɔɔ àaŋ",
    "meaning": "basin",
    "emoji": "🛁",
    "class": "middle"
  },
  {
    "symbol": "ฮ",
    "name": "hɔɔ nók-hûuk",
    "meaning": "owl",
    "emoji": "🦉",
    "class": "low"
  }
]`);

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
      }
    },

    vowels: {
      title: 'Thai Vowel Quiz',
      subtitle: '',
      bodyClass: 'vowel-quiz',
      init: function() {
        var data = JSON.parse(`[
  { "symbol": "-ะ", "sound": "a", "example": "but, cut" },
  { "symbol": "-า", "sound": "aa", "example": "baht, cart" },
  { "symbol": "-ิ", "sound": "i", "example": "did, bit" },
  { "symbol": "-ี", "sound": "ii", "example": "beat, deed" },
  { "symbol": "-ึ", "sound": "ɯ", "example": "-" },
  { "symbol": "-ื", "sound": "ɯɯ", "example": "-" },
  { "symbol": "-ุ", "sound": "u (ou)", "example": "foot, book" },
  { "symbol": "-ู", "sound": "uu (ouuu)", "example": "blue, too" },
  { "symbol": "เ-ะ", "sound": "e (é)", "example": "yet, bet" },
  { "symbol": "เ-", "sound": "ee (ééé)", "example": "fate, taste" },
  { "symbol": "แ-ะ", "sound": "ɛ (è)", "example": "fat, black" },
  { "symbol": "แ-", "sound": "ɛɛ (èèè)", "example": "can, fan" },
  { "symbol": "โ-ะ", "sound": "o", "example": "only, Toyota" },
  { "symbol": "โ-", "sound": "oo", "example": "tone, doe" },
  { "symbol": "เ-าะ", "sound": "ɔ", "example": "cot, watch" },
  { "symbol": "-อ", "sound": "ɔɔ", "example": "bought, cause" },
  { "symbol": "เ-อะ", "sound": "ə (e)", "example": "modern, gentle" },
  { "symbol": "เ-อ", "sound": "əə (eee)", "example": "birth, dirt" },
  { "symbol": "เ-ีย", "sound": "iɑ", "example": "tear, dear" },
  { "symbol": "เ-ือ", "sound": "ɯɑ", "example": "-" },
  { "symbol": "-ัว", "sound": "uɑ", "example": "tour" },
  { "symbol": "ไ-", "sound": "ɑi", "example": "why, hi" },
  { "symbol": "ใ-", "sound": "ɑi", "example": "why, hi" },
  { "symbol": "-ำ", "sound": "ɑm", "example": "yummy" },
  { "symbol": "เ-า", "sound": "ɑw", "example": "doubt, about" }
]`);

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

        var data = JSON.parse(`[
  {"number":"0","thai":"ศูนย์","phonetic":"sǔun"},
  {"number":"1","thai":"หนึ่ง","phonetic":"nɯ̀ŋ"},
  {"number":"2","thai":"สอง","phonetic":"sɔ̌ɔŋ"},
  {"number":"3","thai":"สาม","phonetic":"săam"},
  {"number":"4","thai":"สี่","phonetic":"sìi"},
  {"number":"5","thai":"ห้า","phonetic":"hâa"},
  {"number":"6","thai":"หก","phonetic":"hòk"},
  {"number":"7","thai":"เจ็ด","phonetic":"jèt"},
  {"number":"8","thai":"แปด","phonetic":"bpɛ̀ɛt"},
  {"number":"9","thai":"เก้า","phonetic":"gâao"},
  {"number":"10","thai":"สิบ","phonetic":"sìp"},

  {"number":"11","thai":"สิบเอ็ด","phonetic":"sìp-èt"},
  {"number":"12","thai":"สิบสอง","phonetic":"sìp-sɔ̌ɔŋ"},
  {"number":"13","thai":"สิบสาม","phonetic":"sìp-săam"},
  {"number":"14","thai":"สิบสี่","phonetic":"sìp-sìi"},
  {"number":"15","thai":"สิบห้า","phonetic":"sìp-hâa"},
  {"number":"16","thai":"สิบหก","phonetic":"sìp-hòk"},
  {"number":"17","thai":"สิบเจ็ด","phonetic":"sìp-jèt"},
  {"number":"18","thai":"สิบแปด","phonetic":"sìp-bpɛ̀ɛt"},
  {"number":"19","thai":"สิบเก้า","phonetic":"sìp-gâao"},

  {"number":"20","thai":"ยี่สิบ","phonetic":"yîi-sìp"},
  {"number":"30","thai":"สามสิบ","phonetic":"săam-sìp"},
  {"number":"40","thai":"สี่สิบ","phonetic":"sìi-sìp"},
  {"number":"50","thai":"ห้าสิบ","phonetic":"hâa-sìp"},
  {"number":"60","thai":"หกสิบ","phonetic":"hòk-sìp"},
  {"number":"70","thai":"เจ็ดสิบ","phonetic":"jèt-sìp"},
  {"number":"80","thai":"แปดสิบ","phonetic":"bpɛ̀ɛt-sìp"},
  {"number":"90","thai":"เก้าสิบ","phonetic":"gâao-sìp"},

  {"number":"100","thai":"หนึ่งร้อย","phonetic":"nɯ̀ŋ-ráawy"},
  {"number":"200","thai":"สองร้อย","phonetic":"sɔ̌ɔŋ-ráawy"},
  {"number":"1,000","thai":"หนึ่งพัน","phonetic":"nɯ̀ŋ-phan"},
  {"number":"10,000","thai":"หนึ่งหมื่น","phonetic":"nɯ̀ŋ-mɯ̀ɯn"},
  {"number":"100,000","thai":"หนึ่งแสน","phonetic":"nɯ̀ŋ-sɛ̌ɛn"},
  {"number":"1,000,000","thai":"หนึ่งล้าน","phonetic":"nɯ̀ŋ-láan"}
]`);

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
      }
    },

    time: {
      title: 'Thai Time Quiz',
      subtitle: 'Choose the correct phonetic for the Thai time phrase',
      bodyClass: 'time-quiz',
      init: function() {
        var keyWords = JSON.parse(`[
  {"english":"Hour (o’clock)","thai":"โมง","phonetic":"mooŋ"},
  {"english":"Hour (o’clock)","thai":"ทุ่ม","phonetic":"thûm"},
  {"english":"Hour (o’clock)","thai":"นาฬิกา","phonetic":"naa-lí-gaa"},
  {"english":"Minute","thai":"นาที","phonetic":"naa-thii"},
  {"english":"Second","thai":"วินาที","phonetic":"wí-naa-thii"},
  {"english":"Time","thai":"เวลา","phonetic":"wee-laa"},
  {"english":"O’clock sharp","thai":"ตรง","phonetic":"dtroŋ"},
  {"english":"Half past (30 min)","thai":"ครึ่ง","phonetic":"khrɯ̂ŋ"},
  {"english":"Quarter","thai":"หนึ่งในสี่","phonetic":"nɯ̀ŋ nai sìi"},
  {"english":"Early morning (1–5 AM)","thai":"ตี…","phonetic":"dtii …"},
  {"english":"Morning (6–11 AM)","thai":"…โมงเช้า","phonetic":"…mooŋ cháo"},
  {"english":"Noon","thai":"เที่ยง","phonetic":"thîaŋ"},
  {"english":"Afternoon (1–3 PM)","thai":"บ่าย…โมง","phonetic":"bàay … mooŋ"},
  {"english":"Late afternoon (4–6 PM)","thai":"…โมงเย็น","phonetic":"…mooŋ yen"},
  {"english":"Evening/Night (7–11 PM)","thai":"…ทุ่ม","phonetic":"…thûm"},
  {"english":"Midnight","thai":"เที่ยงคืน","phonetic":"thîaŋ-kʉʉn"}
]`);

        var timeFormats = JSON.parse(`[
  {"thai":"ตีหนึ่ง","phonetic":"dtii nɯ̀ŋ","note":"1 AM"},
  {"thai":"หกโมงเช้า","phonetic":"hòk mooŋ cháo","note":"6 AM"},
  {"thai":"เที่ยง","phonetic":"thîaŋ","note":"12 PM (noon)"},
  {"thai":"บ่ายโมง","phonetic":"bàay mooŋ","note":"1 PM"},
  {"thai":"บ่ายสามโมง","phonetic":"bàay săam mooŋ","note":"3 PM"},
  {"thai":"สี่โมงเย็น","phonetic":"sìi mooŋ yen","note":"4 PM"},
  {"thai":"สองทุ่ม","phonetic":"sǒn thûm","note":"8 PM"},
  {"thai":"เที่ยงคืน","phonetic":"thîaŋ-kʉʉn","note":"12 AM (midnight)"}
]`);

        var examples = JSON.parse(`[
  {"thai":"กี่โมงแล้ว?","phonetic":"gìi mooŋ lɛ́ɛo?","translation":"What time is it now?"},
  {"thai":"ตอนนี้เป็นสี่โมงเย็น","phonetic":"tîi-níi bpen sìi mooŋ yen","translation":"It’s 4 PM"},
  {"thai":"ผมตื่นเช้าตีสี่","phonetic":"phǒm tam ŋaan tʉ̀ʉn cháo sìi dtii","translation":"I wake up at 4 AM"},
  {"thai":"ฉันมาถึงบ้านบ่ายสองโมง","phonetic":"chǎn maa thʉ̌ŋ bâan bàay sɔ̌ɔŋ mooŋ","translation":"I arrived home at 2 PM"},
  {"thai":"เราจะเจอกันหกโมงเช้าตรง","phonetic":"raw jà jer kan hòk mooŋ cháo dtrooŋ","translation":"Let’s meet at exactly 6 AM"},
  {"thai":"พักเบรกใช้เวลาสิบนาที","phonetic":"náam-phàk rao khᴐ̌ɔp chái wee-laa sìp naa-thii","translation":"The break takes 10 minutes"}
]`);

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

        var data = JSON.parse(`[
  {"english":"what","thai":"อะไร","phonetic":"à-rai"},
  {"english":"who","thai":"ใคร","phonetic":"khrai"},
  {"english":"where","thai":"ที่ไหน","phonetic":"thîi-nǎi"},
  {"english":"when","thai":"เมื่อไหร่","phonetic":"mûea-rài"},
  {"english":"why","thai":"ทำไม","phonetic":"tham-mai"},
  {"english":"have … yet","thai":"… หรือยัง","phonetic":"rw-yan"},
  {"english":"how","thai":"ยังไง","phonetic":"yaŋ-ŋai"},
  {"english":"how much","thai":"เท่าไหร่","phonetic":"thâo-rài"},
  {"english":"how many","thai":"กี่","phonetic":"gìi"},
  {"english":"which","thai":"ไหน","phonetic":"nǎi"},
  {"english":"is it … ?","thai":"… ไหม","phonetic":"… mái?"},
  {"english":"can … ?","thai":"… ได้ไหม","phonetic":"… dâay mái?"},
  {"english":"have you ever … ?","thai":"เคย … ไหม","phonetic":"khəəy … mái?"}
]`);

        var examples = {
          'what': 'What is this? → an níi khʉʉ à-rai?',
          'who': 'Who is that? → khrai khʉʉ an nán?',
          'where': 'Where are you going? → khun jà bpai thîi-nǎi?',
          'when': 'When do you work? → khun tham ŋaan mûea-rài?',
          'why': 'Why do you like Thai food? → tham-mai khun chɔ̂ɔp aa-hǎan thai?',
          'how': 'How is the food? → aa-hǎan bpen yaŋ-ŋai?',
          'how much': 'How much is it? → an níi thâo-rài?',
          'how many': 'How many plates? → mii gìi jaan?',
          'which': 'Which one do you want? → khun ao an nǎi?',
          'is it … ?': 'Is it spicy? → phèt mái?',
          'can … ?': 'Can you speak Thai? → khun phûut phaa-sǎa thai dâay mái?',
          'have you ever … ?': 'Have you ever tried Pad Thai? → khun khəəy gin phàt-thai mái?'
        };

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