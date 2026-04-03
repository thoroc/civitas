import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockExistsSync, mockMkdirSync, mockWriteFileSync, mockReadFileSync } =
  vi.hoisted(() => ({
    mockExistsSync: vi.fn(),
    mockMkdirSync: vi.fn(),
    mockWriteFileSync: vi.fn(),
    mockReadFileSync: vi.fn(),
  }));

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    writeFileSync: mockWriteFileSync,
    readFileSync: mockReadFileSync,
  },
}));

import { writePartyMeta } from './writePartyMeta.ts';

const payload = { generatedAt: '2024-01-01T00:00:00Z', parties: [] };

describe('writePartyMeta', () => {
  afterEach(() => vi.clearAllMocks());

  it('creates output directory if it does not exist', () => {
    mockExistsSync.mockReturnValueOnce(false); // outDir missing
    mockReadFileSync.mockImplementation(() => {
      throw new Error('no snap');
    });

    writePartyMeta('/snap.json', payload);

    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('public'),
      { recursive: true }
    );
  });

  it('writes partyMeta.json to output dir', () => {
    mockExistsSync.mockReturnValueOnce(true);
    mockReadFileSync.mockImplementation(() => {
      throw new Error('no snap');
    });

    writePartyMeta('/snap.json', payload);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('partyMeta.json'),
      expect.any(String)
    );
  });

  it('writes per-date file when snapshot has meta.date', () => {
    mockExistsSync.mockReturnValueOnce(true);
    mockReadFileSync.mockReturnValueOnce(
      JSON.stringify({ meta: { date: '2021-01-01T00:00:00Z' } })
    );

    writePartyMeta('/snap.json', payload);

    const calls = mockWriteFileSync.mock.calls;
    const datedCall = calls.find(([p]) =>
      (p as string).includes('partyMeta-2021-01-01T00-00-00Z.json')
    );
    expect(datedCall).toBeDefined();
  });

  it('skips per-date file when snapshot has no meta.date', () => {
    mockExistsSync.mockReturnValueOnce(true);
    mockReadFileSync.mockReturnValueOnce(JSON.stringify({ meta: {} }));

    writePartyMeta('/snap.json', payload);

    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
  });

  it('does not throw when snapshot read fails', () => {
    mockExistsSync.mockReturnValueOnce(true);
    mockReadFileSync.mockImplementation(() => {
      throw new Error('bad file');
    });

    expect(() => writePartyMeta('/snap.json', payload)).not.toThrow();
  });
});
