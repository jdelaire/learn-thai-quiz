# Contributing to ThaiQuest

Thanks for helping improve ThaiQuest! This is a static site built with vanilla HTML/CSS/JS and JSON data.

## Quick start

- Serve locally to avoid CORS errors when fetching JSON:
  - `python3 -m http.server 8000` then open `http://localhost:8000/`
- Run browser smoke tests: open `smoke.html?autorun=1`

## Development conventions

- Use ES2015+ features that work in modern browsers; prefer `const`/`let`.
- Avoid `innerHTML` for runtime DOM updates. Use node creation and `textContent`.
- Use centralized utilities from `js/utils-agg.js` (`Utils`) where available.
- Persist per-quiz progress via `StorageService` only.
- Accessibility: set appropriate `aria-label`s for symbols and stars.

## Style & formatting

- EditorConfig enforces line endings and 2-space indentation.
- Prettier formats code. Run:
  - `npm run format` to write changes
  - `npm run format:check` in CI
- ESLint checks for common pitfalls and enforces safe equality:
  - `npm run lint` or `npm run lint:fix`

## Adding a new quiz

- Add data under `data/` (see `README.md` for schema examples)
- Update `data/quizzes.json` with metadata
- Optionally add a builder in `js/builders/index.js` using `makeStandardQuizBuilder`
- Optionally add `data/changelog.json` entry for the "What’s New" popover

## Commit guidelines

- Keep commits focused and descriptive (imperative mood):
  - "Add prepositions quiz builder"
  - "Refactor example overlay rendering"
- Reference affected files or modules when helpful.

## Testing checklist

- Serve locally and load `index.html`
- Open a few quizzes and answer correct/incorrect once
- Verify auto-advance and stats
- Run `smoke.html?autorun=1&limit=4`

Thanks again! 🙏