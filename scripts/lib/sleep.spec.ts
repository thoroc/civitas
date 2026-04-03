import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sleep } from './sleep.ts';

describe('sleep', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves to undefined after the given ms', async () => {
    const promise = sleep(500);
    vi.advanceTimersByTime(500);
    await expect(promise).resolves.toBeUndefined();
  });

  it('has not resolved before the given ms', async () => {
    let resolved = false;
    sleep(1000).then(() => {
      resolved = true;
    });
    vi.advanceTimersByTime(999);
    await Promise.resolve();
    expect(resolved).toBe(false);
  });

  it('resolves with sleep(0)', async () => {
    const promise = sleep(0);
    vi.advanceTimersByTime(0);
    await expect(promise).resolves.toBeUndefined();
  });
});
