(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.util = NS.util || {};
  var logError = (NS.core && NS.core.error && NS.core.error.logError) || function(){};

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
        if (!needle) return null;
        var h = String(hay);
        var n = String(needle);
        if (!n) return null;
        if (opts && opts.mode === 'regex') {
          var m = (opts.regex).exec(h);
          if (m) return { start: m.index, end: m.index + m[0].length, kind: opts.kind };
          return null;
        }
        if (opts && opts.caseInsensitive) {
          var lc = h.toLowerCase();
          var ni = n.toLowerCase();
          var idx = lc.indexOf(ni);
          if (idx >= 0) return { start: idx, end: idx + ni.length, kind: opts.kind };
          return null;
        }
        var idx2 = h.indexOf(n);
        if (idx2 >= 0) return { start: idx2, end: idx2 + n.length, kind: opts.kind };
        return null;
      }

      var candidates = [];
      try {
        var eng = highlight.english || '';
        var th = highlight.thai || '';
        var ph = highlight.phonetic || '';
        var rEng = findRange(raw, eng, { caseInsensitive: true, kind: 'eng' });
        if (rEng) candidates.push(rEng);
        var rTh = findRange(raw, th, { kind: 'th' });
        if (rTh) candidates.push(rTh);
        var rPh = findRange(raw, ph, { caseInsensitive: true, kind: 'ph' });
        if (rPh) candidates.push(rPh);
      } catch (_) {}

      if (candidates.length === 0) {
        frag.appendChild(doc.createTextNode(raw));
        return frag;
      }

      candidates.sort(function(a, b){ if (a.start === b.start) return (b.end - b.start) - (a.end - a.start); return a.start - b.start; });
      var merged = [];
      for (var ci = 0; ci < candidates.length; ci++) {
        var c = candidates[ci];
        var last = merged[merged.length - 1];
        if (!last || c.start >= last.end) { merged.push(c); }
      }
      var cursor = 0;
      for (var mi = 0; mi < merged.length; mi++) {
        var m = merged[mi];
        if (cursor < m.start) { frag.appendChild(doc.createTextNode(raw.slice(cursor, m.start))); }
        var mark = doc.createElement('mark');
        mark.className = 'sel' + (m.kind ? (' sel-' + m.kind) : '');
        mark.textContent = raw.slice(m.start, m.end);
        frag.appendChild(mark);
        cursor = m.end;
      }
      if (cursor < raw.length) { frag.appendChild(doc.createTextNode(raw.slice(cursor))); }
      return frag;
    } catch (e) { logError(e, 'util.text.buildHighlightedNodes'); var f = global.document.createDocumentFragment(); f.appendChild(global.document.createTextNode(String(text || ''))); return f; }
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
    try { if (ans.phonetic) out.phonetic = String(ans.phonetic); } catch (_) {}
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

