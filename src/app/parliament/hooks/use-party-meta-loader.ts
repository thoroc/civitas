import { useCallback, useState } from 'react';

import { type ParliamentIndexEntry, PartyMetaPayloadSchema } from '../schemas';

const loadPartyMetaMap = async (
  file?: string | null
): Promise<Record<string, { leaning: 'left' | 'center' | 'right' }>> => {
  if (!file) return {};
  try {
    const res = await fetch(`/data/${file}`, { cache: 'no-store' });
    if (!res.ok) return {};
    const json = await res.json();
    const parsed = PartyMetaPayloadSchema.parse(json);
    const map: Record<string, { leaning: 'left' | 'center' | 'right' }> = {};
    for (const p of parsed.parties) {
      map[p.id] = { leaning: p.leaning };
    }
    return map;
  } catch {
    return {};
  }
};

export const usePartyMetaLoader = () => {
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
