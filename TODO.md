# Refactor Plan & Progress

## Last Updated

2025-10-06 (geometry extraction & layout refactor applied)

## Completed (Phase 2)

- Extracted tooltip layout logic → `tooltipLayout.ts`
- Extracted seat interaction logic → `seatInteractions.ts`
- Extracted seat ARIA/title builder → `seatAria.ts`
- Split tooltip rendering into `TooltipContent` inside `HemicycleTooltip.tsx`
- Reverted unrelated formatting changes prior to commit
- Commit: `d6394c3 refactor(parliament): extract tooltip layout and seat interaction utilities`

## Completed (Phase 3 – Session Updates)

- Refactored `SnapshotExplorer.tsx` into modular hooks + components (removed max-lines + complexity warnings)
- Commit: `e911be8 refactor(snapshot): extract hooks and components to reduce complexity`
- Introduced `useHemicycleState` + `useHemicycleTooltipState`; slimmed `HemicycleReact` (removed max-lines warning)
- Decomposed `HemicycleView` into subcomponents (no remaining warnings)
- Added component barrels: `components/hemicycle/index.ts`, `components/filters/index.ts`
- Relocated `filtersContext.tsx` → `context/filtersContext.tsx` and updated all imports
- Consolidated filter component imports via barrel in `FiltersPanel.tsx`
- Simplified several arrow callbacks (minor stylistic cleanup, no behavior change)
- Normalized import ordering (axios/WBK, etc.)
- Commit: `dd7826a refactor(parliament): add component barrels and relocate filters context`

## Completed (Phase 4 – Geometry & Layout)

- Extracted geometry + allocation + party grouping into pure modules under `parliament/geometry/`
- Refactored `useHemicycleLayout` to orchestration-only hook using new pure modules
- Removed outdated ESLint warnings snapshot (now 0 warnings)
- Updated TODO to reflect clean state and future targets
- (Pending commit for geometry/layout extraction refactor) _— commit next step_

## Current State

- Working tree contains uncommitted geometry/layout refactor changes.
- Lint: 0 warnings / 0 errors; TypeScript: 0 errors.
- Playwright E2E infrastructure active (multi-browser, trace on first retry).
- E2E tests: parliament (hemicycle + legend + meta), homepage, cat (fixme in dev).
- GitHub Actions `e2e` job in place.
- Strengthened parliament test (legend structural + totals checks).
- Geometry & allocation logic is now isolated and pure (easier future unit tests).
- Remaining refactor candidates (no active warnings):
  - `parliament/d3.ts`: introduce `GeometryConfig` (param consolidation) + stronger typing.
  - `parliament/exportUtils.ts`: wrap multi-arg export into `ExportSeatsOptions`.
  - `parliament/context/filtersContext.tsx`: extract `apply()` + predicates.

### In Progress

- Planning parameter/options object consolidation (survey phase; implementation not started).
- Prioritization discussion pending for next concrete coding step (filters context vs. export utils vs. d3 config).

## Pending / Next Decisions

- **select-next-track**: Choose immediate focus (Filters context simplification vs Options object rollout vs Export
  utilities cleanup).
- **e2e-refactor-parliament**: Extract polling + legend assertions to reduce test file complexity.
- **e2e-legend-sum-assertion**: Sum party legend counts vs total members (allow vacancy delta).
- **e2e-seat-count-assertion**: Count rendered seat nodes vs total members for integrity.
- **e2e-tighten-polling**: Reduce 25s polling window to 12–15s after stability confirmation.

## Candidate Next Refactors

### A. Seat / Seat Interactions

- (DONE) Extract `useSeatHandlers` hook (keyboard + hover/lock logic) → `useSeatHandlers.ts`
- (DONE) Split `Seat` visual circles into `SeatCircles` SVG micro-component

### B. Tooltip Decomposition

- Move color constants + sizing tokens to `tooltipLayout.ts` or a `tooltipTheme.ts`
- Split secondary info/text block into its own component for line count reduction

### C. HemicycleReact Simplification (Phase 2 complete; Phase 3 targets)

- (DONE) Separate state orchestration vs render container (`HemicycleReact` -> `HemicycleView`)
- (DONE) Extract export logic via `useHemicycleExport` hook
- NEXT: Lift ephemeral selection / hover derived state into a small hook to drop line count

### D. FiltersPanel Modularization

- (DONE) Extract `FilterBadge` & `FilterSection`
- (DONE) Extract `PartyFilterList` and `GenderFilterList`
- (DONE) Add `ActiveFiltersSummary` with memoized derivations
- (DONE) Centralize per-filter option computation inside dedicated list components
- Potential: further extract AgeRange inputs if complexity grows

