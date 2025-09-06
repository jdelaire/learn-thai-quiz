(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.quiz = NS.quiz || {};
  var error = (NS.core && NS.core.error) || {};
  var logError = error.logError || function(){};
  var StorageService = global.StorageService;

  function generatePlayerID() {
    try {
      let playerID = StorageService && StorageService.getItem('thaiQuestPlayerID');
      if (!playerID) {
        const fingerprint = [
          navigator.userAgent,
          navigator.language,
          screen.width + 'x' + screen.height,
          new Date().getTimezoneOffset(),
          navigator.hardwareConcurrency || 'unknown',
          navigator.platform,
          navigator.cookieEnabled ? 'cookies' : 'no-cookies'
        ].join('|');
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        const hashStr = Math.abs(hash).toString(36).toUpperCase();
        playerID = 'Player_' + hashStr;
        if (StorageService) StorageService.setItem('thaiQuestPlayerID', playerID);
      }
      return playerID;
    } catch (e) { logError(e, 'quiz.player.generatePlayerID'); return 'Player_' + Date.now() + '_' + Math.floor(Math.random() * 1000); }
  }

  function getPlayerDisplayName() {
    try {
      const customName = StorageService && StorageService.getItem('thaiQuestCustomName');
      if (customName && customName.trim()) return customName.trim();
      return generatePlayerID();
    } catch (e) { logError(e, 'quiz.player.getPlayerDisplayName'); return generatePlayerID(); }
  }

  function setPlayerCustomName(name) {
    try {
      const trimmedName = (name || '').trim();
      if (!StorageService) return false;
      if (trimmedName) StorageService.setItem('thaiQuestCustomName', trimmedName);
      else StorageService.removeItem('thaiQuestCustomName');
      return true;
    } catch (e) { logError(e, 'quiz.player.setPlayerCustomName'); return false; }
  }

  function getPlayerCustomName() {
    try {
      const customName = StorageService && StorageService.getItem('thaiQuestCustomName');
      return customName && customName.trim() ? customName.trim() : null;
    } catch (e) { logError(e, 'quiz.player.getPlayerCustomName'); return null; }
  }

  const XP_CURVE = { A: 80, p: 1.9 };
  function xpTotalForLevel(levelIndex) { try { const L = Math.max(0, parseInt(levelIndex, 10) || 0); return XP_CURVE.A * Math.pow(L, XP_CURVE.p); } catch (e) { logError(e, 'quiz.player.xpTotalForLevel'); return 0; } }
  function xpDeltaForLevel(levelIndex) { try { const L = Math.max(0, parseInt(levelIndex, 10) || 0); return xpTotalForLevel(L + 1) - xpTotalForLevel(L); } catch (e) { logError(e, 'quiz.player.xpDeltaForLevel'); return XP_CURVE.A; } }
  function getXPForStars(stars) { try { const n = Math.max(0, Math.min(3, parseInt(stars, 10) || 0)); if (n === 3) return 40; if (n === 2) return 20; if (n === 1) return 10; return 0; } catch (e) { logError(e, 'quiz.player.getXPForStars'); return 0; } }

  function getAllSavedProgress() {
    try {
      const entries = [];
      const keys = (StorageService && StorageService.keys && StorageService.keys('thaiQuest.progress.')) || [];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const quizId = key.substring('thaiQuest.progress.'.length);
        try {
          const data = StorageService.getJSON(key, {});
          const norm = (StorageService.validate && StorageService.validate.ensureProgressShape) ? StorageService.validate.ensureProgressShape(data) : { questionsAnswered: 0, correctAnswers: 0 };
          entries.push({ quizId: quizId, questionsAnswered: Math.max(0, parseInt(norm.questionsAnswered, 10) || 0), correctAnswers: Math.max(0, parseInt(norm.correctAnswers, 10) || 0) });
        } catch (_) {}
      }
      return entries;
    } catch (e) { logError(e, 'quiz.player.getAllSavedProgress'); return []; }
  }

  function aggregateGlobalStatsFromStorage() {
    try {
      const progressEntries = getAllSavedProgress();
      let totalQuestionsAnswered = 0, totalCorrectAnswers = 0, quizzesCompleted = 0, totalStarsEarned = 0, totalXPFromStars = 0;
      for (let i = 0; i < progressEntries.length; i++) {
        const p = progressEntries[i];
        totalQuestionsAnswered += p.questionsAnswered;
        totalCorrectAnswers += p.correctAnswers;
        if (p.correctAnswers >= 100) quizzesCompleted += 1;
        try { const s = computeStarRating(p.correctAnswers, p.questionsAnswered); totalStarsEarned += s; totalXPFromStars += getXPForStars(s); } catch (_) {}
      }
      const totalAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0;
      return { totalQuestionsAnswered: totalQuestionsAnswered, totalCorrectAnswers: totalCorrectAnswers, totalAccuracy: totalAccuracy, quizzesCompleted: quizzesCompleted, totalStarsEarned: totalStarsEarned, totalXPFromStars: totalXPFromStars };
    } catch (e) { logError(e, 'quiz.player.aggregateGlobalStatsFromStorage'); return { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, totalAccuracy: 0, quizzesCompleted: 0, totalStarsEarned: 0, totalXPFromStars: 0 }; }
  }

  function getLevelIndexFromTotalXP(totalXP) { try { const x = Math.max(0, Number(totalXP) || 0); const L = Math.floor(Math.pow(x / XP_CURVE.A, 1 / XP_CURVE.p)); return Math.max(0, L); } catch (e) { logError(e, 'quiz.player.getLevelIndexFromTotalXP'); return 0; } }
  function getPlayerLevel() { try { const totalXP = getTotalXPFromStars(); const levelIndex = getLevelIndexFromTotalXP(totalXP); return levelIndex + 1; } catch (e) { logError(e, 'quiz.player.getPlayerLevel'); return 1; } }
  function getPlayerXP() { try { const totalXP = getTotalXPFromStars(); const levelIndex = getLevelIndexFromTotalXP(totalXP); const base = xpTotalForLevel(levelIndex); return Math.max(0, Math.round(totalXP - base)); } catch (e) { logError(e, 'quiz.player.getPlayerXP'); return 0; } }
  function getPlayerMaxXP() { try { const totalXP = getTotalXPFromStars(); const levelIndex = getLevelIndexFromTotalXP(totalXP); return Math.max(1, Math.round(xpDeltaForLevel(levelIndex))); } catch (e) { logError(e, 'quiz.player.getPlayerMaxXP'); return Math.max(1, Math.round(XP_CURVE.A)); } }
  function getTotalXPFromStars() { try { const agg = aggregateGlobalStatsFromStorage(); return agg.totalXPFromStars; } catch (e) { logError(e, 'quiz.player.getTotalXPFromStars'); return 0; } }
  function getPlayerAccuracy() { try { const agg = aggregateGlobalStatsFromStorage(); return agg.totalAccuracy; } catch (e) { logError(e, 'quiz.player.getPlayerAccuracy'); return 0; } }
  function getQuizzesCompleted() { try { const agg = aggregateGlobalStatsFromStorage(); return agg.quizzesCompleted; } catch (e) { logError(e, 'quiz.player.getQuizzesCompleted'); return 0; } }
  function getTotalStarsEarned() { try { const agg = aggregateGlobalStatsFromStorage(); return agg.totalStarsEarned; } catch (e) { logError(e, 'quiz.player.getTotalStarsEarned'); return 0; } }

  // Generate a dynamic SVG avatar that evolves with level and XP progress
  function generateDynamicAvatarDataURI(level, progressPercent, displayName) {
    try {
      var L = Math.max(1, parseInt(level, 10) || 1);
      var progress = Math.min(100, Math.max(0, parseInt(progressPercent, 10) || 0));
      var name = (displayName || '').trim();
      var initial = name ? (name.charAt(0) || '?') : 'P';
      // Color scheme derived from level
      var hue = (L * 47) % 360;
      var bgHue = (hue + 180) % 360;
      var ringColor = 'hsl(' + hue + ', 72%, 48%)';
      var bgColor = 'hsl(' + bgHue + ', 70%, 92%)';
      var textColor = '#111111';

      var size = 80; // px
      var cx = 40;
      var cy = 40;
      var r = 32; // inner circle radius
      var ringR = 36; // ring radius
      var ringWidth = 6;
      var circumference = 2 * Math.PI * ringR;
      var dash = Math.max(0.01, (progress / 100) * circumference);

      var tier = Math.min(5, Math.floor((L - 1) / 5));
      var shieldOpacity = (0.15 + tier * 0.07).toFixed(2);

      var svg = '' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 80 80" role="img" aria-label="Player avatar level ' + L + '">' +
        '  <defs>' +
        '    <linearGradient id="g' + hue + '" x1="0" y1="0" x2="1" y2="1">' +
        '      <stop offset="0%" stop-color="' + bgColor + '" />' +
        '      <stop offset="100%" stop-color="white" />' +
        '    </linearGradient>' +
        '  </defs>' +
        '  <circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#g' + hue + ')" />' +
        '  <circle cx="' + cx + '" cy="' + cy + '" r="' + ringR + '" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="' + ringWidth + '" />' +
        '  <g transform="rotate(-90 ' + cx + ' ' + cy + ')">' +
        '    <circle cx="' + cx + '" cy="' + cy + '" r="' + ringR + '" fill="none" stroke="' + ringColor + '" stroke-linecap="round" stroke-width="' + ringWidth + '" stroke-dasharray="' + dash + ' ' + circumference + '" />' +
        '  </g>' +
        '  <g opacity="' + shieldOpacity + '">' +
        '    <path d="M40 18 L52 28 L52 44 C52 52 46 58 40 62 C34 58 28 52 28 44 L28 28 Z" fill="' + ringColor + '" />' +
        '  </g>' +
        '  <text x="40" y="45" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="28" font-weight="800" fill="' + textColor + '">' + (initial.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')) + '</text>' +
        '  <g aria-hidden="true" opacity="0.92">' +
        '    <rect x="54" y="54" rx="6" ry="6" width="20" height="16" fill="' + ringColor + '" />' +
        '    <text x="64" y="66" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="10" font-weight="800" fill="white">' + L + '</text>' +
        '  </g>' +
        '</svg>';

      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    } catch (e) {
      logError(e, 'quiz.player.generateDynamicAvatarDataURI');
      return 'https://placehold.co/80x80/png';
    }
  }

  function getPlayerAvatar() { try { var level = getPlayerLevel(); var progress = getXPProgressPercentage(); var name = getPlayerDisplayName(); return generateDynamicAvatarDataURI(level, progress, name); } catch (e) { logError(e, 'quiz.player.getPlayerAvatar'); return 'https://placehold.co/80x80/png'; } }
  function formatNumber(num) { try { return num.toLocaleString(); } catch (_) { return String(num); } }
  function getXPProgressPercentage() { try { const currentXP = getPlayerXP(); const maxXP = getPlayerMaxXP(); return Math.min(100, Math.max(0, Math.round((currentXP / maxXP) * 100))); } catch (e) { logError(e, 'quiz.player.getXPProgressPercentage'); return 45; } }

  function getQuizProgress(quizId) {
    try {
      if (!quizId) return { questionsAnswered: 0, correctAnswers: 0 };
      const key = 'thaiQuest.progress.' + quizId;
      const data = (StorageService && StorageService.getJSON && StorageService.getJSON(key, { questionsAnswered: 0, correctAnswers: 0 })) || { questionsAnswered: 0, correctAnswers: 0 };
      const norm = (StorageService && StorageService.validate && StorageService.validate.ensureProgressShape) ? StorageService.validate.ensureProgressShape(data) : data;
      return { questionsAnswered: parseInt(norm.questionsAnswered, 10) || 0, correctAnswers: parseInt(norm.correctAnswers, 10) || 0 };
    } catch (e) { logError(e, 'quiz.player.getQuizProgress'); return { questionsAnswered: 0, correctAnswers: 0 }; }
  }

  function saveQuizProgress(quizId, stateLike) {
    try {
      if (!quizId || !StorageService) return;
      const key = 'thaiQuest.progress.' + quizId;
      const payload = { questionsAnswered: Math.max(0, parseInt(stateLike && stateLike.questionsAnswered, 10) || 0), correctAnswers: Math.max(0, parseInt(stateLike && stateLike.correctAnswers, 10) || 0) };
      StorageService.setJSON(key, payload);
    } catch (e) { logError(e, 'quiz.player.saveQuizProgress'); }
  }

  function computeStarRating(correctAnswers, questionsAnswered) {
    try {
      const c = Math.max(0, parseInt(correctAnswers, 10) || 0);
      const q = Math.max(0, parseInt(questionsAnswered, 10) || 0);
      if (c < 100) return 0;
      const acc = q > 0 ? (c / q) * 100 : 0;
      if (acc > 95) return 3; if (acc > 85) return 2; if (acc > 75) return 1; return 0;
    } catch (e) { logError(e, 'quiz.player.computeStarRating'); return 0; }
  }

  function formatStars(stars) {
    const n = Math.max(0, Math.min(3, parseInt(stars, 10) || 0));
    return '★'.repeat(n) + '☆'.repeat(3 - n);
  }

  function getQuizStars(quizId) { try { const p = getQuizProgress(quizId); return computeStarRating(p.correctAnswers, p.questionsAnswered); } catch (e) { logError(e, 'quiz.player.getQuizStars'); return 0; } }

  function resetAllProgress() {
    try {
      if (!StorageService) return;
      const toDelete = StorageService.keys('thaiQuest.progress.');
      toDelete.forEach(function(k){ try { StorageService.removeItem(k); } catch (_) {} });
      try { StorageService.removeItem('thaiQuestCustomName'); } catch (_) {}
    } catch (e) { logError(e, 'quiz.player.resetAllProgress'); }
  }

  function getStarRulesTooltip() {
    return 'Star rules: 3★ = 100 right with >95% accuracy; 2★ = 100 right with >85% accuracy; 1★ = 100 right with >75% accuracy; 0★ otherwise.';
  }

  NS.quiz.player = {
    // name/id
    generatePlayerID: generatePlayerID,
    getPlayerDisplayName: getPlayerDisplayName,
    setPlayerCustomName: setPlayerCustomName,
    getPlayerCustomName: getPlayerCustomName,
    // stars/xp/level
    XP_CURVE: XP_CURVE,
    xpTotalForLevel: xpTotalForLevel,
    xpDeltaForLevel: xpDeltaForLevel,
    getXPForStars: getXPForStars,
    getTotalXPFromStars: getTotalXPFromStars,
    getPlayerLevel: getPlayerLevel,
    getPlayerXP: getPlayerXP,
    getPlayerMaxXP: getPlayerMaxXP,
    getPlayerAccuracy: getPlayerAccuracy,
    getQuizzesCompleted: getQuizzesCompleted,
    getTotalStarsEarned: getTotalStarsEarned,
    getQuizStars: getQuizStars,
    // progress
    getAllSavedProgress: getAllSavedProgress,
    aggregateGlobalStatsFromStorage: aggregateGlobalStatsFromStorage,
    getQuizProgress: getQuizProgress,
    saveQuizProgress: saveQuizProgress,
    computeStarRating: computeStarRating,
    formatStars: formatStars,
    resetAllProgress: resetAllProgress,
    // misc ui helpers
    getPlayerAvatar: getPlayerAvatar,
    formatNumber: formatNumber,
    getXPProgressPercentage: getXPProgressPercentage
  };
})(window);

