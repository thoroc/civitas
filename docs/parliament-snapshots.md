# Parliament Snapshots

Snapshots capture chamber membership at specific dates and live in `public/data/` as `parliament-<safeDate>.json`.

## Generation

```bash
npm run snapshot:parliament -- --date 2021-01-01T00:00:00Z
```

Date must be ISO UTC. A dash-normalized form (`T00-00-00Z`) is used for filenames.

## Contents

- `meta.date` original requested date
- `meta.generatedAt` generation timestamp
- `meta.total` member count
- `members[]` normalized: id (QID), label, optional party & constituency, gender, age

## Adding / Updating

Generate with new dates; commit new files (do not rewrite historical ones unless fixing objective errors).

## Range Generation

Build multiple historical term snapshots:

```bash
npm run snapshot:range:terms
```

Outputs `parliament.index.json` plus dated party metadata files when present.

## Data Versioning

If schema fields change, bump an internal version constant in generator scripts and gate consumers.

## Size Guidance

Limit committed snapshot dates to those surfaced in UI. Rely on CDN gzip for JSON compression.
