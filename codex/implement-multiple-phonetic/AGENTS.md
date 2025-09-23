# Repository Guidelines

## Project Structure & Module Organization
- `index.html`, `quiz.html`, `smoke.html` anchor the UI; no build step is required.
- `js/` contains plain ES5 modules: `core/` (fetch, error handling), `quiz/` (engine, progressive difficulty, player metrics), `builders/` (per-quiz setup), `home.js`, and `smoke.js`.
- `data/` holds quiz datasets plus `quizzes.json`, the source of metadata such as `bodyClass`, `proTip`, and `symbolNote`.
- `css/styles.css` centralizes styling; quiz-specific tweaks rely on body classes (`body.colors-quiz`, etc.).
- `asset/` provides images/icons; keep additions optimized.

## Build, Test, and Development Commands
- `python3 -m http.server 8000` — serve the project locally so fetch calls to `data/*.json` succeed. Access via `http://localhost:8000/`.
- `http://localhost:8000/smoke.html?autorun=1` — run in-browser smoke checks that validate metadata, load each quiz, and click through a question.
- `http://localhost:8000/smoke.html?limit=4` — quicker subset while iterating.

## Coding Style & Naming Conventions
- Stick to plain HTML/CSS/JavaScript; avoid frameworks and modern build tooling.
- Favor ASCII in source files unless Thai text is required for quiz content.
- JavaScript uses two-space indentation and defensive coding (wrap DOM access in `try/catch`, prefer `Utils.ErrorHandler.safe`).
- Quiz IDs, dataset filenames, and `data/quizzes.json` entries must match exactly (e.g., `foods` → `data/foods.json`, `quiz.html?quiz=foods`).

## Testing Guidelines
- Use the in-browser smoke runner (`smoke.html`) as the regression suite; it checks DOM hooks, aria attributes, and quiz interactivity.
- When adding a quiz, confirm the metadata validates, the quiz renders via direct URL (`quiz.html?quiz=<id>`), and the home card appears.
- No automated coverage tooling is configured; document manual verification steps in PRs when touching quiz logic.

## Commit & Pull Request Guidelines
- Follow the existing history: prefix commits with a concise scope (`Refactor:`, `Fix:`, `Feature:`) and describe the change (“Update quiz body class handling…”).
- Ensure commits stay focused; prefer separate commits for data, logic, and docs when possible.
- Pull requests should summarize the user-facing effect, list test URLs (e.g., `smoke.html?autorun=1`), and link any related issues. Screenshots or GIFs help when adjusting UI/styling.

## Architecture Notes
- The loader (`js/quiz-loader.js`) reads `data/quizzes.json` as the single source of truth, applies metadata-driven classes/notes, and defers to builders or standard quiz fallbacks.
- Reuse helpers from `Utils` (especially `createQuizWithProgressiveDifficulty`) before writing bespoke logic to keep behavior consistent across quizzes.
