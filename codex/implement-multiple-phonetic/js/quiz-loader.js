(function() {
  'use strict';

  const defaultElements = Utils.defaultElements;

  function handleDataLoadError(err) {
    const fb = document.getElementById('feedback');
    if (fb) {
      let msg = 'Failed to load data.';
      if (window.location.protocol === 'file:') {
        msg += ' Open this site via a local server (e.g., python3 -m http.server) so JSON files can be fetched.';
      }
      fb.textContent = msg;
    }
    Utils.logError(err, 'quiz-loader.js: handleDataLoadError');
  }

  // Builders are provided by js/builders/index.js and exposed on window.QuizBuilders
  const QuizBuilders = (window.QuizBuilders || {});
  const metaHelpers = (function(){
    try {
      const ns = window.__TQ;
      if (!ns || !ns.ui || !ns.ui.meta) return null;
      return ns.ui.meta;
    } catch (_) {
      return null;
    }
  })();

  function setText(id, text) {
    Utils.ErrorHandler.safe(Utils.setText)(id, text);
  }

  function fallbackShowNotFound(quizId) {
    try {
      setText('page-title', 'Quiz not found');
      setText('page-subtitle', 'Unknown quiz: ' + (quizId || ''));
    } catch (_) {}
  }

  function showNotFound(quizId) {
    if (metaHelpers && typeof metaHelpers.showNotFound === 'function') {
      try {
        metaHelpers.showNotFound(quizId);
        return;
      } catch (err) {
        Utils.logError(err, 'quiz-loader.js: showNotFound');
      }
    }
    fallbackShowNotFound(quizId);
  }

  function fallbackApplyQuizMetadata(meta, quizId) {
    try {
      document.title = (meta.title || 'ThaiQuest') + ' — ThaiQuest';
    } catch (_) {}
    try { setText('page-title', meta.title || 'ThaiQuest'); } catch (_) {}
    try { setText('page-subtitle', meta.description || ''); } catch (_) {}
    try {
      var metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', meta.description || 'ThaiQuest quiz: practice Thai with interactive, accessible quizzes.');
    } catch (_) {}
    try {
      if (meta && meta.bodyClass) document.body.classList.add(meta.bodyClass);
    } catch (_) {}
    try {
      if (quizId) {
        document.body.classList.add(quizId + '-quiz');
        document.body.dataset.quizId = quizId;
        try { document.body.dataset.voiceSupported = (meta && meta.supportsVoice) ? '1' : '0'; } catch (_) {}
      }
    } catch (_) {}
    try {
      if (meta && meta.proTip) Utils.insertProTip(meta.proTip);
    } catch (_) {}
    try {
      if (meta && meta.symbolNote) {
        const anchor = document.getElementById('symbol');
        if (anchor && !document.querySelector('.quiz-symbol-note')) {
          const note = document.createElement('div');
          var cls = 'quiz-symbol-note';
          if (meta.symbolNoteClass) cls += ' ' + meta.symbolNoteClass;
          note.className = cls;
          note.setAttribute('role', meta.symbolNoteRole || 'note');
          note.textContent = meta.symbolNote;
          anchor.insertAdjacentElement('afterend', note);
        }
      }
    } catch (_) {}
  }

  function applyQuizMetadata(meta, quizId) {
    if (metaHelpers && typeof metaHelpers.applyQuizMetadata === 'function') {
      try {
        metaHelpers.applyQuizMetadata(meta, quizId);
        return;
      } catch (err) {
        Utils.logError(err, 'quiz-loader.js: applyQuizMetadata');
      }
    }
    fallbackApplyQuizMetadata(meta || {}, quizId);
  }

  function initFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      const quizId = params.get('quiz') || '';
      if (!quizId) { showNotFound(quizId); return; }

      // Load metadata from data/quizzes.json to drive page chrome
      Utils.fetchJSONCached('data/quizzes.json').then(function(list){
        const meta = (Array.isArray(list) ? list : []).find(function(it){ return it && it.id === quizId; }) || null;
        if (!meta) { showNotFound(quizId); return; }

        applyQuizMetadata(meta, quizId);

        // Build and start the selected quiz
        const builder = QuizBuilders[quizId];
        if (!builder) {
          // Fallback: try to load data/<quizId>.json as a standard quiz dataset
          try {
            Utils.fetchJSONCached('data/' + quizId + '.json').then(function(data){
              if (!Array.isArray(data) || data.length === 0) { showNotFound(quizId); return; }
              try {
                ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: quizId }, Utils.createQuizWithProgressiveDifficulty({
                  data: data
                })));
              } catch (e) { handleDataLoadError(e); }
            }).catch(function(){ showNotFound(quizId); });
          } catch (e) {
            showNotFound(quizId);
          }
          return;
        }
        builder().then(function(initFn){
          Utils.ErrorHandler.wrap(initFn, 'quiz-loader.js: initFn', null)();
        }).catch(function(err){ handleDataLoadError(err); });
      }).catch(function(err){ handleDataLoadError(err); });
    } catch (e) {
      // no-op
    }
  }

  // Start
  initFromQuery();
})();
