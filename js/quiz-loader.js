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

  function showNotFound(quizId) {
    const handler = metaHelpers && metaHelpers.showNotFound;
    if (typeof handler === 'function') {
      try {
        Utils.ErrorHandler.safe(handler).call(metaHelpers, quizId);
        return;
      } catch (err) {
        Utils.logError(err, 'quiz-loader.js: showNotFound');
      }
    }
    try {
      const safeSetText = Utils.ErrorHandler.safe(Utils.setText);
      safeSetText('page-title', 'Quiz not found');
      safeSetText('page-subtitle', 'Unknown quiz: ' + (quizId || ''));
    } catch (_) {}
  }

  function applyQuizMetadata(meta, quizId) {
    const handler = metaHelpers && metaHelpers.applyQuizMetadata;
    if (typeof handler === 'function') {
      try {
        Utils.ErrorHandler.safe(handler).call(metaHelpers, meta || {}, quizId);
        return;
      } catch (err) {
        Utils.logError(err, 'quiz-loader.js: applyQuizMetadata');
        return;
      }
    }
    Utils.logError(new Error('ui.meta.applyQuizMetadata missing'), 'quiz-loader.js: applyQuizMetadata fallback');
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
        let builder = QuizBuilders[quizId];
        if (!builder && meta) {
          const registerComposite = (typeof QuizBuilders.registerComposite === 'function') ? QuizBuilders.registerComposite : null;
          if (registerComposite && (Array.isArray(meta.compositeOf) || (meta.composite && meta.composite.sources))) {
            const compositeConfig = Object.assign({}, meta.composite || {});
            if (!compositeConfig.sources && Array.isArray(meta.compositeOf)) {
              compositeConfig.sources = meta.compositeOf.slice();
            }
            if (!compositeConfig.answerKey && typeof meta.compositeAnswerKey === 'string') {
              compositeConfig.answerKey = meta.compositeAnswerKey;
            }
            builder = registerComposite(quizId, compositeConfig) || builder;
          }
        }
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
