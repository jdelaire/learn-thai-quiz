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

  var starOverlayTimerId = null;
  function removeStarCelebrationOverlay() {
    try {
      if (starOverlayTimerId != null) {
        clearTimeout(starOverlayTimerId);
        starOverlayTimerId = null;
      }
      var existing = document.querySelector('.star-celebration-overlay');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    } catch (_) {}
  }

  function renderStarCelebration(payload) {
    try {
      var stars = 0;
      var answered = null;
      var correct = null;
      var quizId = '';
      if (typeof payload === 'number') {
        stars = payload;
      } else if (payload && typeof payload === 'object') {
        if (payload.stars != null) stars = payload.stars;
        if (payload.questionsAnswered != null) answered = payload.questionsAnswered;
        if (payload.correctAnswers != null) correct = payload.correctAnswers;
        if (payload.quizId) quizId = String(payload.quizId);
      }
      stars = Math.max(0, Math.min(3, parseInt(stars, 10) || 0));
      if (typeof answered !== 'number' || !isFinite(answered)) answered = null;
      if (typeof correct !== 'number' || !isFinite(correct)) correct = null;

      removeStarCelebrationOverlay();

      var overlay = document.createElement('div');
      overlay.className = 'star-celebration-overlay';
      try {
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Star milestone reached');
      } catch (_) {}

      var card = document.createElement('div');
      card.className = 'star-celebration-card';

      var heading = document.createElement('div');
      heading.className = 'celebrate-heading';
      var icon = document.createElement('span');
      icon.className = 'celebrate-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '⭐';
      heading.appendChild(icon);
      heading.appendChild(document.createTextNode('Milestone reached!'));

      var starsRow = document.createElement('div');
      starsRow.className = 'celebrate-stars';
      var starString = '';
      for (var i = 0; i < 3; i++) starString += i < stars ? '★' : '☆';
      starsRow.textContent = starString;
      try {
        var aria = stars === 1 ? '1 star earned' : (stars + ' stars earned');
        starsRow.setAttribute('aria-label', aria);
      } catch (_) {}

      var message = '';
      if (stars >= 3) message = 'Outstanding accuracy! You earned all three stars.';
      else if (stars === 2) message = 'Great job! Two stars earned.';
      else if (stars === 1) message = 'Nice work! You earned 1 star.';
      else message = 'You reached 100 questions. Keep practicing to earn stars!';
      var messageEl = document.createElement('div');
      messageEl.className = 'celebrate-message';
      messageEl.textContent = message;

      var metaText = '';
      if (correct != null && answered != null) {
        metaText = correct + ' correct out of ' + answered + ' questions';
      }
      if (quizId) {
        metaText = metaText ? metaText + ' · ' + quizId : quizId;
      }
      var metaEl = document.createElement('div');
      metaEl.className = 'celebrate-meta';
      metaEl.textContent = metaText;

      function redirectHome() {
        try { removeStarCelebrationOverlay(); } catch (_) {}
        try { window.location.href = 'index.html'; } catch (_) {}
      }

      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'celebrate-close';
      closeBtn.textContent = 'Continue';
      closeBtn.addEventListener('click', function(ev){
        ev.preventDefault();
        redirectHome();
      });

      card.appendChild(heading);
      card.appendChild(starsRow);
      card.appendChild(messageEl);
      if (metaText) card.appendChild(metaEl);
      card.appendChild(closeBtn);

      overlay.appendChild(card);
      overlay.addEventListener('click', function(ev){
        if (ev.target === overlay) removeStarCelebrationOverlay();
      });

      document.body.appendChild(overlay);

      starOverlayTimerId = setTimeout(function(){ removeStarCelebrationOverlay(); }, 7000);
    } catch (e) { logError(e, 'ui.renderers.renderStarCelebration'); }
  }

  function dismissStarCelebration() {
    try {
      removeStarCelebrationOverlay();
    } catch (e) { logError(e, 'ui.renderers.dismissStarCelebration'); }
  }

  function renderExample(feedbackEl, exampleText) {
    try {
      // Skip success overlay if a star celebration is active
      try {
        if (document.querySelector('.star-celebration-overlay')) {
          while (feedbackEl.firstChild) feedbackEl.removeChild(feedbackEl.firstChild);
          return;
        }
      } catch (_) {}

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
          var highlightSpec = highlight && (highlight.english || highlight.thai || highlight.phonetic) ? highlight : null;

          if (!highlightSpec) {
            var parts = raw.split('→');
            var english = String((parts[0] || raw)).trim();
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
              if (m0) {
                highlightSpec = { english: m0[1] };
                break;
              }
            }
          }

          if (highlightSpec && global && global.Utils && typeof global.Utils.buildHighlightedNodes === 'function') {
            var frag = global.Utils.buildHighlightedNodes(raw, highlightSpec);
            if (frag) {
              text.appendChild(frag);
              return;
            }
          }
          text.appendChild(document.createTextNode(raw));
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
    dismissExampleOverlay: dismissExampleOverlay,
    renderStarCelebration: renderStarCelebration,
    dismissStarCelebration: dismissStarCelebration
  };
})(window);
