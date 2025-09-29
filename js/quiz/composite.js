(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.quiz = NS.quiz || {};

  var coreFetch = (NS.core && NS.core.fetch) || {};
  var errorCore = (NS.core && NS.core.error) || {};
  var logError = typeof errorCore.logError === 'function' ? errorCore.logError : function(){};

  function ensureArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function shallowClone(item) {
    if (!item || typeof item !== 'object') return { value: item };
    return Object.assign({}, item);
  }

  function defaultExampleKey(item, index) {
    if (!item || typeof item !== 'object') return String(index);
    if (item.id != null && item.id !== '') return String(item.id);
    if (item.exampleKey != null && item.exampleKey !== '') return String(item.exampleKey);
    if (item.english) return String(item.english);
    if (item.thai) return String(item.thai);
    if (item.phonetic) return String(item.phonetic);
    if (item.symbol) return String(item.symbol);
    return String(index);
  }

  function pickFetchFn(descriptor, preferred, fallback) {
    if (descriptor && descriptor.cache === false && typeof fallback === 'function') return fallback;
    return typeof preferred === 'function' ? preferred : fallback;
  }

  function pickExamplesFetchFn(descriptor, preferred, fallback) {
    if (descriptor && descriptor.cacheExamples === false && typeof fallback === 'function') return fallback;
    return typeof preferred === 'function' ? preferred : fallback;
  }

  function normalizeSource(descriptor, index) {
    if (!descriptor) descriptor = {};
    if (typeof descriptor === 'string') {
      descriptor = { quizId: descriptor };
    } else if (Array.isArray(descriptor)) {
      descriptor = { data: descriptor };
    } else {
      descriptor = Object.assign({}, descriptor);
    }
    if (!descriptor.sourceId) {
      var baseId = descriptor.quizId || descriptor.id || descriptor.dataUrl || ('source-' + index);
      descriptor.sourceId = String(baseId);
    } else {
      descriptor.sourceId = String(descriptor.sourceId);
    }
    return descriptor;
  }

  function computeExampleKeyForItem(item, idx, descriptor, globalExampleKey) {
    var key = '';
    try {
      if (descriptor && typeof descriptor.exampleKey === 'function') {
        key = descriptor.exampleKey(item, idx, descriptor) || '';
      } else if (typeof globalExampleKey === 'function') {
        key = globalExampleKey(item, idx, descriptor) || '';
      } else {
        key = defaultExampleKey(item, idx);
      }
    } catch (e) {
      key = defaultExampleKey(item, idx);
    }
    if (!key) key = defaultExampleKey(item, idx);
    return String(key);
  }

  function loadExamplesForSource(fetchJSONCached, fetchJSON, descriptor, context) {
    try {
      if (descriptor.examples && typeof descriptor.examples === 'object') {
        return Promise.resolve(descriptor.examples);
      }
      if (typeof descriptor.fetchExamples === 'function') {
        return Promise.resolve().then(function(){
          return descriptor.fetchExamples(context) || null;
        });
      }
      if (descriptor.examplesUrl) {
        var fetchFn = pickExamplesFetchFn(descriptor, fetchJSONCached, fetchJSON);
        if (typeof fetchFn === 'function') {
          return fetchFn(descriptor.examplesUrl).catch(function(err){
            logError(err, 'quiz.composite.examples("' + context.sourceId + '")');
            return null;
          });
        }
      }
    } catch (e) {
      logError(e, 'quiz.composite.examples("' + context.sourceId + '")');
    }
    return Promise.resolve(null);
  }

  function loadSource(options, descriptor, index) {
    var utils = options.utils || {};
    var fetchJSONCached = options.fetchJSONCached || utils.fetchJSONCached || coreFetch.fetchJSONCached;
    var fetchJSON = options.fetchJSON || utils.fetchJSON || coreFetch.fetchJSON;
    var context = {
      descriptor: descriptor,
      sourceId: descriptor.sourceId,
      quizId: descriptor.quizId || null,
      index: index
    };

    var loadPromise;
    try {
      if (Array.isArray(descriptor.data)) {
        loadPromise = Promise.resolve(descriptor.data.slice());
      } else if (typeof descriptor.fetch === 'function') {
        loadPromise = Promise.resolve().then(function(){ return descriptor.fetch(context) || []; });
      } else {
        var url = descriptor.dataUrl;
        if (!url && descriptor.quizId) url = 'data/' + descriptor.quizId + '.json';
        if (!url) loadPromise = Promise.resolve([]);
        else {
          var fetchFn = pickFetchFn(descriptor, fetchJSONCached, fetchJSON);
          if (typeof fetchFn !== 'function') loadPromise = Promise.resolve([]);
          else {
            loadPromise = fetchFn(url).catch(function(err){
              logError(err, 'quiz.composite.source("' + descriptor.sourceId + '")');
              return [];
            });
          }
        }
      }
    } catch (e) {
      logError(e, 'quiz.composite.source("' + descriptor.sourceId + '")');
      loadPromise = Promise.resolve([]);
    }

    return loadPromise.then(function(raw){
      var arr = Array.isArray(raw) ? raw.slice() : [];
      if (descriptor.filter && typeof descriptor.filter === 'function') {
        arr = arr.filter(function(item, idx){ return descriptor.filter(item, idx, context); });
      }
      if (descriptor.map && typeof descriptor.map === 'function') {
        arr = arr.map(function(item, idx){ return descriptor.map(item, idx, context); });
      }
      if (options.mapItem && typeof options.mapItem === 'function') {
        arr = arr.map(function(item, idx){ return options.mapItem(item, idx, context); });
      }

      var keyMap = {};
      var tagged = arr.map(function(item, idx){
        var clone = shallowClone(item);
        clone.__sourceQuizId = descriptor.quizId || descriptor.sourceId;
        var rawKey = computeExampleKeyForItem(clone, idx, descriptor, options.exampleKey);
        clone.__compositeKeyRaw = rawKey;
        clone.__compositeKey = descriptor.sourceId + '::' + rawKey;
        keyMap[rawKey] = clone.__compositeKey;
        if (options.decorateItem && typeof options.decorateItem === 'function') {
          try {
            var decorated = options.decorateItem(clone, idx, context);
            if (decorated) clone = decorated;
          } catch (e) { logError(e, 'quiz.composite.decorate("' + descriptor.sourceId + '")'); }
        }
        return clone;
      });

      return loadExamplesForSource(fetchJSONCached, fetchJSON, descriptor, context).then(function(examples){
        var remappedExamples = null;
        if (examples && typeof examples === 'object') {
          remappedExamples = {};
          for (var key in examples) {
            if (!hasOwn(examples, key)) continue;
            var mappedKey = keyMap[key];
            if (!mappedKey) mappedKey = descriptor.sourceId + '::' + key;
            remappedExamples[mappedKey] = examples[key];
          }
        }

        return {
          data: tagged,
          examples: remappedExamples,
          source: context
        };
      });
    }).catch(function(err){
      logError(err, 'quiz.composite.source("' + descriptor.sourceId + '")');
      return {
        data: [],
        examples: null,
        source: context,
        error: err
      };
    });
  }

  function combineSources(options) {
    options = options || {};
    var descriptors = ensureArray(options.sources).map(normalizeSource);
    if (!descriptors.length) {
      return Promise.resolve({ data: [], sources: [], examples: null, errors: [] });
    }

    var tasks = descriptors.map(function(descriptor, index){
      return loadSource(options, descriptor, index);
    });

    return Promise.all(tasks).then(function(parts){
      var combined = [];
      var examples = {};
      var hasExamples = false;
      var errors = [];
      var meta = [];

      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (!part) continue;
        if (Array.isArray(part.data)) combined = combined.concat(part.data);
        if (part.examples && typeof part.examples === 'object') {
          hasExamples = true;
          for (var key in part.examples) {
            if (!hasOwn(part.examples, key)) continue;
            examples[key] = part.examples[key];
          }
        }
        if (part.error) errors.push({ sourceId: part.source && part.source.sourceId, error: part.error });
        meta.push({
          sourceId: part.source && part.source.sourceId,
          quizId: part.source && part.source.quizId,
          count: Array.isArray(part.data) ? part.data.length : 0
        });
      }

      return {
        data: combined,
        examples: hasExamples ? examples : null,
        sources: meta,
        errors: errors
      };
    });
  }

  function createBuilder(options) {
    options = options || {};
    var quizId = options.quizId || '';
    var utils = options.utils || {};
    var defaultElements = options.defaultElements || (utils.defaultElements || {});

    return function() {
      return combineSources(options).then(function(payload){
        if (!payload || !Array.isArray(payload.data) || payload.data.length === 0) {
          return function initEmpty(){
            try {
              ThaiQuiz.setupQuiz({
                elements: defaultElements,
                quizId: quizId,
                pickRound: function(){ return null; }
              });
            } catch (e) { logError(e, 'quiz.composite.init("' + quizId + '")'); }
          };
        }

        if (typeof options.onSourcesLoaded === 'function') {
          try {
            options.onSourcesLoaded(payload);
          } catch (e) { logError(e, 'quiz.composite.onSourcesLoaded("' + quizId + '")'); }
        }

        var itemsBySource = {};
        try {
          for (var idx = 0; idx < payload.data.length; idx++) {
            var item = payload.data[idx];
            if (!item) continue;
            var sourceId = item.__sourceQuizId ? String(item.__sourceQuizId) : '__composite';
            if (!itemsBySource[sourceId]) itemsBySource[sourceId] = [];
            itemsBySource[sourceId].push(item);
          }
        } catch (e) {
          logError(e, 'quiz.composite.groupBySource("' + quizId + '")');
        }

        var quizParams = Object.assign({}, options.quizParams || {});
        if (options.answerKey) quizParams.answerKey = options.answerKey;
        if (options.progressiveDifficulty != null) quizParams.progressiveDifficulty = options.progressiveDifficulty;
        if (options.exampleKey) quizParams.exampleKey = options.exampleKey;
        else if (!quizParams.exampleKey) {
          quizParams.exampleKey = function(item){ return item && item.__compositeKey ? item.__compositeKey : ''; };
        }
        if (!quizParams.buildSymbol && options.buildSymbol) quizParams.buildSymbol = options.buildSymbol;
        quizParams.data = payload.data;
        if (payload.examples) quizParams.examples = payload.examples;

        var baseConfig;
        try {
          if (typeof utils.createQuizWithProgressiveDifficulty === 'function') {
            baseConfig = utils.createQuizWithProgressiveDifficulty(quizParams);
          } else if (typeof utils.createQuizWithProgressiveDifficulty === 'undefined' && NS.quiz && NS.quiz.factories && typeof NS.quiz.factories.createQuizWithProgressiveDifficulty === 'function') {
            baseConfig = NS.quiz.factories.createQuizWithProgressiveDifficulty(quizParams);
          } else {
            baseConfig = quizParams;
          }
        } catch (e) {
          logError(e, 'quiz.composite.factory("' + quizId + '")');
          baseConfig = quizParams;
        }

        var finalConfig = Object.assign({ elements: defaultElements, quizId: quizId }, baseConfig || {});
        if (options.quizOverrides && typeof options.quizOverrides === 'object') {
          finalConfig = Object.assign(finalConfig, options.quizOverrides);
        }

        var pickUniqueChoices = (options.utils && options.utils.pickUniqueChoices) || function(pool, count, keyFn, seed) {
          var out = [];
          var used = {};
          var safeKey = function(item) {
            try { return keyFn ? keyFn(item) : item; } catch (_) { return item; }
          };
          if (seed != null) {
            out.push(seed);
            var seedKey = safeKey(seed);
            if (seedKey != null) used[String(seedKey)] = true;
          }
          while (out.length < count && pool && out.length < pool.length) {
            var candidate = pool[Math.floor(Math.random() * pool.length)];
            var key = safeKey(candidate);
            if (key == null) continue;
            var keyStr = String(key);
            if (!used[keyStr]) {
              used[keyStr] = true;
              out.push(candidate);
            }
          }
          return out;
        };

        var originalPickRound = (typeof finalConfig.pickRound === 'function') ? finalConfig.pickRound : null;
        if (originalPickRound) {
          finalConfig.pickRound = function(state) {
            var round = originalPickRound(state);
            if (!round || !round.answer) return round;
            var answer = round.answer;
            var sourceId = answer.__sourceQuizId ? String(answer.__sourceQuizId) : null;
            if (!sourceId || !itemsBySource[sourceId] || !itemsBySource[sourceId].length) return round;
            var desired = (round.choices && Array.isArray(round.choices) && round.choices.length) ? round.choices.length : 0;
            if (desired <= 0) desired = 1;
            var keyFn = function(item) {
              if (!item) return '';
              if (item.__compositeKey) return item.__compositeKey;
              if (item.id != null) return 'id::' + item.id;
              if (item.english) return 'en::' + item.english;
              if (item.thai) return 'th::' + item.thai;
              if (item.phonetic) return 'ph::' + item.phonetic;
              return String(itemsBySource[sourceId].indexOf(item));
            };
            var sameSourceChoices = pickUniqueChoices(itemsBySource[sourceId], Math.max(1, desired), keyFn, answer);
            if (sameSourceChoices && sameSourceChoices.length) {
              round.choices = sameSourceChoices;
            }
            return round;
          };
        }

        return function init(){
          try {
            ThaiQuiz.setupQuiz(finalConfig);
          } catch (e) {
            logError(e, 'quiz.composite.setup("' + quizId + '")');
          }
        };
      });
    };
  }

  NS.quiz.composite = {
    combineSources: combineSources,
    createBuilder: createBuilder
  };
})(window);
