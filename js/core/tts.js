(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.core = NS.core || {};
  var err = NS.core.error || {};
  var logError = err.logError || function(){};

  var voices = [];
  function refreshVoices() {
    try {
      voices = (global && global.speechSynthesis && typeof global.speechSynthesis.getVoices === 'function')
        ? (global.speechSynthesis.getVoices() || [])
        : [];
    } catch (_) { voices = []; }
  }

  function isSupported() {
    try { return !!(global && global.speechSynthesis && global.SpeechSynthesisUtterance); }
    catch (_) { return false; }
  }

  function pickThaiVoice() {
    try {
      refreshVoices();
      var best = null;
      for (var i = 0; i < voices.length; i++) {
        var v = voices[i];
        var lang = ((v && v.lang) || '').toLowerCase();
        var name = ((v && v.name) || '').toLowerCase();
        if (lang.indexOf('th') === 0 || name.indexOf('thai') !== -1) { best = v; break; }
      }
      return best;
    } catch (e) { logError(e, 'core.tts.pickThaiVoice'); return null; }
  }

  function speakThai(text, opts) {
    try {
      if (!isSupported()) return false;
      var raw = (text == null) ? '' : String(text);
      var t = raw.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ''); // strip surrogate pairs (basic emoji cleanup)
      t = t.trim();
      if (!t) return false;
      var u = new global.SpeechSynthesisUtterance(t);
      u.lang = 'th-TH';
      var v = pickThaiVoice();
      if (v) u.voice = v;
      if (opts && typeof opts.rate === 'number') u.rate = opts.rate;
      if (opts && typeof opts.pitch === 'number') u.pitch = opts.pitch;
      if (opts && typeof opts.volume === 'number') u.volume = opts.volume;
      try { global.speechSynthesis.cancel(); } catch (_) {}
      global.speechSynthesis.speak(u);
      return true;
    } catch (e) { logError(e, 'core.tts.speakThai'); return false; }
  }

  try {
    if (global && global.speechSynthesis && typeof global.speechSynthesis.addEventListener === 'function') {
      global.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    }
  } catch (_) {}
  refreshVoices();

  NS.core.tts = { isSupported: isSupported, pickThaiVoice: pickThaiVoice, speakThai: speakThai };
})(window);

