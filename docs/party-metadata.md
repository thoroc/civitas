# Party Metadata

`partyMeta.json` enriches parties with color, ideological leaning, and inference provenance.

## Generation

```bash
npm run snapshot:partyMeta -- --snapshot public/data/parliament-2021-01-01T00-00-00Z.json
```

Commit the resulting `public/data/partyMeta.json`.

## Inference Order

1. Overrides file (`partyMeta.overrides.json`) if present
2. Wikidata ideology properties P1142 / P1387
3. Party label regex heuristics
4. Fallback to `center`

## Overrides

Create `public/data/partyMeta.overrides.json` to pin values:

```json
{
  "Q12345": { "leaning": "left" },
  "Q67890": { "leaning": "right", "label": "Custom Label", "spectrumPosition": 0.8 }
}
```

## QID Migration

Ensure snapshots store party/member ids as QIDs; regenerate older snapshots if they held labels for stable matching.
