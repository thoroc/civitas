import { useCallback, useState } from 'react';
import { ZodError } from 'zod';

import { adaptOfficialSnapshot } from '../adapters/officialSnapshot';
import { formatZodError } from '../formatZodError';
import type { ParliamentIndexEntry, ParliamentSnapshot } from '../schemas';

export const useSnapshotLoader = () => {
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
        const [snapshotRes, colorsRes] = await Promise.all([
          fetch(`/data/official/${entry.file}`, { cache: 'no-store' }),
          fetch('/data/partyColors.json', { cache: 'force-cache' }),
        ]);
        if (!snapshotRes.ok)
          throw new Error(`Snapshot HTTP ${snapshotRes.status}`);
        const [json, partyColors] = await Promise.all([
          snapshotRes.json(),
          colorsRes.ok ? colorsRes.json() : Promise.resolve({}),
        ]);
        const parsed = adaptOfficialSnapshot(
          json,
          partyColors as Record<string, string>
        );
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
