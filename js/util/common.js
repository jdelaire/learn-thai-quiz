(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.util = NS.util || {};
  var ErrorHandler = (NS.core && NS.core.error && NS.core.error.ErrorHandler) || { safe: function(fn){ return function(){ try { return fn.apply(this, arguments); } catch (_) { return null; } }; } };

  function byProp(propName) { return function(obj){ return obj && obj[propName]; }; }

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

  const i18n = {
    answerPrefix: 'Answer: ',
    exampleLabel: 'Example',
    correctHeading: 'Correct!',
    labelEnglishThaiPrefix: 'English and Thai: ',
    labelNumberThaiPrefix: 'Number and Thai: ',
    labelClassMarkerLengthPrefix: 'Class + Marker + Length: ',
    labelVowelSymbolPrefix: 'Thai vowel symbol: ',
    labelConsonantSymbolPrefix: 'Thai consonant symbol: ',
    labelColorPhrasePrefix: 'Thai color phrase: ',
    statsStarsAriaLabel: 'Completion stars',
    playerNameEditLabel: 'Player name - click to edit',
    noDataMessage: 'No data available for this quiz.'
  };

  function pickRandom(array) { return array[Math.floor(Math.random() * array.length)]; }

  function pickUniqueChoices(pool, count, keyFn, seed) {
    const choices = [];
    const usedKeys = new Set();
    if (seed != null) {
      choices.push(seed);
      const seedKey = ErrorHandler.safe(keyFn, null)(seed);
      if (seedKey != null) usedKeys.add(String(seedKey));
    }
    while (choices.length < count && choices.length < pool.length) {
      const candidate = pickRandom(pool);
      const key = ErrorHandler.safe(keyFn, null)(candidate);
      if (key == null) continue;
      const keyStr = String(key);
      if (!usedKeys.has(keyStr)) {
        usedKeys.add(keyStr);
        choices.push(candidate);
      }
    }
    return choices;
  }

  var defaultElements = { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' };

  function clearChildren(parent) {
    try {
      if (!parent) return;
      while (parent.firstChild) parent.removeChild(parent.firstChild);
    } catch (_) {}
  }

  // Minimal sanitizer that preserves a tiny whitelist of tags and strips attributes.
  // Returns a DocumentFragment suitable for insertion.
  function sanitizeHTML(html) {
    try {
      var allowed = { BR: true, STRONG: true, EM: true, SMALL: true };
      var tpl = document.createElement('template');
      tpl.innerHTML = String(html);
      function cleanse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return document.createTextNode(node.nodeValue || '');
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          var tag = String(node.tagName || '').toUpperCase();
          if (!allowed[tag]) {
            // Flatten disallowed elements by returning their children sanitized
            var frag = document.createDocumentFragment();
            var child = node.firstChild;
            while (child) {
              frag.appendChild(cleanse(child));
              child = child.nextSibling;
            }
            return frag;
          }
          var el = document.createElement(tag.toLowerCase());
          var c = node.firstChild;
          while (c) { el.appendChild(cleanse(c)); c = c.nextSibling; }
          return el;
        }
        return document.createTextNode('');
      }
      var out = document.createDocumentFragment();
      var n = tpl.content.firstChild;
      while (n) { out.appendChild(cleanse(n)); n = n.nextSibling; }
      return out;
    } catch (_) {
      var fallback = document.createDocumentFragment();
      fallback.appendChild(document.createTextNode(String(html)));
      return fallback;
    }
  }

  NS.util.common = {
    byProp: byProp,
    setText: setText,
    i18n: i18n,
    pickRandom: pickRandom,
    pickUniqueChoices: pickUniqueChoices,
    defaultElements: defaultElements,
    clearChildren: clearChildren,
    sanitizeHTML: sanitizeHTML
  };
})(window);
