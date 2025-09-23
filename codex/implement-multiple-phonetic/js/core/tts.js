(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.core = NS.core || {};
  var err = NS.core.error || {};
  var logError = err.logError || function(){};

  var voices = [];
  var speakSeq = 0; // increments per speak request
  var pendingTimer = null;
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

      // Reset engine and schedule delayed speak to avoid queue glitches
      try { global.speechSynthesis.cancel(); } catch (_) {}
      try { global.speechSynthesis.resume(); } catch (_) {}

      speakSeq++;
      var mySeq = speakSeq;
      if (pendingTimer != null) { try { clearTimeout(pendingTimer); } catch (_) {} pendingTimer = null; }
      pendingTimer = setTimeout(function(){
        if (mySeq !== speakSeq) return;
        try {
          var u = new global.SpeechSynthesisUtterance(t);
          u.lang = 'th-TH';
          var v = pickThaiVoice();
          if (v) u.voice = v;
          if (opts && typeof opts.rate === 'number') u.rate = opts.rate;
          if (opts && typeof opts.pitch === 'number') u.pitch = opts.pitch;
          if (opts && typeof opts.volume === 'number') u.volume = opts.volume;
          var triedRetry = false;
          u.onerror = function(){
            if (triedRetry) return;
            triedRetry = true;
            try { global.speechSynthesis.cancel(); } catch (_) {}
            try { global.speechSynthesis.resume(); } catch (_) {}
            setTimeout(function(){
              try {
                var u2 = new global.SpeechSynthesisUtterance(t);
                u2.lang = 'th-TH';
                var v2 = pickThaiVoice();
                if (v2) u2.voice = v2;
                if (opts && typeof opts.rate === 'number') u2.rate = opts.rate;
                if (opts && typeof opts.pitch === 'number') u2.pitch = opts.pitch;
                if (opts && typeof opts.volume === 'number') u2.volume = opts.volume;
                try { global.speechSynthesis.speak(u2); } catch (e2) { logError(e2, 'core.tts.retry.speakThai'); }
              } catch (e) { logError(e, 'core.tts.retry.prepare'); }
            }, 120);
          };
          try { global.speechSynthesis.speak(u); } catch (e) { logError(e, 'core.tts.speakThai.speak'); }
        } catch (e) { logError(e, 'core.tts.speakThai.prepare'); }
      }, 80);

      return true;
    } catch (e) { logError(e, 'core.tts.speakThai'); return false; }
  }

  try {
    if (global && global.speechSynthesis && typeof global.speechSynthesis.addEventListener === 'function') {
      global.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    }
  } catch (_) {}
  refreshVoices();

  // Try to resume the engine when coming back to the tab/window
  try {
    global.addEventListener('pageshow', function(){ try { global.speechSynthesis && global.speechSynthesis.resume(); } catch (_) {} });
    global.addEventListener('focus', function(){ try { global.speechSynthesis && global.speechSynthesis.resume(); } catch (_) {} });
    if (global.document && typeof global.document.addEventListener === 'function') {
      global.document.addEventListener('visibilitychange', function(){
        if (!global.document.hidden) { try { global.speechSynthesis && global.speechSynthesis.resume(); } catch (_) {} }
      });
    }
  } catch (_) {}

  NS.core.tts = { isSupported: isSupported, pickThaiVoice: pickThaiVoice, speakThai: speakThai };
})(window);
