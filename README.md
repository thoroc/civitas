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

`HemicycleReact.tsx` renders the semicircle layout in pure React/SVG using precomputed geometry helpers. `PartyLegend.tsx` summarises seat counts per party (independents grouped under a neutral colour if no party data present).

### Regenerating / adding dates

Repeat the generation command with a new date and commit the produced JSON. Consider pruning obsolete large snapshots if size becomes an issue.
