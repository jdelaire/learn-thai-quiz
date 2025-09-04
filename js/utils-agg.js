(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  var err = (NS.core && NS.core.error) || {};
  var common = (NS.util && NS.util.common) || {};
  var color = (NS.util && NS.util.color) || {};
  var coreFetch = (NS.core && NS.core.fetch) || {};
  var ui = (NS.ui && NS.ui.renderers) || {};
  var prog = (NS.quiz && NS.quiz.progressive) || {};
  var factories = (NS.quiz && NS.quiz.factories) || {};
  var player = (NS.quiz && NS.quiz.player) || {};

  global.Utils = {
    // Storage service re-export
    Storage: global.StorageService || null,

    // fetch
    fetchJSON: coreFetch.fetchJSON,
    fetchJSONCached: coreFetch.fetchJSONCached,
    fetchJSONs: coreFetch.fetchJSONs,

    // common utils
    pickRandom: common.pickRandom,
    pickUniqueChoices: common.pickUniqueChoices,
    setText: common.setText,
    byProp: common.byProp,
    i18n: common.i18n,
    getBodyClass: common.getBodyClass,
    defaultElements: common.defaultElements,

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
    getXPProgressPercentage: player.getXPProgressPercentage
  };
})(window);

