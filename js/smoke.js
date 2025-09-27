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

  async function waitForCondition(checkFn, timeoutMs, intervalMs) {
    const deadline = Date.now() + (timeoutMs || 4000);
    const delay = intervalMs || 100;
    while (Date.now() < deadline) {
      try {
        if (checkFn()) return true;
      } catch (_) {}
      await wait(delay);
    }
    return false;
  }

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
        window.StorageService.clearPrefix('thaiQuest.lastAttempt.');
        window.StorageService.clearPrefix('thaiQuest.home.questCollapsed.');
        try { window.StorageService.removeItem('thaiQuest.home.viewMode'); } catch (_) {}
        return true;
      }
    } catch (_) {}
    return false;
  }

  const QUEST_MODE_VIEW_KEY = 'thaiQuest.home.viewMode';
  const QUEST_COLLAPSE_PREFIX = 'thaiQuest.home.questCollapsed.';
  const QUEST1_ID = 'quest-survival-basics';
  const QUEST2_ID = 'quest-daily-life';
  const QUEST1_QUIZ_IDS = ['greetings','numbers','colors','family','adjectives'];
  const QUEST2_QUIZ_IDS = ['days','months','time','prepositions','countries'];

  function setHomeViewMode(mode) {
    try {
      if (!window.StorageService) return;
      if (mode) {
        window.StorageService.setItem(QUEST_MODE_VIEW_KEY, mode);
      } else {
        window.StorageService.removeItem(QUEST_MODE_VIEW_KEY);
      }
    } catch (_) {}
  }

  function clearQuestCollapseState(questId) {
    try {
      if (!window.StorageService) return;
      window.StorageService.removeItem(QUEST_COLLAPSE_PREFIX + questId);
    } catch (_) {}
  }

  function setQuizProgressForSmoke(quizId, answered, correct) {
    try {
      if (!quizId || !window.StorageService) return;
      window.StorageService.setJSON('thaiQuest.progress.' + quizId, {
        questionsAnswered: answered,
        correctAnswers: correct
      });
      window.StorageService.setNumber('thaiQuest.lastAttempt.' + quizId, Date.now());
    } catch (_) {}
  }

  function clearQuizProgressForSmoke(quizId) {
    try {
      if (!quizId || !window.StorageService) return;
      window.StorageService.removeItem('thaiQuest.progress.' + quizId);
      window.StorageService.removeItem('thaiQuest.lastAttempt.' + quizId);
    } catch (_) {}
  }

  function clearManyQuizProgress(ids) {
    if (!Array.isArray(ids)) return;
    for (let i = 0; i < ids.length; i++) {
      clearQuizProgressForSmoke(ids[i]);
    }
  }

  function findQuestCard(doc, titleSubstring) {
    const cards = doc.querySelectorAll('.quest-card');
    for (let i = 0; i < cards.length; i++) {
      const titleEl = cards[i].querySelector('.quest-title');
      const text = titleEl && titleEl.textContent || '';
      if (text.indexOf(titleSubstring) !== -1) return cards[i];
    }
    return null;
  }

  function clearQuestSmokeArtifacts() {
    clearQuestCollapseState(QUEST1_ID);
    clearQuestCollapseState(QUEST2_ID);
    setHomeViewMode('browse');
    try { window.StorageService && window.StorageService.removeItem(QUEST_MODE_VIEW_KEY); } catch (_) {}
    clearManyQuizProgress(QUEST1_QUIZ_IDS);
    clearManyQuizProgress(QUEST2_QUIZ_IDS);
  }

  async function discoverQuizIds(serverRoot) {
    // 1) Preferred: read data/quizzes.json
    try {
      const res = await fetch(serverRoot + '/data/quizzes.json', { cache: 'no-cache' });
      if (res && res.ok) {
        const arr = await res.json();
        const ids = Array.isArray(arr)
          ? arr.filter(function(it){ return it && it.id && it.visible !== false; })
              .map(function(it){ return it.id; })
          : [];
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

  async function testHomeSearchFilters(serverRoot) {
    const name = 'Home search filters show empty state';
    const iframe = createFrame();
    try {
      const nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;
      const win = nav.win;
      const search = doc.getElementById('search-input');
      const list = doc.getElementById('quiz-list');
      if (!search || !list) return { name: name, ok: false, details: 'Missing search or quiz-list' };

      // Wait for initial cards to render so we know data has loaded
      let t0 = Date.now();
      while (Date.now() - t0 < 5000) {
        if (list.querySelectorAll('.quiz-card').length > 0) break;
        await wait(100);
      }

      // Enter an unlikely term to force empty state
      search.value = 'zzzzzzzzzz-__unlikely__-zzzzzzzz';
      search.dispatchEvent(new win.Event('input', { bubbles: true }));

      // Accept either explicit empty placeholder or zero cards as empty state
      let start = Date.now();
      while (Date.now() - start < 4000) {
        const empty = list.querySelector('.empty');
        const cardCount = list.querySelectorAll('.quiz-card').length;
        if (empty || cardCount === 0) {
          return { name: name, ok: true };
        }
        await wait(100);
      }
      return { name: name, ok: false, details: 'Empty state did not appear' };
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

  async function testHomePersistCategoryFilter(serverRoot) {
    const name = 'Home persists selected category filter after reload';
    const iframe = createFrame();
    try {
      const nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;
      const filters = doc.getElementById('category-filters');
      if (!filters) return { name: name, ok: false, details: 'No category filters' };

      // Pick a non-empty category chip (not "All")
      const chips = filters.querySelectorAll('.chip');
      let target = null;
      for (let i = 0; i < chips.length; i++) {
        try {
          const val = chips[i].getAttribute('data-value') || chips[i].dataset.value || '';
          if (val) { target = chips[i]; break; }
        } catch (_) {}
      }
      if (!target) {
        // If there are no category-specific chips, nothing to verify
        return { name: name, ok: true };
      }

      const selectedValue = target.getAttribute('data-value') || target.dataset.value || '';
      click(target);
      await wait(120);

      // Reload home into the same frame
      const nav2 = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not reload');
      if (!nav2.ok) return { name: name, ok: false, details: String(nav2.error) };
      const doc2 = nav2.doc;
      const filters2 = doc2.getElementById('category-filters');
      if (!filters2) return { name: name, ok: false, details: 'No category filters after reload' };
      const chips2 = filters2.querySelectorAll('.chip');
      for (let i = 0; i < chips2.length; i++) {
        const val = chips2[i].getAttribute('data-value') || chips2[i].dataset.value || '';
        if (val === selectedValue) {
          if (chips2[i].classList.contains('active')) {
            return { name: name, ok: true };
          }
          return { name: name, ok: false, details: 'Selected category not active after reload' };
        }
      }
      return { name: name, ok: false, details: 'Selected category chip not found after reload' };
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

  async function validateJSONFiles(serverRoot) {
    const name = 'Validate JSON files parse cleanly';
    try {
      const seen = Object.create(null);
      const targets = [];
      function add(path) {
        try { path = String(path || ''); } catch (_) { return; }
        if (!path) return;
        path = path.replace(serverRoot + '/', '');
        path = path.replace(/^\//, '');
        if (!/\.json$/i.test(path)) return;
        if (!seen[path]) {
          seen[path] = true;
          targets.push(path);
        }
      }

      add('data/quizzes.json');
      add('data/changelog.json');

      const builderIds = Object.create(null);
      try {
        const builderRes = await withTimeout(fetch(serverRoot + '/js/builders/index.js', { cache: 'no-cache' }), 5000, 'Could not fetch builders index');
        if (builderRes && builderRes.ok) {
          const text = await builderRes.text();
          const jsonRe = /['"](data\/[A-Za-z0-9_\-\.]+\.json)['"]/g;
          let match;
          while ((match = jsonRe.exec(text))) {
            add(match[1]);
          }
          const keyFnRe = /['"]([A-Za-z0-9_\-]+)['"]\s*:\s*function\s*\(/g;
          while ((match = keyFnRe.exec(text))) {
            builderIds[match[1]] = true;
          }
          const keyFactoryRe = /['"]([A-Za-z0-9_\-]+)['"]\s*:\s*makeStandardQuizBuilder\s*\(/g;
          while ((match = keyFactoryRe.exec(text))) {
            builderIds[match[1]] = true;
          }
        }
      } catch (_) {}

      let metadata = [];
      try {
        const metaRes = await withTimeout(fetch(serverRoot + '/data/quizzes.json', { cache: 'no-cache' }), 5000, 'Timeout fetching quizzes metadata');
        if (metaRes && metaRes.ok) {
          metadata = await metaRes.json();
        }
      } catch (_) {}
      (Array.isArray(metadata) ? metadata : []).forEach(function(item){
        try {
          if (item && item.id && !builderIds[item.id]) add('data/' + item.id + '.json');
        } catch (_) {}
        try {
          if (item && item.examplesFile) add(String(item.examplesFile));
        } catch (_) {}
      });

      const errors = [];
      for (let i = 0; i < targets.length; i++) {
        const path = targets[i];
        try {
          const res = await withTimeout(fetch(serverRoot + '/' + path, { cache: 'no-cache' }), 5000, 'Timeout fetching ' + path);
          if (!res) {
            continue;
          }
          if (res.status === 404) {
            continue;
          }
          if (!res.ok) {
            errors.push(path + ': HTTP ' + res.status);
          } else {
            try {
              await res.json();
            } catch (parseErr) {
              errors.push(path + ': parse failed (' + ((parseErr && parseErr.message) || String(parseErr)) + ')');
            }
          }
        } catch (e) {
          errors.push(path + ': ' + (e && e.message ? e.message : String(e)));
        }
        if (errors.length >= 3) break;
      }

      if (errors.length) {
        return { name: name, ok: false, details: errors.join('; ') };
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

      // After first render, options should be focusable (tabindex=0)
      try {
        let okTab = false;
        let t1 = Date.now();
        while (Date.now() - t1 < 2000) {
          const tb = options.getAttribute('tabindex');
          if (tb === '0') { okTab = true; break; }
          await wait(50);
        }
        if (!okTab) return { name: name, ok: false, details: 'Options tabindex not 0' };
      } catch (_) {}

      // At least first button should have aria-label for screen readers
      try {
        const firstBtn = options.querySelector('button');
        if (!firstBtn || !firstBtn.getAttribute('aria-label')) {
          return { name: name, ok: false, details: 'First answer button missing aria-label' };
        }
      } catch (_) {}

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

      // If we know the expected metadata body class, verify it
      if (expectations && expectations.expectedBodyClass) {
        try {
          const cls = expectations.expectedBodyClass;
          if (cls && !doc.body.classList.contains(cls)) {
            return { name: name, ok: false, details: 'Missing metadata bodyClass ' + cls };
          }
        } catch (_) {}
      }

      // Confirm loader stamped quiz metadata on body dataset
      try {
        const data = (doc && doc.body && doc.body.dataset) || {};
        if (!data.quizId || data.quizId !== quizId) {
          return { name: name, ok: false, details: 'Body dataset quizId mismatch' };
        }
        if (expectations && typeof expectations.voiceSupported === 'boolean') {
          const expectedVoice = expectations.voiceSupported ? '1' : '0';
          if (data.voiceSupported !== expectedVoice) {
            return { name: name, ok: false, details: 'Voice support flag incorrect (expected ' + expectedVoice + ')' };
          }
        }
        if (expectations && typeof expectations.phoneticsSupported === 'boolean') {
          const expectedPhonetics = expectations.phoneticsSupported ? '1' : '0';
          if (data.phoneticsSupported !== expectedPhonetics) {
            return { name: name, ok: false, details: 'Phonetics support flag incorrect (expected ' + expectedPhonetics + ')' };
          }
        }
        if (expectations && expectations.phoneticLocales && expectations.phoneticLocales.length) {
          const bodyLocales = (data.phoneticLocales || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean).sort();
          const expectedList = expectations.phoneticLocales.slice().map(function(x){ return String(x).trim(); }).filter(Boolean).sort();
          if (expectedList.length && (bodyLocales.length !== expectedList.length || bodyLocales.join('|') !== expectedList.join('|'))) {
            return { name: name, ok: false, details: 'Body phoneticLocales mismatch' };
          }
        }
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

  async function testQuizProTip(serverRoot, quizId) {
    const name = 'Quiz "' + quizId + '" inserts metadata proTip';
    const iframe = createFrame();
    try {
      const url = serverRoot + '/quiz.html?quiz=' + encodeURIComponent(quizId);
      const nav = await withTimeout(navigateFrame(iframe, url), 6000, 'Quiz did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;
      let start = Date.now();
      while (Date.now() - start < 3000) {
        const tip = doc.querySelector('.footer .pro-tip small');
        if (tip && (tip.textContent || tip.childNodes.length > 0)) return { name: name, ok: true };
        await wait(100);
      }
      return { name: name, ok: false, details: 'No metadata proTip found in footer' };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testQuizVoiceControls(serverRoot, quizId) {
    const name = 'Quiz "' + quizId + '" provides voice controls or help';
    const iframe = createFrame();
    try {
      const url = serverRoot + '/quiz.html?quiz=' + encodeURIComponent(quizId);
      const nav = await withTimeout(navigateFrame(iframe, url), 6000, 'Quiz did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;

      let start = Date.now();
      while (Date.now() - start < 2000) {
        if (doc && doc.body && doc.body.dataset && doc.body.dataset.voiceSupported === '1') break;
        await wait(50);
      }
      if (!(doc && doc.body && doc.body.dataset && doc.body.dataset.voiceSupported === '1')) {
        return { name: name, ok: false, details: 'Voice support flag missing' };
      }

      start = Date.now();
      while (Date.now() - start < 4000) {
        const controls = doc.querySelector('.sound-controls');
        const help = doc.querySelector('.sound-help');
        if (controls && controls.querySelector('.sound-toggle')) {
          return { name: name, ok: true };
        }
        if (help && (help.textContent || '').trim().length > 0) {
          return { name: name, ok: true };
        }
        await wait(100);
      }
      return { name: name, ok: false, details: 'Voice controls/help not injected' };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testQuizPhoneticsControls(serverRoot, quizId, meta) {
    const name = 'Quiz "' + quizId + '" shows phonetics selector';
    const iframe = createFrame();
    try {
      const url = serverRoot + '/quiz.html?quiz=' + encodeURIComponent(quizId);
      const nav = await withTimeout(navigateFrame(iframe, url), 6000, 'Quiz did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;

      let start = Date.now();
      while (Date.now() - start < 2000) {
        if (doc && doc.body && doc.body.dataset && doc.body.dataset.phoneticsSupported === '1') break;
        await wait(50);
      }
      if (!(doc && doc.body && doc.body.dataset && doc.body.dataset.phoneticsSupported === '1')) {
        return { name: name, ok: false, details: 'Phonetics support flag missing' };
      }

      const container = doc.getElementById('quiz-preferences');
      if (!container) return { name: name, ok: false, details: 'Preferences container missing' };

      start = Date.now();
      while (Date.now() - start < 4000) {
        const select = container.querySelector('#quiz-phonetic-locale');
        if (select && select.options && select.options.length > 0) {
          const aria = select.getAttribute('aria-label');
          if (!aria) {
            return { name: name, ok: false, details: 'Phonetics select missing aria-label' };
          }
          if (meta && meta.phoneticLocales && meta.phoneticLocales.length) {
            const expected = meta.phoneticLocales.map(function(x){ return String(x).trim().toLowerCase(); }).filter(Boolean);
            const optionValues = Array.prototype.map.call(select.options, function(opt){ return String(opt.value || '').toLowerCase(); });
            let covered = true;
            for (let i = 0; i < expected.length; i++) {
              if (optionValues.indexOf(expected[i]) === -1) { covered = false; break; }
            }
            if (!covered) {
              return { name: name, ok: false, details: 'Phonetics select missing locale option' };
            }
          }
          return { name: name, ok: true };
        }
        await wait(100);
      }
      return { name: name, ok: false, details: 'Phonetics select not injected' };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testQuizPhoneticsPersistence(serverRoot, quizId) {
    const name = 'Quiz "' + quizId + '" remembers phonetic locale selection';
    const iframe = createFrame();
    try {
      const url = serverRoot + '/quiz.html?quiz=' + encodeURIComponent(quizId);
      let nav = await withTimeout(navigateFrame(iframe, url), 6000, 'Quiz did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      let doc = nav.doc;
      let win = nav.win;

      const container = doc.getElementById('quiz-preferences');
      if (!container) return { name: name, ok: false, details: 'Preferences container missing' };

      let select = null;
      let start = Date.now();
      while (Date.now() - start < 4000) {
        select = container.querySelector('#quiz-phonetic-locale');
        if (select && select.options && select.options.length > 0) break;
        await wait(100);
      }
      if (!select || !select.options || select.options.length < 1) {
        return { name: name, ok: false, details: 'No phonetics select options' };
      }

      const original = select.value;
      let target = original;
      if (select.options.length > 1) {
        target = select.options[select.options.length - 1].value;
        if (target === original) {
          target = select.options[0].value;
        }
      }

      if (target === original) {
        // Nothing to toggle; treat as covered
        return { name: name, ok: true };
      }

      select.value = target;
      try {
        const evt = new (win.Event || win.CustomEvent)('change', { bubbles: true });
        select.dispatchEvent(evt);
      } catch (_) {
        try {
          const legacyEvt = doc.createEvent('Event');
          legacyEvt.initEvent('change', true, true);
          select.dispatchEvent(legacyEvt);
        } catch (__) {
          // give up, but continue
        }
      }

      start = Date.now();
      while (Date.now() - start < 1500) {
        const stored = select.getAttribute('data-selected-locale');
        if (stored && stored.toLowerCase() === String(target).toLowerCase()) break;
        await wait(50);
      }

      // Reload quiz to verify persistence
      nav = await withTimeout(navigateFrame(iframe, url), 6000, 'Quiz reload failed');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      doc = nav.doc;
      win = nav.win;
      const container2 = doc.getElementById('quiz-preferences');
      if (!container2) return { name: name, ok: false, details: 'Preferences container missing after reload' };

      select = null;
      start = Date.now();
      while (Date.now() - start < 4000) {
        select = container2.querySelector('#quiz-phonetic-locale');
        if (select && select.options && select.options.length > 0) break;
        await wait(100);
      }
      if (!select) return { name: name, ok: false, details: 'Phonetics select missing after reload' };

      if (String(select.value || '').toLowerCase() !== String(target).toLowerCase()) {
        return { name: name, ok: false, details: 'Phonetic locale did not persist' };
      }

      // Restore original preference to avoid side-effects for later manual runs
      try {
        if (original && original !== target && win && win.Utils && typeof win.Utils.setQuizPhoneticLocale === 'function') {
          win.Utils.setQuizPhoneticLocale(quizId, original);
        }
      } catch (_) {}

      return { name: name, ok: true };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testQuizSymbolNote(serverRoot, quizId, meta) {
    const name = 'Quiz "' + quizId + '" shows symbol note';
    const iframe = createFrame();
    try {
      const url = serverRoot + '/quiz.html?quiz=' + encodeURIComponent(quizId);
      const nav = await withTimeout(navigateFrame(iframe, url), 6000, 'Quiz did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;
      let start = Date.now();
      while (Date.now() - start < 3000) {
        const note = doc.querySelector('.quiz-symbol-note');
        if (note && (note.textContent || '').trim()) {
          try {
            if (!note.classList.contains('quiz-symbol-note')) {
              return { name: name, ok: false, details: 'Symbol note missing base class' };
            }
            const expectedRole = (meta && meta.symbolNoteRole) || 'note';
            const role = note.getAttribute('role') || '';
            if (role !== expectedRole) {
              return { name: name, ok: false, details: 'Symbol note role mismatch' };
            }
            const cls = meta && meta.symbolNoteClass;
            if (cls && !note.classList.contains(cls)) {
              return { name: name, ok: false, details: 'Symbol note missing class ' + cls };
            }
          } catch (_) {}
          return { name: name, ok: true };
        }
        await wait(100);
      }
      return { name: name, ok: false, details: 'Symbol note not found' };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testHomeResumeLink(serverRoot, quizId) {
    const name = 'Home shows Resume link for last attempt';
    const iframe = createFrame();
    try {
      // Seed last attempt in same-origin storage
      const key = 'thaiQuest.lastAttempt.' + quizId;
      window.StorageService && window.StorageService.setNumber(key, Date.now());

      const nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;
      let start = Date.now();
      while (Date.now() - start < 4000) {
        const link = doc.querySelector('.player-resume .resume-link');
        if (link && /quiz\.html\?quiz=/.test(link.getAttribute('href') || '')) {
          return { name: name, ok: true };
        }
        await wait(100);
      }
      return { name: name, ok: false, details: 'Resume link not visible' };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testHomeCardStars(serverRoot, quizId) {
    const name = 'Home quiz card shows star rating from progress';
    const iframe = createFrame();
    try {
      // Seed 3★ progress (100/100 correct)
      const pkey = 'thaiQuest.progress.' + quizId;
      window.StorageService && window.StorageService.setJSON(pkey, { questionsAnswered: 100, correctAnswers: 100 });
      const akey = 'thaiQuest.lastAttempt.' + quizId;
      window.StorageService && window.StorageService.setNumber(akey, Date.now());
      // Force Browse All view so the quiz cards render with star ratings
      const viewKey = 'thaiQuest.home.viewMode';
      window.StorageService && window.StorageService.setItem(viewKey, 'browse');

      const nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;

      // Find the quiz card by its start link href
      let start = Date.now();
      while (Date.now() - start < 5000) {
        const cards = Array.prototype.slice.call(doc.querySelectorAll('.quiz-card'));
        for (let i = 0; i < cards.length; i++) {
          try {
            const a = cards[i].querySelector('a.start-btn');
            if (a && /quiz\.html\?quiz=/.test(a.getAttribute('href') || '')) {
              const href = new URL(a.getAttribute('href'), serverRoot + '/');
              const q = href.searchParams.get('quiz');
              if (q === quizId) {
                const rating = cards[i].querySelector('.star-rating');
                if (rating && /^★★★/.test(rating.textContent || '')) {
                  return { name: name, ok: true };
                }
              }
            }
          } catch (_) {}
        }
        await wait(100);
      }
      return { name: name, ok: false, details: 'Star rating not found for ' + quizId };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testQuestDefaultLocking(serverRoot) {
    const name = 'Quest mode locks later quests until prerequisites complete';
    const iframe = createFrame();
    const affectedQuizzes = QUEST1_QUIZ_IDS.concat(QUEST2_QUIZ_IDS);
    try {
      clearQuestSmokeArtifacts();

      const nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;

      let questChip = null;
      const chipReady = await waitForCondition(function(){
        questChip = doc.querySelector('.view-chip[data-mode="quest"]');
        return !!questChip;
      }, 5000);
      if (!chipReady || !questChip) return { name: name, ok: false, details: 'Quest toggle not found' };

      click(questChip);

      const switched = await waitForCondition(function(){
        return doc.body && doc.body.classList && doc.body.classList.contains('quest-mode') && doc.querySelectorAll('.quest-card').length > 0;
      }, 5000);
      if (!switched) return { name: name, ok: false, details: 'Quest view did not activate' };

      const quest1 = findQuestCard(doc, 'Quest 1');
      const quest2 = findQuestCard(doc, 'Quest 2');
      if (!quest1 || !quest2) return { name: name, ok: false, details: 'Quest cards not rendered' };

      if (!quest2.classList.contains('preview')) return { name: name, ok: false, details: 'Quest 2 should be in preview mode' };
      const overlay = quest2.querySelector('.quest-lock-overlay');
      const overlayMsg = overlay && overlay.querySelector('.quest-lock-message');
      const overlayText = overlayMsg && overlayMsg.textContent || '';
      if (!overlay || overlayText.indexOf('Finish') === -1) {
        return { name: name, ok: false, details: 'Quest 2 lock overlay missing' };
      }

      const firstChip = quest1.querySelector('.quest-quiz');
      const firstMeta = firstChip && firstChip.querySelector('.quest-quiz-meta');
      const metaText = firstMeta && firstMeta.textContent || '';
      if (!firstChip || metaText.indexOf('Questions: 0/100') === -1 || metaText.indexOf('Stars: 0/3') === -1) {
        return { name: name, ok: false, details: 'Quest 1 chip meta not showing progress baseline' };
      }

      const nextChip = quest1.querySelector('.quest-quiz.next');
      if (!nextChip) return { name: name, ok: false, details: 'Next target chip missing on Quest 1' };

      const lockedChips = quest1.querySelectorAll('.quest-quiz.locked');
      if (!lockedChips || lockedChips.length === 0) {
        return { name: name, ok: false, details: 'Quest 1 should lock later quizzes until started' };
      }

      const startBtn = quest1.querySelector('.quest-actions .quest-action-btn');
      const startText = startBtn && startBtn.textContent || '';
      if (!startBtn || startText.toLowerCase().indexOf('start quest') === -1) {
        return { name: name, ok: false, details: 'Quest 1 start button missing' };
      }

      return { name: name, ok: true };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      clearQuestSmokeArtifacts();
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function testQuestUnlockFlow(serverRoot) {
    const name = 'Quest unlocks once previous quest earns stars';
    const iframe = createFrame();
    try {
      const targetStarAnswered = 100;
      const targetStarCorrect = 95;
      for (let i = 0; i < QUEST1_QUIZ_IDS.length; i++) {
        setQuizProgressForSmoke(QUEST1_QUIZ_IDS[i], targetStarAnswered, targetStarCorrect);
      }
      clearManyQuizProgress(QUEST2_QUIZ_IDS);
      clearQuestCollapseState(QUEST1_ID);
      clearQuestCollapseState(QUEST2_ID);
      setHomeViewMode('quest');

      const nav = await withTimeout(navigateFrame(iframe, serverRoot + '/index.html'), 6000, 'Home did not load');
      if (!nav.ok) return { name: name, ok: false, details: String(nav.error) };
      const doc = nav.doc;

      const questReady = await waitForCondition(function(){
        const card = findQuestCard(doc, 'Quest 1');
        const progress = card && card.querySelector('.quest-progress');
        const finished = card && card.querySelector('.quest-finished');
        return !!(card && progress && finished && /5\s*\/\s*5/.test(progress.textContent || ''));
      }, 6000);
      if (!questReady) return { name: name, ok: false, details: 'Quest 1 did not reflect completion' };

      let quest1 = findQuestCard(doc, 'Quest 1');
      if (!quest1) return { name: name, ok: false, details: 'Quest 1 card missing after completion' };
      const completedChips = quest1.querySelectorAll('.quest-quiz.complete');
      if (!completedChips || completedChips.length !== QUEST1_QUIZ_IDS.length) {
        return { name: name, ok: false, details: 'Quest 1 chips not all marked complete' };
      }
      const collapseBtn = quest1.querySelector('.quest-collapse-btn');
      if (!collapseBtn) return { name: name, ok: false, details: 'Collapse toggle missing on completed quest' };

      const quest2 = findQuestCard(doc, 'Quest 2');
      if (!quest2) return { name: name, ok: false, details: 'Quest 2 card missing' };
      if (quest2.classList.contains('preview')) {
        return { name: name, ok: false, details: 'Quest 2 should unlock after Quest 1 completion' };
      }
      if (quest2.querySelector('.quest-lock-overlay')) {
        return { name: name, ok: false, details: 'Quest 2 lock overlay still visible after unlock' };
      }

      const quest2Next = quest2.querySelector('.quest-quiz.next');
      if (!quest2Next) return { name: name, ok: false, details: 'Quest 2 next quiz highlight missing' };
      const quest2Locked = quest2.querySelectorAll('.quest-quiz.locked');
      if (!quest2Locked || quest2Locked.length !== (QUEST2_QUIZ_IDS.length - 1)) {
        return { name: name, ok: false, details: 'Quest 2 locking state unexpected' };
      }

      click(collapseBtn);
      const collapsed = await waitForCondition(function(){
        const card = findQuestCard(doc, 'Quest 1');
        if (!card) return false;
        const btn = card.querySelector('.quest-collapse-btn');
        return card.classList.contains('collapsed') && btn && btn.getAttribute('aria-expanded') === 'false';
      }, 4000);
      if (!collapsed) return { name: name, ok: false, details: 'Quest collapse toggle did not persist' };

      return { name: name, ok: true };
    } catch (e) {
      return { name: name, ok: false, details: String(e && e.message || e) };
    } finally {
      clearQuestSmokeArtifacts();
      Utils.ErrorHandler.safe(function() { iframe.remove(); })();
    }
  }

  async function runAll(onProgress, totalExpected) {
    const results = [];
    const root = (new URL('.', window.location.href)).href.replace(/\/$/, '');
    const stats = {
      quizzesTotal: 0,
      quizzesWithVoice: 0,
      quizzesWithPhonetics: 0,
      quizIdsExercised: 0
    };

    // Optional reset to stabilize tests
    const didReset = maybeResetProgressForAll();
    if (didReset) log('Progress reset for smoke run (thaiQuest.progress.*)', 'muted');

    // Metadata validation (quick, no frames)
    results.push(await validateQuizzesMetadata(root));
    if (typeof onProgress === 'function') onProgress();
    results.push(await validateJSONFiles(root));
    if (typeof onProgress === 'function') onProgress();

    // Home page tests
    results.push(await testHome(root));
    if (typeof onProgress === 'function') onProgress();
    results.push(await testHomeContent(root));
    if (typeof onProgress === 'function') onProgress();
    results.push(await testHomeSearchFilters(root));
    if (typeof onProgress === 'function') onProgress();
    results.push(await testHomePersistCategoryFilter(root));
    if (typeof onProgress === 'function') onProgress();
    results.push(await testQuestDefaultLocking(root));
    if (typeof onProgress === 'function') onProgress();
    results.push(await testQuestUnlockFlow(root));
    if (typeof onProgress === 'function') onProgress();

    // Discover subset of quizzes to run
    let quizIds = await discoverQuizIds(root);
    const params = getParams();
    const onlyList = parseListParam(params.get('quiz'));
    if (onlyList.length) quizIds = quizIds.filter(function(id){ return onlyList.indexOf(id) !== -1; });
    const limit = parseInt(params.get('limit'), 10);
    if (isFinite(limit) && limit > 0) quizIds = quizIds.slice(0, limit);

    // Load metadata so we can pass expected bodyClass and pick special cases
    let metaMap = {};
    try {
      const res = await withTimeout(fetch(root + '/data/quizzes.json', { cache: 'no-cache' }), 5000, 'Could not fetch quizzes.json');
      if (res && res.ok) {
        const list = await res.json();
        (Array.isArray(list) ? list : []).forEach(function(it){
          if (!it || !it.id) return;
          if (it.visible === false) return;
          metaMap[it.id] = it;
        });
      }
    } catch (_) {}

    const metaKeys = Object.keys(metaMap);
    stats.quizzesTotal = metaKeys.length;
    for (let i = 0; i < metaKeys.length; i++) {
      const m = metaMap[metaKeys[i]] || {};
      if (m.supportsVoice) stats.quizzesWithVoice += 1;
      if (m.supportsPhonetics) stats.quizzesWithPhonetics += 1;
    }

    for (let i = 0; i < quizIds.length; i++) {
      const id = quizIds[i];
      const meta = metaMap[id] || {};
      results.push(await testQuiz(root, id, {
        minChoices: 4,
        expectedBodyClass: meta.bodyClass,
        voiceSupported: !!meta.supportsVoice,
        phoneticsSupported: !!meta.supportsPhonetics,
        phoneticLocales: Array.isArray(meta.phoneticLocales) ? meta.phoneticLocales : null
      }));
      // Add a focused keyboard test for the first discovered quiz only (fast)
      if (typeof onProgress === 'function') onProgress();
      if (i === 0) {
        results.push(await testKeyboardFocus(root, id));
        if (typeof onProgress === 'function') onProgress();
      }
    }
    stats.quizIdsExercised = quizIds.length;

    // Pick one quiz with a proTip and one with symbolNote to expand coverage
    try {
      const withProTip = Object.keys(metaMap).find(function(k){ return metaMap[k] && metaMap[k].proTip; });
      if (withProTip) {
        results.push(await testQuizProTip(root, withProTip));
        if (typeof onProgress === 'function') onProgress();
      }
    } catch (_) {}
    try {
      const withSymbolNote = Object.keys(metaMap).find(function(k){ return metaMap[k] && metaMap[k].symbolNote; });
      if (withSymbolNote) {
        results.push(await testQuizSymbolNote(root, withSymbolNote, metaMap[withSymbolNote]));
        if (typeof onProgress === 'function') onProgress();
      }
    } catch (_) {}
    try {
      const withVoice = Object.keys(metaMap).find(function(k){ return metaMap[k] && metaMap[k].supportsVoice; });
      if (withVoice) {
        results.push(await testQuizVoiceControls(root, withVoice));
        if (typeof onProgress === 'function') onProgress();
      }
    } catch (_) {}
    try {
      const withPhonetics = Object.keys(metaMap).find(function(k){ return metaMap[k] && metaMap[k].supportsPhonetics; });
      if (withPhonetics) {
        results.push(await testQuizPhoneticsControls(root, withPhonetics, metaMap[withPhonetics]));
        if (typeof onProgress === 'function') onProgress();
        results.push(await testQuizPhoneticsPersistence(root, withPhonetics));
        if (typeof onProgress === 'function') onProgress();
      }
    } catch (_) {}

    // Home resume link and card stars using a discovered quiz id (first)
    if (quizIds.length > 0) {
      results.push(await testHomeResumeLink(root, quizIds[0]));
      if (typeof onProgress === 'function') onProgress();
      results.push(await testHomeCardStars(root, quizIds[0]));
      if (typeof onProgress === 'function') onProgress();
    }

    return { results: results, stats: stats };
  }

  function renderResults(results, durationMs, stats) {
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
    if (stats) {
      const lines = [];
      lines.push('Quizzes in metadata: ' + stats.quizzesTotal);
      lines.push('Voice-enabled quizzes: ' + stats.quizzesWithVoice);
      lines.push('Phonetics-enabled quizzes: ' + stats.quizzesWithPhonetics);
      lines.push('Quizzes exercised this run: ' + stats.quizIdsExercised);
      lines.forEach(function(line){ log(line, 'muted'); });
    }
    setProgressBar(100);
  }

  function ensureServerWarning() {
    if (window.location.protocol === 'file:') {
      log('This page must be served from a local web server so JSON can be fetched (e.g., python3 -m http.server).', 'fail');
    }
  }

  function setProgressBar(percent) {
    try {
      const container = document.getElementById('progress');
      if (!container) return;
      const bar = container.querySelector('.progress-bar');
      if (!bar) return;
      let value = Number(percent);
      if (!isFinite(value)) value = 0;
      value = Math.max(0, Math.min(100, value));
      bar.style.width = value + '%';
      container.setAttribute('aria-valuenow', String(Math.round(value)));
    } catch (_) {}
  }

  function resetProgressBar() {
    setProgressBar(0);
  }

  function createProgressUpdater(totalChecks) {
    let completed = 0;
    const total = Math.max(1, Math.floor(Number(totalChecks)) || 1);
    setProgressBar(0);
    return function incrementProgress(){
      completed += 1;
      const pct = completed >= total ? 100 : (completed / total) * 100;
      setProgressBar(pct);
    };
  }

  async function estimateTotalChecks() {
    try {
      const root = (new URL('.', window.location.href)).href.replace(/\/$/, '');
      let total = 6; // metadata + JSON + home tests

      let quizIds = await discoverQuizIds(root);
      const params = getParams();
      const onlyList = parseListParam(params.get('quiz'));
      if (onlyList.length) quizIds = quizIds.filter(function(id){ return onlyList.indexOf(id) !== -1; });
      const limit = parseInt(params.get('limit'), 10);
      if (isFinite(limit) && limit > 0) quizIds = quizIds.slice(0, limit);

      total += quizIds.length; // per-quiz checks
      if (quizIds.length > 0) total += 1; // keyboard focus for first quiz

      let metadata = [];
      try {
        const res = await withTimeout(fetch(root + '/data/quizzes.json', { cache: 'no-cache' }), 5000, 'Could not fetch quizzes.json');
        if (res && res.ok) metadata = await res.json();
      } catch (_) {}

      const list = Array.isArray(metadata) ? metadata : [];
      const hasProTip = list.some(function(it){ return it && it.proTip; });
      const hasSymbolNote = list.some(function(it){ return it && it.symbolNote; });
      const hasVoice = list.some(function(it){ return it && it.supportsVoice; });
      const hasPhonetics = list.some(function(it){ return it && it.supportsPhonetics; });

      if (hasProTip) total += 1;
      if (hasSymbolNote) total += 1;
      if (hasVoice) total += 1;
      if (hasPhonetics) total += 2; // controls + persistence
      if (quizIds.length > 0) total += 2; // resume link + card stars

      return Math.max(total, 6);
    } catch (_) {
      return 25;
    }
  }

  function wire() {
    const btn = document.getElementById('runBtn');
    btn.onclick = async function(){
      btn.disabled = true;
      setStatus('Running...');
      resetProgressBar();
      const start = performance.now();
      try {
        let totalChecks;
        try {
          totalChecks = await estimateTotalChecks();
        } catch (_) {
          totalChecks = 25;
        }
        if (!isFinite(totalChecks) || totalChecks <= 0) totalChecks = 1;
        const bump = createProgressUpdater(totalChecks);
        const bundle = await runAll(bump, totalChecks);
        renderResults(bundle && bundle.results ? bundle.results : [], Math.round(performance.now() - start), bundle && bundle.stats);
      } catch (err) {
        const msg = (err && err.message) ? err.message : String(err);
        log('✖ Smoke run aborted — ' + msg, 'fail');
        setStatus('Run aborted.');
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
