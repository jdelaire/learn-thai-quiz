(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.quiz = NS.quiz || {};

  var storageKey = 'thaiQuest.settings.phoneticLocale';
  var defaultLocale = 'en';

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

  function getPreferredLocale() {
    try {
      var raw = global.StorageService && typeof global.StorageService.getItem === 'function'
        ? global.StorageService.getItem(storageKey)
        : null;
      var normalized = normalizeLocale(raw);
      if (normalized) return normalized;
    } catch (_) {}
    return defaultLocale;
  }

  function setPreferredLocale(locale) {
    var normalized = normalizeLocale(locale) || defaultLocale;
    try {
      if (global.StorageService && typeof global.StorageService.setItem === 'function') {
        global.StorageService.setItem(storageKey, normalized);
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

  function getPhoneticForLocale(item, locale) {
    var canonical = getCanonicalPhonetic(item);
    var map = getPhoneticMap(item);
    if (!map) return canonical;
    var loc = normalizeLocale(locale) || getPreferredLocale();
    if (loc && map[loc] != null && map[loc] !== '') {
      try { return String(map[loc]); } catch (_) { return canonical; }
    }
    if (map.en != null && map.en !== '') {
      try { return String(map.en); } catch (_) {}
    }
    var first = firstPhonetic(map);
    return first || canonical;
  }

  function getDisplayPhonetic(item, locale) {
    var value = getPhoneticForLocale(item, locale);
    if (value) return value;
    return getCanonicalPhonetic(item);
  }

  function getPhoneticBundle(item, locale) {
    return {
      canonical: getCanonicalPhonetic(item),
      display: getDisplayPhonetic(item, locale)
    };
  }

  NS.quiz.phonetics = {
    normalizeLocale: normalizeLocale,
    getPreferredLocale: getPreferredLocale,
    setPreferredLocale: setPreferredLocale,
    getCanonicalPhonetic: getCanonicalPhonetic,
    getPhoneticForLocale: getPhoneticForLocale,
    getDisplayPhonetic: getDisplayPhonetic,
    getPhoneticBundle: getPhoneticBundle
  };
})(window);
