import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithRetry } from './http.ts';

const mockFetch = vi.fn<typeof fetch>();

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('returns 200 response immediately without retrying', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));
    const res = await fetchWithRetry('http://x.test', {});
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns non-retriable 4xx without retrying', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 400 }));
    const res = await fetchWithRetry('http://x.test', {});
    expect(res.status).toBe(400);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns non-retriable 404 without retrying', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));
    const res = await fetchWithRetry('http://x.test', {});
    expect(res.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and returns success on second attempt', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const res = await fetchWithRetry('http://x.test', {}, { baseBackoffMs: 0 });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 500 and returns success on second attempt', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const res = await fetchWithRetry('http://x.test', {}, { baseBackoffMs: 0 });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('exhausts non-fatal retries and attempts fallback Response after max attempts', async () => {
    // Node's Response rejects status 0; we verify all attempts were made
    mockFetch.mockResolvedValue(new Response(null, { status: 429 }));
    await expect(
      fetchWithRetry('http://x.test', {}, { maxAttempts: 2, baseBackoffMs: 0 })
    ).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws on fatal network error at last attempt', async () => {
    mockFetch.mockRejectedValue(new Error('network failure'));
    await expect(
      fetchWithRetry('http://x.test', {}, { maxAttempts: 2, baseBackoffMs: 0 })
    ).rejects.toThrow('network failure');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('continues retrying after a non-last fatal error then succeeds', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const res = await fetchWithRetry(
      'http://x.test',
      {},
      {
        maxAttempts: 2,
        baseBackoffMs: 0,
      }
    );
    expect(res.status).toBe(200);
  });

  it('passes headers to underlying fetch', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));
    await fetchWithRetry('http://x.test', { headers: { 'X-Test': 'yes' } });
    expect(mockFetch).toHaveBeenCalledWith('http://x.test', {
      headers: { 'X-Test': 'yes' },
    });
  });

  it('respects custom maxAttempts and stops after that many calls', async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 429 }));
    await expect(
      fetchWithRetry('http://x.test', {}, { maxAttempts: 1, baseBackoffMs: 0 })
    ).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
