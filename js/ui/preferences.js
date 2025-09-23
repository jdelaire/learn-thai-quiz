(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};

  var SELECTOR = '[data-role="phonetic-locale-select"]';
  var DEFAULT_LOCALE = 'en';
  var LOCALES = [
    { value: 'en', label: 'English (default)' },
    { value: 'fr', label: 'Français' }
  ];

  function getUtils() {
    try { return global.Utils || null; } catch (_) { return null; }
  }

  function ensureOptions(select) {
    if (!select) return;
    try {
      if (!select.options || select.options.length === 0) {
        for (var i = 0; i < LOCALES.length; i++) {
          var opt = document.createElement('option');
          opt.value = LOCALES[i].value;
          opt.textContent = LOCALES[i].label;
          select.appendChild(opt);
        }
        return;
      }
      // Ensure at least the known locales exist
      var existing = {};
      for (var j = 0; j < select.options.length; j++) {
        existing[select.options[j].value] = true;
      }
      for (var k = 0; k < LOCALES.length; k++) {
        if (!existing[LOCALES[k].value]) {
          var opt2 = document.createElement('option');
          opt2.value = LOCALES[k].value;
          opt2.textContent = LOCALES[k].label;
          select.appendChild(opt2);
        }
      }
    } catch (_) {}
  }

  function setSelectValue(select, locale) {
    if (!select) return;
    ensureOptions(select);
    var value = locale || DEFAULT_LOCALE;
    var hasOption = false;
    try {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === value) { hasOption = true; break; }
      }
      if (!hasOption) {
        var opt = document.createElement('option');
        opt.value = value;
        opt.textContent = value;
        select.appendChild(opt);
      }
      select.value = value;
    } catch (_) {
      try { select.value = value; } catch (_) {}
    }
  }

  function normalizeLocale(locale) {
    var Utils = getUtils();
    if (Utils && typeof Utils.normalizePhoneticLocale === 'function') {
      var norm = Utils.normalizePhoneticLocale(locale);
      if (norm) return norm;
      return DEFAULT_LOCALE;
    }
    try {
      if (!locale) return DEFAULT_LOCALE;
      var str = String(locale).trim().toLowerCase();
      if (!str) return DEFAULT_LOCALE;
      str = str.replace(/_/g, '-');
      var base = str.split('-')[0] || '';
      base = base.replace(/[^a-z]/g, '');
      if (!base) return DEFAULT_LOCALE;
      if (base.length > 5) base = base.slice(0, 5);
      return base;
    } catch (_) {
      return DEFAULT_LOCALE;
    }
  }

  function syncAllSelects(locale, skip) {
    try {
      var selects = document.querySelectorAll(SELECTOR);
      for (var i = 0; i < selects.length; i++) {
        if (skip && selects[i] === skip) continue;
        setSelectValue(selects[i], locale);
        try { selects[i].setAttribute('data-selected-locale', locale); } catch (_) {}
      }
    } catch (_) {}
  }

  function handleChange(event) {
    var select = event && event.target;
    if (!select) return;
    var Utils = getUtils();
    if (!Utils || typeof Utils.setPreferredPhoneticLocale !== 'function') return;
    var normalized = normalizeLocale(select.value);
    try {
      normalized = Utils.setPreferredPhoneticLocale(normalized);
    } catch (_) {
      // ignore
    }
    setSelectValue(select, normalized);
    try { select.setAttribute('data-selected-locale', normalized); } catch (_) {}
    syncAllSelects(normalized, select);
    try { document.dispatchEvent(new CustomEvent('thaiQuest.phonetics.change', { detail: { locale: normalized } })); } catch (_) {}
  }

  function initSelect(select) {
    if (!select || select.__tqPhoneticInit) return;
    select.__tqPhoneticInit = true;
    ensureOptions(select);
    var Utils = getUtils();
    var locale = DEFAULT_LOCALE;
    try {
      if (Utils && typeof Utils.getPreferredPhoneticLocale === 'function') {
        locale = Utils.getPreferredPhoneticLocale() || DEFAULT_LOCALE;
      }
    } catch (_) {}
    locale = normalizeLocale(locale);
    setSelectValue(select, locale);
    try { select.setAttribute('data-selected-locale', locale); } catch (_) {}
    try { select.addEventListener('change', handleChange); } catch (_) {}
  }

  function initAll() {
    try {
      var selects = document.querySelectorAll(SELECTOR);
      for (var i = 0; i < selects.length; i++) {
        initSelect(selects[i]);
      }
    } catch (_) {}
  }

  var Preferences = {
    initPhoneticLocaleSelect: initSelect,
    initPhoneticLocaleSelectors: initAll,
    LOCALE_OPTIONS: LOCALES.slice()
  };

  NS.ui.preferences = Preferences;
  global.ThaiQuestPreferences = Preferences;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})(window);
