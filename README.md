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
- **Progressive difficulty**: Automatically increases challenge by adding more choices and removing hints as players improve
- **JSON‑driven**: Easy to add or tweak data without changing runtime code
- **Per‑quiz progress & stars**: Progress is saved via a storage service (localStorage under the hood); earn up to 3 stars per quiz based on accuracy when you reach 100 correct answers
 - **Player profile card**: Enabled on the home page; shows Level and XP bar, plus aggregated metrics: Avg accuracy, Quizzes completed, and Total stars earned

### Quizzes included

- **Consonants**: All 44 Thai consonants with meanings and tone classes (color‑coded). Progressive difficulty increases choices from 4→5→6→7→8.
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
- **Body Parts in Thai**: Common anatomy words with Thai script, phonetics, and emoji hints
- **Essential Thai Prepositions**: Core place prepositions with phonetics and usage tip
- **Greetings**: Core greetings with Thai script, phonetics, examples, and polite particles
- **Adjectives**: Common adjectives with Thai script, phonetics, emoji hints, and comparison examples
 - **Countries**: Country names with Thai script, phonetics, and flag emoji hints; example sentences on correct answers
 - **Vowels That Change Form**: Thai vowels that change their writing form between consonants; English/Thai/phonetics with examples and a quick reference table.
 - **Consonants in Final Position (Individually)**: Thai consonants as final sounds with examples; maps to collapsed finals like k/t/p and nasals m/n/ŋ.

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

What it does now:
- Validates `data/quizzes.json` (unique `id`s and `href` consistency).
- Loads `index.html` and confirms quiz cards render from metadata.
- Auto-discovers quizzes from `data/quizzes.json` (fallback: parses links on the home page) and runs each via `quiz.html?quiz=<id>`.
- For each quiz, asserts basic accessibility/chrome: per‑quiz body class `<id>-quiz`, `#symbol` has an `aria-label`, `#options` has `role="group"`.
- Ensures options render, clicks an option, and verifies stats increment robustly (compares current vs. baseline rather than a fixed value).
- Catches runtime errors and reports pass/fail per check; no external dependencies.

Run options (URL query params):
- `autorun=1` — auto‑start the suite on page load.
- `limit=N` — run at most N quizzes (useful for quick checks).
- `quiz=a,b,c` — only run specified quiz ids.
- `keepProgress=1` — do not clear local progress; by default the suite clears `thaiQuest.progress.*` to avoid interference.

#### Extending smoke tests when you add a quiz

- When you create a new quiz (add an entry in `data/quizzes.json` and, if needed, a builder in `js/builders/index.js`), the smoke tests will pick it up automatically from metadata.
- You usually don’t need to update `smoke.js` when adding a quiz, because it auto‑discovers quizzes from `data/quizzes.json`.

Examples:
- Quick run of first 4 quizzes: `http://localhost:8000/smoke.html?autorun=1&limit=4`
- Targeted run with preserved progress: `http://localhost:8000/smoke.html?quiz=colors,verbs&autorun=1&keepProgress=1`

Example: verify that the Color quiz sets an accessible aria‑label on the symbol.

