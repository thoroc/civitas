/**
 * Shared HTTP utilities for civitas scripts.
 */

type FetchCfg = { maxAttempts?: number; baseBackoffMs?: number };

/** Signals that the response status is retryable (rate-limit or server error). */
const isRetriable = (status: number): boolean =>
  status === 429 || status >= 500;

const sleep = (ms: number): Promise<void> =>
  new Promise(res => setTimeout(res, ms));

/**
 * Result of a single fetch attempt.
 * `done` is true when the caller should stop retrying.
 */
type AttemptResult =
  | { done: true; response: Response }
  | { done: false; fatal: false }
  | { done: false; fatal: true; error: unknown };

const tryOnce = async (
  url: string,
  options: RequestInit
): Promise<AttemptResult> => {
  try {
    const res = await fetch(url, options);
    if (res.status === 200) return { done: true, response: res };
    console.warn(`[http] HTTP ${res.status} for ${url}`);
    if (isRetriable(res.status)) return { done: false, fatal: false };
    return { done: true, response: res };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[http] fetch error: ${msg}`);
    return { done: false, fatal: true, error };
  }
};

export const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  cfg?: FetchCfg
): Promise<Response> => {
  const maxAttempts = cfg?.maxAttempts ?? 3;
  const baseBackoffMs = cfg?.baseBackoffMs ?? 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      const backoff = baseBackoffMs * 2 ** (attempt - 2);
      await sleep(backoff);
      console.warn(`[http] retry ${attempt - 1} after backoff ${backoff}ms`);
    }

    const result = await tryOnce(url, options);

    if (result.done) return result.response;
    if (result.fatal && attempt === maxAttempts) throw result.error;
  }

  return new Response(null, { status: 0 });
};
