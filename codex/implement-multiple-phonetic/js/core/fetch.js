(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.core = NS.core || {};
  var logError = (NS.core.error && NS.core.error.logError) || function(){};

  function fetchJSON(url) {
    return fetch(url).then(function(r){ if (!r.ok) { throw new Error('HTTP ' + r.status + ' for ' + url); } return r.json(); });
  }

  const __jsonCache = Object.create(null);
  function fetchJSONCached(url) {
    try {
      if (__jsonCache[url]) return __jsonCache[url];
      __jsonCache[url] = fetchJSON(url).catch(function(err){ delete __jsonCache[url]; throw err; });
      return __jsonCache[url];
    } catch (e) { logError(e, 'core.fetch.fetchJSONCached'); return fetchJSON(url); }
  }

  function fetchJSONs(urls) {
    return Promise.all(urls.map(fetchJSONCached));
  }

  NS.core.fetch = { fetchJSON: fetchJSON, fetchJSONCached: fetchJSONCached, fetchJSONs: fetchJSONs };
})(window);

