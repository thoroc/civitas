import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockExistsSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: { existsSync: mockExistsSync, readFileSync: mockReadFileSync },
}));

import { loadSnapshot } from './loadSnapshot.ts';

describe('loadSnapshot', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns parsed snapshot when file exists', () => {
    mockExistsSync.mockReturnValueOnce(true);
    mockReadFileSync.mockReturnValueOnce(
      JSON.stringify({ members: [], meta: { date: '2021-01-01T00:00:00Z' } })
    );
    const snap = loadSnapshot('/data/snap.json');
    expect(snap.members).toEqual([]);
    expect(snap.meta?.date).toBe('2021-01-01T00:00:00Z');
  });

  it('calls process.exit when file does not exist', () => {
    mockExistsSync.mockReturnValueOnce(false);
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    expect(() => loadSnapshot('/missing.json')).toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
    vi.restoreAllMocks();
  });
});
