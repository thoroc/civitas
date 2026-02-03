'use client';
import { useEffect, useState, useCallback } from 'react';
import { ZodError } from 'zod';

import {
  ParliamentFiltersProvider,
  useParliamentFilters,
} from './context/filtersContext';
import FiltersPanel from './FiltersPanel';
import HemicycleReact from './HemicycleReact';
import PartyLegend from './PartyLegend';
import {
  ParliamentIndexEntry,
  ParliamentSnapshot,
  validateParliamentIndex,
  validateParliamentSnapshot,
  validatePartyMetaPayload,
} from './schemas';

// Removed unused diagnostics flag

interface SnapshotExplorerProps {
  initialDate?: string;
}

const LOCAL_KEY = 'parliamentSelectedDate';

const formatZodError = (prefix: string, z: ZodError) => {
  const issues = z.issues
    .slice(0, 3)
    .map(i => `${i.path.join('.') || '(root)'}: ${i.message}`);
  return `${prefix}: ${issues.join('; ')}${z.issues.length > 3 ? '…' : ''}`;
};

const loadPartyMetaMap = async (
  file?: string | null
): Promise<Record<string, { leaning: 'left' | 'center' | 'right' }>> => {
  if (!file) return {};
  try {
    const res = await fetch(`/data/${file}`, { cache: 'no-store' });
    if (!res.ok) return {};
    const json = await res.json();
    const parsed = validatePartyMetaPayload(json);
    const map: Record<string, { leaning: 'left' | 'center' | 'right' }> = {};
    for (const p of parsed.parties) {
      map[p.id] = { leaning: p.leaning };
    }
    return map;
  } catch {
    return {};
  }
};

interface SnapshotHeaderProps {
  index: ParliamentIndexEntry[];
  selectedDate?: string;
  onDateChange: (date: string) => void;
}
const SnapshotHeader = ({
  index,
  selectedDate,
  onDateChange,
}: SnapshotHeaderProps) => (
  <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
    <div>
      <h1>Chamber Composition</h1>
      <p className='text-sm text-muted max-w-2xl'>
        Historical snapshots of the chamber. Select a term start date to view
        its composition; filters apply per snapshot.
      </p>
    </div>
    <div className='flex gap-2 items-end'>
      <label className='form-control w-56'>
        <div className='label py-1'>
          <span className='label-text text-xs uppercase tracking-wide'>
            Snapshot Date
          </span>
        </div>
        <select
          className='select select-sm select-bordered'
          value={selectedDate}
          onChange={e => onDateChange(e.target.value)}
        >
          {index
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(entry => (
              <option key={entry.date} value={entry.date}>
                {entry.date.slice(0, 10)}
              </option>
            ))}
        </select>
      </label>
    </div>
  </div>
);

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

interface UseSnapshotStateResult {
  selectedDate?: string;
  setSelectedDate: (d: string) => void;
  snapshot: ParliamentSnapshot | null;
  loadingSnapshot: boolean;
  partyMetaMap: Record<string, { leaning: 'left' | 'center' | 'right' }>;
  loadingMeta: boolean;
  error: string | null;
}

const useSelectedDate = (
  index: ParliamentIndexEntry[],
  initialDate?: string
) => {
  return useState<string | undefined>(() => {
    if (initialDate) return initialDate;
    try {
      return localStorage.getItem(LOCAL_KEY) || index[index.length - 1]?.date;
    } catch {
      return index[index.length - 1]?.date;
    }
  });
};

const useSnapshotLoader = () => {
  const [snapshot, setSnapshot] = useState<ParliamentSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSnapshotError = useCallback((e: unknown) => {
    if (e instanceof ZodError) {
      setError(formatZodError('Snapshot schema invalid', e));
    } else if (e && typeof e === 'object' && 'message' in e) {
      const msg = (e as { message?: unknown }).message;
      setError(typeof msg === 'string' ? msg : 'Failed loading snapshot');
    } else {
      setError('Failed loading snapshot');
    }
    setSnapshot(null);
  }, []);
  const loadSnapshot = useCallback(
    async (entry?: ParliamentIndexEntry) => {
      if (!entry) return;
      setLoadingSnapshot(true);
      setError(null);
      try {
        const res = await fetch(`/data/${entry.file}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Snapshot HTTP ${res.status}`);
        const json = await res.json();
        const parsed = validateParliamentSnapshot(json);
        setSnapshot(parsed);
      } catch (e) {
        handleSnapshotError(e);
      } finally {
        setLoadingSnapshot(false);
      }
    },
    [handleSnapshotError]
  );
  return { snapshot, loadingSnapshot, error, setError, loadSnapshot };
};

