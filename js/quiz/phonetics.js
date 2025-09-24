(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.quiz = NS.quiz || {};

  var storagePrefix = 'thaiQuest.settings.phoneticLocale.';
  var legacyStorageKey = 'thaiQuest.settings.phoneticLocale';
  var defaultLocale = 'en';

  function normalizeQuizId(input) {
    try {
      if (input != null) {
        var str = String(input).trim();
        if (str) return str;
      }
    } catch (_) {}
    try {
      var body = global.document && global.document.body;
      if (body && body.dataset && body.dataset.quizId) {
        var fromBody = String(body.dataset.quizId || '').trim();
        if (fromBody) return fromBody;
      }
    } catch (_) {}
    return '';
  }

  function storageKey(quizId) {
    var normalizedId = normalizeQuizId(quizId);
    if (!normalizedId) return '';
    return storagePrefix + normalizedId;
  }

  function defaultLocaleForQuiz(quizId) {
    try {
      var body = global.document && global.document.body;
      if (!body || !body.dataset) return defaultLocale;
      var attr = body.dataset.phoneticLocales || '';
      if (!attr) return defaultLocale;
      var parts = attr.split(',');
      for (var i = 0; i < parts.length; i++) {
        var norm = normalizeLocale(parts[i]);
        if (norm) return norm;
      }
    } catch (_) {}
    return defaultLocale;
  }

  function normalizeLocale(locale) {
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

  function getQuizLocale(quizId, fallbackLocale) {
    var normalizedId = normalizeQuizId(quizId);
    var fallback = normalizeLocale(fallbackLocale) || defaultLocaleForQuiz(normalizedId);
    var key = storageKey(normalizedId);
    if (!key) return fallback;
    try {
      if (global.StorageService && typeof global.StorageService.getItem === 'function') {
        var raw = global.StorageService.getItem(key);
        var normalized = normalizeLocale(raw);
        if (normalized) return normalized;
      }
    } catch (_) {}
    try {
      if (global.StorageService && typeof global.StorageService.getItem === 'function') {
        var legacy = global.StorageService.getItem(legacyStorageKey);
        var legacyNorm = normalizeLocale(legacy);
        if (legacyNorm) return legacyNorm;
      }
    } catch (_) {}
    return fallback;
  }

  function setQuizLocale(quizId, locale) {
    var normalizedId = normalizeQuizId(quizId);
    var normalized = normalizeLocale(locale) || defaultLocaleForQuiz(normalizedId);
    var key = storageKey(normalizedId);
    if (!key) return normalized;
    try {
      if (global.StorageService && typeof global.StorageService.setItem === 'function') {
        global.StorageService.setItem(key, normalized);
      }
    } catch (_) {}
    return normalized;
  }

  function getPhoneticMap(item) {
    if (!item) return null;
    var map = null;
    try { map = item.phonetics; } catch (_) { map = null; }
    if (!map || typeof map !== 'object') return null;
    return map;
  }

  function firstPhonetic(map) {
    if (!map) return '';
    try {
      for (var key in map) {
        if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
        var val = map[key];
        if (val == null) continue;
        var str = String(val);
        if (str) return str;
      }
    } catch (_) {}
    return '';
  }

  function getCanonicalPhonetic(item) {
    if (!item) return '';
    try {
      if (item.phonetic != null && item.phonetic !== '') {
        return String(item.phonetic);
      }
    } catch (_) {}
    var map = getPhoneticMap(item);
    if (map && map.en != null && map.en !== '') {
      return String(map.en);
    }
    var first = firstPhonetic(map);
    if (first) return first;
    var fallbackProps = ['sound', 'romanization', 'transliteration'];
    for (var i = 0; i < fallbackProps.length; i++) {
      var key = fallbackProps[i];
      try {
        if (item && item[key] != null && item[key] !== '') {
          return String(item[key]);
        }
      } catch (_) {}
    }
    return '';
  }

  function getPhoneticForLocale(item, locale, quizId) {
    var canonical = getCanonicalPhonetic(item);
    var map = getPhoneticMap(item);
    if (!map) return canonical;
    var loc = normalizeLocale(locale);
    if (!loc) loc = getQuizLocale(normalizeQuizId(quizId));
    if (loc && map[loc] != null && map[loc] !== '') {
      try { return String(map[loc]); } catch (_) { return canonical; }
    }
    if (map.en != null && map.en !== '') {
      try { return String(map.en); } catch (_) {}
    }
    var first = firstPhonetic(map);
    return first || canonical;
  }

  function getDisplayPhonetic(item, locale, quizId) {
    var value = getPhoneticForLocale(item, locale, quizId);
    if (value) return value;
    return getCanonicalPhonetic(item);
  }

  function getPhoneticBundle(item, locale, quizId) {
    return {
      canonical: getCanonicalPhonetic(item),
      display: getDisplayPhonetic(item, locale, quizId)
    };
  }

  NS.quiz.phonetics = {
    normalizeLocale: normalizeLocale,
    getQuizLocale: getQuizLocale,
    setQuizLocale: setQuizLocale,
    getCanonicalPhonetic: getCanonicalPhonetic,
    getPhoneticForLocale: getPhoneticForLocale,
    getDisplayPhonetic: getDisplayPhonetic,
    getPhoneticBundle: getPhoneticBundle
  };
})(window);
