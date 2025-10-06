# Architecture

Civitas is a Next.js 14 application (App Router) delivering a static or SSR-rendered parliamentary visualization.

Core layers:

- UI: React components under `src/app` (App Router pages & components)
- Data: Pre-generated JSON snapshots in `public/data/*`
- Parliament domain: Hemicycle visualization, filters, layout helpers
- Build scripts: TypeScript generators under `scripts/` for snapshots & party metadata

Key decisions:

- Precompute and commit snapshots to avoid runtime SPARQL dependency
- Keep visualization pure React/SVG (no client-side D3 DOM mutation) for accessibility & SSR friendliness
- Filters centralized in context (`filtersContext.tsx`) with an `apply()` pure function
- Options object pattern enforced for >2 scalar params to maintain call-site clarity

See `parliament-snapshots.md`, `party-metadata.md`, and `official-timeline.md` for data pipeline specifics.
