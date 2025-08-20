## Thai Language Quiz

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
- **Verbs**: Common action verbs with English/Thai/phonetics and example sentences
- **Family**: Immediate and extended family members with Thai script and phonetics
- **Classifiers**: Common classifiers with example sentences and helpful emojis
- **Rooms**: House and room vocabulary with example sentences and usage tips
- **Jobs**: Common jobs and occupations with Thai script and phonetics
- **Foods**: Common Thai foods, fruits, and cooking methods with phonetics and example phrases

### Quick start (local)

Because the app fetches JSON files, use a local web server (opening `index.html` via `file://` will block fetches).

```bash
cd /Users/jdelaire/sources/learn-thai-quiz
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in your browser.

Any static server works (Node, Ruby, nginx, etc.).

### Project structure

- `index.html`: Home page with search and category filters, renders quiz cards from `data/quizzes.json`
- `quiz.html`: Quiz runner page; loads a specific quiz via `?quiz=<id>`
- `quiz.js`: Quiz engine (rendering, answer handling, auto‑advance, stats)
- `quiz-loader.js`: Quiz configurations (now mostly use a shared factory to reduce boilerplate)
- `utils.js`: Shared helpers (fetch JSON, random selection, color utilities, DOM helpers)
- `home.js`: Home page logic (filters, chips, card rendering, Today/Month widgets)
- `styles.css`: Shared and per‑quiz styles
- `data/*.json`: Quiz datasets and metadata
- `data/emoji-rules/*.json`: Optional per-quiz emoji matcher rules (pattern → emoji)
  - Datasets may optionally include an `id` per item; when present, examples prefer `id` for lookups (falling back to `english`).
- `profile.jpg`: Avatar shown in the home page Socials card

### How it works

1. The home page (`index.html`) loads `data/quizzes.json`, renders cards, and provides search/category filters.
2. Clicking a card navigates to `quiz.html?quiz=<id>`.
3. `quiz-loader.js` looks up a matching config and calls `ThaiQuiz.setupQuiz(...)` from `quiz.js`.
4. Each quiz config defines how to pick an answer/choices from its JSON data and how to render symbol and options.
5. The engine handles input (click/keyboard), plays feedback animations, auto‑advances on correct answers, and updates stats.

### Add a new quiz

1. **Create data**: Add a new JSON file under `data/` with the items you want to quiz.
2. **Configure**: In `quiz-loader.js`, add a new entry to `ThaiQuizConfigs` with:
   - `title`, `subtitle`, optional `bodyClass`
   - `init()` that fetches your JSON and calls `ThaiQuiz.setupQuiz({ ... })`
   - Provide `pickRound`, `renderSymbol`, `renderButtonContent`, `isCorrect`, etc., as needed
3. **Show on home**: Add an object to `data/quizzes.json` with `id`, `title`, `href`, `description`, `bullets`, `categories`.
4. **Style (optional)**: Add CSS rules under a body class in `styles.css`.

### For AI agents: implement a new quiz correctly

Use this checklist and templates to add a quiz end‑to‑end with minimal changes.

- Create a data file in `data/`
- Add a config in `quiz-loader.js` under `ThaiQuizConfigs`
- Add a card to `data/quizzes.json`
- (Optional) Add styles in `styles.css` using a body class

#### Data schema templates

Basic item (English/Thai/phonetic):
```json
{ "english": "water", "thai": "น้ำ", "phonetic": "náam" }
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

#### Quiz config skeleton (`quiz-loader.js`)

Add a new entry to `ThaiQuizConfigs` with an `id` (used by `quiz.html?quiz=<id>`):
```javascript
myquiz: {
  title: 'My New Quiz',
  subtitle: 'Choose the correct phonetic for the Thai term',
  bodyClass: 'myquiz-quiz',
  init: function() {
    Utils.fetchJSON('data/myquiz.json')
      .then(function(data){
        ThaiQuiz.setupQuiz({
          elements: { symbol: 'symbol', options: 'options', feedback: 'feedback', nextBtn: 'nextBtn', stats: 'stats' },
          pickRound: function() {
            var answer = Utils.pickRandom(data);
            var choices = Utils.pickUniqueChoices(data, 4, Utils.byProp('phonetic'), answer);
            return {
              answer: answer,
              choices: choices,
              symbolText: (answer.english || ''),
              symbolAriaLabel: 'English and Thai: ' + (answer.english || '') + (answer.thai ? ' — ' + answer.thai : '')
            };
          },
          renderSymbol: function(answer, els) {
            var english = answer.english || '';
            var thai = answer.thai || '';
            els.symbolEl.innerHTML = '' + english + (thai ? '<span class="secondary">' + thai + '</span>' : '');
            els.symbolEl.setAttribute('aria-label', 'English and Thai: ' + english + (thai ? ' — ' + thai : ''));
          },
          renderButtonContent: function(choice) { return choice.phonetic; },
          ariaLabelForChoice: function(choice) { return 'Answer: ' + choice.phonetic; },
          isCorrect: function(choice, answer) { return choice.phonetic === answer.phonetic; }
        });
      });
  }
}
```

Available hooks in the engine: `pickRound(state)`, `renderSymbol(answer, els, state)`, `renderButtonContent(choice, state)`, `ariaLabelForChoice(choice, state)`, `decorateButton(btn, choice, state)`, `isCorrect(choice, answer, state)`, `onAnswered(ctx)`.

Utilities you can use: `Utils.fetchJSON(s)`, `Utils.fetchJSONCached(s)`, `Utils.pickRandom`, `Utils.pickUniqueChoices(pool, count, keyFn, seed)`, `Utils.byProp('phonetic')`, `Utils.getDisplayHex(baseHex, modifier)`, `Utils.createStandardQuiz(params)`.

#### New utilities for faster quiz creation

- `Utils.renderEnglishThaiSymbol(symbolEl, { english, thai, emoji?, ariaPrefix? })`
  - Renders a standardized "English + Thai" symbol block, optionally with an emoji line, and sets an accessible `aria-label`.
  - Use in `renderSymbol` for quizzes that show English/Thai with optional emoji.

- `Utils.renderExample(feedbackEl, exampleText)`
  - Renders a small Example card into the feedback area when `exampleText` is provided, or clears it if falsy.
  - Use in `onAnswered` when showing an example sentence on correct answers.

- `Utils.createStandardQuiz({ data, examples?, exampleKey?, answerKey='phonetic', buildSymbol?, choices=4, labelPrefix='English and Thai: ' })`
  - Returns an object you can spread into `ThaiQuiz.setupQuiz` to wire a full quiz with minimal code.
  - `buildSymbol(answer)` lets you supply English/Thai/emoji for the prompt.
  - `examples` (object map) and optional `exampleKey(answer)` control example lookup; defaults to `answer.english` (use `answer.id || answer.english` if your data includes stable ids).
  - Handles pickRound, options rendering, aria labels, isCorrect, and example rendering.

#### Emoji rules (data-driven)

- Add a file like `data/emoji-rules/foods.json` with an ordered list of objects `{ "pattern": "regex", "emoji": "🧪" }`.
- Quizzes that support emojis (foods/rooms/jobs/verbs/classifiers) will load these rules and match against the English text to show the emoji above the symbol.
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
- Maintain readable contrast; follow existing CSS patterns and body classes

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

- Vanilla **HTML/CSS/JavaScript**
- No frameworks, no bundlers

### License

MIT License © 2025 jdelaire. See the [MIT License](https://opensource.org/licenses/MIT).

### Credits

- Data and phonetics curated for learning purposes. Emojis and color accents are used to aid memorization.