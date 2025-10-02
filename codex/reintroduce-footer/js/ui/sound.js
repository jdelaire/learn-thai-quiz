(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};
  var err = (NS.core && NS.core.error) || {};
  var logError = err.logError || function(){};

  var StorageService = global.StorageService;

  var SOUND_KEY = 'thaiQuest.settings.sound';
  var RATE_KEY = 'thaiQuest.settings.soundRate';
  var DEFAULT_RATE = 0.6;

  function isPerQuizVoiceSupported(){
    try { return !!(document && document.body && document.body.dataset && document.body.dataset.voiceSupported === '1'); } catch (_) { return false; }
  }

  function ttsSupported(){ try { return !!(global.Utils && global.Utils.TTS && global.Utils.TTS.isSupported && global.Utils.TTS.isSupported()); } catch (_) { return false; } }
  function hasThaiVoice(){ try { return !!(global.Utils && global.Utils.TTS && global.Utils.TTS.pickThaiVoice && global.Utils.TTS.pickThaiVoice()); } catch (_) { return false; } }

  function isSoundOn(){ try { var v = StorageService && StorageService.getItem(SOUND_KEY); return String(v || '').toLowerCase() === 'on'; } catch (_) { return false; } }
  function setSoundOn(on){ try { StorageService && StorageService.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (_) {} }

  function clearLegacyRate(){ try { StorageService && StorageService.removeItem && StorageService.removeItem(RATE_KEY); } catch (_) {} }
  function getRate(){ clearLegacyRate(); return DEFAULT_RATE; }

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
    DEFAULT_RATE: DEFAULT_RATE,
    injectControls: injectControls,
    maybeSpeakThaiFromAnswer: maybeSpeakThaiFromAnswer,
    // expose for any external UI usage
    isSoundOn: isSoundOn,
    setSoundOn: setSoundOn,
    getRate: getRate
  };
})(window);
