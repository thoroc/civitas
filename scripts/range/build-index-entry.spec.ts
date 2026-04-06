import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReadFileSync, mockExistsSync, mockStatSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
  mockExistsSync: vi.fn(),
  mockStatSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: {
    readFileSync: mockReadFileSync,
    existsSync: mockExistsSync,
    statSync: mockStatSync,
  },
}));

import { buildIndexEntry } from './build-index-entry.ts';

const SNAPSHOT_FILE = '/data/parliament-2021-01-01T00-00-00Z.json';
const DATE = '2021-01-01T00:00:00Z';
const SAFE_DATE = '2021-01-01T00-00-00Z';

describe('buildIndexEntry', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset();
    mockExistsSync.mockReset();
    mockStatSync.mockReset();
  });

  it('uses meta fields when all are present', () => {
    mockReadFileSync.mockReturnValueOnce(
      JSON.stringify({
        meta: {
          date: '2021-01-01T00:00:00Z',
          total: 42,
          generatedAt: '2021-02-01T12:00:00Z',
        },
      })
    );
    mockExistsSync.mockReturnValueOnce(true);

    const entry = buildIndexEntry(SNAPSHOT_FILE, DATE, SAFE_DATE);

    expect(entry.date).toBe('2021-01-01T00:00:00Z');
    expect(entry.total).toBe(42);
    expect(entry.generatedAt).toBe('2021-02-01T12:00:00Z');
    expect(entry.safeDate).toBe(SAFE_DATE);
    expect(entry.file).toBe(`parliament-${SAFE_DATE}.json`);
  });

  it('falls back to date param when meta.date is absent', () => {
    mockReadFileSync.mockReturnValueOnce(
      JSON.stringify({
        meta: { total: 1, generatedAt: '2021-01-01T00:00:00Z' },
      })
    );
    mockExistsSync.mockReturnValueOnce(false);

    const entry = buildIndexEntry(SNAPSHOT_FILE, DATE, SAFE_DATE);
    expect(entry.date).toBe(DATE);
  });

  it('falls back to members.length when meta.total is absent', () => {
    mockReadFileSync.mockReturnValueOnce(
      JSON.stringify({
        members: [1, 2, 3],
        meta: { generatedAt: '2021-01-01T00:00:00Z' },
      })
    );
    mockExistsSync.mockReturnValueOnce(false);

    const entry = buildIndexEntry(SNAPSHOT_FILE, DATE, SAFE_DATE);
    expect(entry.total).toBe(3);
  });

  it('falls back to 0 when both meta.total and members are absent', () => {
    mockReadFileSync.mockReturnValueOnce(
      JSON.stringify({ meta: { generatedAt: '2021-01-01T00:00:00Z' } })
    );
    mockExistsSync.mockReturnValueOnce(false);

    const entry = buildIndexEntry(SNAPSHOT_FILE, DATE, SAFE_DATE);
    expect(entry.total).toBe(0);
  });

  it('falls back to mtime when meta.generatedAt is absent', () => {
    const mtime = new Date('2022-03-15T08:00:00.000Z');
    mockReadFileSync.mockReturnValueOnce(JSON.stringify({ meta: {} }));
    mockExistsSync.mockReturnValueOnce(false);
    mockStatSync.mockReturnValueOnce({ mtime });

    const entry = buildIndexEntry(SNAPSHOT_FILE, DATE, SAFE_DATE);
    expect(entry.generatedAt).toBe(mtime.toISOString());
    expect(mockStatSync).toHaveBeenCalledWith(SNAPSHOT_FILE);
  });

  it('sets partyMetaFile to filename when party meta exists', () => {
    mockReadFileSync.mockReturnValueOnce(
      JSON.stringify({
        meta: { date: DATE, total: 1, generatedAt: '2021-01-01T00:00:00Z' },
      })
    );
    mockExistsSync.mockReturnValueOnce(true);

    const entry = buildIndexEntry(SNAPSHOT_FILE, DATE, SAFE_DATE);
    expect(entry.partyMetaFile).toBe(`partyMeta-${SAFE_DATE}.json`);
  });

  it('sets partyMetaFile to null when party meta does not exist', () => {
    mockReadFileSync.mockReturnValueOnce(
      JSON.stringify({
        meta: { date: DATE, total: 1, generatedAt: '2021-01-01T00:00:00Z' },
      })
    );
    mockExistsSync.mockReturnValueOnce(false);

    const entry = buildIndexEntry(SNAPSHOT_FILE, DATE, SAFE_DATE);
    expect(entry.partyMetaFile).toBeNull();
  });
});
