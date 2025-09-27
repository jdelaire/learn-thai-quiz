# Repository Guidelines

## Project Structure & Module Organization
- `index.html`, `quiz.html`, and `smoke.html` remain the primary entry points; all assets load directly (no bundler or transpile step).
- `dev/avatar-levels.html` is a helper page for inspecting the procedural player avatars across levels.
- `js/storage.js` defines `window.StorageService` with a localStorage fallback; `js/prelude.js` asserts the storage shim exists before the rest of the scripts run.
- `js/core/` hosts infrastructure modules: `error.js` (`ErrorHandler` helpers and logging), `fetch.js` (cached JSON fetchers), and `tts.js` (Thai text to speech utilities).
- `js/util/` contains shared helpers: `common.js` (DOM utilities, sanitizer, i18n strings, safe random choice helpers), `color.js`, `text.js`, and `platform.js`.
- `js/ui/` centralizes DOM glue: `renderers.js` for shared markup, `meta.js` for applying quiz metadata and body classes, `quiz-ui.js` for stats helpers, `sound.js` for opt-in speech controls, and `preferences.js` for per-quiz phonetic locale UI.
- `js/quiz/` holds the quiz engine pieces: `progressive.js` (adaptive choice counts), `factories.js` (standard quiz scaffolding), `player.js` (XP curve, avatar generation, progress aggregation), and `phonetics.js` (locale-aware transliteration helpers).
- `js/quiz/composite.js` provides helpers for assembling cross-quiz data sources and building composite quizzes on the fly.
- `js/utils-agg.js` is the single point that assembles `window.Utils` from the `__TQ` namespace; expose new helpers there instead of creating fresh globals.
- `js/builders/index.js` registers all per-quiz builders, composing datasets and overrides before calling `ThaiQuiz.setupQuiz`.
- `js/quiz.js` exposes `window.ThaiQuiz.setupQuiz`, renders questions, persists per-quiz progress, injects stats and stars, and wires optional text-to-speech controls.
- `js/quiz-loader.js` reads `quiz` from the query string, loads metadata from `data/quizzes.json`, applies `bodyClass`/`symbolNote`/`supportsVoice`/`supportsPhonetics`, and invokes the appropriate builder or falls back to `data/<id>.json`.
- `js/home.js` powers the landing page search, category chips, resume button, player card (level, XP, avatar, Today in Thai), the Browse/Quest view toggle, and the "What's New" popover which pulls `data/changelog.json`.
- `js/smoke.js` contains the in-browser regression suite that drives `smoke.html`.
- `data/` stores quiz datasets; many quizzes have paired `*-examples.json` files that builders join with base data. `data/quizzes.json` is the metadata source of truth (ids, titles, bodyClass, supportsVoice, supportsPhonetics, phoneticLocales, proTip, bullets, categories). `data/quests.json` defines quest progression (see notes below). `data/changelog.json` feeds the home page drawer; keep ISO 8601 timestamps, newest first.
- `css/styles.css` owns all styling and per-quiz overrides (using body classes such as `body.colors-quiz`).
- `asset/` contains images/icons plus the manifest and favicons used by the PWA hooks.

## Build, Test, and Development Commands
- `python3 -m http.server 8000` serves the project locally so fetches to `data/*.json` succeed (open `http://localhost:8000/`).
- `http://localhost:8000/smoke.html?autorun=1` runs the full smoke suite automatically. Useful params: `limit=<n>` to cap quizzes, `quiz=colors,numbers` to target specific ids, and `keepProgress=1` to skip wiping stored stars.

## Coding Style & Naming Conventions
- Stick to plain HTML/CSS/JavaScript with ES5-compatible patterns. Avoid adding build tooling or modern syntax not already in use.
- Favor ASCII in new source files unless Thai text is required for content.
- JavaScript uses two-space indentation and defensive coding: wrap DOM or storage access in `try/catch`, prefer `Utils.ErrorHandler.safe` / `safeDOM`, and reuse helpers from `Utils` or `StorageService` rather than duplicating logic.
- Quiz ids, dataset filenames, and entries in `data/quizzes.json` must stay in sync (`foods` -> `data/foods.json`, `quiz.html?quiz=foods`).

## Testing Guidelines
- Use `smoke.html` as the regression suite. It validates quiz metadata, navigates to each quiz, verifies accessibility hooks, and submits at least one answer. The suite now seeds `thaiQuest.home.viewMode = "browse"` so home-card star assertions run even if a previous session left the UI in quest view, and it toggles quest mode to confirm locked previews, overlays, unlocks, and collapse state.
- When iterating locally, run `smoke.html?limit=4` for a quick subset; pass `quiz=<id>` for targeted checks.
- Document any manual verification for quiz logic (for example, confirming examples render) when sending work for review.

