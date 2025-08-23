## ThaiQuest

Interactive, mobile‑friendly quizzes to learn Thai: consonants, vowels, colors, numbers, time, question patterns, family vocabulary, and common classifiers. Built with plain HTML/CSS/JS and JSON data files. No build step required.

### Live demo

Hosted with GitHub Pages: [https://jdelaire.github.io/learn-thai-quiz](https://jdelaire.github.io/learn-thai-quiz)

### Features

- **Multiple quizzes**: Consonants, Vowels, Colors (with modifiers), Numbers, Time, Questions, Family, Classifiers
- **Clean UI**: Responsive layout, touch‑friendly buttons, subtle animations for correct/incorrect answers
- **Search and filter**: Find quizzes by keyword and category chips on the home page
- **Accessibility**: ARIA labels, semantic roles, live regions, keyboard shortcuts (1–9 to select options)
- **Auto‑advance**: Moves to the next question after a correct answer; tracks questions answered and accuracy
- **JSON‑driven**: Easy to add or tweak data without changing runtime code

### Quizzes included

- **Consonants**: All 44 Thai consonants with meanings and tone classes (color‑coded)
- **Vowels**: 32 Thai vowels, symbols and sounds. On some browsers a placeholder consonant ก ("goo gai") is shown to indicate where a vowel attaches; it's not part of the answer.
- **Colors**: Base colors plus light/dark modifiers; renders Thai text in the color tone
- **Numbers**: From 0 upward, with Thai script and phonetics; classifier tips included
- **Time**: Keywords, AM/PM patterns, and practical phrases
- **Questions**: Core question words and common patterns; shows an example sentence after correct answers
- **Tone Markers**: Resulting tones from consonant class + tone mark + vowel length
- **Verbs**: Common action verbs with English/Thai/phonetics and example sentences
- **Family**: Immediate and extended family members with Thai script and phonetics
- **Classifiers**: Common classifiers with example sentences and helpful emojis
- **Rooms**: House and room vocabulary with example sentences and usage tips
- **Jobs**: Common jobs and occupations with Thai script and phonetics
- **Foods**: Common Thai foods, fruits, and cooking methods with phonetics and example phrases
- **Months & Seasons**: 12 months and Thailand’s seasons with Thai script, phonetics, and example sentences
- **Tense Markers**: Thai time words and structures; examples after correct answers
- **Days of the Week**: Thai day names with phonetics, planet, and color associations

### Quick start (local)

Because the app fetches JSON files, use a local web server (opening `index.html` via `file://` will block fetches).

```bash
cd /Users/jdelaire/sources/learn-thai-quiz
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in your browser.

Any static server works (Node, Ruby, nginx, etc.).

### Smoke tests (no libraries)

Run quick end-to-end checks in your browser:

1. Start a local server from the project root so JSON can load.

```bash
python3 -m http.server 8000
```

2. Open `http://localhost:8000/smoke.html` and click “Run Smoke Tests”.

What it does:
- Loads `index.html` in a hidden iframe and verifies it loads successfully.
- Auto-discovers all quizzes from `data/quizzes.json` (fallback: parses links on the home page) and runs each via `quiz.html?quiz=<id>`.
- Ensures options render, clicks an option, verifies stats update, and catches runtime errors.
- Reports pass/fail per check; no external dependencies.

#### Extending smoke tests when you add a quiz

When you create a new quiz (add a builder in `quiz-loader.js` and an entry in `data/quizzes.json`), extend the smoke tests so it’s covered:

You usually don’t need to update `smoke.js` when you add a quiz, because it auto‑discovers quizzes from `data/quizzes.json`.

Example: verify that the Color quiz sets an accessible aria‑label on the symbol.

```javascript
// smoke.js
async function testColorsAria(serverRoot) {
  const iframe = document.createElement('iframe');
  iframe.className = 'smoke-frame';
  document.body.appendChild(iframe);
  try {
    const res = await withTimeout(navigateFrame(iframe, serverRoot + '/quiz.html?quiz=colors'), 6000, 'Colors did not load');
    if (!res.ok) return { name: 'Colors aria label', ok: false, details: String(res.error) };
    const symbol = res.doc.querySelector('#symbol');
    const aria = symbol && symbol.getAttribute('aria-label');
    if (!aria || !/Thai color phrase:/i.test(aria)) {
      return { name: 'Colors aria label', ok: false, details: 'Missing or incorrect aria-label' };
    }
    return { name: 'Colors aria label', ok: true };
  } finally { try { iframe.remove(); } catch (_) {} }
}

// Inside runAll()
results.push(await testColorsAria(root));
```

Tip: if your quiz shows an example sentence on correct answers, you can loop through the option buttons until `stats` shows `Correct: 1`, then assert that `#feedback .example` is present.


### Project structure

- `index.html`: Home page with search and category filters, renders quiz cards from `data/quizzes.json`
- `quiz.html`: Quiz runner page; loads a specific quiz via `?quiz=<id>`
- `quiz.js`: Quiz engine (rendering, answer handling, auto‑advance, stats)
- `quiz-loader.js`: Metadata‑driven loader with per‑quiz builder functions keyed by id (`QuizBuilders.<id>()`). It reads `data/quizzes.json` for title/subtitle, applies a body class based on the quiz id, also adds a generic `<id>-quiz` class (e.g., `foods-quiz`), and wires `ThaiQuiz.setupQuiz(...)` via `Utils.createStandardQuiz` plus small helpers
- `utils.js`: Shared helpers (fetch JSON, caching, random selection, color utilities, DOM helpers). Includes `createStandardQuiz`, `renderEnglishThaiSymbol`, `renderExample`, `createEmojiGetter`/`loadEmojiGetter`, `insertProTip`, `insertConsonantLegend`, and `renderVowelSymbol`
- `home.js`: Home page logic (filters, chips, card rendering, Today/Month widgets)
- `styles.css`: Shared and per‑quiz styles
- `data/*.json`: Quiz datasets and metadata
- `data/emoji-rules/*.json`: Optional per-quiz emoji matcher rules (pattern → emoji)
  - Datasets may optionally include an `id` per item; when present, examples prefer `id` for lookups (falling back to `english`).
- `asset/`: Images and icons used across the site
  - `asset/profile.jpg`: Avatar shown in the home page Socials card
  - `asset/thai-quest-logo.png`: App logo used in the header
- Favicons and PWA manifest: `asset/favicon.ico`, `asset/favicon-16x16.png`, `asset/favicon-32x32.png`, `asset/apple-touch-icon.png`, `asset/site.webmanifest`

### How it works

1. The home page (`index.html`) loads `data/quizzes.json`, renders cards, and provides search/category filters.
2. Clicking a card navigates to `quiz.html?quiz=<id>`.
3. `quiz-loader.js` reads the `id` from the URL, sets page title/subtitle, applies both a mapped body class and a generic `<id>-quiz` class, and invokes a per‑quiz builder.
4. Each builder fetches JSON via `Utils.fetchJSONCached`/`Utils.fetchJSONs` and wires `ThaiQuiz.setupQuiz(...)` using `Utils.createStandardQuiz` plus small overrides (emoji, examples, symbol rendering).
5. The engine handles input (click/keyboard), plays feedback animations, auto‑advances on correct answers, and updates stats.

### Styling & overrides

The default styling for all quizzes is defined in `styles.css` under `body.quiz-page` using CSS variables. Prefer overriding these variables per quiz instead of duplicating CSS rules.

- Variables available: `--symbol-font-size`, `--symbol-margin`, `--symbol-font-weight`, `--symbol-color`, `--symbol-text-shadow`, `--symbol-line-height`, `--options-max-width`.
- Override per quiz on either the mapped class (e.g., `body.questions-quiz`) or the generic class (e.g., `body.foods-quiz`). The loader applies both.

```css
/* Example: tweak Foods quiz symbol size and options width */
body.foods-quiz {
  --symbol-font-size: 4.6em;
  --options-max-width: 600px;
}
```

```css
/* Responsive override using the same variables */
@media (max-width: 600px) {
  body.foods-quiz { --symbol-font-size: 3.6em; }
}
```

- Special look & feel: If variables are not enough, add targeted rules. For example, the Colors quiz adds a text shadow via the variable:

```css
body.color-quiz {
  --symbol-text-shadow: 0 1px 1px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.45);
}
```

- Notes: Buttons have a sensible default (`body.quiz-page .options button { min-width: 240px; }`). Only override per quiz if needed.

### Add a new quiz

1. **Create data**: Add a new JSON file under `data/` with the items you want to quiz.
2. **Add metadata**: In `data/quizzes.json`, add an object with `id`, `title`, `href`, `description`, `bullets`, `categories`.
3. **Add a builder**: In `quiz-loader.js`, add `QuizBuilders.<id> = function(){ ... }` that fetches your JSON via `Utils.fetchJSONCached` and returns an `init()` which calls `ThaiQuiz.setupQuiz(Object.assign({ elements: ... }, Utils.createStandardQuiz({...})))`.
   - Use `buildSymbol` to show English/Thai/emoji.
   - If you show examples after correct answers, pass `examples` and an `exampleKey` if needed.
4. **Style (optional)**: Add CSS rules in `styles.css` using `body.<id>-quiz` (e.g., `body.foods-quiz`) or the mapped class (e.g., `body.questions-quiz`). The loader ensures both exist.

#### AI quickstart: minimal builder template

Use this skeleton when adding a new dataset‑driven quiz. The loader resolves data first, then returns an initializer that calls `ThaiQuiz.setupQuiz` with a config from `Utils.createStandardQuiz`.

```javascript
// quiz-loader.js
QuizBuilders.myquiz = function() {
  return Utils.fetchJSONCached('data/myquiz.json').then(function(items){
    return function init(){
      ThaiQuiz.setupQuiz(Object.assign({ elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' } }, Utils.createStandardQuiz({
        data: items,
        answerKey: 'phonetic',
        labelPrefix: 'English and Thai: ',
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '' }; }
      })));
    };
  });
};
```

#### Data schema templates

Basic item (English/Thai/phonetic):
```json
{ "english": "water", "thai": "น้ำ", "phonetic": "náam" }
```

Tense marker item:
```json
{ "english": "already", "thai": "แล้ว", "phonetic": "lɛ́ɛw" }
```

Numbers:
```json
{ "number": 42, "thai": "สี่สิบสอง", "phonetic": "sìi sìp sɔ̌ɔŋ" }
```

Consonant:
```json
{ "symbol": "ก", "name": "kɔɔ kai", "meaning": "chicken", "class": "low", "emoji": "🐔" }
```

Color base and modifier:
```json
// data/colors-base.json item
{ "english": "red", "thai": "สีแดง", "phonetic": "sǐi dɛɛŋ", "hex": "#E74C3C" }
// data/color-modifiers.json item
{ "english": "light", "thai": "อ่อน", "phonetic": "ɔ̀ɔn" }
```

Time/phrases (any of these keys are supported by existing configs):
```json
{ "english": "o'clock sharp", "thai": "ตรง", "phonetic": "dtrong", "note": "exact hour", "translation": "sharp" }
```

Classifiers:
```json
{ "english": "people", "thai": "คน", "phonetic": "khon" }
```

Rooms:
```json
{ "english": "bedroom", "thai": "ห้องนอน", "phonetic": "hɔ̂ɔŋ nɔɔn" }
```

Jobs:
```json
{ "english": "doctor", "thai": "หมอ", "phonetic": "mɔɔ" }
```

Tone Markers (class + marker + length → resulting tone):
```json
{ "english": "Middle + none (long)", "thai": "กลาง + ไม่มีวรรณยุกต์ (สระยาว)", "phonetic": "Mid" }
```

#### Quiz config skeleton (metadata‑driven)

Add a `QuizBuilders.<id>` entry in `quiz-loader.js` that fetches data via cache and returns an initializer using `Utils.createStandardQuiz`:
```javascript
// quiz-loader.js
QuizBuilders.myquiz = function() {
  return Utils.fetchJSONCached('data/myquiz.json').then(function(data){
    return function init(){
      ThaiQuiz.setupQuiz(Object.assign({ elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' } }, Utils.createStandardQuiz({
        data: data,
        answerKey: 'phonetic',
        labelPrefix: 'English and Thai: ',
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '' }; }
      })));
    };
  });
};
```


Available hooks in the engine: `pickRound(state)`, `renderSymbol(answer, els, state)`, `renderButtonContent(choice, state)`, `ariaLabelForChoice(choice, state)`, `decorateButton(btn, choice, state)`, `isCorrect(choice, answer, state)`, `onAnswered(ctx)`.

Utilities you can use: `Utils.fetchJSONCached(s)`, `Utils.fetchJSONs([urls])`, `Utils.pickRandom`, `Utils.pickUniqueChoices(pool, count, keyFn, seed)`, `Utils.byProp('phonetic')`, `Utils.getDisplayHex(baseHex, modifier)`, `Utils.createStandardQuiz(params)`.

#### New utilities for faster quiz creation

- `Utils.renderEnglishThaiSymbol(symbolEl, { english, thai, emoji?, ariaPrefix? })`
  - Renders a standardized "English + Thai" symbol block, optionally with an emoji line, and sets an accessible `aria-label`.

- `Utils.renderExample(feedbackEl, exampleText)`
  - Renders a small Example card into the feedback area when `exampleText` is provided, or clears it if falsy.

- `Utils.createStandardQuiz({ data, examples?, exampleKey?, answerKey='phonetic', buildSymbol?, choices=4, labelPrefix='English and Thai: ' })`
  - Returns an object you can spread into `ThaiQuiz.setupQuiz` to wire a full quiz with minimal code.
  - `buildSymbol(answer)` lets you supply English/Thai/emoji for the prompt.
  - `examples` (object map) and optional `exampleKey(answer)` control example lookup; defaults to `answer.english` (use `answer.id || answer.english` if your data includes stable ids).

- `Utils.createEmojiGetter(rules)` / `Utils.loadEmojiGetter(url)`
  - Build an emoji matcher from regex rules or load them from JSON and return a function mapping English text → emoji. Many quizzes derive an emoji line above the symbol using this.

- `Utils.insertProTip(html)` / `Utils.insertConsonantLegend()`
  - Insert a pro‑tip into the quiz footer or a consonant legend before the symbol.

- `Utils.renderVowelSymbol(symbolEl, symbol)`
  - Render vowel symbols with the shaping‑safe placeholder behavior (ko kai replacement) and set `aria-label`.

#### Emoji rules (data-driven)

- Add a file like `data/emoji-rules/foods.json` with an ordered list of objects `{ "pattern": "regex", "emoji": "🧪" }`.
- Quizzes that support emojis (foods/rooms/jobs/verbs/classifiers/tenses) will load these rules and match against the English text to show the emoji above the symbol.
- If the file is missing or empty, the quiz still works (no emoji shown).

#### Homepage card entry (`data/quizzes.json`)

```json
{
  "id": "myquiz",
  "title": "🧠 My Quiz",
  "href": "quiz.html?quiz=myquiz",
  "description": "Short description of what is being practiced.",
  "bullets": ["Key point A","Key point B"],
  "categories": ["Vocabulary","Beginner"]
}
```

#### Accessibility and UX requirements

- Set `aria-label` on the symbol (or return `symbolAriaLabel` from `pickRound`)
- Keep 4–6 options; ensure choices are unique using `Utils.pickUniqueChoices`
- Support keyboard 1–9 for selecting options (engine does this automatically)
- Do not rely on the “Next” button; auto‑advance on correct answers is built‑in
- Prefer `textContent` over `innerHTML` unless you intentionally render HTML
- Maintain readable contrast; follow existing CSS patterns and body classes. The loader always applies both a mapped class and `<id>-quiz` (e.g., `foods-quiz`).

#### Quick test checklist

- Serve locally (JSON fetch requires http)
- Load `index.html` and verify your quiz card appears and opens
- Answer wrong and correct once; verify animations and stats update
- Confirm auto‑advance after a correct answer
- Check small screens (≤600px) for layout

### Development tips

- Run through a local server to avoid CORS errors when fetching JSON
- Use number keys 1–9 to select answers quickly
- After a correct answer, the app auto‑advances; the “Next” button remains hidden by design
- Stats show Questions, Correct, and Accuracy

### Tech stack

- Vanilla **HTML/CSS/JavaScript** (ES2015+). The codebase prefers `const`/`let` over `var`, arrow functions only where they do not change `this` semantics, and simple modules via script tags without bundlers.
- No frameworks, no bundlers

### License

MIT License © 2025 jdelaire. See the [MIT License](https://opensource.org/licenses/MIT).

### Credits

- Data and phonetics curated for learning purposes. Emojis and color accents are used to aid memorization.