# Official Members Timeline

Alternative pipeline ingesting UK Parliament OData XML to derive events & snapshots under `public/data/official/`.

## Command

```bash
bun run snapshot:official -- --since 2005-01-01 --granularity events --source odata
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

## Event Types

Event type classification uses Wikidata for UK general elections and UK parliamentary by‑elections. The build augments
missing dates from Wikidata to ensure `eventType` coverage even when the seat‑spell data lacks an explicit event.

Keep `scripts/harvest/electionsBaseline.ts` updated with new general election dates. Use
`bun run scripts/verify-event-types.ts` after regenerating data to confirm the Wikidata dates align with the generated
`events.json` and `official.index.json`.

## Reliability

Retry with fallback query; logs HTTP status & zero-row scenarios. Manual checks via Wikidata Query Service possible.

## Limitations

- Intra-incumbency party switches not yet emitted
- Constituency slug collisions not deduped
- Party color/leaning not reconciled with official IDs yet
