(function(){
  'use strict';

  function log(message, cls) {
    var el = document.getElementById('log');
    var div = document.createElement('div');
    div.className = 'row ' + (cls || '');
    div.textContent = message;
    el.appendChild(div);
  }

  function setStatus(text) {
    var el = document.getElementById('status');
    el.textContent = text || '';
  }

  function withTimeout(promise, ms, message) {
    return new Promise(function(resolve){
      var finished = false;
      var timer = setTimeout(function(){
        if (finished) return;
        finished = true;
        resolve({ ok: false, error: new Error(message || ('Timeout after ' + ms + 'ms')) });
      }, ms);
      promise.then(function(res){
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(res);
      }).catch(function(err){
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve({ ok: false, error: err });
      });
    });
  }

  function createFrame() {
    var iframe = document.createElement('iframe');
    iframe.className = 'smoke-frame';
    document.body.appendChild(iframe);
    return iframe;
  }

  function navigateFrame(iframe, url) {
    return new Promise(function(resolve){
      function done(result) {
        iframe.removeEventListener('load', onload);
        resolve(result);
      }
      function onload() {
        try {
          var doc = iframe.contentDocument;
          if (!doc) return done({ ok: false, error: new Error('No document') });
          done({ ok: true, doc: doc, win: iframe.contentWindow });
        } catch (e) {
          done({ ok: false, error: e });
        }
      }
      iframe.addEventListener('load', onload);
      iframe.src = url;
    });
  }

  function safeQuery(doc, sel) {
    try { return doc.querySelector(sel); } catch (_) { return null; }
  }

  function click(el) { try { el.click(); } catch (_) {} }

  function wait(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

  async function discoverQuizIds(serverRoot) {
    // 1) Preferred: read data/quizzes.json
    try {
      var res = await fetch(serverRoot + '/data/quizzes.json', { cache: 'no-cache' });
      if (res && res.ok) {
        var arr = await res.json();
        var ids = Array.isArray(arr) ? arr.map(function(it){ return it && it.id; }).filter(Boolean) : [];
        if (ids.length) return ids;
      }
    } catch (_) {}

    // 2) Fallback: parse links on the home page
    var iframe = createFrame();
    try {
      var nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not load for discovery');
      if (nav.ok) {
        var anchors = nav.doc.querySelectorAll('#quiz-list a[href*="quiz.html"]');
        var set = Object.create(null);
        for (var i = 0; i < anchors.length; i++) {
          try {
            var href = anchors[i].getAttribute('href') || '';
            var url = new URL(href, serverRoot + '/');
            var id = url.searchParams.get('quiz');
            if (id) set[id] = true;
          } catch (_) {}
        }
        var fromHome = Object.keys(set);
        if (fromHome.length) return fromHome;
      }
    } catch (_) {
      // ignore
    } finally {
      try { iframe.remove(); } catch (_) {}
    }

    // 3) Last resort: minimal baseline
    return ['consonants','vowels','numbers'];
  }

  async function testHome(serverRoot) {
    var name = 'Home page (ThaiQuest) loads';
    var iframe = createFrame();
    try {
      var nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 5000, 'Home did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      // Minimal success criteria: page navigated and document available
      return { name: name, ok: true };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      try { iframe.remove(); } catch (_) {}
    }
  }

  async function testQuiz(serverRoot, quizId, expectations) {
    var name = 'Quiz "' + quizId + '" basic flow';
    var iframe = createFrame();
    try {
      var url = serverRoot + '/quiz.html?quiz=' + encodeURIComponent(quizId);
      var nav = await withTimeout(navigateFrame(iframe, url), 6000, 'Quiz did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      var doc = nav.doc;
      var win = nav.win;

      // Core elements exist
      var symbol = safeQuery(doc, '#symbol');
      var options = safeQuery(doc, '#options');
      var feedback = safeQuery(doc, '#feedback');
      var nextBtn = safeQuery(doc, '#nextBtn');
      var stats = safeQuery(doc, '#stats');
      if (!symbol || !options || !feedback || !nextBtn || !stats) {
        return { name: name, ok: false, details: 'Missing required quiz elements' };
      }

      // Wait for first question to render
      var start = Date.now();
      while (Date.now() - start < 5000) {
        if (options.children && options.children.length >= (expectations && expectations.minChoices || 2)) break;
        await wait(100);
      }
      if (!options.children || options.children.length === 0) {
        return { name: name, ok: false, details: 'No answer buttons rendered' };
      }

      // Click first button
      click(options.querySelector('button'));

      // Stats should update soon
      start = Date.now();
      var updated = false;
      while (Date.now() - start < 2000) {
        if ((stats.textContent || '').indexOf('Questions: 1') !== -1) { updated = true; break; }
        await wait(100);
      }
      if (!updated) return { name: name, ok: false, details: 'Stats did not update after click' };

      // If correct, auto-advance may occur; just ensure no script errors captured
      var hadError = false;
      function onErr(e){ hadError = true; }
      win.addEventListener('error', onErr);
      await wait(300);
      win.removeEventListener('error', onErr);
      if (hadError) return { name: name, ok: false, details: 'Runtime error in quiz frame' };

      return { name: name, ok: true };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      try { iframe.remove(); } catch (_) {}
    }
  }

  async function runAll() {
    var results = [];
    var root = (new URL('.', window.location.href)).href.replace(/\/$/, '');

    results.push(await testHome(root));
    var quizIds = await discoverQuizIds(root);
    for (var i = 0; i < quizIds.length; i++) {
      results.push(await testQuiz(root, quizIds[i], { minChoices: 4 }));
    }

    return results;
  }

  function renderResults(results, durationMs) {
    var failures = results.filter(function(r){ return !r.ok; });
    log('Ran ' + results.length + ' checks in ~' + durationMs + 'ms');
    results.forEach(function(r){
      if (r.ok) log('✔ ' + r.name, 'ok');
      else log('✖ ' + r.name + (r.details ? (' — ' + r.details) : ''), 'fail');
    });
    var summary = (failures.length === 0)
      ? 'All checks passed.'
      : (failures.length + ' check(s) failed.');
    setStatus(summary);
  }

  function ensureServerWarning() {
    if (window.location.protocol === 'file:') {
      log('This page must be served from a local web server so JSON can be fetched (e.g., python3 -m http.server).', 'fail');
    }
  }

  function wire() {
    var btn = document.getElementById('runBtn');
    btn.onclick = async function(){
      btn.disabled = true;
      setStatus('Running...');
      var start = performance.now();
      try {
        var results = await runAll();
        renderResults(results, Math.round(performance.now() - start));
      } finally {
        btn.disabled = false;
      }
    };
    ensureServerWarning();
  }

  wire();
})();

