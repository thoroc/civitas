import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { EventType, ParliamentIndexEntry } from '../schemas';

const EVENT_TYPE_LOCAL_KEY = 'parliamentSelectedEventType';

export type SelectedEventType = EventType | 'all';

const isSelectedEventType = (
  value?: string | null
): value is SelectedEventType =>
  value === 'general' ||
  value === 'by-election' ||
  value === 'other' ||
  value === 'unknown' ||
  value === 'all';

export const useSnapshotSelection = (index: ParliamentIndexEntry[]) => {
  const searchParams = useSearchParams();
  const queryDate = searchParams.get('date') ?? undefined;
  const queryEventType = searchParams.get('eventType') ?? undefined;
  const normalizedQueryEventType = isSelectedEventType(queryEventType)
    ? queryEventType
    : undefined;
  const [selectedEventType, setSelectedEventType] = useState<SelectedEventType>(
    () => {
      if (normalizedQueryEventType) return normalizedQueryEventType;
      try {
        const stored = localStorage.getItem(EVENT_TYPE_LOCAL_KEY);
        if (isSelectedEventType(stored)) return stored;
      } catch {}
      return 'general';
    }
  );

  useEffect(() => {
    if (!normalizedQueryEventType) return;
    if (normalizedQueryEventType === selectedEventType) return;
    setSelectedEventType(normalizedQueryEventType);
  }, [normalizedQueryEventType, selectedEventType]);

  useEffect(() => {
    try {
      localStorage.setItem(EVENT_TYPE_LOCAL_KEY, selectedEventType);
    } catch {}
  }, [selectedEventType]);

  const filteredIndex = useMemo(() => {
    if (selectedEventType === 'all') return index;
    return index.filter(entry => entry.eventType === selectedEventType);
  }, [index, selectedEventType]);

  return {
    filteredIndex,
    queryDate,
    selectedEventType,
    setSelectedEventType,
  };
};
