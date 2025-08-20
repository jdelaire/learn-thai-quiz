(function(global) {
  'use strict';

  function fetchJSON(url) {
    return fetch(url).then(function(r) { return r.json(); });
  }

  // Simple in-memory cache for JSON fetches
  var __jsonCache = Object.create(null);
  function fetchJSONCached(url) {
    try {
      if (__jsonCache[url]) return __jsonCache[url];
      __jsonCache[url] = fetchJSON(url).catch(function(err){ delete __jsonCache[url]; throw err; });
      return __jsonCache[url];
    } catch (_) {
      return fetchJSON(url);
    }
  }

  function fetchJSONs(urls) {
    return Promise.all(urls.map(fetchJSON));
  }

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function pickUniqueChoices(pool, count, keyFn, seed) {
    var choices = [];
    var usedKeys = new Set();

    if (seed != null) {
      choices.push(seed);
      try { usedKeys.add(String(keyFn(seed))); } catch (_) {}
    }

    while (choices.length < count && choices.length < pool.length) {
      var candidate = pickRandom(pool);
      var key = null;
      try { key = String(keyFn(candidate)); } catch (_) {}
      if (key == null) continue;
      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        choices.push(candidate);
      }
    }

    return choices;
  }

  function hexToRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) {
      h = h.split('').map(function(x){ return x + x; }).join('');
    }
    var bigint = parseInt(h, 16);
    if (isNaN(bigint)) return { r: 0, g: 0, b: 0 };
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  function rgbToHex(r, g, b) {
    function toHex(x) { return Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'); }
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
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
    if (s === 0) {
      r = g = b = l;
    } else {
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
    var eng = String(modifier.english || '');
    if (/^light$/i.test(eng)) return adjustLightness(baseHex, 0.25);
    if (/^dark$/i.test(eng)) return adjustLightness(baseHex, -0.25);
    return baseHex;
  }

  function hexToRgba(hex, alpha) {
    var rgb = hexToRgb(hex);
    var a = (typeof alpha === 'number') ? alpha : 1;
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a + ')';
  }

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

  function byProp(propName) {
    return function(obj) { return obj && obj[propName]; };
  }

  // Creates a standard quiz configuration block for ThaiQuiz.setupQuiz
  // params: { data, examples?, exampleKey?(answer)->string, answerKey='phonetic', buildSymbol(answer) -> { english, thai, emoji? }, choices=4, labelPrefix='English and Thai: ' }
  function createStandardQuiz(params) {
    var data = params && params.data || [];
    var examples = params && params.examples || null;
    var exampleKeyFn = params && params.exampleKey;
    var answerKey = (params && params.answerKey) || 'phonetic';
    var buildSymbol = (params && params.buildSymbol) || function(a){ return { english: String(a && a.english || ''), thai: String(a && a.thai || '') }; };
    var choices = (params && params.choices) || 4;
    var labelPrefix = (params && params.labelPrefix) || 'English and Thai: ';

    return {
      pickRound: function() {
        var answer = pickRandom(data);
        var uniqueChoices = pickUniqueChoices(data, choices, byProp(answerKey), answer);
        return { answer: answer, choices: uniqueChoices };
      },
      renderSymbol: function(answer, els) {
        try {
          var sym = buildSymbol(answer) || {};
          renderEnglishThaiSymbol(els.symbolEl, {
            english: String(sym.english || ''),
            thai: String(sym.thai || ''),
            emoji: String(sym.emoji || ''),
            ariaPrefix: labelPrefix
          });
        } catch (_) {}
      },
      renderButtonContent: function(choice) { return choice && choice[answerKey]; },
      ariaLabelForChoice: function(choice) { return 'Answer: ' + (choice && choice[answerKey]); },
      isCorrect: function(choice, answer) { return (choice && choice[answerKey]) === (answer && answer[answerKey]); },
      onAnswered: function(ctx) {
        if (!examples) return;
        var correct = ctx && ctx.correct;
        if (!correct) return;
        try {
          var fb = document.getElementById('feedback');
          var ans = ctx && ctx.answer || {};
          var key = null;
          try { key = exampleKeyFn ? exampleKeyFn(ans) : ans.english; } catch (_) { key = ans.english; }
          var ex = examples[key];
          renderExample(fb, ex);
        } catch (_) {}
      }
    };
  }

  // Build a function that maps a text (usually English) to an emoji based on regex rules
  function buildEmojiMatcher(rules) {
    try {
      var compiled = (rules || []).map(function(r){ return [new RegExp(r.pattern, 'i'), r.emoji]; });
      return function toEmoji(text) {
        var t = String(text || '').toLowerCase();
        for (var i = 0; i < compiled.length; i++) {
          if (compiled[i][0].test(t)) return compiled[i][1];
        }
        return '';
      };
    } catch (_) {
      return function(){ return ''; };
    }
  }

  // Simple validation helpers (console-only)
  function validateDataset(items, requiredKeys) {
    try {
      var missing = 0;
      for (var i = 0; i < (items || []).length; i++) {
        for (var j = 0; j < (requiredKeys || []).length; j++) {
          if (items[i][requiredKeys[j]] == null) { missing++; break; }
        }
      }
      if (missing > 0) console.warn('[validateDataset] Missing required keys in', missing, 'items');
    } catch (_) {}
  }

  function validateExamples(items, examples, key) {
    try {
      if (!examples || typeof examples !== 'object') return;
      var k = key || 'english';
      var set = Object.create(null);
      for (var i = 0; i < (items || []).length; i++) {
        var val = String(items[i][k] || '');
        set[val] = true;
      }
      var unknown = [];
      Object.keys(examples).forEach(function(exKey){ if (!set[exKey]) unknown.push(exKey); });
      if (unknown.length) console.warn('[validateExamples] Unmatched example keys:', unknown.slice(0, 10).join(', '), (unknown.length > 10 ? '…' : ''));
    } catch (_) {}
  }

  // Renders a common "English + Thai (+ optional emoji)" symbol layout and sets ARIA label
  function renderEnglishThaiSymbol(symbolEl, params) {
    try {
      var english = String((params && params.english) || '');
      var thai = String((params && params.thai) || '');
      var emoji = String((params && params.emoji) || '');
      var ariaPrefix = String((params && params.ariaPrefix) || 'English and Thai: ');
      var emojiLine = emoji ? '<div class="emoji-line" aria-hidden="true">' + emoji + '</div>' : '';
      symbolEl.innerHTML = emojiLine + english + (thai ? '<span class="secondary">' + thai + '</span>' : '');
      symbolEl.setAttribute('aria-label', ariaPrefix + english + (thai ? ' — ' + thai : ''));
    } catch (_) {}
  }

  // Renders an example block into the feedback element
  function renderExample(feedbackEl, exampleText) {
    try {
      feedbackEl.innerHTML = exampleText
        ? '<div class="example" aria-label="Example sentence"><span class="label">Example</span><div class="text">' + exampleText + '</div></div>'
        : '';
    } catch (_) {}
  }

  global.Utils = {
    fetchJSON: fetchJSON,
    fetchJSONCached: fetchJSONCached,
    fetchJSONs: fetchJSONs,
    pickRandom: pickRandom,
    pickUniqueChoices: pickUniqueChoices,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    adjustLightness: adjustLightness,
    getDisplayHex: getDisplayHex,
    hexToRgba: hexToRgba,
    setText: setText,
    byProp: byProp,
    createStandardQuiz: createStandardQuiz,
    buildEmojiMatcher: buildEmojiMatcher,
    validateDataset: validateDataset,
    validateExamples: validateExamples,
    renderEnglishThaiSymbol: renderEnglishThaiSymbol,
    renderExample: renderExample
  };
})(window);