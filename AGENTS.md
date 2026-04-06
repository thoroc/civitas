# Agent Rules <!-- tessl-managed -->

@.tessl/RULES.md follow the [instructions](.tessl/RULES.md)

@MEMORY.md

## Data Flow: Generation vs Presentation

The data pipeline is separate from the website UI. High level flow:

- `scripts/cli.ts` wires the `timeline` command.
- `scripts/commands/timeline.ts` runs `runTimeline()` which calls `runHarvest()` and then `buildEventsAndSnapshots()`.
- `scripts/timeline/buildEventsAndSnapshots.ts` calls `buildEvents()` and `buildSnapshots()`, then `writeTimelineOutput()` writes `public/data/official/official.index.json`.
- The web UI reads snapshot index data via `src/app/parliament/hooks/useParliamentIndex.ts` and loads snapshots via `src/app/parliament/hooks/useSnapshotLoader.ts`.

## Coding style

Read the @CONTRIBUTING.md
