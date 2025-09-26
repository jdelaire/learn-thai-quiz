(function(global){
  'use strict';
  function assert(name, value) {
    if (!value) {
      throw new Error('[ThaiQuest] Missing required global: ' + name);
    }
  }
  try {
    assert('StorageService', global.StorageService);
    var root = global.__TQ = global.__TQ || {};
    var quizNs = root.quiz = root.quiz || {};
    var config = quizNs.config = quizNs.config || {};
    var getCap = function(){
      return Math.max(1, parseInt(config.QUESTION_CAP, 10) || 100);
    };
    config.QUESTION_CAP = getCap();
    config.getQuestionCap = getCap;
    root.getQuestionCap = getCap;
    // Utils and ThaiQuiz are initialized later in the page; assert their presence when used
  } catch (e) { if (global && global.console && console.error) { console.error(e); } throw e; }
})(window);
