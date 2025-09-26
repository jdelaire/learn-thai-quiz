(function(global){
  'use strict';

  function logError(error, context) {
    try {
      if (context) {
        console.error('[ThaiQuest]', context, error);
      } else {
        console.error('[ThaiQuest]', error);
      }
    } catch (_) {}
  }

  const ErrorHandler = {
    wrap: function(fn, context, fallback = null) {
      return function(){
        try {
          return fn.apply(this, arguments);
        } catch (error) {
          logError(error, context);
          return fallback;
        }
      };
    },
    safe: function(fn, fallback = null) {
      return function(){
        try {
          return fn.apply(this, arguments);
        } catch (_) {
          return fallback;
        }
      };
    },
    wrapAsync: function(fn, context) {
      return function(){
        return fn.apply(this, arguments).catch(function(error){
          logError(error, context);
          throw error;
        });
      };
    },
    safeDOM: function(operation, fallback = null) {
      return function(){
        try {
          return operation.apply(this, arguments);
        } catch (_) {
          return fallback;
        }
      };
    }
  };

  var NS = global.__TQ = global.__TQ || {};
  NS.core = NS.core || {};
  NS.core.error = { logError: logError, ErrorHandler: ErrorHandler };
})(window);

