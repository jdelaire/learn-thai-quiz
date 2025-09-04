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
        // Map categories to a default body class; allow overrides via metadata
        var cls = (meta && meta.bodyClass) || Utils.getBodyClass(quizId);
        if (cls) document.body.classList.add(cls);
        // Always add a generic per-quiz class as a fallback (e.g., foods -> foods-quiz)
        try {
          if (quizId) {
            document.body.classList.add(quizId + '-quiz');
            document.body.dataset.quizId = quizId;
          }
        } catch (e) {}

        // Add per-quiz pro tips, prefer metadata if provided
        try {
          if (meta && meta.proTip) {
            Utils.insertProTip(meta.proTip);
          } else {
             if (quizId === 'vowels') {
              // Friendly note specific to vowel shaping
              try {
                const symbolAnchor = document.getElementById('symbol');
                if (symbolAnchor && !document.querySelector('.vowel-note')) {
                  const tip = document.createElement('div');
                  tip.className = 'vowel-note';
                  tip.setAttribute('role', 'note');
                  tip.textContent = 'Note: The consonant ก (goo gai) may appear as a placeholder to show where the vowel attaches; it is not part of the answer.';
                  symbolAnchor.insertAdjacentElement('afterend', tip);
                }
              } catch (e) {}
            }
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
