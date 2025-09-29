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
  var phoneticControls = (NS.ui && NS.ui.phonetics) || {};
  var prog = (NS.quiz && NS.quiz.progressive) || {};
  var factories = (NS.quiz && NS.quiz.factories) || {};
  var player = (NS.quiz && NS.quiz.player) || {};
  var phonetics = (NS.quiz && NS.quiz.phonetics) || {};
  var composite = (NS.quiz && NS.quiz.composite) || {};

  var noop = function(){};
  function resolveTextUtil(){
    try {
      var ns = global.__TQ;
      return ns && ns.util && ns.util.text;
    } catch (_) {
      return null;
    }
  }
  function dynamicFn(resolver, key, fallback){
    return function(){
      var source = resolver();
      var fn = (source && typeof source[key] === 'function') ? source[key] : fallback;
      try {
        return fn.apply(source, arguments);
      } catch (err) {
        try { err && err.message; } catch (_) {}
        return fallback.apply(source, arguments);
      }
    };
  }
  function fallbackHighlight(text){
    try {
      if (!global || !global.document) return null;
      var frag = global.document.createDocumentFragment();
      frag.appendChild(global.document.createTextNode(String(text == null ? '' : text)));
      return frag;
    } catch (_) {
      return null;
    }
  }
  function fallbackFormatExample(answer){
    return { text: String((answer && answer.text) || ''), highlight: { english: '', thai: '', phonetic: '' } };
  }
  function fallbackNormalizeAnswer(answer){
    return {
      english: answer && typeof answer === 'string' ? String(answer) : '',
      thai: '',
      phonetic: ''
    };
  }
  function fallbackCombineSources(){
    return Promise.resolve({ data: [], examples: null, sources: [], errors: [] });
  }
  function fallbackCreateCompositeBuilder(){
    return function(){
      return Promise.reject(new Error('Composite builder unavailable'));
    };
  }
  function questionCap() {
    try {
      if (player && typeof player.getQuestionCap === 'function') {
        return player.getQuestionCap();
      }
    } catch (_) {}
    return 100;
  }
  function pickFn(source, key, fallback) {
    return (source && typeof source[key] === 'function') ? source[key] : fallback;
  }

  var DEFAULT_TTS_RATE = (sound && typeof sound.DEFAULT_RATE === 'number') ? sound.DEFAULT_RATE : 0.6;

  global.Utils = {
    // Storage service re-export
    Storage: global.StorageService || null,
    getQuestionCap: questionCap,

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

    // text helpers
    buildHighlightedNodes: dynamicFn(resolveTextUtil, 'buildHighlightedNodes', fallbackHighlight),
    formatExample: dynamicFn(resolveTextUtil, 'formatExample', fallbackFormatExample),
    normalizeAnswer: dynamicFn(resolveTextUtil, 'normalizeAnswer', fallbackNormalizeAnswer),

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
      getRate: pickFn(sound, 'getRate', function(){ return DEFAULT_TTS_RATE; }),
      getDefaultRate: function(){ return DEFAULT_TTS_RATE; }
    },

    // phonetic controls UI
    phoneticsUI: {
      injectControls: pickFn(phoneticControls, 'injectControls', noop)
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
          if (!statsEl || !state || !global || !global.document) return;
          var cap = questionCap();
          var maxQuestions = Math.max(1, parseInt(state.maxQuestions, 10) || cap);
          var qa = Math.max(0, Math.min(maxQuestions, parseInt(state.questionsAnswered, 10) || 0));
          var ca = Math.max(0, Math.min(qa, parseInt(state.correctAnswers, 10) || 0));
          var acc = qa > 0 ? Math.round((ca / qa) * 100) : 0;
          var baseText = 'Questions: ' + qa + '/' + maxQuestions + ' | Correct: ' + ca + ' | Accuracy: ' + acc + '%';
          var computeStars = pickFn(player, 'computeStarRating', function(){ return 0; });
          var formatStars = pickFn(player, 'formatStars', function(){ return '☆☆☆'; });
          var getTooltip = pickFn(player, 'getStarRulesTooltip', function(){ return ''; });
          var starsCount = quizId ? computeStars(ca, qa) : 0;
          var starsText = formatStars(starsCount) || '';
          while (statsEl.firstChild) statsEl.removeChild(statsEl.firstChild);
          statsEl.appendChild(global.document.createTextNode(baseText));
          if (starsText) {
            statsEl.appendChild(global.document.createTextNode(' | '));
            var span = global.document.createElement('span');
            span.className = 'stats-stars';
            span.textContent = starsText;
            var tip = getTooltip();
            if (tip) {
              span.title = tip;
              try {
                var label = 'Completion stars';
                if (common && common.i18n && common.i18n.statsStarsAriaLabel) label = common.i18n.statsStarsAriaLabel;
                span.setAttribute('aria-label', label);
              } catch (_) {}
            }
            statsEl.appendChild(span);
          }
        } catch (_) {}
      })
    },

    composite: {
      combineSources: pickFn(composite, 'combineSources', fallbackCombineSources),
      createBuilder: pickFn(composite, 'createBuilder', fallbackCreateCompositeBuilder)
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
    getQuizPhoneticLocale: phonetics.getQuizLocale,
    setQuizPhoneticLocale: phonetics.setQuizLocale,
    getCanonicalPhonetic: phonetics.getCanonicalPhonetic,
    getPhoneticForLocale: phonetics.getPhoneticForLocale,
    getDisplayPhonetic: phonetics.getDisplayPhonetic,
    getPhoneticBundle: phonetics.getPhoneticBundle
    ,
    // latest attempt
    getLatestAttempt: player.getLatestAttempt
  };
})(window);