### E. useHemicycleLayout Heavy Function

- (DONE) Geometry & allocation split into pure modules (`parliament/geometry/`)
- Wrap multi-parameter geometry calls into a config object to reduce `max-params` (optional follow-up)
- Add thin memo boundaries per derived structure (rings, seat positions, color mapping) (evaluate necessity
  post-extraction)

### F. SnapshotExplorer / Filters / Legend

- Decompose long render blocks into smaller presentational components (pure props)
- Isolate async snapshot loading + validation into a hook (`useSnapshotData`)

### G. Context / Filters Complexity

- Extract filter application (`apply()`) into pure utility for easier unit testing later
- Split age range + party/gender predicate construction into helpers to reduce complexity

### H. d3 Utilities Typing

- Replace remaining `any` with explicit structural types
- Introduce a `GeometryConfig` interface to consolidate parameters (moves under parameter options adoption)

### I. Documentation & API Surface

- Add short note to `CONTRIBUTING.md` about new `context/` + component barrel conventions
- Consider root `parliament/index.ts` barrel exporting common hooks + components

### J. Script CLI Consolidation

- Migrate node scripts in `scripts/` (harvest + generation) to a unified Commander.js CLI
- Provide `--from`, `--to`, `--snapshot`, `--out`, `--verbose` flags with shared validation
- Output consistent help/usage and exit codes for CI integration
- Centralize logging + error handling (avoid duplicated try/catch + console noise)
- Enable future testability by isolating pure logic from Commander action handlers

### K. markdown linting

- (DONE) Add dependency to `markdownlint-cli2`
- (DONE) Add new script target `lint:md` to lint .md files
- (DONE) Add new pre-commit hook to lint .md files

### L. Parameter Options Object Adoption

- Convert `seatAria` function signature to single `SeatAriaOptions`
- Introduce `GeometryConfig` in `d3.ts` (merge ring / seat coordinate params)
- Replace multi-arg export function with `ExportSeatsOptions` in `exportUtils.ts`
- Audit remaining >2 param helpers in hooks after initial utility conversions

### M. Deployment Automation (Planned)

- Decide triggers: SSR deploy on push to `main`; static export on `v*` tags (pending confirmation)
- Add GitHub Actions deploy jobs (SSR + static) with conditional skip when secrets missing
- Document required secrets in `docs/deployment.md`: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Add clear skip messaging in workflow when secrets absent (do not fail CI)
- After secrets present: wire production alias for SSR; tag-based alias for static build
- Consider `workflow_dispatch` manual static preview trigger for dry runs

### N. Tooling Enhancements

- Integrate `prettier-plugin-packagejson` to auto-sort `package.json` fields
- Add as dev dependency; Prettier will auto-load without config changes
- Run once: `npx prettier package.json -w` to normalize ordering
- Rely on existing pre-commit Prettier hook to enforce sorting going forward

### O. Lockfile Integrity

- Add `lockfile-lint` dev dependency
- Add script `lint:lockfile`:
  `lockfile-lint --path package-lock.json --type npm --validate-https --allowed-hosts npm,registry.npmjs.org`
- Add CI step (post install, pre build) to run lockfile lint; non-blocking locally via optional pre-commit hook
- Document override process (e.g. private registry) in `docs/development.md`
- Goal: prevent compromised registries / insecure protocols in lockfile

## Prioritization Guidance

1. High user impact: reduce SnapshotExplorer + HemicycleReact length
2. High technical debt payoff: filters context simplification (G) & parameter objects (L)
3. Medium: export utilities consolidation & d3 typing (H/L)
4. Low: docs + root barrel (I) once structural churn slows

## Definition of Done for Each Refactor

- Lint: removed or reduced max-lines / complexity warnings where practical
- No behavior changes (visual or a11y) without explicit intent
- Naming matches existing patterns; no broad stylistic churn

## Deferred (Not in Scope Yet)

- Test suite scaffolding (unit + interaction)
- Performance optimization (memo boundaries audit)
- Theming abstraction for tooltip + legend

## Suggested Next Step

Select one focused track:

- Logic Isolation: Extract `apply()` + predicates from filters context (G)
- Parameter Objects: Implement `ExportSeatsOptions` + `GeometryConfig` (L/H)
- E2E Assertions: Legend sum + seat count (test integrity improvements)

---

(Generated by assistant; edit freely as plan evolves.)
