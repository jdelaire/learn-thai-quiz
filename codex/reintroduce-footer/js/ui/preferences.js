(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};
  var logError = (NS.core && NS.core.error && NS.core.error.logError) || function(){};

  var LABEL_MAP = {
    en: 'English',
    fr: 'Français',
    es: 'Español'
  };

  var DEFAULT_LOCALE_OPTIONS = [
    { value: 'en', label: 'English (default)' },
    { value: 'fr', label: 'Français' }
  ];

  function getUtils() {
    try { return global.Utils || null; } catch (_) { return null; }
  }

  function normalize(locale) {
    var Utils = getUtils();
    if (Utils && typeof Utils.normalizePhoneticLocale === 'function') {
      var norm = Utils.normalizePhoneticLocale(locale);
      if (norm) return norm;
    }
    try {
      if (!locale) return '';
      var str = String(locale).trim().toLowerCase();
      if (!str) return '';
      str = str.replace(/_/g, '-');
      var base = str.split('-')[0] || '';
      base = base.replace(/[^a-z]/g, '');
      if (!base) return '';
      if (base.length > 5) base = base.slice(0, 5);
      return base;
    } catch (_) {
      return '';
    }
  }

  function labelForLocale(locale) {
    var norm = normalize(locale);
    if (!norm) return '';
    if (LABEL_MAP[norm]) return LABEL_MAP[norm];
    try {
      return norm.toUpperCase();
    } catch (_) {
      return norm;
    }
  }

  function uniquePush(target, value) {
    var norm = normalize(value);
    if (!norm) return;
    for (var i = 0; i < target.length; i++) {
      if (target[i] === norm) return;
    }
    target.push(norm);
  }

  function parseLocales(input) {
    var list = [];
    if (!input) return list;
    if (Array.isArray(input)) {
      for (var i = 0; i < input.length; i++) {
        uniquePush(list, input[i]);
      }
    } else if (typeof input === 'string') {
      var parts = input.split(',');
      for (var j = 0; j < parts.length; j++) {
        uniquePush(list, parts[j]);
      }
    }
    return list;
  }

  function localeOptions(quizId, provided) {
    var codes = parseLocales(provided);
    var options = [];
    if (!codes.length) {
      for (var i = 0; i < DEFAULT_LOCALE_OPTIONS.length; i++) {
        var value = normalize(DEFAULT_LOCALE_OPTIONS[i].value);
        if (!value) continue;
        options.push({ value: value, label: DEFAULT_LOCALE_OPTIONS[i].label });
      }
      if (options.length) return options;
      codes = ['en'];
    }
    var seen = {};
    for (var j = 0; j < codes.length; j++) {
      var value = normalize(codes[j]);
      if (!value || seen[value]) continue;
      seen[value] = true;
      var label = labelForLocale(value);
      if (!label) continue;
      options.push({ value: value, label: label });
    }
    if (!options.length) {
      options.push({ value: 'en', label: labelForLocale('en') || 'EN' });
    }
    return options;
  }

  function injectControls(config) {
    try {
      var doc = global.document;
      if (!doc) return;
      var body = doc.body;
      if (!body) return;

      config = config || {};
      var quizId = config.quizId || (body.dataset && body.dataset.quizId) || '';
      if (!quizId) return;

      var supported = (typeof config.supported === 'boolean')
        ? config.supported
        : !!(body.dataset && body.dataset.phoneticsSupported === '1');

      var container = doc.getElementById('quiz-preferences');
      if (!container) return;

      if (!supported) {
        while (container.firstChild) container.removeChild(container.firstChild);
        container.style.display = 'none';
        return;
      }

      container.style.display = '';
      while (container.firstChild) container.removeChild(container.firstChild);

      var providedLocales = config.locales;
      if (!providedLocales && body.dataset) {
        providedLocales = body.dataset.phoneticLocales || '';
      }
      var options = localeOptions(quizId, providedLocales);
      var Utils = getUtils();
      var current = options[0].value;
      try {
        if (Utils && typeof Utils.getQuizPhoneticLocale === 'function') {
          var stored = Utils.getQuizPhoneticLocale(quizId, current);
          if (stored) current = normalize(stored) || current;
        }
      } catch (_) {}

      var hasCurrent = false;
      for (var i = 0; i < options.length; i++) {
        if (options[i].value === current) { hasCurrent = true; break; }
      }
      if (!hasCurrent) {
        options.push({ value: current, label: labelForLocale(current) || current });
      }

      var label = doc.createElement('label');
      label.setAttribute('for', 'quiz-phonetic-locale');
      label.textContent = 'Phonetic language';
      container.appendChild(label);

      var select = doc.createElement('select');
      select.id = 'quiz-phonetic-locale';
      select.setAttribute('aria-label', 'Select phonetic language for this quiz');

      for (var j = 0; j < options.length; j++) {
        var opt = doc.createElement('option');
        opt.value = options[j].value;
        opt.textContent = options[j].label;
        select.appendChild(opt);
      }

      select.value = current;
      try { select.setAttribute('data-selected-locale', current); } catch (_) {}

      select.addEventListener('change', function(){
        var value = normalize(select.value);
        if (!value) value = options[0].value;
        try {
          if (Utils && typeof Utils.setQuizPhoneticLocale === 'function') {
            value = Utils.setQuizPhoneticLocale(quizId, value);
          }
        } catch (_) {}
        select.value = value;
        try { select.setAttribute('data-selected-locale', value); } catch (_) {}
        try {
          doc.dispatchEvent(new CustomEvent('thaiQuest.phonetics.change', {
            detail: { quizId: quizId, locale: value }
          }));
        } catch (_) {}
      });

      container.appendChild(select);
    } catch (e) {
      logError(e, 'ui.phonetics.injectControls');
    }
  }

  NS.ui.phonetics = {
    injectControls: injectControls
  };
})(window);
