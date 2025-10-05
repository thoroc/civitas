import HemicycleReact from './HemicycleReact';
import { ParliamentFiltersProvider } from './filtersContext';
import PartyLegend from './PartyLegend';
import type { ParliamentSnapshot } from './types';
import fs from 'fs';
import path from 'path';

// This is a server component by default; we can read the snapshot at build/runtime.
const SNAPSHOT_DATE = '2021-01-01T00:00:00Z';

const loadSnapshot = (): ParliamentSnapshot | null => {
  const normalized = SNAPSHOT_DATE.replace(/:/g, '-');
  const file = path.join(process.cwd(), 'public', 'data', `parliament-${normalized}.json`);
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as ParliamentSnapshot;
  } catch (_) {
    return null;
  }
};

const ParliamentPage = () => {
  const snapshot = loadSnapshot();
  return (
    <div className="space-y-6">
      <header>
        <h1>Chamber Composition</h1>
        <p className="text-sm text-muted max-w-2xl">Interactive hemicycle representing the chamber membership. Hover, focus or tap seats for member details; export the current visual for reporting or civic analysis.</p>
      </header>
      {!snapshot && (
        <div className="alert alert-warning">Snapshot not found. Run <code>npm run snapshot:parliament</code> to generate it.</div>
      )}
      {snapshot && (
        <ParliamentFiltersProvider>
          <div className="grid gap-8 lg:grid-cols-4 items-start">
            <div className="lg:col-span-3 order-2 lg:order-1 card-surface">
              <p className="text-xs text-muted mb-3">Snapshot date: {snapshot.meta.date} · Total members: {snapshot.meta.total}</p>
              <HemicycleReact members={snapshot.members} />
            </div>
            <aside className="lg:col-span-1 order-1 lg:order-2 space-y-4">
              <div className="card-muted">
                <h2 className="mb-2">Party Totals</h2>
                <PartyLegend members={snapshot.members} />
              </div>
            </aside>
          </div>
        </ParliamentFiltersProvider>
      )}
    </div>
  );
};

export default ParliamentPage;
