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

  function setText(id, text) {
    Utils.ErrorHandler.safe(Utils.setText)(id, text);
  }

  function initFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      const quizId = params.get('quiz') || '';
      if (!quizId) {
        setText('page-title', 'Quiz not found');
        setText('page-subtitle', 'Unknown quiz: ' + quizId);
        return;
      }

      // Load metadata from data/quizzes.json to drive page chrome
      Utils.fetchJSONCached('data/quizzes.json').then(function(list){
        const meta = (Array.isArray(list) ? list : []).find(function(it){ return it && it.id === quizId; }) || null;
        if (!meta) {
          setText('page-title', 'Quiz not found');
          setText('page-subtitle', 'Unknown quiz: ' + quizId);
          return;
        }

        document.title = (meta.title || 'ThaiQuest') + ' — ThaiQuest';
        setText('page-title', meta.title || 'ThaiQuest');
        setText('page-subtitle', meta.description || '');
        try {
          var metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', meta.description || 'ThaiQuest quiz: practice Thai with interactive, accessible quizzes.');
        } catch (e) {}
        // Body class lives in data/quizzes.json so metadata stays the single source of truth
        var cls = meta && meta.bodyClass;
        if (cls) document.body.classList.add(cls);
        // Always add a generic per-quiz class as a fallback (e.g., foods -> foods-quiz)
        try {
          if (quizId) {
            document.body.classList.add(quizId + '-quiz');
            document.body.dataset.quizId = quizId;
          }
        } catch (e) {}

        // Add per-quiz pro tips and optional symbol notes from metadata
        try {
          if (meta && meta.proTip) {
            Utils.insertProTip(meta.proTip);
          }
          if (meta && meta.symbolNote) {
            try {
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
            } catch (e) {}
          }
        } catch (e) {}

        // Build and start the selected quiz
        const builder = QuizBuilders[quizId];
        if (!builder) {
          // Fallback: try to load data/<quizId>.json as a standard quiz dataset
          try {
            Utils.fetchJSONCached('data/' + quizId + '.json').then(function(data){
              if (!Array.isArray(data) || data.length === 0) {
                setText('page-title', 'Quiz not found');
                setText('page-subtitle', 'Unknown quiz: ' + quizId);
                return;
              }
              try {
                ThaiQuiz.setupQuiz(Object.assign({ elements: defaultElements, quizId: quizId }, Utils.createQuizWithProgressiveDifficulty({
                  data: data
                })));
              } catch (e) { handleDataLoadError(e); }
            }).catch(function(){
              setText('page-title', 'Quiz not found');
              setText('page-subtitle', 'Unknown quiz: ' + quizId);
            });
          } catch (e) {
            setText('page-title', 'Quiz not found');
            setText('page-subtitle', 'Unknown quiz: ' + quizId);
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
