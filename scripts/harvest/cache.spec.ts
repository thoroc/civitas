import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  axiosGet: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: mocks.existsSync,
    mkdirSync: mocks.mkdirSync,
    readFileSync: mocks.readFileSync,
    writeFileSync: mocks.writeFileSync,
  },
}));

vi.mock('axios', () => ({
  default: {
    get: mocks.axiosGet,
  },
}));

import { cachedGet } from './cache.ts';

describe('harvest cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.existsSync.mockReturnValue(false);
  });

  it('returns cached data when available and not forced', async () => {
    mocks.existsSync.mockReturnValue(true);
    mocks.readFileSync.mockReturnValueOnce(JSON.stringify({ ok: true }));

    const result = await cachedGet('http://example.test', {
      dir: '.cache',
      forceRefresh: false,
    });

    expect(result).toEqual({ ok: true });
    expect(mocks.axiosGet).not.toHaveBeenCalled();
  });

  it('fetches and writes cache when missing', async () => {
    mocks.axiosGet.mockResolvedValueOnce({ status: 200, data: { ok: true } });

    const result = await cachedGet('http://example.test', {
      dir: '.cache',
      forceRefresh: false,
    });

    expect(result).toEqual({ ok: true });
    expect(mocks.axiosGet).toHaveBeenCalledTimes(1);
    expect(mocks.writeFileSync).toHaveBeenCalledTimes(1);
  });
});
