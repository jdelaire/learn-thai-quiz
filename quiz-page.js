(function(){
  function getQueryParam(name){
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function setupColors(){
    const baseColors = (window.ThaiData && window.ThaiData.colors && window.ThaiData.colors.baseColors) || [];
    const modifiers = (window.ThaiData && window.ThaiData.colors && window.ThaiData.colors.modifiers) || [];

    function hexToRgb(hex){ const h = hex.replace('#',''); const bigint = parseInt(h, 16); return { r: (bigint>>16)&255, g: (bigint>>8)&255, b: bigint&255 }; }
    function rgbToHex(r,g,b){ const toHex = (x)=>x.toString(16).padStart(2,'0'); return `#${toHex(clamp(Math.round(r),0,255))}${toHex(clamp(Math.round(g),0,255))}${toHex(clamp(Math.round(b),0,255))}`; }
    function rgbToHsl(r,g,b){ r/=255; g/=255; b/=255; const max=Math.max(r,g,b), min=Math.min(r,g,b); let h,s,l=(max+min)/2; if(max===min){ h=s=0; } else { const d=max-min; s=l>0.5? d/(2-max-min): d/(max+min); switch(max){ case r: h=(g-b)/d+(g<b?6:0); break; case g: h=(b-r)/d+2; break; case b: h=(r-g)/d+4; break; } h/=6; } return {h,s,l}; }
    function hslToRgb(h,s,l){ let r,g,b; if(s===0){ r=g=b=l; } else { const hue2rgb=(p,q,t)=>{ if(t<0) t+=1; if(t>1) t-=1; if(t<1/6) return p+(q-p)*6*t; if(t<1/2) return q; if(t<2/3) return p+(q-p)*(2/3-t)*6; return p; }; const q=l<0.5? l*(1+s): l+s-l*s; const p=2*l-q; r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3); } return { r:r*255, g:g*255, b:b*255 }; }
    function adjustLightness(hex, delta){ const {r,g,b}=hexToRgb(hex); const {h,s,l}=rgbToHsl(r,g,b); const newL=clamp(l+delta,0,1); const {r:nr,g:ng,b:nb}=hslToRgb(h,s,newL); return rgbToHex(nr,ng,nb); }
    function getDisplayHex(baseHex, modifier){ if(!modifier) return baseHex; if(/^light$/i.test(modifier.english)) return adjustLightness(baseHex, 0.25); if(/^dark$/i.test(modifier.english)) return adjustLightness(baseHex, -0.25); return baseHex; }
    function buildColorPhrase(base, maybeModifier){ const hasBuiltInShade = /(^|\s)(dark|light)\s/i.test(base.english); const useModifier = !!maybeModifier && !hasBuiltInShade; const thai = useModifier ? `${base.thai} ${maybeModifier.thai}` : base.thai; const phonetic = useModifier ? `${base.phonetic} ${maybeModifier.phonetic}` : base.phonetic; const english = useModifier ? `${maybeModifier.english} ${base.english}` : base.english; const hex = useModifier ? getDisplayHex(base.hex, maybeModifier) : base.hex; return { english, thai, phonetic, hex }; }

    return {
      title: 'Thai Color Quiz',
      subtitle: 'Choose the correct phonetic for the Thai color',
      pickRound: () => {
        const base = baseColors[Math.floor(Math.random()*baseColors.length)];
        const maybeModifier = Math.random() < 0.55 ? modifiers[Math.floor(Math.random()*modifiers.length)] : null;
        const answer = buildColorPhrase(base, maybeModifier);
        const choices = [answer];
        while (choices.length < 4) {
          const b = baseColors[Math.floor(Math.random()*baseColors.length)];
          const m = Math.random() < 0.45 ? modifiers[Math.floor(Math.random()*modifiers.length)] : null;
          const choice = buildColorPhrase(b, m);
          if (!choices.find(c => c.phonetic === choice.phonetic)) choices.push(choice);
        }
        return { answer, choices, symbolText: answer.thai, symbolStyle: { color: answer.hex }, symbolAriaLabel: `Thai color phrase: ${answer.thai}` };
      },
      renderButtonContent: (choice) => choice.phonetic,
      ariaLabelForChoice: (choice) => `Answer: ${choice.phonetic}`,
      isCorrect: (choice, answer) => choice.phonetic === answer.phonetic
    };
  }

  function setupNumbers(){
    const data = (window.ThaiData && window.ThaiData.numbers) || [];
    return {
      title: 'Thai Numbers Quiz',
      subtitle: 'Choose the correct phonetic for the Thai number',
      pickRound: () => {
        const answer = data[Math.floor(Math.random() * data.length)];
        const choices = [answer];
        while (choices.length < 4) {
          const rand = data[Math.floor(Math.random() * data.length)];
          if (!choices.find(c => c.phonetic === rand.phonetic)) choices.push(rand);
        }
        const symbolText = `${answer.number}  ${answer.thai}`;
        const symbolAriaLabel = `Number and Thai: ${answer.number} ${answer.thai}`;
        return { answer, choices, symbolText, symbolAriaLabel };
      },
      renderButtonContent: (choice) => choice.phonetic,
      ariaLabelForChoice: (choice) => `Answer: ${choice.phonetic}`,
      isCorrect: (choice, answer) => choice.phonetic === answer.phonetic
    };
  }

  function setupVowels(){
    const data = (window.ThaiData && window.ThaiData.vowels) || [];
    return {
      title: 'Thai Vowel Quiz',
      subtitle: '',
      pickRound: () => {
        const answer = data[Math.floor(Math.random()*data.length)];
        const choices = [answer];
        while (choices.length < 4) {
          const rand = data[Math.floor(Math.random()*data.length)];
          if (!choices.includes(rand)) choices.push(rand);
        }
        return { answer, choices, symbolText: answer.symbol };
      },
      renderButtonContent: (choice) => choice.sound,
      isCorrect: (choice, answer) => choice.sound === answer.sound
    };
  }

  function setupConsonants(){
    const data = (window.ThaiData && window.ThaiData.consonants) || [];
    return {
      title: 'Thai Consonant Quiz',
      subtitle: '',
      pickRound: (state) => {
        const answer = data[Math.floor(Math.random()*data.length)];
        const choices = [answer];
        const numChoices = state.correctAnswers >= 30 ? 6 : 4;
        while (choices.length < numChoices) {
          const rand = data[Math.floor(Math.random()*data.length)];
          if (!choices.find(c => c.name === rand.name)) choices.push(rand);
        }
        return { answer, choices };
      },
      renderSymbol: (answer, els) => {
        els.symbolEl.textContent = answer.symbol;
        els.symbolEl.setAttribute('aria-label', `Thai consonant symbol: ${answer.symbol}`);
      },
      renderButtonContent: (choice, state) => {
        const hideEmojis = state.correctAnswers >= 50;
        return hideEmojis ? `${choice.name}` : `<span class="emoji">${choice.emoji}</span> ${choice.name}`;
      },
      ariaLabelForChoice: (choice) => `Answer: ${choice.name} (${choice.meaning})`,
      decorateButton: (btn, choice) => { btn.classList.add(`${choice.class}-class`); },
      isCorrect: (choice, answer) => choice.name === answer.name
    };
  }

  function setupTime(){
    const time = (window.ThaiData && window.ThaiData.time) || { keyWords:[], timeFormats:[], examples:[] };
    const pool = [...time.keyWords, ...time.timeFormats, ...time.examples];
    function englishOf(item){ return item.english || item.note || item.translation || ''; }

    return {
      title: 'Thai Time Quiz',
      subtitle: 'Choose the correct phonetic for the Thai time phrase',
      pickRound: () => {
        const answer = pool[Math.floor(Math.random()*pool.length)];
        const choices = [answer];
        while (choices.length < 4) {
          const rand = pool[Math.floor(Math.random()*pool.length)];
          if (!choices.find(c => c.phonetic === rand.phonetic)) choices.push(rand);
        }
        const symbolAriaLabel = `Thai and English: ${answer.thai} — ${englishOf(answer)}`;
        return { answer, choices, symbolAriaLabel };
      },
      renderSymbol: (answer, els) => {
        const english = englishOf(answer);
        const thai = answer.thai || '';
        els.symbolEl.innerHTML = `${thai}${english ? `<span class="secondary">${english}</span>` : ''}`;
        els.symbolEl.setAttribute('aria-label', `Thai and English: ${thai}${english ? ' — ' + english : ''}`);
      },
      renderButtonContent: (choice) => choice.phonetic,
      ariaLabelForChoice: (choice) => `Answer: ${choice.phonetic}`,
      isCorrect: (choice, answer) => choice.phonetic === answer.phonetic
    };
  }

  function setupQuestions(){
    const q = (window.ThaiData && window.ThaiData.questions) || { data: [], examples: {} };
    return {
      title: 'Thai Questions Quiz',
      subtitle: 'Choose the correct phonetic for the Thai question word or pattern',
      pickRound: () => {
        const answer = q.data[Math.floor(Math.random()*q.data.length)];
        const choices = [answer];
        while (choices.length < 4) {
          const rand = q.data[Math.floor(Math.random()*q.data.length)];
          if (!choices.find(c => c.phonetic === rand.phonetic)) choices.push(rand);
        }
        const symbolAriaLabel = `Thai and English: ${answer.thai} — ${answer.english}`;
        return { answer, choices, symbolAriaLabel };
      },
      renderSymbol: (answer, els) => {
        const thai = answer.thai || '';
        const english = answer.english || '';
        els.symbolEl.innerHTML = `${thai}${english ? `<span class="secondary">${english}</span>` : ''}`;
        els.symbolEl.setAttribute('aria-label', `Thai and English: ${thai}${english ? ' — ' + english : ''}`);
      },
      renderButtonContent: (choice) => choice.phonetic,
      ariaLabelForChoice: (choice) => `Answer: ${choice.phonetic}`,
      isCorrect: (choice, answer) => choice.phonetic === answer.phonetic,
      onAnswered: ({ correct, answer, state }) => {
        if (!correct) return;
        try {
          const fb = document.getElementById('feedback');
          const ex = q.examples[answer.english];
          fb.innerHTML = ex ? `<div class="correct-line">✅ Correct!</div><div class="example" aria-label="Example sentence"><span class="label">Example</span><div class="text">${ex}</div></div>` : '<div class="correct-line">✅ Correct!</div>';
          if (state && state.autoAdvanceTimerId != null) { clearTimeout(state.autoAdvanceTimerId); }
          state.autoAdvanceTimerId = setTimeout(() => { const next = document.getElementById('nextBtn'); if (next && next.style.display !== 'none') next.click(); }, 3000);
        } catch(e){}
      }
    };
  }

  const type = (getQueryParam('type') || '').toLowerCase();
  const registry = {
    colors: setupColors,
    numbers: setupNumbers,
    vowels: setupVowels,
    consonants: setupConsonants,
    time: setupTime,
    questions: setupQuestions
  };

  const builder = registry[type] || registry.consonants;
  const cfg = builder();

  // Set page headings
  const h1 = document.querySelector('h1');
  const subtitleEl = document.querySelector('.subtitle');
  if (h1 && cfg.title) h1.textContent = cfg.title;
  if (subtitleEl && cfg.subtitle) subtitleEl.textContent = cfg.subtitle;

  // Add type-specific body class to reuse existing styles
  if (type && /^(colors|numbers|vowels|consonants|time|questions)$/.test(type)) {
    document.body.classList.add(type + '-quiz');
  }

  // Inject small type-specific UI elements preserved from legacy pages
  if (type === 'consonants') {
    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = '<span class="legend-item"><span class="legend-color middle-class"></span> Middle Class</span>'+
                       '<span class="legend-item"><span class="legend-color high-class"></span> High Class</span>'+
                       '<span class="legend-item"><span class="legend-color low-class"></span> Low Class</span>';
    const h1El = document.querySelector('h1');
    if (h1El && h1El.parentNode) {
      h1El.parentNode.insertBefore(legend, h1El.nextSibling);
    }
  } else if (type === 'numbers') {
    const footer = document.querySelector('.footer');
    if (footer) {
      const tip = document.createElement('div');
      tip.className = 'pro-tip';
      tip.innerHTML = '<small>Pro tip: Insert a classifier after the number for counting. e.g., 2 bottles = <strong>สองขวด</strong> (<em>sɔ̌ɔŋ khùat</em>), 5 people = <strong>ห้าคน</strong> (<em>hâa khon</em>).</small>';
      footer.appendChild(tip);
    }
  }

  ThaiQuiz.setupQuiz({
    elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' },
    pickRound: cfg.pickRound,
    renderSymbol: cfg.renderSymbol,
    renderButtonContent: cfg.renderButtonContent,
    ariaLabelForChoice: cfg.ariaLabelForChoice,
    decorateButton: cfg.decorateButton,
    isCorrect: cfg.isCorrect,
    onAnswered: cfg.onAnswered
  });
})();