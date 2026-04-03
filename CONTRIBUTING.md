# Contributing

Thanks for your interest in improving the project! This document outlines a lightweight workflow to keep changes
consistent and reviewable.

## Development Setup

1. Install deps: `bun install` (this automatically sets up lefthook pre-commit hooks)
2. Run dev server: `bun run dev`
3. Lint before committing: `bun run lint` (or `bun run lint:fix` to auto-fix issues)
4. Format code: `bun run format` (or `bun run format:check` to check formatting)
5. Type check: `bun run type-check`
6. (Optional) Build to verify type + prod compilation: `bun run build`

## Pre-commit Hooks

This project uses [lefthook](https://lefthook.dev/) for automated pre-commit hooks that ensure code quality:

- **Linting & formatting**: Biome runs on staged `.js`, `.ts`, `.jsx`, `.tsx` files (auto-fixes where possible)
- **Type checking**: TypeScript compiler checks for type errors
- **Convention check**: `scripts/check-conventions.sh` validates the four code conventions below
- **Markdown lint**: markdownlint-cli2 runs on staged `.md` and `.markdown` files

The hooks run in parallel for faster execution. If any hook fails, the commit is blocked.

### Manual Commands

- `bun run format` — format all files with Biome
- `bun run format:check` — check formatting without writing
- `bun run lint:fix` — run Biome and auto-fix issues
- `bun run type-check` — run TypeScript type checking
- `bun run pre-commit` — manually run pre-commit hooks

## Code Conventions

These conventions are enforced automatically on every commit via
`scripts/check-conventions.sh` and Biome rules.

### 1. One function per module

Each non-barrel module exports exactly one function (or component). Split unrelated
utilities into separate files.

```ts
// ❌ two exports in one file
export const formatDate = (d: Date) => ...;
export const parseDate = (s: string) => ...;

// ✅ one per file
// formatDate.ts
export const formatDate = (d: Date) => ...;

// parseDate.ts
export const parseDate = (s: string) => ...;
```

### 2. Barrel modules

Every directory exposes a single `index.ts` that re-exports its public API. Consumers
import from the directory, not from deep paths.

```ts
// parliament/filters/index.ts  — barrel
export { applyFilters } from './apply';
export type { ParliamentFiltersState } from './types';

// consumer — ✅
import { applyFilters } from '@/app/parliament/filters';

// consumer — ❌ (leaks internal paths)
import { applyFilters } from '@/app/parliament/filters/apply';
```

Barrel files are exempt from the one-function-per-module rule.

### 3. Unit tests collocated

Place unit test files next to the module they test, using `.spec.ts` / `.spec.tsx` /
`.test.ts` / `.test.tsx` naming. Integration or end-to-end tests stay under `tests/`.

```text
src/app/parliament/filters/
  apply.ts
  apply.spec.ts      ← collocated unit test
  index.ts
```

Vitest is already configured to pick up `src/**/*.spec.*` and `src/**/*.test.*`.

### 4. Arrow functions — no named functions, no classes

Use arrow functions for everything. Do not use `class` declarations or named `function`
declarations unless a framework explicitly requires them (e.g. Next.js `generateMetadata`
— annotate the exception with a comment).

```ts
// ❌ named function declaration
function getSeats(config: GeometryConfig) { ... }

// ❌ class
class SeatCalculator { ... }

// ✅ arrow function
const getSeats = (config: GeometryConfig) => { ... };

// ✅ async arrow
const fetchMembers = async (url: string) => { ... };

// ✅ React component
const SeatGrid = ({ seats }: SeatGridProps) => <div>...</div>;
```

`scripts/check-conventions.sh` blocks commits. Biome additionally auto-fixes function
expressions via `complexity/useArrowFunction`.

### 5. Function complexity and length

A function must not exceed **both** a cognitive complexity score of 12 **and** a body
length of 80 lines. Either alone is tolerable; both together is a signal to decompose.

| Metric | Threshold | Enforced by |
| --- | --- | --- |
| Cognitive complexity | > 12 | Biome `complexity/noExcessiveCognitiveComplexity` |
| Substantive lines | > 80 | `scripts/check-conventions.sh` `[max-function-lines]` |

When either limit is approached, extract pure helper functions into their own modules
(each following the one-function-per-module rule).

> **Note on Biome plugins**: Biome 1.x has no user-space plugin API for custom lint
> rules. The checks in `check-conventions.sh` (no-class, arrow-only,
> one-function-per-module, no-internal-function, max-function-lines) live in the
> script until Biome 2.0 introduces a plugin system.

### 6. No internal functions

Do not define functions inside other functions. Inner helpers must be extracted into
their own modules (following the one-function-per-module rule).

```ts
// ❌ inner function
export const processItems = (items: Item[]) => {
  const format = (item: Item) => item.name.trim();
  return items.map(format);
};

// ✅ separate modules
// format.ts
export const format = (item: Item) => item.name.trim();

// processItems.ts
import { format } from './format';
export const processItems = (items: Item[]) => items.map(format);
```

React hook callbacks (`useMemo`, `useCallback`, `useEffect`, etc.) are not inner
functions in this sense — they are arguments, not named local definitions, and are
exempt from this rule.

## Branching & Commits

- Use small, focused branches (e.g. `feat/legend-filtering`, `fix/tooltip-overflow`).
- Commit messages: `<type>(scope): short description` following conventional style.
  - Types: `feat`, `fix`, `refactor`, `docs`, `perf`, `test`, `chore`, `style`.
  - Scope examples: `parliament`, `filters`, `legend`, `ui`.
  - Example: `feat(parliament): add vertical ring navigation`.
- Avoid unrelated bulk formatting inside feature commits.

## Code Style & Patterns

- Prefer functional React components with hooks.
- Favor small modules focused on a single domain or responsibility.
- Group code logic by domain, not by technical layer. Place related types, logic, and tests together under a shared
  domain directory (e.g. `elections/`, `districts/`, `seats/`) rather than splitting them across `models/`, `utils/`,
  or `helpers/`.
- Embrace SOLID principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and
  Dependency Inversion.
- Follow DRY (Don't Repeat Yourself) principle — extract common logic into reusable utilities and hooks.
- Filtering logic lives in the pure module `parliament/filters/apply.ts`; the context (`filtersContext.tsx`) simply
  delegates. Call `apply()` from the hook — do not re-implement predicates inline.
- Treat snapshot JSON as immutable historical data — add new files rather than editing old ones unless correcting
  objective errors.
- Geometry math is split:
  - Low-level seat math & ring utilities: `parliament/d3.ts` (exposes `GeometryConfig` helpers)
  - High-level hemicycle assembly & allocation: `parliament/geometry/` (`geometry.ts`, `allocation.ts`, `parties.ts`)
  Extend in the lowest appropriate layer; keep new logic pure and parameterised.
- Avoid premature abstraction; wait for a second concrete use case.
- For any function taking more than two distinct scalar parameters, prefer a single options object typed by a dedicated
  interface (e.g. `renderSeats(opts: RenderSeatsOptions)`). Name the interface `<Verb><Noun>Options` or `<Domain>Config`
  consistently.

  ```ts
  // ❌ scattered parameters
  const renderSeats = (members: Member[], radius: number, colorScale: ColorScale, showVacant: boolean) => { ... };

  // ✅ options object
  interface RenderSeatsOptions {
    members: Member[];
    radius: number;
    colorScale: ColorScale;
    showVacant: boolean;
  }
  const renderSeats = (opts: RenderSeatsOptions) => { ... };
  ```

## Accessibility

- Maintain keyboard parity for any new interactive seat behaviours.
- Provide `aria-label` or `aria-describedby` for new controls; reuse existing live region if announcing seat-level
  changes.

## Performance

- Keep renders pure: derive display state from props + context, not module singletons.
- When expanding filters, ensure derived computations are memoised if O(n) over seats or members.

## Testing

- Unit test `apply()` filtering logic (edge cases: empty arrays, age bounds null, partial filters).
- Snapshot test legend output for filtered vs full state.
- Interaction tests (Playwright) for keyboard navigation & locking.
- **Location rule**: always collocate unit tests next to the code they test (see § Code Conventions above).

## Adding Filters

1. Extend `ParliamentFiltersState`.
2. Update `apply()` logic.
3. Adjust `reset` behaviour if new primitive requires clearing.
4. Add UI controls in `FiltersPanel.tsx` (mirror existing badge toggle pattern).
5. Update README if user-facing.

## Export Features

- For new export formats, branch from the existing SVG → canvas pipeline in `HemicycleReact.tsx` (PNG exporter). Keep
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
