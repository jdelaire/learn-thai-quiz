(function(global) {
  'use strict';

  function logErrorSafe(error, context) {
    try {
      if (context) {
        console.error('[ThaiQuest]', context, error);
      } else {
        console.error('[ThaiQuest]', error);
      }
    } catch (_) {}
  }

  var memoryStore = Object.create(null);

  function storageAvailable() {
    try {
      var testKey = '__thaiQuest_storage_test__' + Date.now();
      global.localStorage.setItem(testKey, '1');
      global.localStorage.removeItem(testKey);
      return true;
    } catch (_) {
      return false;
    }
  }

  var hasLocalStorage = storageAvailable();

  function getItemLS(key) {
    try {
      if (!hasLocalStorage) return (key in memoryStore) ? String(memoryStore[key]) : null;
      return global.localStorage.getItem(key);
    } catch (e) {
      logErrorSafe(e, 'StorageService.getItem');
      return (key in memoryStore) ? String(memoryStore[key]) : null;
    }
  }

  function setItemLS(key, value) {
    try {
      var v = (value == null) ? '' : String(value);
      if (hasLocalStorage) {
        global.localStorage.setItem(key, v);
      } else {
        memoryStore[key] = v;
      }
      return true;
    } catch (e) {
      logErrorSafe(e, 'StorageService.setItem');
      try { memoryStore[key] = (value == null) ? '' : String(value); } catch (_) {}
      return false;
    }
  }

  function removeItemLS(key) {
    try {
      if (hasLocalStorage) {
        global.localStorage.removeItem(key);
      }
      delete memoryStore[key];
      return true;
    } catch (e) {
      logErrorSafe(e, 'StorageService.removeItem');
      try { delete memoryStore[key]; } catch (_) {}
      return false;
    }
  }

  function keys(prefix) {
    var out = [];
    try {
      if (hasLocalStorage) {
        for (var i = 0; i < global.localStorage.length; i++) {
          var k = global.localStorage.key(i);
          if (!k) continue;
          if (!prefix || k.indexOf(prefix) === 0) out.push(k);
        }
      }
    } catch (e) {
      logErrorSafe(e, 'StorageService.keys.localStorage');
    }
    try {
      Object.keys(memoryStore).forEach(function(k) {
        if (!prefix || k.indexOf(prefix) === 0) {
          if (out.indexOf(k) === -1) out.push(k);
        }
      });
    } catch (_) {}
    return out;
  }

  function clearPrefix(prefix) {
    var ks = keys(prefix);
    for (var i = 0; i < ks.length; i++) {
      removeItemLS(ks[i]);
    }
  }

  function getJSON(key, fallback) {
    try {
      var raw = getItemLS(key);
      if (!raw) return (fallback == null) ? null : fallback;
      try {
        var obj = JSON.parse(raw);
        return (obj == null) ? ((fallback == null) ? null : fallback) : obj;
      } catch (e) {
        logErrorSafe(e, 'StorageService.getJSON.parse ' + key);
        return (fallback == null) ? null : fallback;
      }
    } catch (e) {
      logErrorSafe(e, 'StorageService.getJSON');
      return (fallback == null) ? null : fallback;
    }
  }

  function setJSON(key, value) {
    try {
      var raw = JSON.stringify(value == null ? {} : value);
      return setItemLS(key, raw);
    } catch (e) {
      logErrorSafe(e, 'StorageService.setJSON');
      return false;
    }
  }

  function getNumber(key, fallback) {
    var str = getItemLS(key);
    var n = parseInt(str, 10);
    if (!isFinite(n)) return (typeof fallback === 'number') ? fallback : 0;
    return n;
  }

  function setNumber(key, num) {
    if (typeof num !== 'number' || !isFinite(num)) num = 0;
    return setItemLS(key, String(Math.floor(num)));
  }

  var validate = {
    isNonNegativeInteger: function(n) {
      var x = parseInt(n, 10);
      return isFinite(x) && x >= 0;
    },
    ensureProgressShape: function(value) {
      var v = value || {};
      var qa = parseInt(v.questionsAnswered, 10);
      var ca = parseInt(v.correctAnswers, 10);
      if (!isFinite(qa) || qa < 0) qa = 0;
      if (!isFinite(ca) || ca < 0) ca = 0;
      return { questionsAnswered: qa, correctAnswers: ca };
    }
  };

  global.StorageService = {
    isAvailable: function() { return hasLocalStorage; },
    getItem: getItemLS,
    setItem: setItemLS,
    removeItem: removeItemLS,
    getJSON: getJSON,
    setJSON: setJSON,
    getNumber: getNumber,
    setNumber: setNumber,
    keys: keys,
    clearPrefix: clearPrefix,
    validate: validate
  };
})(window);

