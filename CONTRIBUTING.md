# Contributing

Thanks for your interest in improving the project! This document outlines a lightweight workflow to keep changes
consistent and reviewable.

## Development Setup

1. Install deps: `npm install` (this automatically sets up lefthook pre-commit hooks)
2. Run dev server: `npm run dev`
3. Lint before committing: `npm run lint` (or `npm run lint:fix` to auto-fix issues)
4. Format code: `npm run format` (or `npm run format:check` to check formatting)
5. Type check: `npm run type-check`
6. (Optional) Build to verify type + prod compilation: `npm run build`

## Pre-commit Hooks

This project uses [lefthook](https://lefthook.dev/) for automated pre-commit hooks that ensure code quality:

- **Linting**: ESLint runs on staged `.js`, `.ts`, `.jsx`, `.tsx` files
- **Formatting**: Prettier runs on staged files (JS/TS/JSON/MD/CSS)
- **Type checking**: TypeScript compiler checks for type errors
- **Auto-fixing**: Both linting and formatting issues are automatically fixed when possible

The hooks run in parallel for faster execution. If any hook fails, the commit is blocked.

### Manual Commands

- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted correctly
- `npm run lint:fix` - Run ESLint and auto-fix issues
- `npm run type-check` - Run TypeScript type checking
- `npm run pre-commit` - Manually run pre-commit hooks

## Branching & Commits

- Use small, focused branches (e.g. `feat/legend-filtering`, `fix/tooltip-overflow`).
- Commit messages: `<type>(scope): short description` following conventional style.
  - Types: `feat`, `fix`, `refactor`, `docs`, `perf`, `test`, `chore`, `style`.
  - Scope examples: `parliament`, `filters`, `legend`, `ui`.
  - Example: `feat(parliament): add vertical ring navigation`.
- Avoid unrelated bulk formatting inside feature commits.

## Code Style & Patterns

- Prefer functional React components with hooks.
- Use arrow functions for all function declarations (components, utilities, event handlers).
- Favor small modules focused on a single domain or responsibility—group related functionality together.
- Embrace SOLID principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and
  Dependency Inversion.
- Follow DRY (Don't Repeat Yourself) principle—extract common logic into reusable utilities and hooks.
- Filtering logic lives in the pure module `parliament/filters/apply.ts`; the context (`filtersContext.tsx`) simply
  delegates. Call `apply()` from the hook—do not re‑implement predicates inline.
- Treat snapshot JSON as immutable historical data—add new files rather than editing old ones unless correcting
  objective errors.
- Geometry math is split:
  - Low-level seat math & ring utilities: `parliament/d3.ts` (now exposes `GeometryConfig` helpers)
  - High-level hemicycle assembly & allocation: `parliament/geometry/` (`geometry.ts`, `allocation.ts`, `parties.ts`)
    Extend in the lowest appropriate layer; keep new logic pure and parameterized.
- Avoid premature abstraction; wait for a second concrete use case.
- For any function taking more than two distinct scalar parameters, prefer a single options object typed by a dedicated
  interface (e.g. `renderSeats(opts: RenderSeatsOptions)`). This improves readability, keeps call sites resilient to
  parameter reordering, and enables optional/extended configuration without breaking existing calls. Name the interface
  `<Verb><Noun>Options` or `<Domain>Config` consistently. Do not prematurely wrap when only two parameters or when the
  function is clearly internal and stable.

  Example (before → after):

  ```ts
  // Before (discouraged)
  const renderSeats = (members: Member[], radius: number, colorScale: ColorScale, showVacant: boolean) => {
    /* ... */
  };

  // After (preferred)
  interface RenderSeatsOptions {
    members: Member[];
    radius: number;
    colorScale: ColorScale;
    showVacant: boolean;
  }
  const renderSeats = (opts: RenderSeatsOptions) => {
    /* ... */
  };
  ```

## Accessibility

- Maintain keyboard parity for any new interactive seat behaviors.
- Provide `aria-label` or `aria-describedby` for new controls; reuse existing live region if announcing seat-level
  changes.

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

- For new export formats, branch from the existing SVG -> canvas pipeline in `HemicycleReact.tsx` (PNG exporter). Keep
  operations synchronous or show progress UI if >250ms.

## Submitting Changes

1. Ensure lint passes with zero warnings.
2. Rebase onto latest `main` (prefer fast-forward merges).
3. Open a PR with a concise summary focusing on _why_.
4. Include before/after screenshots or GIFs for UI-affecting changes.

## License / Attribution

(If project gains a license later, list it here; currently inherited from repository root context.)

---

Happy hacking! Feel free to open an issue for clarifications before large refactors.
