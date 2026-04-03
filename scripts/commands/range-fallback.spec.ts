import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockReaddirSync,
  mockWriteFileSync,
  mockExistsSync,
  mockBuildIndexEntry,
  mockNormalizeInputDate,
  mockRunPartyMeta,
} = vi.hoisted(() => ({
  mockReaddirSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockExistsSync: vi.fn(),
  mockBuildIndexEntry: vi.fn(),
  mockNormalizeInputDate: vi.fn(),
  mockRunPartyMeta: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: {
    readdirSync: mockReaddirSync,
    writeFileSync: mockWriteFileSync,
    existsSync: mockExistsSync,
  },
}));

vi.mock('../lib/paths.ts', () => ({
  OUTPUT_DIR: '/test/output',
  PARLIAMENT_INDEX: '/test/output/parliament.index.json',
}));

vi.mock('../lib/buildIndexEntry.ts', () => ({
  buildIndexEntry: mockBuildIndexEntry,
}));

vi.mock('../lib/normalizeInputDate.ts', () => ({
  normalizeInputDate: mockNormalizeInputDate,
}));

vi.mock('./party-meta.ts', () => ({ runPartyMeta: mockRunPartyMeta }));

import type { IndexEntry } from '../lib/buildIndexEntry.ts';
import { handleFallbackRange } from './range-fallback.ts';

const makeEntry = (date: string): IndexEntry => ({
  date,
  safeDate: date.replace(/:/g, '-'),
  file: `parliament-${date.replace(/:/g, '-')}.json`,
  partyMetaFile: null,
  total: 10,
  generatedAt: '2024-01-01T00:00:00Z',
});

describe('handleFallbackRange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNormalizeInputDate.mockImplementation((d: string) =>
      d.replace(/-(\d{2})-(\d{2})Z$/, ':$1:$2Z')
    );
  });

  it('writes empty index when no snapshot files exist', async () => {
    mockReaddirSync.mockReturnValueOnce([]);

    await handleFallbackRange(new Map());

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/test/output/parliament.index.json',
      JSON.stringify([], null, 2)
    );
    expect(mockBuildIndexEntry).not.toHaveBeenCalled();
  });

  it('writes empty index when no files match parliament pattern', async () => {
    mockReaddirSync.mockReturnValueOnce(['random.json', 'other.txt']);

    await handleFallbackRange(new Map());

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/test/output/parliament.index.json',
      JSON.stringify([], null, 2)
    );
  });

  it('calls buildIndexEntry for each matching snapshot file', async () => {
    mockReaddirSync.mockReturnValueOnce([
      'parliament-2021-01-01T00-00-00Z.json',
    ]);
    mockExistsSync.mockReturnValueOnce(true); // partyMeta exists
    const entry = makeEntry('2021-01-01T00:00:00Z');
    mockBuildIndexEntry.mockReturnValueOnce(entry);
    mockNormalizeInputDate.mockReturnValueOnce('2021-01-01T00:00:00Z');

    await handleFallbackRange(new Map());

    expect(mockBuildIndexEntry).toHaveBeenCalledTimes(1);
    const written = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
    expect(written).toHaveLength(1);
    expect(written[0].date).toBe('2021-01-01T00:00:00Z');
  });

  it('calls runPartyMeta when partyMeta file does not exist', async () => {
    mockReaddirSync.mockReturnValueOnce([
      'parliament-2021-01-01T00-00-00Z.json',
    ]);
    mockExistsSync.mockReturnValueOnce(false); // partyMeta missing
    mockRunPartyMeta.mockResolvedValueOnce(undefined);
    mockBuildIndexEntry.mockReturnValueOnce(makeEntry('2021-01-01T00:00:00Z'));
    mockNormalizeInputDate.mockReturnValueOnce('2021-01-01T00:00:00Z');

    await handleFallbackRange(new Map());

    expect(mockRunPartyMeta).toHaveBeenCalledTimes(1);
  });

  it('skips runPartyMeta when partyMeta already exists', async () => {
    mockReaddirSync.mockReturnValueOnce([
      'parliament-2021-01-01T00-00-00Z.json',
    ]);
    mockExistsSync.mockReturnValueOnce(true); // partyMeta exists
    mockBuildIndexEntry.mockReturnValueOnce(makeEntry('2021-01-01T00:00:00Z'));
    mockNormalizeInputDate.mockReturnValueOnce('2021-01-01T00:00:00Z');

    await handleFallbackRange(new Map());

    expect(mockRunPartyMeta).not.toHaveBeenCalled();
  });

  it('continues when runPartyMeta throws', async () => {
    mockReaddirSync.mockReturnValueOnce([
      'parliament-2021-01-01T00-00-00Z.json',
    ]);
    mockExistsSync.mockReturnValueOnce(false);
    mockRunPartyMeta.mockRejectedValueOnce(new Error('party meta failed'));
    mockBuildIndexEntry.mockReturnValueOnce(makeEntry('2021-01-01T00:00:00Z'));
    mockNormalizeInputDate.mockReturnValueOnce('2021-01-01T00:00:00Z');

    await expect(handleFallbackRange(new Map())).resolves.toBeUndefined();
    expect(mockBuildIndexEntry).toHaveBeenCalledTimes(1);
  });

  it('skips file when buildIndexEntry throws', async () => {
    mockReaddirSync.mockReturnValueOnce([
      'parliament-2021-01-01T00-00-00Z.json',
    ]);
    mockExistsSync.mockReturnValueOnce(true);
    mockBuildIndexEntry.mockImplementationOnce(() => {
      throw new Error('bad snapshot');
    });
    mockNormalizeInputDate.mockReturnValueOnce('2021-01-01T00:00:00Z');

    await handleFallbackRange(new Map());

    const written = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
    expect(written).toHaveLength(0);
  });

  it('outputs entries sorted by date ascending', async () => {
    mockReaddirSync.mockReturnValueOnce([
      'parliament-2021-06-01T00-00-00Z.json',
      'parliament-2010-05-06T00-00-00Z.json',
    ]);
    mockExistsSync.mockReturnValue(true);
    mockNormalizeInputDate
      .mockReturnValueOnce('2021-06-01T00:00:00Z')
      .mockReturnValueOnce('2010-05-06T00:00:00Z');
    mockBuildIndexEntry
      .mockReturnValueOnce(makeEntry('2021-06-01T00:00:00Z'))
      .mockReturnValueOnce(makeEntry('2010-05-06T00:00:00Z'));

    await handleFallbackRange(new Map());

    const written = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
    expect(written[0].date).toBe('2010-05-06T00:00:00Z');
    expect(written[1].date).toBe('2021-06-01T00:00:00Z');
  });

  it('merges with entries already in indexByDate', async () => {
    mockReaddirSync.mockReturnValueOnce([]);
    const existing = makeEntry('2015-05-07T00:00:00Z');
    const map = new Map([['2015-05-07T00:00:00Z', existing]]);

    await handleFallbackRange(map);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/test/output/parliament.index.json',
      JSON.stringify([], null, 2)
    );
  });
});