```javascript
// js/smoke.js
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
- `smoke.html`: Browser-based smoke tests for end-to-end validation
- `js/`: JavaScript modules (modularized)
  - `prelude.js`: Early asserts for critical globals (e.g., `StorageService`) for fail-fast dev
  - `core/`: error and fetch utilities (`error.js`, `fetch.js`)
  - `util/`: common helpers and color utilities (`common.js`, `color.js`)
  - `ui/`: DOM renderers (`renderers.js`)
  - `quiz/`: progressive difficulty, factories, and player metrics (`progressive.js`, `factories.js`, `player.js`)
  - `builders/index.js`: all `QuizBuilders` (moved out of loader)
  - `utils-agg.js`: aggregator exposing stable `window.Utils` API
  - `quiz.js`: Quiz engine (rendering, answer handling, auto‑advance, stats)
  - `quiz-loader.js`: Thin loader: reads metadata, applies classes/proTip, resolves `QuizBuilders[quizId]`, and falls back to `data/<id>.json` when needed
  - `home.js`: Home page logic (filters, chips, card rendering, Today/Month widgets)
  - `smoke.js`: Smoke test runner for automated validation
- `css/`: Stylesheets
  - `styles.css`: Shared and per‑quiz styles
- `data/*.json`: Quiz datasets and metadata
  - Datasets may optionally include an `id` per item; when present, examples prefer `id` for lookups (falling back to `english`).
-  - `data/changelog.json`: Entries powering the home page “What’s New” popover. Each entry links a quiz `id` to a `date`. Dates should be ISO‑8601 UTC (e.g., `2025-08-20T10:00:00Z`). Epoch milliseconds are also accepted. The popover shows the latest 10 by date.
- `asset/`: Images and icons used across the site
  - `asset/profile.jpg`: Avatar shown in the home page Socials card
  - `asset/thai-quest-logo.png`: App logo used in the header
- Favicons and PWA manifest: `asset/favicon.ico`, `asset/favicon-16x16.png`, `asset/favicon-32x32.png`, `asset/apple-touch-icon.png`, `asset/site.webmanifest`

### How it works

1. The home page (`index.html`) loads `data/quizzes.json`, renders cards, and provides search/category filters.
2. Clicking a card navigates to `quiz.html?quiz=<id>`.
3. `js/quiz-loader.js` reads the `id` and metadata from `data/quizzes.json`, sets page title/subtitle, applies `meta.bodyClass` when present (else a default mapping via `Utils.getBodyClass(id)`) and also adds a generic `<id>-quiz` class. If `meta.proTip` is present, it is inserted into the quiz footer.
4. The loader invokes a per‑quiz builder from `js/builders/index.js`. If no builder exists for the `id`, it falls back to running a standard quiz from `data/<id>.json` using `phonetic` as the answer key.
5. Builders fetch JSON via `Utils.fetchJSONCached`/`Utils.fetchJSONs` and wire `ThaiQuiz.setupQuiz(...)` using `Utils.createStandardQuiz` plus small overrides (emoji, examples, symbol rendering).
6. The engine handles input (click/keyboard), plays feedback animations, auto‑advances on correct answers, and updates stats.
7. Per‑quiz progress (questions answered and correct answers) is persisted through the storage service (backed by localStorage); the home page displays a 0–3 star rating for each quiz.

### Player profile & metrics

The home page header includes a player profile card with:

- **Custom player name**: Click on your player name to set a custom name (stored via the storage service). If no custom name is set, displays a computed ID based on browser fingerprinting.
- **XP bar**: Shows current XP vs. max XP for your level. The XP bar remains visible and is independent of the star metrics.
- **Avg accuracy**: Aggregated across all quizzes: round(Σ correct ÷ Σ answered × 100).
- **Quizzes completed**: Count of quizzes with at least 100 correct answers.
- **Total stars earned**: Sum of each quiz’s star rating (0–3) based on accuracy thresholds.

Implementation details:

- Aggregation is computed from per‑quiz progress stored under the key `thaiQuest.progress.<quizId>` via the storage service.
- Public helpers: `Utils.getTotalStarsEarned()`, `Utils.getPlayerAccuracy()`, `Utils.getQuizzesCompleted()`, and low‑level `Utils.aggregateGlobalStatsFromStorage()` / `Utils.getAllSavedProgress()`.
- Star tiers: see the table below; totals are computed by summing stars across all quizzes.

### Leveling and XP

We convert stars to XP and level up using a power‑law curve:

- **Star → XP**: 1★ = 10 XP, 2★ = 20 XP, 3★ = 40 XP (0★ = 0 XP).
- **Total XP**: Sum XP across all quizzes based on each quiz’s current star rating.
- **Level curve**: XP_total(L) = A · L^p, with A ≈ 2.09933 and p = 1.9.
- **XP to next level**: ΔXP(L) = XP_total(L+1) − XP_total(L).
- **Displayed level**: `floor(((TotalXP / A)^(1/p))) + 1`.
- **XP bar**: Shows `TotalXP − XP_total(L_current)` over `ΔXP(L_current)`.

Runtime helpers:

- Curve: `Utils.XP_CURVE`, `Utils.xpTotalForLevel(L)`, `Utils.xpDeltaForLevel(L)`.
- Star XP: `Utils.getXPForStars(stars)`, totals: `Utils.getTotalXPFromStars()`.
- Player‑facing: `Utils.getPlayerLevel()`, `Utils.getPlayerXP()` (in‑level), `Utils.getPlayerMaxXP()` (to next level).

### Styling & overrides

The default styling for all quizzes is defined in `css/styles.css` under `body.quiz-page` using CSS variables. Prefer overriding these variables per quiz instead of duplicating CSS rules.

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

1. **Create data**: Add a new JSON file under `data/`. For a standard quiz, prefer `data/<id>.json` with items like `{ "english": "water", "thai": "น้ำ", "phonetic": "náam" }`.
2. **Add metadata**: In `data/quizzes.json`, add an object with `id`, `title`, `href`, `description`, `bullets`, `categories`, and optionally `bodyClass` and `proTip`.
3. **Wire it up**:
   - If you don’t need custom logic, you can skip a builder. The loader will automatically run a standard quiz from `data/<id>.json` using `phonetic` as the answer key.
   - If you need custom behavior (emoji rules, multiple datasets, special symbol rendering, examples), add a builder using the helper `makeStandardQuizBuilder(urls, transform)` or write a manual builder.
4. **Style (optional)**: Add CSS rules in `styles.css` using `body.<id>-quiz` (e.g., `body.foods-quiz`) or the mapped class (e.g., `body.questions-quiz`). The loader ensures both exist.

 

### Update the “What’s New” changelog when adding a quiz

The discreet bell popover on the home page lists the latest quizzes. To surface a new quiz there:

1. Open `data/changelog.json`.
2. Append an entry with the quiz `id` and a `date` in ISO‑8601 UTC (or epoch ms):

```json
{
  "entries": [
    { "id": "your-quiz-id", "date": "2025-08-28T09:00:00Z" }
  ]
}
```

- The `id` must exactly match the quiz `id` in `data/quizzes.json`.
- Order does not matter; the UI sorts by `date` descending and shows up to the latest 10.
- The red dot on the bell appears when there are entries newer than the locally stored `thaiQuest.lastSeenChangelogAt`.

Reset the seen‑state locally (for testing):

```javascript
localStorage.removeItem('thaiQuest.lastSeenChangelogAt');
```

Then refresh the home page and open the popover to verify your entry appears.

#### Loader helper (recommended)

Use `makeStandardQuizBuilder` to wire a data-driven quiz with minimal code.

```javascript
// js/builders/index.js
QuizBuilders.myquiz = makeStandardQuizBuilder('data/myquiz.json', function(results) {
  const data = results[0] || [];
  return {
    data: data,
    answerKey: 'phonetic',
    labelPrefix: 'English and Thai: ',
    buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '' }; }
    // Progressive difficulty enabled by default
  };
});
```

#### AI quickstart: minimal builder template (manual)

Use this skeleton when you need full control. The loader resolves data first, then returns an initializer that calls `ThaiQuiz.setupQuiz` with a config from `Utils.createStandardQuiz`.

```javascript
// js/builders/index.js
QuizBuilders.myquiz = function() {
  return Utils.fetchJSONCached('data/myquiz.json').then(function(items){
    return function init(){
      ThaiQuiz.setupQuiz(Object.assign({ elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' } }, Utils.createQuizWithProgressiveDifficulty({
        data: items,
        answerKey: 'phonetic',
        labelPrefix: 'English and Thai: ',
        buildSymbol: function(a){ return { english: a.english || '', thai: a.thai || '' }; }
        // Progressive difficulty enabled by default
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

#### Progressive difficulty

The quiz engine supports automatic difficulty progression based on player performance. **Progressive difficulty is enabled by default** for all quizzes using the standard builder.

**Default configuration:**
- 4→5→6→7→8 choices at 20/40/60/80 correct answers

**Custom configuration:**
```javascript
// Disable progressive difficulty
progressiveDifficulty: false

// Custom thresholds
progressiveDifficulty: {
  choicesThresholds: [
    { correctAnswers: 15, choices: 5 },
    { correctAnswers: 30, choices: 6 }
  ]
}
```

**Available options:**
- `choicesThresholds`: Array of `{ correctAnswers: number, choices: number }` to increase difficulty

**Example implementations:**
- **All quizzes**: 4→5→6→7→8 choices at 20/40/60/80 correct answers (default)
- **Custom quizzes**: Can override thresholds as needed

#### Quiz completion and star ranking

- A quiz is considered eligible for ranking after you accumulate 100 correct answers on that quiz (across sessions; persisted via the storage service).
- Star tiers (based on overall accuracy at the time you've reached 100 correct answers or beyond):
  - 3★: 100 correct with >95% accuracy
  - 2★: 100 correct with >85% accuracy
  - 1★: 100 correct with >75% accuracy
  - 0★: otherwise

Implementation details:
- Progress is stored under the key `thaiQuest.progress.<quizId>` via the storage service as a JSON object `{ questionsAnswered, correctAnswers }`.
- The quiz engine initializes from stored progress and saves after every answer through the storage service.
- The stats line in `quiz.html` shows current counters plus a star preview (e.g., `Stars: ★☆★`).
- The home page reads stars per quiz and shows them on each card.

#### Quiz config skeleton (metadata‑driven)

Add a `QuizBuilders.<id>` entry in `js/builders/index.js` that fetches data via cache and returns an initializer using `Utils.createStandardQuiz`:
```javascript
// js/builders/index.js
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


Available hooks in the engine: `pickRound(state)`, `renderSymbol(answer, els, state)`, `renderButtonContent(choice, state)`, `ariaLabelForChoice(choice, state)`, `decorateButton(btn, choice, state)`, `isCorrect(choice, answer, state)`, `onRoundStart({ answer, choices, state })`, `onAnswered(ctx)`.

Utilities you can use: `Utils.fetchJSONCached(s)`, `Utils.fetchJSONs([urls])`, `Utils.pickRandom`, `Utils.pickUniqueChoices(pool, count, keyFn, seed)`, `Utils.byProp('phonetic')`, `Utils.getDisplayHex(baseHex, modifier)`, `Utils.createStandardQuiz(params)`, `Utils.getBodyClass(id)`, and `Utils.i18n` for label prefixes and accessibility strings. Error handling: `Utils.ErrorHandler` for centralized error management. Player metrics helpers: `Utils.getTotalStarsEarned()`, `Utils.getPlayerAccuracy()`, `Utils.getQuizzesCompleted()`, `Utils.aggregateGlobalStatsFromStorage()`, `Utils.getAllSavedProgress()`. Player name helpers: `Utils.getPlayerDisplayName()`, `Utils.setPlayerCustomName(name)`, `Utils.getPlayerCustomName()`.

#### New utilities for faster quiz creation

- `Utils.renderEnglishThaiSymbol(symbolEl, { english, thai, emoji?, ariaPrefix? })`
  - Renders a standardized "English + Thai" symbol block, optionally with an emoji line, and sets an accessible `aria-label`. Uses DOM nodes (no innerHTML).

- `Utils.renderExample(feedbackEl, exampleText)`
- `Utils.clearChildren(parent)`
  - Removes all children safely from a DOM node. Use instead of setting `innerHTML = ''`.

  - Renders a small Example card into the feedback area when `exampleText` is provided, or clears it if falsy. Uses DOM nodes (no innerHTML).

- `Utils.createStandardQuiz({ data, examples?, exampleKey?, answerKey='phonetic', buildSymbol?, choices=4, labelPrefix='English and Thai: ' })`
  - Returns an object you can spread into `ThaiQuiz.setupQuiz` to wire a full quiz with minimal code.
  - `buildSymbol(answer)` lets you supply English/Thai/emoji for the prompt.
  - `renderButtonContent(choice, state)` may return a string or a DOM Node.
  - `examples` (object map) and optional `exampleKey(answer)` control example lookup; defaults to `answer.english` (use `answer.id || answer.english` if your data includes stable ids).
  - If `data` is empty, the engine renders a friendly "No data available" message.

  - Items may include an optional `emoji` field which the quiz UI displays above the symbol.

- `Utils.insertProTip(content)` / `Utils.insertConsonantLegend()`
  - Insert a pro‑tip into the quiz footer or a consonant legend before the symbol.
  - `insertProTip` accepts either plain text or a very small subset of sanitized HTML (`<strong>`, `<em>`, `<br>`, `<small>`). Attributes are stripped. Prefer plain text.

- `Utils.renderVowelSymbol(symbolEl, symbol)`
  - Render vowel symbols with the shaping‑safe placeholder behavior (ko kai replacement) and set `aria-label`.

#### Player name management

- `Utils.getPlayerDisplayName()`
  - Returns the player's display name (custom name if set, otherwise computed ID).

- `Utils.setPlayerCustomName(name)`
  - Sets a custom player name via the storage service. Pass empty string to clear custom name.

- `Utils.getPlayerCustomName()`
  - Returns the custom player name or null if not set.

#### Emoji data

- Add an `emoji` field directly to each item in your dataset when you want an emoji hint to display above the symbol.

#### Homepage card entry (`data/quizzes.json`)

```json
{
  "id": "myquiz",
  "title": "🧠 My Quiz",
  "href": "quiz.html?quiz=myquiz",
  "description": "Short description of what is being practiced.",
  "bullets": ["Key point A","Key point B"],
  "categories": ["Vocabulary","Beginner"],
  "bodyClass": "questions-quiz",
  "proTip": "Optional HTML snippet shown in the quiz footer with helpful hints."
}
```


- `bodyClass` and `proTip` are optional. If omitted, the loader picks a sensible default class and no tip is shown (some quizzes still add inline notes, e.g., the vowel placement hint).

#### Accessibility and UX requirements

- Set `aria-label` on the symbol (or return `symbolAriaLabel` from `pickRound`)
- Keep 4–6 options; ensure choices are unique using `Utils.pickUniqueChoices`
- Support keyboard 1–9 for selecting options (scoped to the options container; engine wires a keydown handler on `#options`)
- Do not rely on the “Next” button; auto‑advance on correct answers is built‑in
- The engine uses text/DOM nodes and avoids `innerHTML`. If you intentionally render HTML, prefer creating DOM nodes or return a Node from `renderButtonContent`.

I18n label keys available:
- `i18n.labelVowelSymbolPrefix`: Prefix for vowel symbol aria-label
- `i18n.labelConsonantSymbolPrefix`: Prefix for consonant aria-label
- `i18n.labelColorPhrasePrefix`: Prefix for color phrase aria-label
- `i18n.statsStarsAriaLabel`: Label for stats stars element
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
 - Reset local progress for testing: on the home page bottom, click “Reset progression”

### Resetting local progress (testing)

For quick manual testing, the home page (`index.html`) includes a temporary button at the very bottom labeled “Reset progression”. Clicking it clears all keys prefixed with `thaiQuest.progress.` and the custom player name via the storage service and refreshes the displayed stars, header metrics, and level/XP bar.

### Tech stack

- Vanilla **HTML/CSS/JavaScript** (ES2015+). The codebase prefers `const`/`let` over `var`, arrow functions only where they do not change `this` semantics, and simple modules via script tags without bundlers.
- No frameworks, no bundlers

### Error handling

The codebase uses a centralized error handling system via `Utils.ErrorHandler` to reduce defensive programming overhead and improve maintainability.

#### ErrorHandler utilities

```javascript
// Wrap a function with error handling and logging
Utils.ErrorHandler.wrap(fn, context, fallback)

// Safe execution with fallback value (no logging)
Utils.ErrorHandler.safe(fn, fallback)

// Async-safe wrapper for promises
Utils.ErrorHandler.wrapAsync(fn, context)

// Safe DOM operations
Utils.ErrorHandler.safeDOM(operation, fallback)
```

#### Usage examples

**Replacing try-catch blocks:**
```javascript
// Before
try {
  element.classList.add('active');
} catch (e) {
  console.error('Failed to add class:', e);
}

// After
Utils.ErrorHandler.safeDOM(function() {
  element.classList.add('active');
})();
```

**Function wrapping:**
```javascript
// Before
try {
  return someFunction(data);
} catch (e) {
  logError(e, 'context');
  return null;
}

// After
return Utils.ErrorHandler.wrap(someFunction, 'context', null)(data);
```

**Safe operations with fallbacks:**
```javascript
// Before
try {
  return JSON.parse(data);
} catch {
  return {};
}

// After
return Utils.ErrorHandler.safe(JSON.parse, {})(data);
```

#### Best practices

- Use `ErrorHandler.safe()` for operations where you want a fallback but don't need logging
- Use `ErrorHandler.wrap()` for operations where you want both error logging and fallback handling
- Use `ErrorHandler.safeDOM()` for DOM manipulations that might fail
- Use `ErrorHandler.wrapAsync()` for promise-based operations
- Always provide meaningful context strings for better debugging
- Prefer these utilities over inline try-catch blocks for consistency

### Refactors and hardening (latest)

- Replaced innerHTML-based DOM updates with safe node creation/removal in key paths:
  - `js/ui/renderers.js`: `insertProTip` now sanitizes a tiny whitelist of tags; `renderExample` uses i18n for its label and avoids raw HTML.
  - `js/quiz.js`: clearing options uses child removal instead of `innerHTML = ''`.
  - `js/home.js`: removed duplicate player-name click handler and replaced `innerHTML = ''` clears with safe child removal for category chips and quiz list.

- Behavior is unchanged; changes reduce XSS risk and improve consistency with the codebase’s “no innerHTML” guidance.

### Storage service (localStorage abstraction)

All access to browser storage is centralized in `js/storage.js` and exposed globally as `StorageService`. This improves data consistency, error handling, and testability.

Benefits:
- Safer operations with try/catch and graceful fallback to an in‑memory store when `localStorage` is unavailable
- JSON helpers avoid repeated parsing/stringifying in feature code
- Prefix utilities to list/clear groups of keys
- Basic validation helpers for common shapes (e.g., quiz progress)

Load order:
- `storage.js` is included before `utils-agg.js` in both `index.html` and `quiz.html`.

Public API:

```javascript
// Strings and numbers
StorageService.getItem(key)        // -> string|null
StorageService.setItem(key, value) // -> boolean
StorageService.removeItem(key)     // -> boolean
StorageService.getNumber(key, fallback) // -> number
StorageService.setNumber(key, num)      // -> boolean

// JSON convenience
StorageService.getJSON(key, fallback)   // -> object|null
StorageService.setJSON(key, value)      // -> boolean

// Key management
StorageService.keys(prefix)        // -> array of keys, optionally filtered by prefix
StorageService.clearPrefix(prefix) // remove all keys that start with prefix

// Validation helpers
StorageService.validate.ensureProgressShape(obj) // -> { questionsAnswered, correctAnswers }
```

Usage examples:

```javascript
// Save and read per‑quiz progress
const key = 'thaiQuest.progress.colors';
StorageService.setJSON(key, { questionsAnswered: 10, correctAnswers: 8 });
const progress = StorageService.validate.ensureProgressShape(
  StorageService.getJSON(key, { questionsAnswered: 0, correctAnswers: 0 })
);

// Clear all progress (used by the Reset button on the home page)
StorageService.clearPrefix('thaiQuest.progress.');
```

Migration guide:
- Replace direct `localStorage.getItem/setItem/removeItem` calls with `StorageService`.
- Prefer `getJSON/setJSON` for structured data.
- Avoid parsing or stringifying JSON directly in feature code.

### License

MIT License © 2025 jdelaire. See the [MIT License](https://opensource.org/licenses/MIT).

### Credits

- Data and phonetics curated for learning purposes. Emojis and color accents are used to aid memorization.
