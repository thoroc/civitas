'use client';
import FiltersPanel from '../FiltersPanel';
import HemicycleReact from '../HemicycleReact';
import PartyLegend from '../PartyLegend';
import type { ParliamentSnapshot } from '../schemas';

interface SnapshotPanelsProps {
  snapshot: ParliamentSnapshot;
  loadingMeta: boolean;
  partyMetaMap: Record<string, { leaning: 'left' | 'center' | 'right' }>;
}

const SnapshotPanels = ({
  snapshot,
  loadingMeta,
  partyMetaMap,
}: SnapshotPanelsProps) => (
  <div className='grid gap-8 lg:grid-cols-4 items-start'>
    <div className='lg:col-span-3 order-2 lg:order-1 card-surface'>
      <p className='text-xs text-muted mb-3'>
        Snapshot date: {snapshot.meta.date} · Total members:{' '}
        {snapshot.meta.total}
        {loadingMeta && ' · Loading party meta…'}
      </p>
      <HemicycleReact
        members={snapshot.members}
        partyMetaOverride={partyMetaMap}
      />
    </div>
    <aside className='lg:col-span-1 order-1 lg:order-2 space-y-4'>
      <div className='card-muted'>
        <FiltersPanel members={snapshot.members} />
      </div>
      <div className='card-muted'>
        <h2 className='mb-2'>Party Totals</h2>
        <PartyLegend members={snapshot.members} />
      </div>
    </aside>
  </div>
);

export default SnapshotPanels;
