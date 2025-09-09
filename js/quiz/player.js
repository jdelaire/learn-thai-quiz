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

  // Generate a Thai temple SVG avatar that grows in scale and detail with level
  function generateDynamicAvatarDataURI(level, progressPercent, displayName) {
    try {
      var L = Math.max(1, parseInt(level, 10) || 1);
      var progress = Math.min(100, Math.max(0, parseInt(progressPercent, 10) || 0));
      var parts = [];

      // Derived values
      var detail = Math.min(1, (L - 1) / 50); // 0..1
      var tiers = Math.min(6, 1 + Math.floor((L - 1) / 5));
      var steps = Math.min(4, 1 + Math.floor(L / 10));
      var scale = 0.85 + 0.35 * Math.min(1, L / 50);

      // Colors
      var GOLD = '#FFD54F';
      var GOLD_DARK = '#C9A131';
      var RED = '#A51931';
      var RED_DARK = '#7F1526';
      var WHITE = '#ffffff';
      var STONE = '#f2efe6';
      var STONE_DARK = '#d9d2c0';
      var SKY_TOP = '#e7f3ff';
      var SKY_BOTTOM = '#ffffff';
      var GREEN = '#e6f3ea';

      parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 100" role="img" aria-label="Thai temple avatar level ' + L + '">');
      parts.push('<defs>');
      parts.push('<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">');
      parts.push('<stop offset="0%" stop-color="' + SKY_TOP + '"/>');
      parts.push('<stop offset="100%" stop-color="' + SKY_BOTTOM + '"/>');
      parts.push('</linearGradient>');
      parts.push('<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">');
      parts.push('<stop offset="0%" stop-color="' + GOLD + '"/>');
      parts.push('<stop offset="100%" stop-color="' + GOLD_DARK + '"/>');
      parts.push('</linearGradient>');
      parts.push('</defs>');

      // Background sky and subtle sun that grows with XP progress
      parts.push('<rect x="0" y="0" width="100" height="100" fill="url(#sky)"/>');
      var sunR = 6 + Math.round(10 * (progress / 100));
      parts.push('<circle cx="82" cy="18" r="' + sunR + '" fill="' + GOLD + '" opacity="' + (0.35 + 0.25 * detail) + '"/>');

      // Ground
      parts.push('<rect x="0" y="86" width="100" height="14" fill="' + GREEN + '"/>');

      // Temple group scales with level
      parts.push('<g transform="translate(50,86) scale(' + scale + ') translate(-50,-86)">');

      // Platform steps (stone)
      for (var si = 0; si < steps; si++) {
        var sw = 64 + si * 10;
        var sy = 86 + si * 3;
        var sx = 50 - sw / 2;
        parts.push('<rect x="' + sx + '" y="' + sy + '" width="' + sw + '" height="3" fill="' + STONE + '" stroke="' + STONE_DARK + '" stroke-width="0.5"/>');
      }

      // Base podium
      var podiumW = 58;
      var podiumH = 10;
      parts.push('<rect x="' + (50 - podiumW / 2) + '" y="' + (86 - podiumH) + '" width="' + podiumW + '" height="' + podiumH + '" rx="1.2" fill="' + WHITE + '" stroke="' + STONE_DARK + '" stroke-width="0.6"/>');

      // Columned hall (ubosot-like)
      var hallW = 52;
      var hallH = 18 + Math.round(6 * detail);
      var hallX = 50 - hallW / 2;
      var hallY = 86 - podiumH - hallH;
      parts.push('<rect x="' + hallX + '" y="' + hallY + '" width="' + hallW + '" height="' + hallH + '" fill="' + WHITE + '" stroke="#c9c1ae" stroke-width="0.6"/>');

      // Columns increase with level
      var colCount = Math.min(6, 2 + Math.floor(L / 8));
      for (var ci = 0; ci < colCount; ci++) {
        var cx = hallX + 6 + (ci * (hallW - 12)) / (colCount - 1);
        parts.push('<rect x="' + (cx - 1.2) + '" y="' + (hallY + 2) + '" width="2.4" height="' + (hallH - 4) + '" fill="' + WHITE + '" stroke="#d5ccb7" stroke-width="0.6"/>');
        if (detail > 0.35) {
          parts.push('<rect x="' + (cx - 2.2) + '" y="' + (hallY + 1) + '" width="4.4" height="1.6" fill="url(#gold)" opacity="0.9"/>');
          parts.push('<rect x="' + (cx - 2.2) + '" y="' + (hallY + hallH - 2.6) + '" width="4.4" height="1.6" fill="url(#gold)" opacity="0.9"/>');
        }
      }

      // Windows (appear gradually)
      var winRows = detail > 0.65 ? 2 : 1;
      var winsPerRow = Math.min(5, 2 + Math.floor(L / 12));
      for (var wr = 0; wr < winRows; wr++) {
        for (var wi = 0; wi < winsPerRow; wi++) {
          var wx = hallX + 8 + (wi * (hallW - 16)) / (winsPerRow - 1);
          var wy = hallY + 4 + wr * 6;
          parts.push('<rect x="' + (wx - 1.5) + '" y="' + wy + '" width="3" height="5" rx="0.6" fill="#f7e7c5" stroke="#caa94c" stroke-width="0.5" opacity="' + (0.45 + 0.35 * detail) + '"/>');
        }
      }

      // Roof tiers (red with golden eaves)
      var roofBaseY = hallY - 2;
      for (var r = 0; r < tiers; r++) {
        var rw = 66 - r * 8;
        var rh = 6;
        var rx = 50 - rw / 2;
        var ry = roofBaseY - r * 7;
        parts.push('<rect x="' + rx + '" y="' + ry + '" width="' + rw + '" height="' + rh + '" fill="' + RED + '" stroke="' + RED_DARK + '" stroke-width="0.7"/>');
        parts.push('<rect x="' + (rx + 2) + '" y="' + (ry + rh - 2) + '" width="' + (rw - 4) + '" height="2" fill="url(#gold)" opacity="0.95"/>');

        // Subtle gable highlight
        if (r === tiers - 1) {
          parts.push('<polygon points="' + 50 + ',' + (ry - 4) + ' ' + (rx + 5) + ',' + (ry + 1) + ' ' + (rx + rw - 5) + ',' + (ry + 1) + '" fill="url(#gold)" opacity="' + (0.6 + 0.3 * detail) + '"/>');
        }

        // Chofah-like tips (appear at higher detail)
        if (detail > 0.5) {
          parts.push('<polygon points="' + (rx - 3) + ',' + (ry + 2) + ' ' + (rx + 2) + ',' + (ry + 1) + ' ' + (rx + 2) + ',' + (ry + 3) + '" fill="url(#gold)"/>');
          parts.push('<polygon points="' + (rx + rw + 3) + ',' + (ry + 2) + ' ' + (rx + rw - 2) + ',' + (ry + 1) + ' ' + (rx + rw - 2) + ',' + (ry + 3) + '" fill="url(#gold)"/>');
        }
      }

      // Central spire grows with level
      var topY = roofBaseY - (tiers - 1) * 7;
      var spireH = 8 + Math.round(16 * detail);
      parts.push('<polygon points="' + 50 + ',' + (topY - spireH) + ' ' + 46 + ',' + (topY + 1) + ' ' + 54 + ',' + (topY + 1) + '" fill="url(#gold)" stroke="' + GOLD_DARK + '" stroke-width="0.6"/>');
      if (detail > 0.75) {
        parts.push('<circle cx="50" cy="' + (topY - spireH - 2) + '" r="1.5" fill="url(#gold)"/>');
      }

      // Side shrines appear later
      if (detail > 0.4) {
        var sW = 12;
        var sH = 10;
        var sY = hallY + 4;
        parts.push('<rect x="' + (hallX - sW - 2) + '" y="' + sY + '" width="' + sW + '" height="' + sH + '" fill="' + WHITE + '" stroke="#c9c1ae" stroke-width="0.6"/>');
        parts.push('<rect x="' + (hallX + hallW + 2) + '" y="' + sY + '" width="' + sW + '" height="' + sH + '" fill="' + WHITE + '" stroke="#c9c1ae" stroke-width="0.6"/>');
        parts.push('<rect x="' + (hallX - sW - 1) + '" y="' + (sY - 3) + '" width="' + (sW + 2) + '" height="3" fill="' + RED + '"/>');
        parts.push('<rect x="' + (hallX + hallW - 1) + '" y="' + (sY - 3) + '" width="' + (sW + 2) + '" height="3" fill="' + RED + '"/>');
      }

      // Level badge (subtle) in the corner
      var badge = String(Math.min(99, Math.max(1, L)));
      parts.push('<g transform="translate(72,74)">');
      parts.push('<rect x="0" y="0" width="20" height="12" rx="2" fill="#111" opacity="0.7"/>');
      parts.push('<rect x="1.5" y="1.5" width="17" height="2.5" fill="' + RED + '" opacity="0.9"/>');
      parts.push('<rect x="1.5" y="4.5" width="17" height="2.5" fill="' + WHITE + '" opacity="0.9"/>');
      parts.push('<rect x="1.5" y="7.5" width="17" height="2.5" fill="#00247D" opacity="0.9"/>');
      if (badge.length === 1) {
        parts.push('<circle cx="10" cy="6" r="2" fill="#fff"/>');
      } else {
        parts.push('<rect x="6.5" y="5" width="2" height="2" fill="#fff"/>');
        parts.push('<rect x="11.5" y="5" width="2" height="2" fill="#fff"/>');
      }
      parts.push('</g>');

      parts.push('</g>'); // end scaled temple group
      parts.push('</svg>');
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(parts.join(''));
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
      try { StorageService.setNumber('thaiQuest.lastAttempt.' + quizId, Date.now()); } catch (_) {}
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
      try {
        const lastKeys = StorageService.keys('thaiQuest.lastAttempt.');
        lastKeys.forEach(function(k){ try { StorageService.removeItem(k); } catch (_) {} });
      } catch (_) {}
      try { StorageService.removeItem('thaiQuestCustomName'); } catch (_) {}
    } catch (e) { logError(e, 'quiz.player.resetAllProgress'); }
  }

  function getStarRulesTooltip() {
    return 'Star rules: 3★ = 100 right with >95% accuracy; 2★ = 100 right with >85% accuracy; 1★ = 100 right with >75% accuracy; 0★ otherwise.';
  }

  function getLatestAttempt() {
    try {
      const prefix = 'thaiQuest.lastAttempt.';
      const keys = (StorageService && StorageService.keys && StorageService.keys(prefix)) || [];
      let bestQuizId = null;
      let bestMs = 0;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const qid = k.substring(prefix.length);
        try {
          const ms = StorageService.getNumber(k, 0);
          if (ms > bestMs) { bestMs = ms; bestQuizId = qid; }
        } catch (_) {}
      }
      if (bestQuizId) return { quizId: bestQuizId, lastAttemptMs: bestMs };

      // Fallback: if no timestamps yet, pick any quiz with progress, highest questionsAnswered
      try {
        const progress = getAllSavedProgress();
        const withProgress = progress.filter(function(p){ return (p && p.questionsAnswered) > 0; });
        if (withProgress.length) {
          withProgress.sort(function(a, b){ return (b.questionsAnswered || 0) - (a.questionsAnswered || 0); });
          return { quizId: withProgress[0].quizId, lastAttemptMs: 0 };
        }
      } catch (_) {}
      return null;
    } catch (e) { logError(e, 'quiz.player.getLatestAttempt'); return null; }
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
    getXPProgressPercentage: getXPProgressPercentage,
    // dev helpers for previews
    generateAvatar: generateDynamicAvatarDataURI,
    // latest attempt
    getLatestAttempt: getLatestAttempt
  };
})(window);

