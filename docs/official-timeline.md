# Official Members Timeline

Alternative pipeline ingesting UK Parliament OData XML to derive events & snapshots under `public/data/official/`.

## Command

```bash
npm run snapshot:official -- --since 2005-01-01 --granularity events --source odata
```

## Outputs

- `events.json` chronological events
- `official.index.json` snapshot index
- `official-parliament-<date>.json` snapshot files

## Components

- `odataHarvester.ts` -> raw spells
- `normalize.ts` -> cleaned spells & options
- `buildEvents.ts` -> elections, vacancies, switches, by‑elections
- `buildSnapshots.ts` -> applies events to state

## Reliability

Retry with fallback query; logs HTTP status & zero-row scenarios. Manual checks via Wikidata Query Service possible.

## Limitations

- Intra-incumbency party switches not yet emitted
- Constituency slug collisions not deduped
- Party color/leaning not reconciled with official IDs yet
