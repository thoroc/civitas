# Contributing

Thanks for your interest in improving the project! This document outlines a lightweight workflow to keep changes consistent and reviewable.

## Development Setup

1. Install deps: `npm install`
2. Run dev server: `npm run dev`
3. Lint before committing: `npm run lint`
4. (Optional) Build to verify type + prod compilation: `npm run build`

## Branching & Commits

- Use small, focused branches (e.g. `feat/legend-filtering`, `fix/tooltip-overflow`).
- Commit messages: `<type>(scope): short description` following conventional style.
  - Types: `feat`, `fix`, `refactor`, `docs`, `perf`, `test`, `chore`, `style`.
  - Scope examples: `parliament`, `filters`, `legend`, `ui`.
  - Example: `feat(parliament): add vertical ring navigation`.
- Avoid unrelated bulk formatting inside feature commits.

## Code Style & Patterns

- Prefer functional React components with hooks.
- Keep filtering logic consolidated in `filtersContext.tsx`; consumers should call `apply()` instead of duplicating logic.
- Treat snapshot JSON as immutable historical data—add new files rather than editing old ones unless correcting objective errors.
- Geometry helpers live in `parliament/d3.ts`; extend there if adding new layout variants.
- Avoid premature abstraction; wait for a second concrete use case.

## Accessibility

- Maintain keyboard parity for any new interactive seat behaviors.
- Provide `aria-label` or `aria-describedby` for new controls; reuse existing live region if announcing seat-level changes.

## Performance

- Keep renders pure: derive display state from props + context, not module singletons.
- When expanding filters, ensure derived computations are memoised if O(n) over seats or members.

## Testing (Future Direction)

No formal test suite yet. Pragmatic suggestions when adding one:
- Unit test `apply()` filtering logic (edge cases: empty arrays, age bounds null, partial filters).
- Snapshot test legend output for filtered vs full state.
- Interaction tests (Playwright / Testing Library) for keyboard navigation & locking.

## Adding Filters

1. Extend `ParliamentFiltersState`.
2. Update `apply()` logic.
3. Adjust `reset` behavior if new primitive requires clearing.
4. Add UI controls in `FiltersPanel.tsx` (mirror existing badge toggle pattern).
5. Update README if user-facing.

## Export Features

- For new export formats, branch from the existing SVG -> canvas pipeline in `HemicycleReact.tsx` (PNG exporter). Keep operations synchronous or show progress UI if >250ms.

## Submitting Changes

1. Ensure lint passes with zero warnings.
2. Rebase onto latest `main` (prefer fast-forward merges).
3. Open a PR with a concise summary focusing on *why*.
4. Include before/after screenshots or GIFs for UI-affecting changes.

## License / Attribution

(If project gains a license later, list it here; currently inherited from repository root context.)

---
Happy hacking! Feel free to open an issue for clarifications before large refactors.
