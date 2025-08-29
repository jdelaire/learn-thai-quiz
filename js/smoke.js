(function(){
  'use strict';

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

      // Wait for first question to render
      let start = Date.now();
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
      let updated = false;
      while (Date.now() - start < 2000) {
        if ((stats.textContent || '').indexOf('Questions: 1') !== -1) { updated = true; break; }
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
        if ((stats.textContent || '').indexOf('Questions: 1') !== -1) {
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

    results.push(await testHome(root));
    const quizIds = await discoverQuizIds(root);
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
  }

  wire();
})();

