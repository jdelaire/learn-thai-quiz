(function(){
  'use strict';

  function getParams() {
    try { return new URLSearchParams(window.location.search); } catch (_) { return new URLSearchParams(''); }
  }

  function parseListParam(value) {
    if (!value) return [];
    return String(value).split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  }

  function log(message, cls) {
    const el = document.getElementById('log');
    const div = document.createElement('div');
    div.className = 'row ' + (cls || '');
    div.textContent = message;
    el.appendChild(div);
  }

  function setStatus(text) {
    const el = document.getElementById('status');
    el.textContent = text || '';
  }

  function withTimeout(promise, ms, message) {
    return new Promise(function(resolve){
      let finished = false;
      const timer = setTimeout(function(){
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
    const iframe = document.createElement('iframe');
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
          const doc = iframe.contentDocument;
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
    return Utils.ErrorHandler.safe(function() { return doc.querySelector(sel); }, null)();
  }

  function click(el) { 
    Utils.ErrorHandler.safe(function() { el.click(); })();
  }

  function wait(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

  function extractQuestionsAnswered(statsEl) {
    try {
      const text = String(statsEl && statsEl.textContent || '');
      const m = text.match(/Questions:\s*(\d+)/i);
      if (m) return parseInt(m[1], 10) || 0;
    } catch (_) {}
    return 0;
  }

  function maybeResetProgressForAll() {
    try {
      const params = getParams();
      const keep = params.get('keepProgress');
      if (keep === '1' || keep === 'true') return false;
      if (window.StorageService && typeof window.StorageService.clearPrefix === 'function') {
        window.StorageService.clearPrefix('thaiQuest.progress.');
        return true;
      }
    } catch (_) {}
    return false;
  }

  async function discoverQuizIds(serverRoot) {
    // 1) Preferred: read data/quizzes.json
    try {
      const res = await fetch(serverRoot + '/data/quizzes.json', { cache: 'no-cache' });
      if (res && res.ok) {
        const arr = await res.json();
        const ids = Array.isArray(arr) ? arr.map(function(it){ return it && it.id; }).filter(Boolean) : [];
        if (ids.length) return ids;
      }
    } catch (_) {}

    // 2) Fallback: parse links on the home page
    const iframe = createFrame();
    try {
      const nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not load for discovery');
      if (nav.ok) {
        const anchors = nav.doc.querySelectorAll('#quiz-list a[href*="quiz.html"]');
        const set = Object.create(null);
        for (let i = 0; i < anchors.length; i++) {
          try {
            const href = anchors[i].getAttribute('href') || '';
            const url = new URL(href, serverRoot + '/');
            const id = url.searchParams.get('quiz');
            if (id) set[id] = true;
          } catch (_) {}
        }
        const fromHome = Object.keys(set);
        if (fromHome.length) return fromHome;
      }
          } catch (_) {
        // ignore
      } finally {
        Utils.ErrorHandler.safe(function() { iframe.remove(); })();
      }

    // 3) Last resort: minimal baseline
    return ['consonants','vowels','numbers'];
  }

  async function testHome(serverRoot) {
    const name = 'Home page (ThaiQuest) loads';
    const iframe = createFrame();
    try {
      const nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 5000, 'Home did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      // Minimal success criteria: page navigated and document available
      return { name: name, ok: true };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testHomeContent(serverRoot) {
    const name = 'Home renders quiz cards from metadata';
    const iframe = createFrame();
    try {
      const nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;
      // Wait for list to populate
      let start = Date.now();
      while (Date.now() - start < 5000) {
        const anchors = doc.querySelectorAll('#quiz-list a[href*="quiz.html?quiz="]');
        if (anchors && anchors.length > 0) {
          return { name: name, ok: true };
        }
        await wait(100);
      }
      return { name: name, ok: false, details: 'No quiz cards rendered' };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function validateQuizzesMetadata(serverRoot) {
    const name = 'Validate quizzes metadata (ids unique, href matches)';
    try {
      const res = await withTimeout(fetch(serverRoot + '/data/quizzes.json', { cache: 'no-cache' }), 5000, 'Could not fetch quizzes.json');
      if (!res || !res.ok) return { name: name, ok: false, details: 'Fetch failed' };
      const list = await res.json();
      const ids = Object.create(null);
      for (let i = 0; i < (Array.isArray(list) ? list.length : 0); i++) {
        const it = list[i];
        if (!it || !it.id) return { name: name, ok: false, details: 'Missing id at index ' + i };
        if (ids[it.id]) return { name: name, ok: false, details: 'Duplicate id: ' + it.id };
        ids[it.id] = true;
        const expected = 'quiz.html?quiz=' + encodeURIComponent(it.id);
        if (!it.href || it.href.indexOf(expected) === -1) {
          return { name: name, ok: false, details: 'href mismatch for ' + it.id };
        }
      }
      return { name: name, ok: true };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    }
  }

  async function testQuiz(serverRoot, quizId, expectations) {
    const name = 'Quiz "' + quizId + '" basic flow';
    const iframe = createFrame();
    try {
      const url = serverRoot + '/quiz.html?quiz=' + encodeURIComponent(quizId);
      const nav = await withTimeout(navigateFrame(iframe, url), 6000, 'Quiz did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;
      const win = nav.win;

      // Core elements exist
      const symbol = safeQuery(doc, '#symbol');
      const options = safeQuery(doc, '#options');
      const feedback = safeQuery(doc, '#feedback');
      const nextBtn = safeQuery(doc, '#nextBtn');
      const stats = safeQuery(doc, '#stats');
      if (!symbol || !options || !feedback || !nextBtn || !stats) {
        return { name: name, ok: false, details: 'Missing required quiz elements' };
      }

      // Basic chrome/accessibility assertions (some depend on loader; check others later)
      try {
        const ariaLabel = symbol.getAttribute('aria-label');
        if (!ariaLabel) return { name: name, ok: false, details: 'Symbol aria-label missing' };
      } catch (_) {}
      try {
        const role = options.getAttribute('role');
        if (role !== 'group') return { name: name, ok: false, details: 'Options role not set to group' };
      } catch (_) {}

      // Wait for first question to render
      let start = Date.now();
      while (Date.now() - start < 5000) {
        if (options.children && options.children.length >= (expectations && expectations.minChoices || 2)) break;
        await wait(100);
      }
      if (!options.children || options.children.length === 0) {
        return { name: name, ok: false, details: 'No answer buttons rendered' };
      }

      // Ensure generic per-quiz body class is applied by loader (poll briefly)
      try {
        let t0 = Date.now();
        let hasBodyClass = false;
        while (Date.now() - t0 < 2000) {
          hasBodyClass = !!(doc && doc.body && doc.body.classList && doc.body.classList.contains(quizId + '-quiz'));
          if (hasBodyClass) break;
          await wait(50);
        }
        if (!hasBodyClass) return { name: name, ok: false, details: 'Missing body class ' + quizId + '-quiz' };
      } catch (_) {}

      // Baseline stats value
      const baselineQuestions = extractQuestionsAnswered(stats);

      // Click first button
      click(options.querySelector('button'));

      // Stats should update soon
      start = Date.now();
      let updated = false;
      while (Date.now() - start < 2000) {
        const current = extractQuestionsAnswered(stats);
        if (current === baselineQuestions + 1) { updated = true; break; }
        await wait(100);
      }
      if (!updated) return { name: name, ok: false, details: 'Stats did not update after click' };

      // If correct, auto-advance may occur; just ensure no script errors captured
      let hadError = false;
      function onErr(e){ hadError = true; }
      win.addEventListener('error', onErr);
      await wait(300);
      win.removeEventListener('error', onErr);
      if (hadError) return { name: name, ok: false, details: 'Runtime error in quiz frame' };

      return { name: name, ok: true };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testKeyboardFocus(serverRoot, quizId) {
    const name = 'Quiz "' + quizId + '" options focusable + 1-9 works';
    const iframe = createFrame();
    try {
      const url = serverRoot + '/quiz.html?quiz=' + encodeURIComponent(quizId);
      const nav = await withTimeout(navigateFrame(iframe, url), 6000, 'Quiz did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;
      const win = nav.win;

      const options = safeQuery(doc, '#options');
      const stats = safeQuery(doc, '#stats');
      if (!options || !stats) return { name: name, ok: false, details: 'Missing options or stats' };

      Utils.ErrorHandler.safe(function() { options.focus(); })();
      // Wait for focus to settle
      await wait(50);
      const focused = doc.activeElement === options;
      if (!focused) return { name: name, ok: false, details: '#options not focusable' };

      // Simulate pressing "1"
      const evt = new win.KeyboardEvent('keydown', { key: '1', bubbles: true });
      options.dispatchEvent(evt);

      // Expect questions count to increment to 1 shortly
      let start = Date.now();
      while (Date.now() - start < 1500) {
        const current = extractQuestionsAnswered(stats);
        if (current >= 1) {
          return { name: name, ok: true };
        }
        await wait(50);
      }
      return { name: name, ok: false, details: 'Keyboard 1 did not trigger click' };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function runAll() {
    const results = [];
    const root = (new URL('.', window.location.href)).href.replace(/\/$/, '');

    // Optional reset to stabilize tests
    const didReset = maybeResetProgressForAll();
    if (didReset) log('Progress reset for smoke run (thaiQuest.progress.*)', 'muted');

    // Metadata validation (quick, no frames)
    results.push(await validateQuizzesMetadata(root));

    // Home page tests
    results.push(await testHome(root));
    results.push(await testHomeContent(root));

    // Discover subset of quizzes to run
    let quizIds = await discoverQuizIds(root);
    const params = getParams();
    const onlyList = parseListParam(params.get('quiz'));
    if (onlyList.length) quizIds = quizIds.filter(function(id){ return onlyList.indexOf(id) !== -1; });
    const limit = parseInt(params.get('limit'), 10);
    if (isFinite(limit) && limit > 0) quizIds = quizIds.slice(0, limit);

    for (let i = 0; i < quizIds.length; i++) {
      results.push(await testQuiz(root, quizIds[i], { minChoices: 4 }));
      // Add a focused keyboard test for the first discovered quiz only (fast)
      if (i === 0) results.push(await testKeyboardFocus(root, quizIds[i]));
    }

    return results;
  }

  function renderResults(results, durationMs) {
    const failures = results.filter(function(r){ return !r.ok; });
    log('Ran ' + results.length + ' checks in ~' + durationMs + 'ms');
    results.forEach(function(r){
      if (r.ok) log('✔ ' + r.name, 'ok');
      else log('✖ ' + r.name + (r.details ? (' — ' + r.details) : ''), 'fail');
    });
    const summary = (failures.length === 0)
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
    const btn = document.getElementById('runBtn');
    btn.onclick = async function(){
      btn.disabled = true;
      setStatus('Running...');
      const start = performance.now();
      try {
        const results = await runAll();
        renderResults(results, Math.round(performance.now() - start));
      } finally {
        btn.disabled = false;
      }
    };
    ensureServerWarning();
    try {
      const params = getParams();
      const autorun = params.get('autorun');
      if (autorun === '1' || autorun === 'true') {
        // Delay slightly to allow layout
        setTimeout(function(){ btn.click(); }, 0);
      }
    } catch (_) {}
  }

  wire();
})();

