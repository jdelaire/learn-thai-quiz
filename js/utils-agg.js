(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  var err = (NS.core && NS.core.error) || {};
  var common = (NS.util && NS.util.common) || {};
  var color = (NS.util && NS.util.color) || {};
  var platform = (NS.util && NS.util.platform) || {};
  var coreFetch = (NS.core && NS.core.fetch) || {};
  var tts = (NS.core && NS.core.tts) || {};
  var ui = (NS.ui && NS.ui.renderers) || {};
  var quizUI = (NS.ui && NS.ui.quizui) || {};
  var sound = (NS.ui && NS.ui.sound) || {};
  var prog = (NS.quiz && NS.quiz.progressive) || {};
  var factories = (NS.quiz && NS.quiz.factories) || {};
  var player = (NS.quiz && NS.quiz.player) || {};
  var phonetics = (NS.quiz && NS.quiz.phonetics) || {};

  var noop = function(){};
  function pickFn(source, key, fallback) {
    return (source && typeof source[key] === 'function') ? source[key] : fallback;
  }

  global.Utils = {
    // Storage service re-export
    Storage: global.StorageService || null,

    // fetch
    fetchJSON: coreFetch.fetchJSON,
    fetchJSONCached: coreFetch.fetchJSONCached,
    fetchJSONs: coreFetch.fetchJSONs,
    
    // text-to-speech (Thai, when available)
    TTS: {
      isSupported: tts.isSupported,
      speakThai: tts.speakThai,
      pickThaiVoice: tts.pickThaiVoice
    },

    // common utils
    pickRandom: common.pickRandom,
    pickUniqueChoices: common.pickUniqueChoices,
    setText: common.setText,
    byProp: common.byProp,
    i18n: common.i18n,
    defaultElements: common.defaultElements,
    clearChildren: common.clearChildren,
    sanitizeHTML: common.sanitizeHTML,

    // color
    hexToRgb: color.hexToRgb,
    rgbToHex: color.rgbToHex,
    rgbToHsl: color.rgbToHsl,
    hslToRgb: color.hslToRgb,
    adjustLightness: color.adjustLightness,
    getDisplayHex: color.getDisplayHex,
    hexToRgba: color.hexToRgba,

    // renderers
    renderEnglishThaiSymbol: ui.renderEnglishThaiSymbol,
    renderExample: ui.renderExample,
    insertProTip: ui.insertProTip,
    insertConsonantLegend: ui.insertConsonantLegend,
    renderVowelSymbol: ui.renderVowelSymbol,
    renderConsonantSymbol: ui.renderConsonantSymbol,
    dismissExampleOverlay: ui.dismissExampleOverlay,

    // platform helpers
    platform: {
      getUserAgent: pickFn(platform, 'getUserAgent', function(){ return ''; }),
      getPlatform: pickFn(platform, 'getPlatform', function(){ return ''; }),
      isIOS: pickFn(platform, 'isIOS', function(){ return false; }),
      isAndroid: pickFn(platform, 'isAndroid', function(){ return false; }),
      isWindows: pickFn(platform, 'isWindows', function(){ return false; }),
      isMac: pickFn(platform, 'isMac', function(){ return false; }),
      isMobile: pickFn(platform, 'isMobile', function(){ return false; })
    },

    // sound controls
    sound: {
      injectControls: pickFn(sound, 'injectControls', noop),
      maybeSpeakThaiFromAnswer: pickFn(sound, 'maybeSpeakThaiFromAnswer', function(){ return false; }),
      isSoundOn: pickFn(sound, 'isSoundOn', function(){ return false; }),
      setSoundOn: pickFn(sound, 'setSoundOn', noop),
      getRate: pickFn(sound, 'getRate', function(){ return 0.8; }),
      setRate: pickFn(sound, 'setRate', noop)
    },

    // quiz UI helpers
    quizUI: {
      disableOtherButtons: pickFn(quizUI, 'disableOtherButtons', function(optionsEl, exceptBtn){
        try {
          if (!optionsEl) return;
          var buttons = optionsEl.querySelectorAll('button');
          for (var i = 0; i < buttons.length; i++) {
            var b = buttons[i];
            if (b !== exceptBtn) {
              b.disabled = true;
              try { b.setAttribute('aria-disabled', 'true'); } catch (_) {}
              try { b.tabIndex = -1; } catch (_) {}
            }
          }
        } catch (_) {}
      }),
      scheduleAutoAdvance: pickFn(quizUI, 'scheduleAutoAdvance', function(state, callback, delayMs){
        try {
          if (!state) return;
          if (state.autoAdvanceTimerId != null) clearTimeout(state.autoAdvanceTimerId);
          state.autoAdvanceTimerId = setTimeout(function(){
            try {
              state.autoAdvanceTimerId = null;
              if (typeof callback === 'function') callback();
            } catch (_) {}
          }, Math.max(0, parseInt(delayMs, 10) || 0));
        } catch (_) {}
      }),
      updateStats: pickFn(quizUI, 'updateStats', function(statsEl, quizId, state){
        try {
          if (!statsEl || !state) return;
          var qa = state.questionsAnswered || 0;
          var ca = state.correctAnswers || 0;
          var acc = qa > 0 ? Math.round((ca / qa) * 100) : 0;
          var baseText = 'Questions: ' + qa + ' | Correct: ' + ca + ' | Accuracy: ' + acc + '%';
          var starsText = '';
          try {
            if (quizId && global.Utils && typeof global.Utils.computeStarRating === 'function' && typeof global.Utils.formatStars === 'function') {
              var stars = global.Utils.computeStarRating(ca, qa);
              starsText = global.Utils.formatStars(stars) || '';
            }
          } catch (_) {}
          while (statsEl.firstChild) statsEl.removeChild(statsEl.firstChild);
          statsEl.appendChild(global.document.createTextNode(baseText));
          if (starsText) {
            statsEl.appendChild(global.document.createTextNode(' | '));
            var span = global.document.createElement('span');
            span.className = 'stats-stars';
            span.textContent = starsText;
            try {
              if (global.Utils && typeof global.Utils.getStarRulesTooltip === 'function') {
                span.title = global.Utils.getStarRulesTooltip();
                try { span.setAttribute('aria-label', (global.Utils.i18n && global.Utils.i18n.statsStarsAriaLabel) || 'Completion stars'); } catch (_) {}
              }
            } catch (_) {}
            statsEl.appendChild(span);
          }
        } catch (_) {}
      })
    },

    // progressive & factories
    createProgressiveDifficulty: prog.createProgressiveDifficulty,
    DEFAULT_PROGRESSIVE_DIFFICULTY: prog.DEFAULT_PROGRESSIVE_DIFFICULTY,
    getChoicesCountForState: prog.getChoicesCountForState,
    createStandardQuiz: factories.createStandardQuiz,
    createQuizWithProgressiveDifficulty: factories.createQuizWithProgressiveDifficulty,

    // error handling
    ErrorHandler: err.ErrorHandler,
    logError: err.logError,

    // player/profile/progress/stars/xp
    generatePlayerID: player.generatePlayerID,
    getPlayerDisplayName: player.getPlayerDisplayName,
    setPlayerCustomName: player.setPlayerCustomName,
    getPlayerCustomName: player.getPlayerCustomName,
    getPlayerLevel: player.getPlayerLevel,
    getPlayerXP: player.getPlayerXP,
    getPlayerMaxXP: player.getPlayerMaxXP,
    XP_CURVE: player.XP_CURVE,
    xpTotalForLevel: player.xpTotalForLevel,
    xpDeltaForLevel: player.xpDeltaForLevel,
    getXPForStars: player.getXPForStars,
    getTotalXPFromStars: player.getTotalXPFromStars,
    getPlayerAccuracy: player.getPlayerAccuracy,
    getQuizzesCompleted: player.getQuizzesCompleted,
    getTotalStarsEarned: player.getTotalStarsEarned,
    getAllSavedProgress: player.getAllSavedProgress,
    aggregateGlobalStatsFromStorage: player.aggregateGlobalStatsFromStorage,
    getQuizProgress: player.getQuizProgress,
    saveQuizProgress: player.saveQuizProgress,
    computeStarRating: player.computeStarRating,
    formatStars: player.formatStars,
    getQuizStars: player.getQuizStars,
    resetAllProgress: player.resetAllProgress,
    getStarRulesTooltip: player.getStarRulesTooltip,
    getPlayerAvatar: player.getPlayerAvatar,
    formatNumber: player.formatNumber,
    getXPProgressPercentage: player.getXPProgressPercentage,
    // phonetics / localization
    normalizePhoneticLocale: phonetics.normalizeLocale,
    getPreferredPhoneticLocale: phonetics.getPreferredLocale,
    setPreferredPhoneticLocale: phonetics.setPreferredLocale,
    getCanonicalPhonetic: phonetics.getCanonicalPhonetic,
    getPhoneticForLocale: phonetics.getPhoneticForLocale,
    getDisplayPhonetic: phonetics.getDisplayPhonetic,
    getPhoneticBundle: phonetics.getPhoneticBundle
    ,
    // latest attempt
    getLatestAttempt: player.getLatestAttempt
  };
})(window);
