# Civitas — Project Memory

This file gives agents and contributors the context needed to make good decisions without re-deriving it from scratch.

## What is Civitas?

Civitas is a **web application that visualises party distribution in parliamentary assemblies over time**. The primary example is the **UK House of Commons**.

The central view is a **hemicycle** — a semi-circular diagram where each seat is a dot, coloured by party, arranged left-to-right by ideological leaning (left → centre → right). The user can scrub through
a timeline and watch the composition change.

## Domain model in one paragraph

A parliament has a fixed number of **seats** (650 for the UK Commons). Each seat belongs to a **constituency** and is held by an **MP** from a **party**. Composition changes at two kinds of event:

- **General election** — all seats are contested at once; completely resets composition.
- **By-election** — a single seat is refilled after a vacancy (death, resignation, recall, etc.); changes composition by ±1 seat.

Between those events the composition is static (ignoring rare mid-term party switches). This means the data model is naturally a **timeline of snapshots** driven by discrete events.

## UK Parliament specifics

See [`docs/uk-parliament-primer.md`](docs/uk-parliament-primer.md) for a full primer. Key facts:

- **650 constituencies**, each returning exactly one MP via First Past the Post.
- Parliament lasts up to **5 years**; snap elections possible at PM's request.
- Historical general elections in scope: 2005, 2010, 2015, 2017, 2019, 2024.
- By-elections occur throughout a parliament — sometimes several per year.
- The hemicycle shows **seats won**, not vote share.

## Data pipeline

```text
UK Parliament Members API / OData
        ↓
  harvestMembers / odataHarvester   (scripts/harvest/)
        ↓
  normalize                          → NormalizedData
        ↓
  buildEvents + buildSnapshots       (scripts/timeline/)
        ↓
  writeTimelineOutput
        ↓
  public/data/official/
    ├── events.json
    ├── official.index.json
    └── official-parliament-<date>.json  (one per snapshot)
```

Each snapshot file contains the **full chamber composition** at that date — it is not a diff. The state machine in `buildSnapshots` accumulates all active members and emits the complete set on each event.

## Known data issue (as of April 2026)

The generated snapshots currently contain only ~7 members because `harvestMembers` (the Parliament Members API client) is an incomplete scaffold — it fetches one search-results page and cannot yet extract
full party/seat spell histories. **Each snapshot should have ~650 members.** The old Wikidata SPARQL pipeline (`public/data/parliament-2021-01-01T00-00-00Z.json`, 226 KB) is the only fully populated
snapshot available.

**Do not treat the small member counts in `official.index.json` as correct.**

## Key source files

| Purpose                     | Path                                             |
| --------------------------- | ------------------------------------------------ |
| Hemicycle container         | `src/app/parliament/HemicycleReact.tsx`          |
| Snapshot explorer (UI)      | `src/app/parliament/SnapshotExplorer.tsx`        |
| Data schemas (Zod)          | `src/app/parliament/schemas.ts`                  |
| Snapshot index hook         | `src/app/parliament/hooks/useParliamentIndex.ts` |
| Snapshot loader hook        | `src/app/parliament/hooks/useSnapshotLoader.ts`  |
| State machine               | `scripts/harvest/buildSnapshots.ts`              |
| Members API client          | `scripts/harvest/membersApiClient.ts`            |
| Timeline CLI command        | `scripts/commands/timeline.ts`                   |
| Official data dir           | `public/data/official/`                          |

## Docs index

| File                                                                  | Topic                                         |
| --------------------------------------------------------------------- | --------------------------------------------- |
| [`docs/uk-parliament-primer.md`](docs/uk-parliament-primer.md)        | UK Commons structure, elections, by-elections |
| [`docs/official-timeline.md`](docs/official-timeline.md)              | Data generation pipeline                      |
| [`docs/architecture.md`](docs/architecture.md)                        | Overall app architecture                      |
| [`docs/parliament-snapshots.md`](docs/parliament-snapshots.md)        | Snapshot data format                          |
| [`docs/party-metadata.md`](docs/party-metadata.md)                    | Party colour & leaning metadata               |
| [`docs/filters-and-interaction.md`](docs/filters-and-interaction.md)  | UI filter system                              |
| [`docs/exporting.md`](docs/exporting.md)                              | SVG/PNG export feature                        |
| [`docs/development.md`](docs/development.md)                          | Local dev setup                               |
| [`docs/deployment.md`](docs/deployment.md)                            | Deployment                                    |
| [`docs/roadmap.md`](docs/roadmap.md)                                  | Planned features                              |
