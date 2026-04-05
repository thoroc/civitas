'use client';
import SnapshotHeader from './components/SnapshotHeader';
import SnapshotPanels from './components/SnapshotPanels';
import { ParliamentFiltersProvider } from './context/filtersContext';
import { useParliamentIndex } from './hooks/useParliamentIndex';
import { useSnapshotSelection } from './hooks/useSnapshotSelection';
import { useSnapshotState } from './hooks/useSnapshotState';
import type { ParliamentIndexEntry } from './schemas';

interface SnapshotExplorerProps {
  initialDate?: string;
}

const SnapshotInner = ({
  index,
  initialDate,
}: {
  index: ParliamentIndexEntry[];
  initialDate?: string;
}) => {
  const { filteredIndex, queryDate } = useSnapshotSelection(index);

  const {
    selectedDate,
    setSelectedDate,
    snapshot,
    loadingSnapshot,
    partyMetaMap,
    loadingMeta,
    error,
  } = useSnapshotState(filteredIndex, queryDate ?? initialDate);

  return (
    <div className='space-y-6'>
      <SnapshotHeader
        index={filteredIndex}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      {error && <div className='alert alert-error text-sm'>{error}</div>}
      {!error && loadingSnapshot && (
        <div className='skeleton h-32 w-full' aria-label='Loading snapshot' />
      )}
      {snapshot && !loadingSnapshot && (
        <SnapshotPanels
          snapshot={snapshot}
          loadingMeta={loadingMeta}
          partyMetaMap={partyMetaMap}
        />
      )}
    </div>
  );
};

const SnapshotExplorer = ({ initialDate }: SnapshotExplorerProps) => {
  const { index, loading, error } = useParliamentIndex();
  if (loading) return <div className='p-4 text-sm'>Loading index…</div>;
  if (error) return <div className='alert alert-error text-sm'>{error}</div>;
  if (!index || index.length === 0)
    return (
      <div className='p-4 text-sm'>
        No snapshots indexed. Run <code>bun run generate timeline</code>.
      </div>
    );
  return (
    <ParliamentFiltersProvider>
      <SnapshotInner index={index} initialDate={initialDate} />
    </ParliamentFiltersProvider>
  );
};

export default SnapshotExplorer;
