(function(global){
  'use strict';
  function assert(name, value) {
    if (!value) {
      throw new Error('[ThaiQuest] Missing required global: ' + name);
    }
  }
  try {
    assert('StorageService', global.StorageService);
    // Utils and ThaiQuiz are initialized later in the page; assert their presence when used
  } catch (e) { if (global && global.console && console.error) { console.error(e); } throw e; }
})(window);

