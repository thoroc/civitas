This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

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

### Output file naming

Snapshots are written to `public/data` with colons replaced by dashes for filesystem safety:

```
public/data/parliament-2021-01-01T00-00-00Z.json
```

Only the dash-normalised filename is loaded (the app no longer checks the raw colon form). If you change the constant `SNAPSHOT_DATE` in `src/app/parliament/page.tsx`, ensure a corresponding snapshot file exists.

### Data contents

Each snapshot file contains:
- `meta.date`: the requested snapshot date (original form)
- `meta.generatedAt`: ISO timestamp when the file was created
- `meta.total`: number of members
- `members[]`: normalised member objects with id, label, optional party & constituency, gender, age

### Legend & Visualisation

`HemicycleReact.tsx` renders the semicircle layout in pure React/SVG using precomputed geometry helpers. `PartyLegend.tsx` summarises seat counts per party (independents grouped under a neutral colour if no party data present). After filtering (see below) the legend shows `filtered / total` for each party, highlighting filtered counts.

### Regenerating / adding dates

Repeat the generation command with a new date and commit the produced JSON. Consider pruning obsolete large snapshots if size becomes an issue.

### Snapshot Size & Versioning Guidance

Snapshots are treated as deterministic build inputs:
- Keep only the dates you actively surface in the UI to limit repository size.
- Large diffs: Prefer adding new snapshots rather than rewriting historical ones (immutability aids reproducibility).
- If the underlying SPARQL query changes shape (new fields), bump an internal data version constant (e.g. `SCHEMA_VERSION = 2`) in the generator and gate consumer logic if needed.
- For very large legislatures, consider gzipping snapshots at the CDN layer (static hosting typically auto‑compresses JSON). Avoid committing compressed variants alongside raw JSON.
- Validate snapshot schema with a lightweight runtime check (could be added later) before rendering to avoid silent geometry or filter failures.

### Filtering & Controls

`FiltersPanel.tsx` exposes interactive filters (Parties, Gender, Age range). Internally, empty filter arrays mean "no restriction"; when a user first deselects a party/gender the UI materialises an explicit inclusion list. Re‑selecting all options collapses back to the empty (all) state for simplicity.

State shape (`ParliamentFiltersState`):
- `parties: string[]` – party ids to include; empty = all
- `genders: string[]` – gender tokens to include; empty = all
- `minAge` / `maxAge` – numeric bounds or `null`

The filter logic lives in `filtersContext.tsx` (`apply()`), memoising context values and stabilising callbacks with `useCallback` to avoid unnecessary re-renders of consumers like the hemicycle and legend.

### Interaction Model (Hemicycle)

Keyboard (roving tabindex):
- Arrow Left/Right: previous/next seat (wraps)
- Arrow Up/Down: move proportionally to adjacent ring
- Home / End: jump to first / last seat
- Page Up / Page Down: jump ±10 seats
- Space / Enter: toggle lock on current seat (locks tooltip)

Mouse / focus: Hover or focus shows a tooltip with member name, party, and seat index (in full mode). Toggling compact/full mode persists in `localStorage` under `parliamentTooltipMode`.

Seat locking: Clicking or pressing Space/Enter toggles a locked state (visual halo + thicker stroke) and keeps tooltip visible while exploring other seats. The element exposes `aria-pressed` for assistive tech.

Live region: A visually hidden element announces seat changes and lock/unlock events for screen reader users.

### Export

Buttons above the hemicycle export the current SVG directly or render a high‑resolution PNG (off‑screen canvas, white background). Locked state and current scaling are preserved.

### Extensibility

- Add a new categorical filter: extend `ParliamentFiltersState`, update `apply()`, expose UI in `FiltersPanel` mirroring the existing badge toggle pattern.
- Additional seat metadata: include in snapshot generation script and surface inside `HemicycleReact` tooltip rendering.
- Performance: For very large chambers, consider virtualization (only rendering visible seats) or reducing DOM nodes by grouping static rings; current pure SVG approach is adequate for typical chamber sizes.

### Accessibility Notes

- Interactive seats use semantic `role="button"` and `aria-pressed` to convey lock state.
- Roving tabindex keeps the tab order concise (only one focusable seat at a time).
- Instructions and live updates use `sr-only` regions for clarity without visual clutter.

### Implementation Notes

- Geometry is precomputed each render based on the filtered member count; ring metadata (`ringMeta`) enables proportional vertical navigation.
- Filters are intentionally stateless from the perspective of components: consumers call `apply(members)` on their own list, easing reuse with future datasets.
- Legend recomputes counts from both full and filtered sets to display `filtered / total` succinctly.
- Seat ordering groups parties into left → center → right wedges using party metadata (see below). If metadata is missing it falls back to a heuristic regex against party labels.

### Party Metadata (Ideological Leaning)

A separate metadata file enriches parties with an inferred ideological leaning used to produce contiguous wedges:

`public/data/partyMeta.json`

Structure:
```jsonc
{
  "generatedAt": "2025-01-01T00:00:00.000Z",
  "parties": [
    {
      "id": "Q12345",              // Wikidata QID (preferred stable id)
      "originalSnapshotId": "Q12345", // For reconciliation if snapshot id differed
      "label": "Example Party",
      "color": "#0055AA",
      "leaning": "center",          // one of left|center|right
      "spectrumPosition": 0.5,        // coarse numeric slot (future use)
      "qidResolved": true,
      "source": {
        "ideologies": ["liberalism"],
        "matched": ["liberal"],
        "method": "ideology-labels", // override | ideology-labels | party-label-regex | fallback
        "generatedAt": "2025-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

### Generate / Refresh Party Metadata

1. Ensure you have an up‑to‑date parliament snapshot (see earlier section). The snapshot now stores party and member ids as Wikidata QIDs.
2. Run:
```bash
npm run snapshot:partyMeta -- --snapshot public/data/parliament-2021-01-01T00-00-00Z.json
```
3. Commit the resulting `public/data/partyMeta.json`.

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

`HemicycleReact.tsx` loads `partyMeta.json` at runtime (graceful fallback). If the file is absent or a given party not present, it applies the previous regex heuristics so the visualization still renders deterministically.

### Regeneration Guidance

After modifying overrides or updating the snapshot query:
```bash
npm run snapshot:partyMeta -- --snapshot public/data/parliament-YYYY-MM-DDTHH-MM-SSZ.json
```
Then reload `/parliament` to see updated wedges.
