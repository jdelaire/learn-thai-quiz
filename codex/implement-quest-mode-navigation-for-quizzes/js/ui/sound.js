(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};
  var err = (NS.core && NS.core.error) || {};
  var logError = err.logError || function(){};

  var StorageService = global.StorageService;

  var SOUND_KEY = 'thaiQuest.settings.sound';
  var RATE_KEY = 'thaiQuest.settings.soundRate';

  function isPerQuizVoiceSupported(){
    try { return !!(document && document.body && document.body.dataset && document.body.dataset.voiceSupported === '1'); } catch (_) { return false; }
  }

  function ttsSupported(){ try { return !!(global.Utils && global.Utils.TTS && global.Utils.TTS.isSupported && global.Utils.TTS.isSupported()); } catch (_) { return false; } }
  function hasThaiVoice(){ try { return !!(global.Utils && global.Utils.TTS && global.Utils.TTS.pickThaiVoice && global.Utils.TTS.pickThaiVoice()); } catch (_) { return false; } }

  function isSoundOn(){ try { var v = StorageService && StorageService.getItem(SOUND_KEY); return String(v || '').toLowerCase() === 'on'; } catch (_) { return false; } }
  function setSoundOn(on){ try { StorageService && StorageService.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (_) {} }

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function getRate(){ try { var raw = StorageService && StorageService.getItem(RATE_KEY); var n = parseFloat(raw); if (!isFinite(n)) n = 0.8; return clamp(n, 0.5, 1.5); } catch (_) { return 0.8; } }
  function setRate(r){ try { StorageService && StorageService.setItem(RATE_KEY, String(r)); } catch (_) {} }

  function getThaiVoiceInstallMessage(){
    try {
      var pf = (global && global.Utils && global.Utils.platform) || {};
      if (pf.isIOS && pf.isIOS()) return 'To enable audio: Settings → Accessibility → Spoken Content → Voices → Add New Voice → Thai';
      if (pf.isAndroid && pf.isAndroid()) return 'To enable audio: Settings → System → Languages & input → Text‑to‑speech → Install voice data → Thai';
      if (pf.isMac && pf.isMac()) return 'To enable audio: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → Thai';
      if (pf.isWindows && pf.isWindows()) return 'To enable audio: Settings → Time & Language → Speech → Manage voices → Add voices → Thai';
      return 'Thai voice not available. Install Thai TTS in your system settings.';
    } catch (_) { return 'Thai voice not available. Install Thai TTS in your system settings.'; }
  }

  function labelForRate(rate){ return 'Speed: ' + (rate.toFixed(1) + 'x'); }

  function injectControls(){
    try {
      if (!isPerQuizVoiceSupported()) return;
      var footer = document.querySelector('.footer');
      if (!footer || footer.querySelector('.sound-controls') || footer.querySelector('.sound-help')) return;

      var canSpeakThai = ttsSupported() && hasThaiVoice();
      if (!canSpeakThai) {
        var help = document.createElement('div');
        help.className = 'sound-help';
        help.textContent = getThaiVoiceInstallMessage();
        footer.appendChild(help);
        return;
      }

      var wrap = document.createElement('div');
      wrap.className = 'sound-controls';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip sound-toggle';
      var on = isSoundOn();
      btn.textContent = on ? '🔊 Sound: On' : '🔇 Sound: Off';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.addEventListener('click', function(){
        var nowOn = !isSoundOn();
        setSoundOn(nowOn);
        try { btn.textContent = nowOn ? '🔊 Sound: On' : '🔇 Sound: Off'; } catch (_) {}
        try { btn.setAttribute('aria-pressed', nowOn ? 'true' : 'false'); } catch (_) {}
        try { global.speechSynthesis && global.speechSynthesis.resume(); } catch (_) {}
      });
      wrap.appendChild(btn);

      var speedBtn = document.createElement('button');
      speedBtn.type = 'button';
      speedBtn.className = 'chip sound-speed-toggle';
      var RATES = [0.6, 0.8, 1.0];
      function nearestRate(val){ var r = parseFloat(val); if (!isFinite(r)) r = 0.8; var best = RATES[0], diff = Math.abs(r - best); for (var i=1;i<RATES.length;i++){ var d = Math.abs(r - RATES[i]); if (d < diff) { diff = d; best = RATES[i]; } } return best; }
      var current = nearestRate(getRate());
      setRate(current);
      speedBtn.textContent = labelForRate(current);
      speedBtn.addEventListener('click', function(){
        var idx = 0; for (var i=0;i<RATES.length;i++){ if (Math.abs(RATES[i]-current) < 0.001) { idx = i; break; } }
        current = RATES[(idx + 1) % RATES.length];
        setRate(current);
        try { speedBtn.textContent = labelForRate(current); } catch (_) {}
        try { global.speechSynthesis && global.speechSynthesis.resume(); } catch (_) {}
      });
      wrap.appendChild(speedBtn);

      footer.appendChild(wrap);
    } catch (e) { logError(e, 'ui.sound.injectControls'); }
  }

  function maybeSpeakThaiFromAnswer(ans){
    try {
      if (!isPerQuizVoiceSupported()) return false;
      if (!isSoundOn()) return false;
      if (!(global.Utils && global.Utils.TTS && typeof global.Utils.TTS.speakThai === 'function' && ttsSupported() && hasThaiVoice())) return false;
      var text = '';
      try {
        if (ans && ans.thai) text = String(ans.thai);
        else if (ans && ans.exampleThai) text = String(ans.exampleThai);
        else if (ans && ans.symbol) text = String(ans.symbol);
      } catch (_) { text = ''; }
      if (!text) return false;
      global.Utils.TTS.speakThai(text, { rate: getRate(), pitch: 1.0 });
      return true;
    } catch (e) { logError(e, 'ui.sound.maybeSpeakThaiFromAnswer'); return false; }
  }

  NS.ui.sound = {
    injectControls: injectControls,
    maybeSpeakThaiFromAnswer: maybeSpeakThaiFromAnswer,
    // expose for any external UI usage
    isSoundOn: isSoundOn,
    setSoundOn: setSoundOn,
    getRate: getRate,
    setRate: setRate
  };
})(window);

