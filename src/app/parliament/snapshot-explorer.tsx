'use client';
import SnapshotHeader from './components/snapshot-header';
import SnapshotPanels from './components/snapshot-panels';
import { ParliamentFiltersProvider } from './context/filters-context';
import { useParliamentIndex } from './hooks/use-parliament-index';
import { useSnapshotSelection } from './hooks/use-snapshot-selection';
import { useSnapshotState } from './hooks/use-snapshot-state';
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
  const { filteredIndex, queryDate, selectedEventType, setSelectedEventType } =
    useSnapshotSelection(index);
  const showAllOption =
    selectedEventType === 'all' ||
    index.some(
      entry => entry.eventType === 'other' || entry.eventType === 'unknown'
    );
  const isEmpty = filteredIndex.length === 0;

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
        isEmpty={isEmpty}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedEventType={selectedEventType}
        onEventTypeChange={setSelectedEventType}
        showAllOption={showAllOption}
      />
      {isEmpty ? (
        <div className='text-sm text-muted'>
          No snapshots for this event type.
        </div>
      ) : (
        <>
          {error && <div className='alert alert-error text-sm'>{error}</div>}
          {!error && loadingSnapshot && (
            <div
              className='skeleton h-32 w-full'
              aria-label='Loading snapshot'
            />
          )}
          {snapshot && !loadingSnapshot && (
            <SnapshotPanels
              snapshot={snapshot}
              loadingMeta={loadingMeta}
              partyMetaMap={partyMetaMap}
            />
          )}
        </>
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
