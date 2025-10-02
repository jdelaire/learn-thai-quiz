(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};
  var logError = (NS.core && NS.core.error && NS.core.error.logError) || function(){};

  function getUtils() {
    try { return global.Utils || {}; } catch (_) { return {}; }
  }

  function safeSetText(id, text) {
    var value = (typeof text === 'string') ? text : (text || '');
    var Utils = getUtils();
    try {
      if (Utils && typeof Utils.setText === 'function') {
        Utils.setText(id, value);
        return;
      }
    } catch (_) {}
    try {
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    } catch (_) {}
  }

  function ensureMetaDescription(description) {
    try {
      var metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description || 'ThaiQuest quiz: practice Thai with interactive, accessible quizzes.');
    } catch (_) {}
  }

  function applyBodyMetadata(meta, quizId) {
    try {
      if (meta.bodyClass) document.body.classList.add(meta.bodyClass);
    } catch (_) {}

    if (!quizId) return;

    try { document.body.classList.add(quizId + '-quiz'); } catch (_) {}

    try { document.body.dataset.quizId = quizId; } catch (_) {}

    try { document.body.dataset.voiceSupported = meta.supportsVoice ? '1' : '0'; } catch (_) {}

    try {
      document.body.dataset.phoneticsSupported = meta.supportsPhonetics ? '1' : '0';
      if (meta.supportsPhonetics && meta.phoneticLocales && meta.phoneticLocales.length) {
        document.body.dataset.phoneticLocales = meta.phoneticLocales.join(',');
      } else {
        try { delete document.body.dataset.phoneticLocales; } catch (_) { document.body.dataset.phoneticLocales = ''; }
      }
    } catch (_) {}
  }

  function insertProTip(meta) {
    if (!meta.proTip) return;
    var Utils = getUtils();
    try {
      if (Utils && typeof Utils.insertProTip === 'function') {
        Utils.insertProTip(meta.proTip);
      }
    } catch (_) {}
  }

  function ensureSymbolNote(meta) {
    if (!meta.symbolNote) return;
    try {
      var anchor = document.getElementById('symbol');
      if (anchor && !document.querySelector('.quiz-symbol-note')) {
        var note = document.createElement('div');
        var cls = 'quiz-symbol-note';
        if (meta.symbolNoteClass) cls += ' ' + meta.symbolNoteClass;
        note.className = cls;
        note.setAttribute('role', meta.symbolNoteRole || 'note');
        note.textContent = meta.symbolNote;
        anchor.insertAdjacentElement('afterend', note);
      }
    } catch (_) {}
  }

  function showNotFound(quizId) {
    try {
      safeSetText('page-title', 'Quiz not found');
      safeSetText('page-subtitle', 'Unknown quiz: ' + (quizId || ''));
    } catch (e) { logError(e, 'ui.meta.showNotFound'); }
  }

  function applyQuizMetadata(meta, quizId) {
    try {
      meta = meta || {};

      try { document.title = (meta.title || 'ThaiQuest') + ' — ThaiQuest'; } catch (_) {}

      safeSetText('page-title', meta.title || 'ThaiQuest');
      safeSetText('page-subtitle', meta.description || '');

      ensureMetaDescription(meta.description);
      applyBodyMetadata(meta, quizId);
      insertProTip(meta);
      ensureSymbolNote(meta);
    } catch (e) { logError(e, 'ui.meta.applyQuizMetadata'); }
  }

  NS.ui.meta = { applyQuizMetadata: applyQuizMetadata, showNotFound: showNotFound };
})(window);
