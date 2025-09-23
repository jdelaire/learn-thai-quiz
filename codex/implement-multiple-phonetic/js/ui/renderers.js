(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};
  var logError = (NS.core && NS.core.error && NS.core.error.logError) || function(){};

  // Manage lifecycle for the example overlay so only one is visible at a time
  var exampleOverlayTimerId = null;
  function removeExistingExampleOverlay() {
    try {
      if (exampleOverlayTimerId != null) {
        clearTimeout(exampleOverlayTimerId);
        exampleOverlayTimerId = null;
      }
      var existing = document.querySelector('.example-overlay');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    } catch (_) {}
  }

  function renderEnglishThaiSymbol(symbolEl, params) {
    try {
      const english = String((params && params.english) || '');
      const thai = String((params && params.thai) || '');
      const emoji = String((params && params.emoji) || '');
      const ariaPrefix = String((params && params.ariaPrefix) || (global.Utils && global.Utils.i18n && global.Utils.i18n.labelEnglishThaiPrefix) || 'English and Thai: ');
      while (symbolEl.firstChild) symbolEl.removeChild(symbolEl.firstChild);
      if (emoji) {
        const emojiLine = document.createElement('div');
        emojiLine.className = 'emoji-line';
        emojiLine.setAttribute('aria-hidden', 'true');
        emojiLine.textContent = emoji;
        symbolEl.appendChild(emojiLine);
      }
      symbolEl.appendChild(document.createTextNode(english));
      if (thai) {
        const sep = document.createElement('span');
        sep.className = 'secondary';
        sep.textContent = thai;
        symbolEl.appendChild(sep);
      }
      symbolEl.setAttribute('aria-label', ariaPrefix + english + (thai ? ' — ' + thai : ''));
    } catch (e) { logError(e, 'ui.renderers.renderEnglishThaiSymbol'); }
  }

  function renderExample(feedbackEl, exampleText) {
    try {
      // Clear any inline feedback content and remove previous overlays
      while (feedbackEl.firstChild) feedbackEl.removeChild(feedbackEl.firstChild);
      removeExistingExampleOverlay();

      var correctHeading = (global.Utils && global.Utils.i18n && global.Utils.i18n.correctHeading) || 'Correct!';
      var durationMs = 2600;
      var hasExample = !!exampleText;

      // Support extended API: exampleText can be an object { text: string, highlight: { english?, thai?, phonetic? } }
      var exampleTextStr = '';
      var highlight = null;
      try {
        if (exampleText && typeof exampleText === 'object' && exampleText.nodeType == null) {
          exampleTextStr = String(exampleText.text || '');
          highlight = exampleText.highlight || null;
        } else {
          exampleTextStr = String(exampleText || '');
        }
      } catch (_) { exampleTextStr = String(exampleText || ''); }
      hasExample = !!exampleTextStr;

      // Build a full-screen overlay to showcase the example prominently
      var overlay = document.createElement('div');
      overlay.className = 'example-overlay';
      try { overlay.setAttribute('role', 'dialog'); } catch (_) {}
      try { overlay.setAttribute('aria-modal', 'true'); } catch (_) {}
      try { overlay.setAttribute('aria-label', correctHeading); } catch (_) {}
      try { overlay.style.setProperty('--overlay-duration', durationMs + 'ms'); } catch (_) {}

      var card = document.createElement('div');
      card.className = 'overlay-card';

      var heading = document.createElement('div');
      heading.className = 'heading';
      var icon = document.createElement('span');
      icon.className = 'celebrate-icon';
      try { icon.setAttribute('aria-hidden', 'true'); } catch (_) {}
      icon.textContent = '\u2713';
      heading.appendChild(icon);
      heading.appendChild(document.createTextNode(correctHeading));

      var text = document.createElement('div');
      text.className = 'text';
      (function buildHighlightedText(){
        if (!hasExample) { return; }
        try {
          var raw = String(exampleTextStr);

          // If highlight info is provided, prioritize highlighting the selected word(s)
          if (highlight && (highlight.english || highlight.thai || highlight.phonetic)) {
            // Compute first match ranges for each highlight without overlapping
            function escapeRegExp(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
            function findRange(hay, needle, opts){
              if (!needle) return null;
              var h = String(hay);
              var n = String(needle);
              if (!n) return null;
              if (opts && opts.mode === 'regex') {
                var m = (opts.regex).exec(h);
                if (m) return { start: m.index, end: m.index + m[0].length, kind: opts.kind };
                return null;
              }
              if (opts && opts.caseInsensitive) {
                var lc = h.toLowerCase();
                var ni = n.toLowerCase();
                var idx = lc.indexOf(ni);
                if (idx >= 0) return { start: idx, end: idx + ni.length, kind: opts.kind };
                return null;
              }
              var i = h.indexOf(n);
              return (i >= 0) ? { start: i, end: i + n.length, kind: opts && opts.kind } : null;
            }
            var candidates = [];
            try {
              if (highlight.english) {
                var reEn = new RegExp('\\b' + escapeRegExp(highlight.english) + '\\b', 'i');
                var rEn = findRange(raw, null, { mode: 'regex', regex: reEn, kind: 'en' });
                if (rEn) { candidates.push(rEn); }
                else {
                  var rEnFallback = findRange(raw, highlight.english, { caseInsensitive: true, kind: 'en' });
                  if (rEnFallback) candidates.push(rEnFallback);
                }
              }
            } catch (_) {
              var rEn2 = findRange(raw, highlight.english, { caseInsensitive: true, kind: 'en' });
              if (rEn2) candidates.push(rEn2);
            }
            if (highlight.thai) {
              var rTh = findRange(raw, highlight.thai, { caseInsensitive: false, kind: 'th' });
              if (rTh) candidates.push(rTh);
            }
            if (highlight.phonetic) {
              // Simple case-insensitive substring match (romanized words separated by spaces)
              var rPh = findRange(raw, highlight.phonetic, { caseInsensitive: true, kind: 'ph' });
              if (rPh) candidates.push(rPh);
            }

            if (candidates.length === 0) {
              text.appendChild(document.createTextNode(raw));
            } else {
              // Resolve overlaps: sort by start, then by longer length first
              candidates.sort(function(a, b){ if (a.start === b.start) return (b.end - b.start) - (a.end - a.start); return a.start - b.start; });
              var merged = [];
              for (var ci = 0; ci < candidates.length; ci++) {
                var c = candidates[ci];
                var last = merged[merged.length - 1];
                if (!last || c.start >= last.end) { merged.push(c); }
              }
              var cursor = 0;
              for (var mi = 0; mi < merged.length; mi++) {
                var m = merged[mi];
                if (cursor < m.start) {
                  text.appendChild(document.createTextNode(raw.slice(cursor, m.start)));
                }
                var mark = document.createElement('mark');
                mark.className = 'sel' + (m.kind ? (' sel-' + m.kind) : '');
                mark.textContent = raw.slice(m.start, m.end);
                text.appendChild(mark);
                cursor = m.end;
              }
              if (cursor < raw.length) {
                text.appendChild(document.createTextNode(raw.slice(cursor)));
              }
            }
          } else {
            // Legacy behavior: emphasize a question word at the start of the English segment
            var parts = raw.split('→');
            var english = String((parts[0] || raw)).trim();
            var tail = parts[1] ? (' → ' + String(parts[1]).trim()) : '';

            var match = null;
            var patterns = [
              /^(How much)\b/i,
              /^(How many)\b/i,
              /^(Have you ever)\b/i,
              /^(Is it)\b/i,
              /^(Can\b[^?]*)/i,
              /^(What|Who|Where|When|Why|How|Which)\b/i
            ];
            for (var i = 0; i < patterns.length; i++) {
              var m0 = patterns[i].exec(english);
              if (m0) { match = m0[1]; break; }
            }

            if (match) {
              var mark0 = document.createElement('mark');
              mark0.className = 'qword';
              mark0.textContent = english.slice(0, match.length);
              text.appendChild(mark0);
              text.appendChild(document.createTextNode(english.slice(match.length)));
            } else {
              text.appendChild(document.createTextNode(english));
            }

            if (tail) { text.appendChild(document.createTextNode(tail)); }
          }
        } catch (_) {
          try { text.textContent = String(exampleTextStr); } catch (_) {}
        }
      })();

      // Visual countdown timer bar synced with auto-dismiss
      var timer = document.createElement('div');
      timer.className = 'timer';
      var timerFill = document.createElement('div');
      timerFill.className = 'timer-fill';
      timer.appendChild(timerFill);

      card.appendChild(heading);
      card.appendChild(text);
      card.appendChild(timer);
      // Falling Thai flags background layer
      var flagsWrap = document.createElement('div');
      flagsWrap.className = 'flags-wrap';
      try { flagsWrap.setAttribute('aria-hidden', 'true'); } catch (_) {}
      var flagCount = 22;
      for (var i = 0; i < flagCount; i++) {
        var flag = document.createElement('span');
        flag.className = 'flag';
        flag.textContent = '\uD83C\uDDF9\uD83C\uDDED'; // 🇹🇭
        var left = 2 + Math.random() * 96;
        var sizePx = 14 + Math.floor(Math.random() * 9); // 14–22px
        flag.style.left = left + '%';
        flag.style.fontSize = sizePx + 'px';
        flag.style.animationDelay = Math.floor(Math.random() * 220) + 'ms';
        flag.style.setProperty('--flag-rotate', (200 + Math.floor(Math.random() * 280)) + 'deg');
        flag.style.animationDuration = (3600 + Math.floor(Math.random() * 2200)) + 'ms';
        flagsWrap.appendChild(flag);
      }
      overlay.appendChild(flagsWrap);
      overlay.appendChild(card);

      // Insert overlay at the end of body so it sits above the quiz
      document.body.appendChild(overlay);

      // Auto-dismiss shortly before auto-advance to the next question
      exampleOverlayTimerId = setTimeout(function(){ removeExistingExampleOverlay(); }, durationMs);
    } catch (e) { logError(e, 'ui.renderers.renderExample'); }
  }

  function insertProTip(text) {
    try {
      const footer = document.querySelector('.footer');
      if (footer && text) {
        const tip = document.createElement('div');
        tip.className = 'pro-tip';
        var small = document.createElement('small');
        // If the text contains markup, sanitize it; otherwise set as text
        var hasMarkup = /<\/?[a-z][\s\S]*>/i.test(String(text));
        if (hasMarkup && global && global.Utils && typeof global.Utils.sanitizeHTML === 'function') {
          small.appendChild(global.Utils.sanitizeHTML(text));
        }
        else { small.textContent = String(text); }
        tip.appendChild(small);
        footer.appendChild(tip);
      }
    } catch (e) { logError(e, 'ui.renderers.insertProTip'); }
  }

  function insertConsonantLegend() {
    try {
      const symbolAnchor = document.getElementById('symbol');
      if (symbolAnchor && symbolAnchor.parentNode && !document.querySelector('.legend-chips')) {
        const legend = document.createElement('div');
        legend.className = 'legend legend-chips';
        var chips = [
          { text: 'Middle Class', cls: 'middle-class' },
          { text: 'High Class', cls: 'high-class' },
          { text: 'Low Class', cls: 'low-class' }
        ];
        chips.forEach(function(c){
          var span = document.createElement('span');
          span.className = 'class-chip ' + c.cls;
          span.textContent = c.text;
          legend.appendChild(span);
        });
        symbolAnchor.parentNode.insertBefore(legend, symbolAnchor);
      }
    } catch (e) { logError(e, 'ui.renderers.insertConsonantLegend'); }
  }

  function renderVowelSymbol(symbolEl, symbol) {
    try {
      const raw = String(symbol || '');
      const out = raw.replace(/-/g, '\u0E01');
      symbolEl.textContent = out;
      try {
        var prefix = (global.Utils && global.Utils.i18n && global.Utils.i18n.labelVowelSymbolPrefix) || 'Thai vowel symbol: ';
        symbolEl.setAttribute('aria-label', prefix + raw);
      } catch (_) {}
    } catch (e) { logError(e, 'ui.renderers.renderVowelSymbol'); }
  }

  function renderConsonantSymbol(symbolEl, symbol) {
    try {
      const raw = String(symbol || '');
      symbolEl.textContent = raw;
      try {
        var prefix = (global.Utils && global.Utils.i18n && global.Utils.i18n.labelConsonantSymbolPrefix) || 'Thai consonant symbol: ';
        symbolEl.setAttribute('aria-label', prefix + raw);
      } catch (_) {}
    } catch (e) { logError(e, 'ui.renderers.renderConsonantSymbol'); }
  }

  function dismissExampleOverlay() {
    try {
      removeExistingExampleOverlay();
    } catch (e) { logError(e, 'ui.renderers.dismissExampleOverlay'); }
  }

  NS.ui.renderers = {
    renderEnglishThaiSymbol: renderEnglishThaiSymbol,
    renderExample: renderExample,
    insertProTip: insertProTip,
    insertConsonantLegend: insertConsonantLegend,
    renderVowelSymbol: renderVowelSymbol,
    renderConsonantSymbol: renderConsonantSymbol,
    dismissExampleOverlay: dismissExampleOverlay
  };
})(window);
