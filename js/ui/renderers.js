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
      if (!exampleText) return;

      var exampleLabel = (global.Utils && global.Utils.i18n && global.Utils.i18n.exampleLabel) || 'Example';
      var correctHeading = (global.Utils && global.Utils.i18n && global.Utils.i18n.correctHeading) || 'Correct!';

      // Build a full-screen overlay to showcase the example prominently
      var overlay = document.createElement('div');
      overlay.className = 'example-overlay';
      try { overlay.setAttribute('role', 'dialog'); } catch (_) {}
      try { overlay.setAttribute('aria-modal', 'true'); } catch (_) {}
      try { overlay.setAttribute('aria-label', correctHeading + ' — ' + exampleLabel); } catch (_) {}

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

      var label = document.createElement('span');
      label.className = 'label';
      label.textContent = exampleLabel;

      var text = document.createElement('div');
      text.className = 'text';
      text.textContent = String(exampleText);

      card.appendChild(heading);
      card.appendChild(label);
      card.appendChild(text);
      // Confetti background layer
      var confettiWrap = document.createElement('div');
      confettiWrap.className = 'confetti-wrap';
      try { confettiWrap.setAttribute('aria-hidden', 'true'); } catch (_) {}
      var colors = ['#27ae60','#2ecc71','#f39c12','#3498db','#A51931','#00247D','#ff6b6b','#ffd166','#06d6a0','#118ab2'];
      for (var i = 0; i < 24; i++) {
        var piece = document.createElement('span');
        piece.className = 'confetti';
        var left = 2 + Math.random() * 96;
        var widthPx = 6 + Math.floor(Math.random() * 5);
        var heightPx = 10 + Math.floor(Math.random() * 7);
        piece.style.left = left + '%';
        piece.style.width = widthPx + 'px';
        piece.style.height = heightPx + 'px';
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = Math.floor(Math.random() * 200) + 'ms';
        piece.style.setProperty('--confetti-rotate', (240 + Math.floor(Math.random() * 240)) + 'deg');
        confettiWrap.appendChild(piece);
      }
      overlay.appendChild(confettiWrap);
      overlay.appendChild(card);

      // Insert overlay at the end of body so it sits above the quiz
      document.body.appendChild(overlay);

      // Auto-dismiss shortly before auto-advance to the next question
      exampleOverlayTimerId = setTimeout(function(){ removeExistingExampleOverlay(); }, 2600);
    } catch (e) { logError(e, 'ui.renderers.renderExample'); }
  }

  function insertProTip(text) {
    try {
      const footer = document.querySelector('.footer');
      if (footer && text) {
        const tip = document.createElement('div');
        tip.className = 'pro-tip';
        var small = document.createElement('small');
        // Minimal sanitizer that preserves a tiny whitelist of tags and strips attributes
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
        // If the text contains markup, sanitize it; otherwise set as text
        var hasMarkup = /<\/?[a-z][\s\S]*>/i.test(String(text));
        if (hasMarkup) { small.appendChild(sanitizeHTML(text)); }
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

  NS.ui.renderers = {
    renderEnglishThaiSymbol: renderEnglishThaiSymbol,
    renderExample: renderExample,
    insertProTip: insertProTip,
    insertConsonantLegend: insertConsonantLegend,
    renderVowelSymbol: renderVowelSymbol
  };
})(window);

