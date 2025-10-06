import { useEffect, useState } from 'react';

export type Leaning = 'left' | 'center' | 'right';

interface UsePartyMetaOptions {
  partyMetaOverride?: Record<string, { leaning: Leaning }>;
  path?: string; // allow overriding fetch path for future flexibility
}

/**
 * usePartyMeta
 * ------------
 * Loads party ideological leaning metadata from a static JSON endpoint unless an override map is provided.
 * Schema validation is performed lazily via dynamic import to keep initial bundle small.
 * Silent failure policy: returns an empty map if fetch or validation fails.
 */
export const usePartyMeta = ({
  partyMetaOverride,
  path = '/data/partyMeta.json',
}: UsePartyMetaOptions) => {
  const [partyMeta, setPartyMeta] = useState<
    Record<string, { leaning: Leaning }>
  >({});

  useEffect(() => {
    if (partyMetaOverride) {
      setPartyMeta(partyMetaOverride);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(path, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const { validatePartyMetaPayload } = await import('../schemas');
        try {
          const parsed = validatePartyMetaPayload(json);
          const map: Record<string, { leaning: Leaning }> = {};
          for (const p of parsed.parties) map[p.id] = { leaning: p.leaning };
          setPartyMeta(map);
        } catch {
          // ignore schema errors
        }
      } catch {
        // silent fallback
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [partyMetaOverride, path]);

  return partyMeta;
};

export default usePartyMeta;
