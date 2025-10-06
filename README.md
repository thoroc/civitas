# Civitas

This is a [Next.js](https://nextjs.org/) project bootstrapped with
[`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and
load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions
are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### Deployment Modes: SSR vs Static Export

The app supports two deployment modes controlled at build time.

1. Default (SSR / ISR capable): build without `STATIC_EXPORT`. Uses Next.js routing, `headers()` API, and can later
   adopt incremental static regeneration or dynamic routes that require a server runtime.
2. Static Export (`output: 'export'`): build with `STATIC_EXPORT=1` (or `true`). Produces fully static assets suitable
   for CDN-only hosting. Avoid if you plan to add server components, dynamic data fetching, or revalidation.

Commands:

```bash
# SSR / ISR capable build (recommended for Vercel)
npm run build

# Static export build
STATIC_EXPORT=1 npm run build
```

When exporting, ensure any future dynamic features are guarded or avoided; otherwise prefer the default mode on Vercel.

### Security Headers

Security headers are defined in `next.config.mjs` via `async headers()`. Key directives:

- CSP: locked to required domains (cat facts, Wikidata, GitHub raw/gist). `style-src 'self'` no longer needs
  `'unsafe-inline'`.
- HSTS: two-year preload (`Strict-Transport-Security`). Only effective over HTTPS.
- Frame / embed isolation: `X-Frame-Options: SAMEORIGIN`, COOP/COEP/CORP to enable stronger cross-origin protections.
- Referrer policy: `no-referrer` (adjust to `strict-origin-when-cross-origin` if analytics need path info).
- Permissions Policy: disables geolocation, mic, camera, and FLoC / Topics (`interest-cohort=()`).
- Cross-domain policy blocked: `X-Permitted-Cross-Domain-Policies: none`.

If you switch to static export hosting not honoring Next.js `headers()`, replicate equivalent headers at the CDN / host
layer.

CSP maintenance tips:

- Keep `connect-src` minimal; remove unused endpoints before broadening.
- If `Cross-Origin-Embedder-Policy` blocks required third-party scripts, consider dropping COEP/CORP pair first.
- Validate changes in browser DevTools (Security & Network panels) and watch for CSP violation reports (add a
  `report-uri` if needed).

## Technologies used additionally

- DaisyUI: <https://daisyui.com/>
- D3js: <https://d3js.org/>

## Parliament Snapshot & Hemicycle

A static parliament snapshot is used to render the hemicycle at `/parliament`.

### Generate a snapshot

```bash
npm run snapshot:parliament -- --date 2021-01-01T00:00:00Z
```

The `--date` must be an ISO timestamp (UTC) matching the Wikidata query timeframe.

Accepted input formats:

- `YYYY-MM-DDTHH:MM:SSZ` (canonical ISO)
- `YYYY-MM-DDTHH-MM-SSZ` (dash form; auto-normalized for the query, still used for filename)

### Output file naming

Snapshots are written to `public/data` with colons replaced by dashes for filesystem safety:

```text
public/data/parliament-2021-01-01T00-00-00Z.json
```

Only the dash-normalised filename is loaded (the app no longer checks the raw colon form). If you change the constant
`SNAPSHOT_DATE` in `src/app/parliament/page.tsx`, ensure a corresponding snapshot file exists.

### Data contents

Each snapshot file contains:

- `meta.date`: the requested snapshot date (original form)
- `meta.generatedAt`: ISO timestamp when the file was created
- `meta.total`: number of members
- `members[]`: normalised member objects with id, label, optional party & constituency, gender, age

### Legend & Visualisation

`HemicycleReact.tsx` renders the semicircle layout in pure React/SVG using precomputed geometry helpers.
`PartyLegend.tsx` summarises seat counts per party (independents grouped under a neutral colour if no party data
present). After filtering (see below) the legend shows `filtered / total` for each party, highlighting filtered counts.

### Regenerating / adding dates

Repeat the generation command with a new date and commit the produced JSON. Consider pruning obsolete large snapshots if
size becomes an issue.

### Snapshot Size & Versioning Guidance

Snapshots are treated as deterministic build inputs:

- Keep only the dates you actively surface in the UI to limit repository size.
- Large diffs: Prefer adding new snapshots rather than rewriting historical ones (immutability aids reproducibility).
- If the underlying SPARQL query changes shape (new fields), bump an internal data version constant (e.g.
  `SCHEMA_VERSION = 2`) in the generator and gate consumer logic if needed.
- For very large legislatures, consider gzipping snapshots at the CDN layer (static hosting typically auto‑compresses
  JSON). Avoid committing compressed variants alongside raw JSON.
- Validate snapshot schema with a lightweight runtime check (could be added later) before rendering to avoid silent
  geometry or filter failures.

### Filtering & Controls

`FiltersPanel.tsx` exposes interactive filters (Parties, Gender, Age range). Internally, empty filter arrays mean "no
restriction"; when a user first deselects a party/gender the UI materialises an explicit inclusion list. Re‑selecting
all options collapses back to the empty (all) state for simplicity.

State shape (`ParliamentFiltersState`):

- `parties: string[]` – party ids to include; empty = all
- `genders: string[]` – gender tokens to include; empty = all
- `minAge` / `maxAge` – numeric bounds or `null`

The filter logic lives in `filtersContext.tsx` (`apply()`), memoising context values and stabilising callbacks with
`useCallback` to avoid unnecessary re-renders of consumers like the hemicycle and legend.

### Interaction Model (Hemicycle)

Keyboard (roving tabindex):

- Arrow Left/Right: previous/next seat (wraps)
- Arrow Up/Down: move proportionally to adjacent ring
- Home / End: jump to first / last seat
- Page Up / Page Down: jump ±10 seats
- Space / Enter: toggle lock on current seat (locks tooltip)

Mouse / focus: Hover or focus shows a tooltip with member name, party, and seat index (in full mode). Toggling
compact/full mode persists in `localStorage` under `parliamentTooltipMode`.

Seat locking: Clicking or pressing Space/Enter toggles a locked state (visual halo + thicker stroke) and keeps tooltip
visible while exploring other seats. The element exposes `aria-pressed` for assistive tech.

Live region: A visually hidden element announces seat changes and lock/unlock events for screen reader users.

### Export

Buttons above the hemicycle export the current SVG directly or render a high‑resolution PNG (off‑screen canvas, white
background). Locked state and current scaling are preserved.

### Extensibility

- Add a new categorical filter: extend `ParliamentFiltersState`, update `apply()`, expose UI in `FiltersPanel` mirroring
  the existing badge toggle pattern.
- Additional seat metadata: include in snapshot generation script and surface inside `HemicycleReact` tooltip rendering.
- Performance: For very large chambers, consider virtualization (only rendering visible seats) or reducing DOM nodes by
  grouping static rings; current pure SVG approach is adequate for typical chamber sizes.

### Accessibility Notes

- Interactive seats use semantic `role="button"` and `aria-pressed` to convey lock state.
- Roving tabindex keeps the tab order concise (only one focusable seat at a time).
- Instructions and live updates use `sr-only` regions for clarity without visual clutter.

### Implementation Notes

- Geometry is precomputed each render based on the filtered member count; ring metadata (`ringMeta`) enables
  proportional vertical navigation.
- Filters are intentionally stateless from the perspective of components: consumers call `apply(members)` on their own
  list, easing reuse with future datasets.
- Legend recomputes counts from both full and filtered sets to display `filtered / total` succinctly.
- Seat ordering groups parties into left → center → right wedges using party metadata (see below). If metadata is
  missing it falls back to a heuristic regex against party labels.

### Party Metadata (Ideological Leaning)

A separate metadata file enriches parties with an inferred ideological leaning used to produce contiguous wedges:

`public/data/partyMeta.json`

Structure:

```jsonc
{
  "generatedAt": "2025-01-01T00:00:00.000Z",
  "parties": [
    {
      "id": "Q12345", // Wikidata QID (preferred stable id)
      "originalSnapshotId": "Q12345", // For reconciliation if snapshot id differed
      "label": "Example Party",
      "color": "#0055AA",
      "leaning": "center", // one of left|center|right
      "spectrumPosition": 0.5, // coarse numeric slot (future use)
      "qidResolved": true,
      "source": {
        "ideologies": ["liberalism"],
        "matched": ["liberal"],
        "method": "ideology-labels", // override | ideology-labels | party-label-regex | fallback
        "generatedAt": "2025-01-01T00:00:00.000Z",
      },
    },
  ],
}
```

### Generate / Refresh Party Metadata

1. Ensure you have an up‑to‑date parliament snapshot (see earlier section). The snapshot now stores party and member ids
   as Wikidata QIDs.
2. Run:

```bash
npm run snapshot:partyMeta -- --snapshot public/data/parliament-2021-01-01T00-00-00Z.json
```

1. Commit the resulting `public/data/partyMeta.json`.

The script attempts the following inference order:

1. Overrides file (`public/data/partyMeta.overrides.json`) if present
2. Wikidata ideology properties P1142 / P1387 (keyword matched)
3. Party label regex heuristics
4. Fallback to `center`

### Overrides

Create `public/data/partyMeta.overrides.json` (not committed by default unless you add it) to pin values:

```json
{
  "Q12345": { "leaning": "left" },
  "Q67890": { "leaning": "right", "label": "Custom Label", "spectrumPosition": 0.8 }
}
```

Keys can be either the party QID or (legacy) the snapshot party id; QID takes precedence.

### Updating Snapshot Script (QIDs)

The snapshot generator (`scripts/generateParliamentSnapshot.ts`) now stores:

- `member.id` = MP QID (without full URI)
- `party.id` = Party QID
- `party.label` = Party label

If you still have older snapshots where `party.id` was a label, regenerate them for consistent meta matching.

### Client Integration

`HemicycleReact.tsx` loads `partyMeta.json` at runtime (graceful fallback). If the file is absent or a given party not
present, it applies the previous regex heuristics so the visualization still renders deterministically.

### Regeneration Guidance

After modifying overrides or updating the snapshot query:

```bash
npm run snapshot:partyMeta -- --snapshot public/data/parliament-YYYY-MM-DDTHH-MM-SSZ.json
```

Then reload `/parliament` to see updated wedges.

### Multiple Historical Snapshots

The application now supports selecting among multiple historical snapshots (typically UK Parliament term starts) via a
dropdown on `/parliament`.

#### Generate a Range of Snapshots

Run the batch script (discovers all UK parliamentary term start dates >= 2005):

```bash
npm run snapshot:range:terms
```

Options (pass after `--` if invoking via npm):

- `--force` regenerate even if snapshot file already exists
- `--throttle <ms>` delay between requests (default 300)

Each discovered date generates:

- `public/data/parliament-<safeDate>.json`
- `public/data/partyMeta-<safeDate>.json` (dated party meta)

An index file is (re)built:

```text
public/data/parliament.index.json
```

Structure (array):

```jsonc
[
  {
    "date": "2021-01-01T00:00:00Z",
    "safeDate": "2021-01-01T00-00-00Z",
    "file": "parliament-2021-01-01T00-00-00Z.json",
    "partyMetaFile": "partyMeta-2021-01-01T00-00-00Z.json",
    "total": 650,
    "generatedAt": "2025-10-05T12:34:56.000Z",
  },
]
```

#### SPARQL Reliability & Troubleshooting

The range generator now includes:

- Retry (up to 3 attempts) with exponential backoff for the term start date discovery query
- A simplified fallback query (drops subclass traversal) if the primary returns zero rows
- Detailed logging: HTTP status codes, retry notices, zero-row warnings

Common scenarios:

- Zero rows every attempt: Wikidata Query Service may be under load or the query pattern temporarily cached poorly. The
  script will fall back to scanning existing `public/data/parliament-*.json` files and still regenerate the index.
- HTTP 429 or 5xx: These are automatically retried. Consider increasing `--throttle` (default 300ms between snapshot
  generations) for very large ranges.

Manual verification:

1. Copy the primary query from `generateParliamentSnapshotsRange.ts` and run it in <https://query.wikidata.org/> to
   confirm expected rows.
2. If primary succeeds there but script fails, temporarily run with `DEBUG=1` (future enhancement) or inspect logged
   statuses for network issues.

If both primary and fallback queries fail persistently you can still add manual dates using the single snapshot
generator and re-run the range script to rebuild the index from files.

#### Client Loading Flow

`/parliament` now renders `SnapshotExplorer` which:

- Fetches `parliament.index.json` (no-cache)
- Determines selected date (last used from `localStorage` or latest entry)
- Fetches the snapshot file & corresponding dated party meta
- Resets filters upon snapshot change

If no index exists you will see an instructional message.

#### Adding New Snapshots

1. Run the single snapshot generator for a new date OR rerun the range generator.
2. Commit new `parliament-<date>.json`, `partyMeta-<date>.json`, and updated `parliament.index.json`.
3. Deploy — the UI will automatically include the new date.

#### Deep Linking (Future)

Planned enhancement: support `?date=YYYY-MM-DDTHH:MM:SSZ` to preselect a snapshot.

## Official Members Timeline (UK Parliament)

An alternative pipeline builds a seat & party timeline from official UK Parliament data (Members Data Platform XML
“OData style”) instead of Wikidata snapshots.

### Status

Implemented OData/XML harvester: multi‑seat careers and election/by‑election/vacancy events are produced from
authoritative incumbency rows. Party history within a continuous seat tenure is currently coarse (only the final/current
party is exposed per incumbency row), so intra‑tenure party switches that do not coincide with a constituency change are
not yet emitted as `partySwitch` events.

### Rationale

- Reduce dependence on SPARQL rate limits & transient failures.
- Provide an events stream (general elections, by‑elections, seat changes, vacancies, party switches where detectable)
  for higher‑frequency snapshots.
- Lay groundwork to reconcile with richer party history sources later.

### Data Source

Bulk Commons membership endpoint (single fetch):

```text
https://data.parliament.uk/membersdataplatform/services/mnis/members/query/House=Commons|Membership=All/
```

Each `<Member>` row represents a continuous incumbency (may span multiple general elections). Fields extracted:
`Member_Id`, `DisplayAs`, `Party (Id + text)`, `MemberFrom`, `HouseStartDate`, `HouseEndDate`.

### Components

- `scripts/harvest/odataHarvester.ts` – fetch + XML parse to raw `SeatSpell` & `PartySpell` records.
- `scripts/harvest/membersApiClient.ts` – legacy fallback (still available via `--source membersApi`).
- `scripts/harvest/normalize.ts` – ISO normalisation, filtering by `--since`, party alias handling, optional Labour &
  Co‑op merge.
- `scripts/harvest/buildEvents.ts` – derives events from spells + curated elections baseline.
- `scripts/harvest/buildSnapshots.ts` – applies events to chamber state, emits snapshots (event or monthly granularity).
- `scripts/generateOfficialTimeline.ts` – orchestrator CLI with enhanced validation (overlaps, gaps, negative
  durations).

### Usage

```bash
npm run snapshot:official -- --since 2005-01-01 --granularity events --source odata
```

Options:

- `--since <YYYY-MM-DD>`: trim spells/events before date (default 2005-01-01)
- `--granularity events|monthly`: snapshot emission strategy
- `--merge-labour-coop`: collapse Labour & Co‑operative joint entries
- `--force-refresh`: ignore HTTP/XML cache
- `--max-concurrency <n>`: not currently used by bulk OData fetch (still honored for legacy membersApi path)
- `--cache-dir <path>`: cache base (default `.cache/members-api`)
- `--source membersApi|odata`: choose harvester (recommend `odata`)

### Output

`public/data/official/`:

- `events.json` – ordered event list
- `official.index.json` – snapshot index
- `official-parliament-<date>.json` – individual snapshots `{ date, meta, members[], parties, total }`

### Validation

The orchestrator logs counts (per spell type) of:

- Overlaps (temporal overlaps same member)
- Gaps (non-contiguous spells leaving vacancy potential)
- Negative durations (end < start) Only summary + first samples are printed; address anomalies at source or during
  normalization.

### Known Limitations

- Intra‑incumbency party switches not exposed: missing `partySwitch` events when a member changes party without a seat
  change and remains in continuous service.
- Constituency slug collisions are possible if distinct historical names normalise identically (not yet de‑duplicated).
- Party color / ideological metadata not yet integrated with official IDs (current IDs are raw Party Ids from source).

### Planned Enhancements

1. Discover supplemental endpoint(s) or alternate dataset for detailed party affiliation history.
2. Constituency slug collision detection / stable ID mapping.
3. Party ID reconciliation and color/leaning mapping file akin to Wikidata path.
4. Optional monthly snapshots on top of event snapshots for smoother trend charts.
5. UI mode toggle (Wikidata vs Official) with clear provenance badge.
6. Synthetic test fixtures for event derivation edge cases (gap, overlapping spells, multi-switch sequences).

### Fallback / Legacy Path

`--source membersApi` retains earlier JSON-based placeholder logic (single provisional spells when history absent).
Prefer `--source odata` now; provisional flags are no longer set for OData-derived spells.

### Caution

Treat party switch analytics as incomplete until intra‑tenure party history is sourced. Seat-based events (elections,
by‑elections, vacancies, seat changes) are reliable within data extraction constraints.