## Commit & Pull Request Guidelines
- Follow existing history: prefix commits with a concise scope (`Refactor:`, `Fix:`, `Feature:`) and keep them focused (data vs logic vs docs).
- Summaries should note user-facing effects, list smoke URLs exercised (for example, `smoke.html?autorun=1`), and link related issues or provide before/after visuals when UI changes.

## Architecture Notes
- Scripts attach to `window.__TQ` and are surfaced through `window.Utils`; prefer extending existing namespaces (`core`, `util`, `ui`, `quiz`) rather than adding new globals.
- `ThaiQuiz.setupQuiz` expects `elements`, `pickRound` or `data`, and optionally `quizId`; reuse `Utils.createQuizWithProgressiveDifficulty` for standard datasets so difficulty and stats remain consistent.
- Per-quiz progress, stars, and XP live in `StorageService` under the `thaiQuest.*` prefix; call `Utils.getQuizProgress`/`saveQuizProgress` and `Utils.computeStarRating` rather than touching storage directly.
- Shared UI helpers (stats/auto-advance/disable) live under `Utils.quizUI`, voice controls under `Utils.sound`, and platform detection under `Utils.platform`; call those instead of reimplementing quiz glue.
- Quiz stats and stars cap at `state.maxQuestions` (default 100). After the cap, progress is frozen until the "Restart Quizz" button (appended to the footer) resets per-quiz storage via `Utils.saveQuizProgress`.
- Quizzes that set `supportsVoice` in metadata enable voice controls; use the helpers in `js/ui/sound.js`/`Utils.TTS` instead of custom speech synthesis code.
- Quizzes that set `supportsPhonetics` add a footer dropdown; rely on `Utils.phoneticsUI.injectControls` (called inside `ThaiQuiz.setupQuiz`) and fetch/store locales with `Utils.getQuizPhoneticLocale(quizId)`/`Utils.setQuizPhoneticLocale(quizId, locale)`.

## Composite Quiz Notes

- Define composite quizzes via `data/quizzes.json` using either `composite.sources` (array of quiz ids/descriptors) or the legacy shortcut `compositeOf`. No manual builder entry is required; `quiz-loader.js` auto-registers the builder by calling `QuizBuilders.registerComposite`.
- Each descriptor supports strings (existing quiz ids). When registering via JS you can pass richer objects with `quizId`, `filter`, `map`, `dataUrl`, and optional `examplesUrl`, or inline data arrays. Items are tagged with `__sourceQuizId`; example keys are remapped to `__compositeKey` for stable lookups.
- Customise behaviour with `composite.answerKey`, `composite.quizParams`, `composite.quizOverrides`, and `composite.onSourcesLoaded(payload)` (called after all sources load so the payload can be shuffled or truncated).
- `Utils.composite.combineSources(options)` and `Utils.composite.createBuilder(options)` expose the same helpers if you need to orchestrate composite data outside of the default builder.
- Reference implementation: the `quest1-mixed` entry in `data/quizzes.json` combines the Survival Starter quizzes into one composite.
- Set `visible: false` on any quiz metadata entry to hide it from the Browse list (quests and direct links still work). Hidden quizzes are skipped by smoke auto-discovery.

## Quest Mode Notes

- Quests live in `data/quests.json`. Each entry supports `preview` (boolean) and `requiresQuestId` to lock a quest until the prerequisite has at least one star on every quiz listed in its steps.
- `js/home.js` renders quest cards from that JSON. Progress is derived from storage: quizzes count as complete once `Utils.getQuizStars(quizId) > 0`. Chips show `Questions: answered/100` (capped via `Utils.getQuestionCap()`) and `Stars: n/3` text.
- Browse/Quest mode is persisted under `thaiQuest.home.viewMode` (`browse` vs `quest`). Quest collapse state persists under `thaiQuest.home.questCollapsed.<questId>`; only completed quests can collapse.
- Locked quests display a grey overlay message (“Finish Quest X to unlock Quest Y”). Individual quiz chips gain the `locked` class until they become the next target; the next eligible quiz chip is tagged with `quest-quiz next` for styling.
- Quest cards are full-width with `box-sizing: border-box` to avoid mobile clipping. Chip links use a rounded pill radius matching the surrounding card per latest design.
