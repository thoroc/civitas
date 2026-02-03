# Civitas

Parliament visualization and historical membership timelines (Wikidata + Official UK Parliament data) built with
Next.js 14.

## Quick Start

```bash
npm install
npm run dev
# visit http://localhost:3000
```

## Key Features

- Hemicycle SVG with keyboard navigation & live region accessibility
- Party filtering, gender & age range filters
- Multi-date snapshot selection with persisted choice
- Party metadata enrichment (ideological grouping) and legend counts
- Optional official data pipeline producing event-driven snapshots
- Dual build modes: SSR (default) & static export (explicit)

## Documentation Index

- Architecture: `docs/architecture.md`
- Parliament Snapshots: `docs/parliament-snapshots.md`
- Party Metadata: `docs/party-metadata.md`
- Filters & Interaction: `docs/filters-and-interaction.md`
- Official Timeline: `docs/official-timeline.md`
- Exporting: `docs/exporting.md`
- Deployment: `docs/deployment.md`
- Development & Conventions: `docs/development.md`
- Roadmap: `docs/roadmap.md`

## Builds & Deployment

Default (SSR) build applies security headers via `next.config.mjs`.

```bash
npm run build          # SSR
npm run build:static   # static export (no automatic headers)
```

CI (GitHub Actions) runs lint, type-check, SSR build, static export build. See `.github/workflows/ci.yml`.

## Contributing

Follow development conventions in `docs/development.md`. Keep snapshot data additive (no destructive rewrites unless
fixing objective errors). Use options-object pattern for functions with >2 scalar params.

## License

Unspecified (in-repo usage). Add a LICENSE file before external distribution.
