# Refactor Plan & Progress

_Last updated: 2025-10-06 (post lint baseline capture & no new refactors)_

## Completed (Phase 2)

- Extracted tooltip layout logic → `tooltipLayout.ts`
- Extracted seat interaction logic → `seatInteractions.ts`
- Extracted seat ARIA/title builder → `seatAria.ts`
- Split tooltip rendering into `TooltipContent` inside `HemicycleTooltip.tsx`
- Reverted unrelated formatting changes prior to commit
- Commit: `d6394c3 refactor(parliament): extract tooltip layout and seat interaction utilities`

## Completed (Phase 3 – Session Updates)

- Added component barrels: `components/hemicycle/index.ts`, `components/filters/index.ts`
- Relocated `filtersContext.tsx` → `context/filtersContext.tsx` and updated all imports
- Consolidated filter component imports via barrel in `FiltersPanel.tsx`
- Simplified several arrow callbacks (minor stylistic cleanup, no behavior change)
- Normalized import ordering (axios/WBK, etc.)
- Commit: `dd7826a refactor(parliament): add component barrels and relocate filters context`

## Current State

- Working tree clean; 0 type errors; no uncommitted changes.
- This session outcome: captured a full, up-to-date lint warning baseline (no code edits committed).
- ESLint warnings (full snapshot this run):
  - `components/d3/linechart.tsx`: 2 × max-lines-per-function
  - `parliament/HemicycleReact.tsx`: max-lines-per-function
  - `parliament/components/hemicycle/HemicycleView.tsx`: max-lines-per-function
  - `parliament/SnapshotExplorer.tsx`: max-lines-per-function + complexity
  - `parliament/components/hemicycle/SeatCircles.tsx`: complexity
  - `parliament/components/hemicycle/seatInteractions.ts`: complexity
  - `parliament/components/hemicycle/tooltipLayout.ts`: complexity
  - `parliament/context/filtersContext.tsx`: complexity
  - `parliament/hooks/useHemicycleLayout.ts`: max-lines (2 fns) + complexity (primary hook)
  - `parliament/d3.ts`: no-explicit-any + max-params
  - `parliament/exportUtils.ts`: max-params
  - `parliament/hooks/useSeatFocusNavigation.ts`: no-explicit-any
  - `parliament/hooks/useSeatHandlers.ts`: react-hooks/exhaustive-deps (callback dependencies)
- Overall focus remains: shift from structural extraction → complexity & size reduction (targeting large
  hooks/components + geometry typing / params).

## Pending / Next Decisions

- **plan-next-phase**: Choose which warning cluster to address first (geometry, snapshot UI, or context logic).

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

- Split geometry calculations (rings, seat placement) into pure utilities (`d3.ts` or `layout/geometry.ts`)
- Wrap multi-parameter geometry calls into a config object to reduce `max-params`
- Add thin memo boundaries per derived structure (rings, seat positions, color mapping)

### F. SnapshotExplorer / Filters / Legend

- Decompose long render blocks into smaller presentational components (pure props)
- Isolate async snapshot loading + validation into a hook (`useSnapshotData`)

### G. Context / Filters Complexity

- Extract filter application (`apply()`) into pure utility for easier unit testing later
- Split age range + party/gender predicate construction into helpers to reduce complexity

### H. d3 Utilities Typing

- Replace remaining `any` with explicit structural types
- Introduce a `GeometryConfig` interface to remove `max-params` warning

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

- Add dependency to `markdownlint-cli2`
- Add new script target to lint .md files
- Add new pre-commit hook to lint .md files

## Prioritization Guidance

1. High user impact: reduce SnapshotExplorer + HemicycleReact length
2. High technical debt payoff: isolate geometry & layout math (E + H)
3. Medium: simplify filters context (G) to ease future test introduction
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

- Complexity: Split `useHemicycleLayout` (E + H)
- UI Decomposition: Break down `SnapshotExplorer` (F)
- Logic Isolation: Extract `apply()` + predicates from filters context (G)

---

(Generated by assistant; edit freely as plan evolves.)
