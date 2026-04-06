import { useEffect, useState } from 'react';

import { useParliamentFilters } from '../context/filters-context';
import type { ParliamentIndexEntry, ParliamentSnapshot } from '../schemas';
import { usePartyMetaLoader } from './use-party-meta-loader';
import { useSnapshotLoader } from './use-snapshot-loader';

const LOCAL_KEY = 'parliamentSelectedDate';

const useSelectedDate = (index: ParliamentIndexEntry[], initialDate?: string) =>
  useState<string | undefined>(() => {
    if (initialDate && index.some(e => e.date === initialDate))
      return initialDate;
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (stored && index.some(e => e.date === stored)) return stored;
    } catch {}
    return index[index.length - 1]?.date;
  });

export interface UseSnapshotStateResult {
  selectedDate?: string;
  setSelectedDate: (d: string) => void;
  snapshot: ParliamentSnapshot | null;
  loadingSnapshot: boolean;
  partyMetaMap: Record<string, { leaning: 'left' | 'center' | 'right' }>;
  loadingMeta: boolean;
  error: string | null;
}

export const useSnapshotState = (
  index: ParliamentIndexEntry[],
  initialDate?: string
): UseSnapshotStateResult => {
  const { reset } = useParliamentFilters();
  const [selectedDate, setSelectedDate] = useSelectedDate(index, initialDate);
  const { snapshot, loadingSnapshot, error, loadSnapshot } =
    useSnapshotLoader();
  const { partyMetaMap, loadingMeta, loadPartyMeta } = usePartyMetaLoader();

  const selectedEntry = index.find(e => e.date === selectedDate);

  useEffect(() => {
    if (index.length === 0) return;
    if (selectedDate && index.some(e => e.date === selectedDate)) return;
    const latestDate = index[index.length - 1]?.date;
    if (!latestDate || latestDate === selectedDate) return;
    setSelectedDate(latestDate);
  }, [index, selectedDate, setSelectedDate]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only; loadSnapshot/loadPartyMeta are stable useCallback refs
  useEffect(() => {
    if (selectedEntry) {
      loadSnapshot(selectedEntry);
      loadPartyMeta(selectedEntry);
    }
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
