(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};
  var logError = (NS.core && NS.core.error && NS.core.error.logError) || function(){};

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
      while (feedbackEl.firstChild) feedbackEl.removeChild(feedbackEl.firstChild);
      if (!exampleText) return;
      const card = document.createElement('div');
      card.className = 'example';
      var exampleLabel = (global.Utils && global.Utils.i18n && global.Utils.i18n.exampleLabel) || 'Example';
      card.setAttribute('aria-label', exampleLabel);
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = exampleLabel;
      const text = document.createElement('div');
      text.className = 'text';
      text.textContent = String(exampleText);
      card.appendChild(label);
      card.appendChild(text);
      feedbackEl.appendChild(card);
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
      symbolEl.setAttribute('aria-label', 'Thai vowel symbol: ' + raw);
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

