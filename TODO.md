# Refactor Plan & Progress

## Last Updated

2025-10-07 (geometry + filters + export + e2e assertions committed)

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
- Commits: geometry/layout extraction, filters apply module, unified export API (`exportHemicycle`), strengthened e2e
  assertions

## Current State

- Working tree clean: geometry/layout, filters extraction, export refactor all merged.
- Lint: 0 warnings / 0 errors; TypeScript: 0 errors.
- Playwright E2E infrastructure active (multi-browser, trace on first retry).
- E2E tests: parliament (hemicycle + legend + meta), homepage, cat (fixme in dev).
- GitHub Actions `e2e` job in place.
- Parliament test strengthened (legend structure + aggregated totals + seat count).
- Geometry & allocation logic is now isolated and pure (easier future unit tests).
- Remaining refactor candidates (no active warnings):
  - `parliament/d3.ts`: incremental tightening of `GeometryConfig` usage (some done, review for leftovers).
  - `parliament/exportUtils.ts`: verify callers migrated to unified `exportHemicycle` (delete legacy wrappers once
    stable).
  - Consider pruning legacy comments / dead code after stability window.

### In Progress

- Monitoring stability of recent refactors (geometry, filters, export, e2e) before removing backward-compatible
  wrappers.
- Light survey of residual multi-param functions for options object migration (low priority).

## Pending / Next Decisions

- **select-next-track**: Decide next improvement (tighten polling vs further geometry typing vs export deprecation
  cleanup).
- **e2e-tighten-polling**: Reduce 25s polling window to 12–15s after stability confirmation.
- (DONE) e2e-refactor-parliament.
- (DONE) legend sum + seat count assertions.

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

- (DONE) Extract filter application (`apply()`) into pure utility for easier unit testing later
- Split age range + party/gender predicate construction into helpers to reduce complexity (evaluate further extraction
  if logic grows)

### H. d3 Utilities Typing

- Replace remaining `any` with explicit structural types
- Introduce / finish adopting a `GeometryConfig` interface to consolidate parameters (partially implemented)

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

### M. Deployment Automation (Done)

- ✅ Triggers confirmed: SSR deploy on push to `main`; static export on `v*` tags + `workflow_dispatch`
- ✅ `.github/workflows/deploy.yml` — both jobs skip cleanly when secrets absent (verified with `v0.1.0-test` tag and
  main push)
- ✅ Required secrets documented in `docs/deployment.md`: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- ✅ Skip messaging in place — jobs exit green without Vercel credentials

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
- Parameter Objects: Finalize `GeometryConfig` adoption and consider deprecating legacy export wrapper
- E2E Assertions: (DONE) Legend sum + seat count (test integrity improvements)

---

(Generated by assistant; edit freely as plan evolves.)

## Testing & Coverage (2025-10-08)

- Summary: Ran unit tests and generated coverage artifacts; added helper scripts under `tmp/` to parse coverage JSON
  produced by Vitest's `--coverage` output.
- Coverage provider: Vitest coverage requires `@vitest/coverage-v8` in CI and locally; ensure this devDependency is
  present in `package.json`.

### Findings

- Repository area analysed: `src/app/parliament` (approx. 64 files).
- Files with existing test coverage (examples):
  - `parliament/filters/apply.spec.ts`, `apply.additional.spec.ts`
  - `parliament/d3.spec.ts`
  - `parliament/geometry/geometry.spec.ts`, `allocation.spec.ts`
  - `parliament/tooltip/tooltipLayout.spec.ts`
  - Hook specs present for several hooks (see `src/app/parliament/*/*.spec.ts`)
- Files with NO coverage entries (representative list):
  - `src/app/parliament/FiltersPanel.tsx`
  - `src/app/parliament/HemicycleReact.tsx`
  - `src/app/parliament/PartyLegend.tsx`
  - `src/app/parliament/SnapshotExplorer.tsx`
  - `src/app/parliament/hemicycle/HemicycleSeats.tsx`
  - `src/app/parliament/hemicycle/HemicycleTooltip.tsx`
  - `src/app/parliament/hemicycle/HemicycleView.tsx`
  - `src/app/parliament/seat/Seat.tsx`
  - `src/app/parliament/seat/SeatCircles.tsx`
  - `src/app/parliament/tooltip/TooltipSecondary.tsx`
  - `src/app/parliament/filters/FilterBadge.tsx`
  - `src/app/parliament/filters/ActiveFiltersSummary.tsx`
  - `src/app/parliament/filters/PartyFilterList.tsx`
  - `src/app/parliament/filters/GenderFilterList.tsx`
  - `src/app/parliament/filters/AgeRangeFilter.tsx`
  - `src/app/parliament/d3.ts`
  - `src/app/parliament/exportUtils.ts`
  - `src/app/parliament/geometry/allocation.ts`
  - `src/app/parliament/geometry/geometry.ts`
  - `src/app/parliament/geometry/parties.ts`
  - `src/app/parliament/data/sparql.ts`
  - hooks without coverage: `useHemicycleLayout.ts`, `useHemicycleExport.ts`, `useHemicycleState.ts`,
    `useHemicycleTooltipState.ts`, `usePartyMeta.ts`, `useResponsiveSeatScale.ts`, `useSeatHandlers.ts`

### Coverage artifacts location

- Vitest coverage artifacts produced under `coverage/.tmp/*.json` (helper scripts parse these into a summary).
- Helper scripts added (non-invasive) under `tmp/`:
  - `tmp/parse-coverage.js` — enumerates coverage JSON files and extracts covered file paths
  - `tmp/coverage-summary.js` — compares covered files to `src/app/parliament` source files and prints missing files

### Recommended test-writing priorities

1. Pure logic & hooks (fast feedback, no DOM):
   - `useHemicycleLayout` (geometry orchestration)
   - `parliament/d3.ts` (geometry utilities)
   - `parliament/geometry/*` (allocation, parties)
   - `exportUtils.ts`
2. Data + fetching logic (mock network):
   - `data/sparql.ts`
   - `usePartyMeta`, `useLiveAnnouncements` (mock fetch responses)
3. Small presentational components (React Testing Library):
   - `FilterBadge`, `ActiveFiltersSummary`, `SeatCircles`, `TooltipSecondary`
4. Larger integration components (mocked contexts & snapshots):
   - `SnapshotExplorer` (async snapshot loading)
   - `HemicycleReact` / `HemicycleView` (integration + render smoke tests)

### CI / Tooling notes

- Ensure CI installs `@vitest/coverage-v8` before running tests with coverage.
- Add an optional coverage check step in CI; either fail on missing thresholds or report as a warning depending on team
  preference.

### Next actionable options

- Option A: Add this section to `TODO.md` (done) and create a small PR with a single sample test for a priority file (I
  can implement a unit test for `d3.ts` or `useHemicycleLayout`).
- Option B: I can start implementing tests now — pick the first target (suggestion: `useHemicycleLayout` or `d3.ts`).
- Option C: Add coverage to CI and a coverage badge (requires GH Actions edit) — I can prepare the workflow change if
  you want.

(End of coverage summary)
