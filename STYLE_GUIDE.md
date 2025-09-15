# ThaiQuest Style Guide

A concise guide to keep the codebase consistent, readable, and maintainable.

## Language & patterns

- Vanilla JS in browser, ES2015+ features allowed where safe for modern UAs.
- Prefer `const`/`let` over `var` in new code. Existing `var` is tolerated for consistency/compat.
- Avoid `innerHTML` for dynamic UI. Create nodes and set `textContent`.
- Use helpers from `Utils` (see `js/utils-agg.js`) to avoid duplication.
- Equality: use `===`/`!==`. `== null` is allowed when intentionally checking for null or undefined.
- Errors: use `Utils.ErrorHandler` (`wrap`, `safe`, `wrapAsync`, `safeDOM`) instead of ad hoc try/catch.

## DOM & accessibility

- Set `aria-label` on the main symbol and stars. Use i18n prefixes from `Utils.i18n`.
- Keep option buttons as `<button type="button">` and support keyboard 1–9 within the options container.
- Use `Utils.clearChildren` when clearing containers.

## Structure

- `js/` modules are plain IIFEs attaching to `window.__TQ` namespaces and re-exported via `Utils`.
- Builders live in `js/builders/index.js` and should use `makeStandardQuizBuilder` when possible.
- Data-driven first: prefer adding JSON under `data/` over custom code.

## Formatting

- 2-space indentation, LF line endings, UTF-8 (enforced by EditorConfig).
- Prettier defaults with 100-char print width and single quotes.

## Naming

- Functions: verbs (`createStandardQuiz`, `renderExample`).
- Variables: descriptive (`playerLevelEl`, `exampleOverlayTimerId`).

## Comments

- Explain "why" for non-obvious logic; avoid restating the code.
- Keep comments above the relevant lines; avoid inline trailing comments.

## Performance

- Avoid unnecessary layout thrashing; batch DOM writes when possible.
- Use cached JSON via `Utils.fetchJSONCached` for repeated loads.

## Data

- Prefer stable `id` fields in datasets; when present, use them for `exampleKey`.
- Keep JSON minimal and valid UTF-8; no trailing commas.