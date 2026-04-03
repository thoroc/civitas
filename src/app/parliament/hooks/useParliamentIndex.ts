import { useEffect, useState } from 'react';
import { ZodError } from 'zod';

import { formatZodError } from '../formatZodError';
import { type ParliamentIndexEntry, ParliamentIndexSchema } from '../schemas';

export interface UseParliamentIndexResult {
  index: ParliamentIndexEntry[] | null;
  loading: boolean;
  error: string | null;
}

const toErrorMessage = (e: unknown): string => {
  if (e instanceof ZodError) return formatZodError('Index schema invalid', e);
  if (e && typeof e === 'object' && 'message' in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return 'Failed loading index';
};

const fetchIndex = async (): Promise<
  { data: ParliamentIndexEntry[] } | { error: string }
> => {
  try {
    const res = await fetch('/data/official/official.index.json', {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Index HTTP ${res.status}`);
    const json = await res.json();
    return { data: ParliamentIndexSchema.parse(json) };
  } catch (e: unknown) {
    return { error: toErrorMessage(e) };
  }
};

export const useParliamentIndex = (): UseParliamentIndexResult => {
  const [index, setIndex] = useState<ParliamentIndexEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      const result = await fetchIndex();
      if (cancelled) return;
      if ('error' in result) setError(result.error);
      else setIndex(result.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { index, loading, error };
};