const usePartyMetaLoader = () => {
  const [partyMetaMap, setPartyMetaMap] = useState<
    Record<string, { leaning: 'left' | 'center' | 'right' }>
  >({});
  const [loadingMeta, setLoadingMeta] = useState(false);
  const loadPartyMeta = useCallback(async (entry?: ParliamentIndexEntry) => {
    setPartyMetaMap({});
    if (!entry?.partyMetaFile) return;
    setLoadingMeta(true);
    try {
      const map = await loadPartyMetaMap(entry.partyMetaFile);
      setPartyMetaMap(map);
    } finally {
      setLoadingMeta(false);
    }
  }, []);
  return { partyMetaMap, loadingMeta, loadPartyMeta };
};

const useSnapshotState = (
  index: ParliamentIndexEntry[],
  initialDate?: string
): UseSnapshotStateResult => {
  const { reset } = useParliamentFilters();
  const [selectedDate, setSelectedDate] = useSelectedDate(index, initialDate);
  const { snapshot, loadingSnapshot, error, loadSnapshot } =
    useSnapshotLoader();
  const { partyMetaMap, loadingMeta, loadPartyMeta } = usePartyMetaLoader();

  const selectedEntry = index.find(e => e.date === selectedDate);

  // Initial load
  useEffect(() => {
    if (selectedEntry) {
      loadSnapshot(selectedEntry);
      loadPartyMeta(selectedEntry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Change handler when date changes
  useEffect(() => {
    if (!selectedEntry) return;
    reset();
    loadSnapshot(selectedEntry);
    loadPartyMeta(selectedEntry);
    try {
      localStorage.setItem(LOCAL_KEY, selectedEntry.date);
    } catch {}
  }, [selectedEntry, loadSnapshot, loadPartyMeta, reset]);

  return {
    selectedDate,
    setSelectedDate,
    snapshot,
    loadingSnapshot,
    partyMetaMap,
    loadingMeta,
    error,
  };
};

const SnapshotInner = ({
  index,
  initialDate,
}: {
  index: ParliamentIndexEntry[];
  initialDate?: string;
}) => {
  const {
    selectedDate,
    setSelectedDate,
    snapshot,
    loadingSnapshot,
    partyMetaMap,
    loadingMeta,
    error,
  } = useSnapshotState(index, initialDate);

  return (
    <div className='space-y-6'>
      <SnapshotHeader
        index={index}
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

interface UseParliamentIndexResult {
  index: ParliamentIndexEntry[] | null;
  loading: boolean;
  error: string | null;
}

const useParliamentIndex = (): UseParliamentIndexResult => {
  const [index, setIndex] = useState<ParliamentIndexEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const assignIndex = (parsed: ParliamentIndexEntry[]) => {
      if (!cancelled) setIndex(parsed);
    };
    const assignError = (msg: string) => {
      if (!cancelled) setError(msg);
    };
    const finalize = () => {
      if (!cancelled) setLoading(false);
    };
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/data/parliament.index.json', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Index HTTP ${res.status}`);
        const json = await res.json();
        assignIndex(validateParliamentIndex(json));
      } catch (e: unknown) {
        if (e instanceof ZodError) {
          assignError(formatZodError('Index schema invalid', e));
        } else if (e && typeof e === 'object' && 'message' in e) {
          const msg = (e as { message?: unknown }).message;
          assignError(typeof msg === 'string' ? msg : 'Failed loading index');
        } else {
          assignError('Failed loading index');
        }
      } finally {
        finalize();
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { index, loading, error };
};

const renderExplorerContent = ({
  index,
  loading,
  error,
  initialDate,
}: {
  index: ParliamentIndexEntry[] | null;
  loading: boolean;
  error: string | null;
  initialDate?: string;
}) => {
  if (loading) return <div className='p-4 text-sm'>Loading index…</div>;
  if (error) return <div className='alert alert-error text-sm'>{error}</div>;
  if (!index || index.length === 0)
    return (
      <div className='p-4 text-sm'>
        No snapshots indexed. Run <code>npm run snapshot:range:terms</code>.
      </div>
    );
  return (
    <ParliamentFiltersProvider>
      <SnapshotInner index={index} initialDate={initialDate} />
    </ParliamentFiltersProvider>
  );
};

const SnapshotExplorer = ({ initialDate }: SnapshotExplorerProps) => {
  const { index, loading, error } = useParliamentIndex();
  return renderExplorerContent({ index, loading, error, initialDate });
};

export default SnapshotExplorer;
