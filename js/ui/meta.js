(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.ui = NS.ui || {};
  var logError = (NS.core && NS.core.error && NS.core.error.logError) || function(){};

  function showNotFound(quizId) {
    try {
      var Utils = global.Utils || {};
      var setText = (Utils && Utils.setText) || function(id, text){ try { var el = document.getElementById(id); if (el) el.textContent = text || ''; } catch (_) {} };
      setText('page-title', 'Quiz not found');
      setText('page-subtitle', 'Unknown quiz: ' + (quizId || ''));
    } catch (e) { logError(e, 'ui.meta.showNotFound'); }
  }

  function applyQuizMetadata(meta, quizId) {
    try {
      meta = meta || {};
      var Utils = global.Utils || {};
      // Title + header
      try { document.title = (meta.title || 'ThaiQuest') + ' — ThaiQuest'; } catch (_) {}
      try { (Utils.setText || function(){})('page-title', meta.title || 'ThaiQuest'); } catch (_) {}
      try { (Utils.setText || function(){})('page-subtitle', meta.description || ''); } catch (_) {}

      // Meta description
      try {
        var metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.setAttribute('name', 'description'); document.head.appendChild(metaDesc); }
        metaDesc.setAttribute('content', meta.description || 'ThaiQuest quiz: practice Thai with interactive, accessible quizzes.');
      } catch (_) {}

      // Body classes + dataset
      try { if (meta.bodyClass) document.body.classList.add(meta.bodyClass); } catch (_) {}
      try {
        if (quizId) {
          document.body.classList.add(quizId + '-quiz');
          document.body.dataset.quizId = quizId;
          document.body.dataset.voiceSupported = (meta && meta.supportsVoice) ? '1' : '0';
        }
      } catch (_) {}

      // Pro tip
      try { if (meta.proTip && Utils.insertProTip) Utils.insertProTip(meta.proTip); } catch (_) {}

      // Symbol note after #symbol
      try {
        if (meta.symbolNote) {
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
        }
      } catch (_) {}
    } catch (e) { logError(e, 'ui.meta.applyQuizMetadata'); }
  }

  NS.ui.meta = { applyQuizMetadata: applyQuizMetadata, showNotFound: showNotFound };
})(window);

