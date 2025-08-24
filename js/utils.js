(function(global) {
  'use strict';

  function logError(error, context) {
    try {
      if (context) {
        console.error('[ThaiQuest]', context, error);
      } else {
        console.error('[ThaiQuest]', error);
      }
    } catch (_) {}
  }
  
  function fetchJSON(url) {
    return fetch(url).then(function(r) { if (!r.ok) { throw new Error('HTTP ' + r.status + ' for ' + url); } return r.json(); });
  }

  // Simple in-memory cache for JSON fetches
  const __jsonCache = Object.create(null);
  function fetchJSONCached(url) {
    try {
      if (__jsonCache[url]) return __jsonCache[url];
      __jsonCache[url] = fetchJSON(url).catch(function(err){ delete __jsonCache[url]; throw err; });
      return __jsonCache[url];
    } catch (e) { logError(e, 'Utils.fetchJSONCached'); return fetchJSON(url); }
  }

  function fetchJSONs(urls) {
    return Promise.all(urls.map(fetchJSONCached));
  }

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function pickUniqueChoices(pool, count, keyFn, seed) {
    const choices = [];
    const usedKeys = new Set();

    if (seed != null) {
      choices.push(seed);
      try { usedKeys.add(String(keyFn(seed))); } catch (e) { logError(e, 'Utils.pickUniqueChoices keyFn(seed)'); }
    }

    while (choices.length < count && choices.length < pool.length) {
      const candidate = pickRandom(pool);
      let key = null;
      try { key = String(keyFn(candidate)); } catch (e) { logError(e, 'Utils.pickUniqueChoices keyFn(candidate)'); }
      if (key == null) continue;
      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        choices.push(candidate);
      }
    }

    return choices;
  }

  function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) {
      h = h.split('').map(function(x){ return x + x; }).join('');
    }
    const bigint = parseInt(h, 16);
    if (isNaN(bigint)) return { r: 0, g: 0, b: 0 };
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  function rgbToHex(r, g, b) {
    function toHex(x) { return Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'); }
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
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
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  function adjustLightness(hex, delta) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const newL = Math.max(0, Math.min(1, hsl.l + delta));
    const nrgb = hslToRgb(hsl.h, hsl.s, newL);
    return rgbToHex(nrgb.r, nrgb.g, nrgb.b);
  }

  function getDisplayHex(baseHex, modifier) {
    if (!modifier) return baseHex;
    const eng = String(modifier.english || '');
    if (/^light$/i.test(eng)) return adjustLightness(baseHex, 0.25);
    if (/^dark$/i.test(eng)) return adjustLightness(baseHex, -0.25);
    return baseHex;
  }

  function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    const a = (typeof alpha === 'number') ? alpha : 1;
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a + ')';
  }

  function setText(id, text) {
    const el = document.getElementById(id);
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
    const data = params && params.data || [];
    const examples = params && params.examples || null;
    const exampleKeyFn = params && params.exampleKey;
    const answerKey = (params && params.answerKey) || 'phonetic';
    const buildSymbol = (params && params.buildSymbol) || function(a){ return { english: String(a && a.english || ''), thai: String(a && a.thai || '') }; };
    const choices = (params && params.choices) || 4;
    const labelPrefix = (params && params.labelPrefix) || 'English and Thai: ';

    return {
      pickRound: function() {
        const answer = pickRandom(data);
        const uniqueChoices = pickUniqueChoices(data, choices, byProp(answerKey), answer);
        return { answer: answer, choices: uniqueChoices };
      },
      renderSymbol: function(answer, els) {
        try {
          const sym = buildSymbol(answer) || {};
          renderEnglishThaiSymbol(els.symbolEl, {
            english: String(sym.english || ''),
            thai: String(sym.thai || ''),
            emoji: String(sym.emoji || ''),
            ariaPrefix: labelPrefix
          });
        } catch (e) { logError(e, 'Utils.createStandardQuiz.renderSymbol'); }
      },
      renderButtonContent: function(choice) { return choice && choice[answerKey]; },
      ariaLabelForChoice: function(choice) { return 'Answer: ' + (choice && choice[answerKey]); },
      isCorrect: function(choice, answer) { return (choice && choice[answerKey]) === (answer && answer[answerKey]); },
      onAnswered: function(ctx) {
        if (!examples) return;
        const correct = ctx && ctx.correct;
        if (!correct) return;
        try {
          const fb = document.getElementById('feedback');
          const ans = ctx && ctx.answer || {};
          let key = null;
          try { key = exampleKeyFn ? exampleKeyFn(ans) : ans.english; } catch (_) { key = ans.english; }
          const ex = examples[key];
          renderExample(fb, ex);
        } catch (e) { logError(e, 'Utils.createStandardQuiz.onAnswered'); }
      }
    };
  }

  // Build a function that maps a text (usually English) to an emoji based on regex rules
  function buildEmojiMatcher(rules) {
    try {
      const compiled = (rules || []).map(function(r){ return [new RegExp(r.pattern, 'i'), r.emoji]; });
      return function toEmoji(text) {
        const t = String(text || '').toLowerCase();
        for (let i = 0; i < compiled.length; i++) {
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
      let missing = 0;
      for (let i = 0; i < (items || []).length; i++) {
        for (let j = 0; j < (requiredKeys || []).length; j++) {
          if (items[i][requiredKeys[j]] == null) { missing++; break; }
        }
      }
      if (missing > 0) console.warn('[validateDataset] Missing required keys in', missing, 'items');
    } catch (e) { logError(e, 'Utils.validateDataset'); }
  }

  function validateExamples(items, examples, key) {
    try {
      if (!examples || typeof examples !== 'object') return;
      const k = key || 'english';
      const set = Object.create(null);
      for (let i = 0; i < (items || []).length; i++) {
        const val = String(items[i][k] || '');
        set[val] = true;
      }
      const unknown = [];
      Object.keys(examples).forEach(function(exKey){ if (!set[exKey]) unknown.push(exKey); });
      if (unknown.length) console.warn('[validateExamples] Unmatched example keys:', unknown.slice(0, 10).join(', '), (unknown.length > 10 ? '…' : ''));
    } catch (e) { logError(e, 'Utils.validateExamples'); }
  }

  // Renders a common "English + Thai (+ optional emoji)" symbol layout and sets ARIA label
  function renderEnglishThaiSymbol(symbolEl, params) {
    try {
      const english = String((params && params.english) || '');
      const thai = String((params && params.thai) || '');
      const emoji = String((params && params.emoji) || '');
      const ariaPrefix = String((params && params.ariaPrefix) || 'English and Thai: ');

      // Clear previous content
      while (symbolEl.firstChild) symbolEl.removeChild(symbolEl.firstChild);

      if (emoji) {
        const emojiLine = document.createElement('div');
        emojiLine.className = 'emoji-line';
        emojiLine.setAttribute('aria-hidden', 'true');
        emojiLine.textContent = emoji;
        symbolEl.appendChild(emojiLine);
      }

      // English text node
      symbolEl.appendChild(document.createTextNode(english));

      if (thai) {
        const sep = document.createElement('span');
        sep.className = 'secondary';
        sep.textContent = thai;
        symbolEl.appendChild(sep);
      }

      symbolEl.setAttribute('aria-label', ariaPrefix + english + (thai ? ' — ' + thai : ''));
    } catch (e) { logError(e, 'Utils.renderEnglishThaiSymbol'); }
  }

  // Renders an example block into the feedback element
  function renderExample(feedbackEl, exampleText) {
    try {
      // Clear previous content
      while (feedbackEl.firstChild) feedbackEl.removeChild(feedbackEl.firstChild);

      if (!exampleText) return;

      const card = document.createElement('div');
      card.className = 'example';
      card.setAttribute('aria-label', 'Example sentence');

      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = 'Example';

      const text = document.createElement('div');
      text.className = 'text';
      text.textContent = String(exampleText);

      card.appendChild(label);
      card.appendChild(text);
      feedbackEl.appendChild(card);
    } catch (e) { logError(e, 'Utils.renderExample'); }
  }

  // New helpers for data-driven configs and shared UI snippets
  function createEmojiGetter(rules) {
    try {
      const matcher = buildEmojiMatcher(rules || []);
      return function getEmojiForText(text) {
        try { return matcher(String(text || '')); } catch (e) { return ''; }
      };
    } catch (e) {
      logError(e, 'Utils.createEmojiGetter');
      return function(){ return ''; };
    }
  }

  function loadEmojiGetter(rulesUrl) {
    try {
      return fetchJSONCached(rulesUrl).then(function(rules){ return createEmojiGetter(rules); });
    } catch (e) {
      logError(e, 'Utils.loadEmojiGetter');
      return Promise.resolve(function(){ return ''; });
    }
  }

  function insertProTip(text) {
    try {
      const footer = document.querySelector('.footer');
      if (footer && text) {
        const tip = document.createElement('div');
        tip.className = 'pro-tip';
        tip.innerHTML = '<small>' + text + '</small>';
        footer.appendChild(tip);
      }
    } catch (e) { logError(e, 'Utils.insertProTip'); }
  }

  function insertConsonantLegend() {
    try {
      const symbolAnchor = document.getElementById('symbol');
      if (symbolAnchor && symbolAnchor.parentNode && !document.querySelector('.legend-chips')) {
        const legend = document.createElement('div');
        legend.className = 'legend legend-chips';
        legend.innerHTML = '<span class="class-chip middle-class">Middle Class</span>' +
                           '<span class="class-chip high-class">High Class</span>' +
                           '<span class="class-chip low-class">Low Class</span>';
        symbolAnchor.parentNode.insertBefore(legend, symbolAnchor);
      }
    } catch (e) { logError(e, 'Utils.insertConsonantLegend'); }
  }

  function renderVowelSymbol(symbolEl, symbol) {
    try {
      const raw = String(symbol || '');
      const out = raw.replace(/-/g, '\u0E01');
      symbolEl.textContent = out;
      symbolEl.setAttribute('aria-label', 'Thai vowel symbol: ' + raw);
    } catch (e) { logError(e, 'Utils.renderVowelSymbol'); }
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
    renderExample: renderExample,
    logError: logError,
    // New helpers
    createEmojiGetter: createEmojiGetter,
    loadEmojiGetter: loadEmojiGetter,
    insertProTip: insertProTip,
    insertConsonantLegend: insertConsonantLegend,
    renderVowelSymbol: renderVowelSymbol
  };
})(window);