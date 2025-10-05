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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hemicycle Visualisation</h1>
      {!snapshot && (
        <div className="alert alert-warning">Snapshot not found. Run npm run snapshot:parliament to generate it.</div>
      )}
      {snapshot && (
        <ParliamentFiltersProvider>
          <div>
            <p className="text-sm text-gray-500">Snapshot date: {snapshot.meta.date} (total members: {snapshot.meta.total})</p>
            <HemicycleReact members={snapshot.members} />
            <PartyLegend members={snapshot.members} />
          </div>
        </ParliamentFiltersProvider>
      )}
    </div>
  );
};

export default ParliamentPage;
