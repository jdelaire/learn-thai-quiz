(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.util = NS.util || {};
  var logError = (NS.core && NS.core.error && NS.core.error.logError) || function(){};
  var phonetics = (NS.quiz && NS.quiz.phonetics) || {};

  function escapeRegExp(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function buildHighlightedNodes(text, highlight){
    try {
      var raw = String(text == null ? '' : text);
      var doc = global.document;
      var frag = doc.createDocumentFragment();
      if (!highlight || (!highlight.english && !highlight.thai && !highlight.phonetic)) {
        frag.appendChild(doc.createTextNode(raw));
        return frag;
      }

      function findRange(hay, needle, opts){
        if (!needle && !(opts && opts.mode === 'regex')) return null;
        var h = String(hay);
        if (opts && opts.mode === 'regex' && opts.regex) {
          var match = opts.regex.exec(h);
          if (match) return { start: match.index, end: match.index + match[0].length, kind: opts.kind };
          return null;
        }
        var n = String(needle);
        if (!n) return null;
        if (opts && opts.caseInsensitive) {
          var lc = h.toLowerCase();
          var ni = n.toLowerCase();
          var idx = lc.indexOf(ni);
          if (idx >= 0) return { start: idx, end: idx + ni.length, kind: opts.kind };
          return null;
        }
        var idx = h.indexOf(n);
        return idx >= 0 ? { start: idx, end: idx + n.length, kind: opts && opts.kind } : null;
      }

      function pushCandidate(val, optsPrimary, optsFallback){
        var candidate = findRange(raw, null, optsPrimary);
        if (!candidate && optsFallback) {
          candidate = findRange(raw, val, optsFallback);
        }
        if (!candidate && optsPrimary && optsPrimary.kind === 'eng' && val) {
          candidate = findRange(raw, val, { caseInsensitive: true, kind: optsPrimary.kind });
        }
        if (candidate) return candidate;
        return null;
      }

      var eng = '';
      var th = '';
      var ph = '';
      try { if (highlight.english != null) eng = String(highlight.english).trim(); } catch (_) {}
      try { if (highlight.thai != null) th = String(highlight.thai).trim(); } catch (_) {}
      try { if (highlight.phonetic != null) ph = String(highlight.phonetic).trim(); } catch (_) {}

      var candidates = [];
      if (eng) {
        try {
          var re = null;
          try { re = new RegExp('\\b' + escapeRegExp(eng) + '\\b', 'i'); } catch (_) {}
          var engCandidate = pushCandidate(eng, { mode: 'regex', regex: re, kind: 'eng' }, null);
          if (engCandidate) candidates.push(engCandidate);
        } catch (_) {}
      }

      if (th) {
        try {
          var thCandidate = findRange(raw, th, { kind: 'th' });
          if (thCandidate) candidates.push(thCandidate);
        } catch (_) {}
      }

      if (ph) {
        try {
          var phCandidate = findRange(raw, ph, { caseInsensitive: true, kind: 'ph' });
          if (phCandidate) candidates.push(phCandidate);
        } catch (_) {}
      }

      if (candidates.length === 0) {
        if (eng || th || ph) {
          var manual = doc.createDocumentFragment();
          var appended = false;
          function appendMarked(value, kind, prefix){
            if (!value) return;
            if (prefix) manual.appendChild(doc.createTextNode(prefix));
            var mark = doc.createElement('mark');
            mark.className = 'sel' + (kind ? (' sel-' + kind) : '');
            mark.textContent = value;
            manual.appendChild(mark);
            appended = true;
          }
          appendMarked(eng, 'eng', '');
          appendMarked(th, 'th', eng ? ' → ' : '');
          appendMarked(ph, 'ph', (eng || th) ? ' — ' : '');
          if (appended) {
            return manual;
          }
        }
        frag.appendChild(doc.createTextNode(raw));
        return frag;
      }

      candidates.sort(function(a, b){
        if (a.start === b.start) return (b.end - b.start) - (a.end - a.start);
        return a.start - b.start;
      });
      var merged = [];
      for (var ci = 0; ci < candidates.length; ci++) {
        var c = candidates[ci];
        var last = merged[merged.length - 1];
        if (!last || c.start >= last.end) {
          merged.push(c);
        }
      }
      var cursor = 0;
      for (var mi = 0; mi < merged.length; mi++) {
        var m = merged[mi];
        if (cursor < m.start) {
          frag.appendChild(doc.createTextNode(raw.slice(cursor, m.start)));
        }
        var mark = doc.createElement('mark');
        mark.className = 'sel' + (m.kind ? (' sel-' + m.kind) : '');
        mark.textContent = raw.slice(m.start, m.end);
        frag.appendChild(mark);
        cursor = m.end;
      }
      if (cursor < raw.length) {
        frag.appendChild(doc.createTextNode(raw.slice(cursor)));
      }
      return frag;
    } catch (e) {
      logError(e, 'util.text.buildHighlightedNodes');
      try {
        var fallbackFrag = global.document.createDocumentFragment();
        fallbackFrag.appendChild(global.document.createTextNode(String(text || '')));
        return fallbackFrag;
      } catch (_) {
        return null;
      }
    }
  }

  function normalizeAnswer(ans, answerKey){
    var out = { english: '', thai: '', phonetic: '' };
    try {
      if (!ans) return out;
      if (typeof ans.english === 'string') out.english = ans.english;
      else if (ans.number != null) out.english = String(ans.number);
      else if (answerKey && typeof ans[answerKey] === 'string') out.english = ans[answerKey];
    } catch (_) {}
    try { if (ans.thai) out.thai = String(ans.thai); else if (ans.symbol) out.thai = String(ans.symbol); } catch (_) {}
    try {
      if (phonetics && typeof phonetics.getPhoneticBundle === 'function') {
        var bundle = phonetics.getPhoneticBundle(ans);
        if (bundle && (bundle.display || bundle.canonical)) {
          out.phonetic = String(bundle.display || bundle.canonical || '');
        }
      }
      if (!out.phonetic && ans && ans.phonetic) out.phonetic = String(ans.phonetic);
    } catch (_) {}
    return out;
  }

  function formatExample(ans, opts){
    try {
      var n = normalizeAnswer(ans, opts && opts.answerKey);
      var parts = [];
      if (n.english) parts.push(n.english);
      if (n.thai) parts.push(' → ' + n.thai);
      if (n.phonetic) parts.push(' — ' + n.phonetic);
      var text = parts.join(' ');
      var highlight = { english: n.english || '', thai: n.thai || '', phonetic: n.phonetic || '' };
      return { text: text, highlight: highlight };
    } catch (e) { logError(e, 'util.text.formatExample'); return { text: '', highlight: { english: '', thai: '', phonetic: '' } }; }
  }

  NS.util.text = { buildHighlightedNodes: buildHighlightedNodes, formatExample: formatExample, normalizeAnswer: normalizeAnswer };
})(window);
