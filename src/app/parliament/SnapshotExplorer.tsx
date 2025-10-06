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

const DIAG = process.env.NEXT_PUBLIC_TEST_DIAGNOSTICS === '1';

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

const SnapshotInner = ({
  index,
  initialDate,
}: {
  index: ParliamentIndexEntry[];
  initialDate?: string;
}) => {
  const { reset } = useParliamentFilters();
  const [selectedDate, setSelectedDate] = useState<string | undefined>(() => {
    if (initialDate) return initialDate;
    try {
      return localStorage.getItem(LOCAL_KEY) || index[index.length - 1]?.date;
    } catch {
      return index[index.length - 1]?.date;
    }
  });
  const [snapshot, setSnapshot] = useState<ParliamentSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [partyMetaMap, setPartyMetaMap] = useState<
    Record<string, { leaning: 'left' | 'center' | 'right' }>
  >({});
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEntry = index.find(e => e.date === selectedDate);

  const loadSnapshot = useCallback(async (entry?: ParliamentIndexEntry) => {
    if (!entry) return;
    setLoadingSnapshot(true);
    setError(null);
    try {
      const res = await fetch(`/data/${entry.file}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Snapshot HTTP ${res.status}`);
      const json = await res.json();
      const parsed = validateParliamentSnapshot(json);
      setSnapshot(parsed);
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        setError(formatZodError('Snapshot schema invalid', e));
      } else if (e && typeof e === 'object' && 'message' in e) {
        const msg = (e as { message?: unknown }).message;
        setError(typeof msg === 'string' ? msg : 'Failed loading snapshot');
      } else {
        setError('Failed loading snapshot');
      }
      setSnapshot(null);
    } finally {
      setLoadingSnapshot(false);
    }
  }, []);

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

  // Initial load
  useEffect(() => {
    if (selectedEntry) {
      loadSnapshot(selectedEntry);
      loadPartyMeta(selectedEntry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When date changes
  useEffect(() => {
    if (!selectedEntry) return;
    reset();
    loadSnapshot(selectedEntry);
    loadPartyMeta(selectedEntry);
    try {
      localStorage.setItem(LOCAL_KEY, selectedEntry.date);
    } catch {}
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1>Chamber Composition</h1>
          <p className='text-sm text-muted max-w-2xl'>
            Historical snapshots of the chamber. Select a term start date to
            view its composition; filters apply per snapshot.
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
              onChange={e => setSelectedDate(e.target.value)}
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
      {error && <div className='alert alert-error text-sm'>{error}</div>}
      {!error && loadingSnapshot && (
        <div className='skeleton h-32 w-full' aria-label='Loading snapshot' />
      )}
      {snapshot && !loadingSnapshot && (
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
      )}
    </div>
  );
};

const SnapshotExplorer = ({ initialDate }: SnapshotExplorerProps) => {
  const [index, setIndex] = useState<ParliamentIndexEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (DIAG) console.log('[SnapshotExplorer] Begin index fetch');
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/data/parliament.index.json', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Index HTTP ${res.status}`);
        const json = await res.json();
        const parsed = validateParliamentIndex(json);
        if (!cancelled) setIndex(parsed);
      } catch (e: unknown) {
        if (!cancelled) {
          if (e instanceof ZodError) {
            setError(formatZodError('Index schema invalid', e));
          } else if (e && typeof e === 'object' && 'message' in e) {
            const msg = (e as { message?: unknown }).message;
            setError(typeof msg === 'string' ? msg : 'Failed loading index');
          } else {
            setError('Failed loading index');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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

export default SnapshotExplorer;
