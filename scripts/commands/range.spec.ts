import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchTermStartDates: vi.fn(),
  handleFallbackRange: vi.fn(),
  runSnapshot: vi.fn(),
  runPartyMeta: vi.fn(),
  buildIndexEntry: vi.fn(),
  sleep: vi.fn(),
  toSafeFilename: vi.fn((s: string) => s.replace(/:/g, '-')),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('../range/fetch-term-start-dates.ts', () => ({
  fetchTermStartDates: mocks.fetchTermStartDates,
}));
vi.mock('../range/range-fallback.ts', () => ({
  handleFallbackRange: mocks.handleFallbackRange,
}));
vi.mock('./snapshot.ts', () => ({ runSnapshot: mocks.runSnapshot }));
vi.mock('./party-meta.ts', () => ({ runPartyMeta: mocks.runPartyMeta }));
vi.mock('../range/build-index-entry.ts', () => ({
  buildIndexEntry: mocks.buildIndexEntry,
}));
vi.mock('../lib/sleep.ts', () => ({ sleep: mocks.sleep }));
vi.mock('../lib/to-safe-filename.ts', () => ({
  toSafeFilename: mocks.toSafeFilename,
}));
vi.mock('../lib/paths.ts', () => ({
  OUTPUT_DIR: '/out',
  PARLIAMENT_INDEX: '/out/parliament.index.json',
}));
vi.mock('node:fs', () => ({
  default: {
    existsSync: mocks.existsSync,
    mkdirSync: mocks.mkdirSync,
    readFileSync: mocks.readFileSync,
    writeFileSync: mocks.writeFileSync,
  },
}));

import { runRange } from './range.ts';

const OPTS = { mode: 'terms' as const, throttle: 0, force: false };

const makeEntry = (date: string) => ({
  date,
  safeDate: date.replace(/:/g, '-'),
  file: `parliament-${date.replace(/:/g, '-')}.json`,
  partyMetaFile: null,
  total: 0,
  generatedAt: '',
});

describe('runRange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sleep.mockResolvedValue(undefined);
    mocks.runSnapshot.mockResolvedValue(undefined);
    mocks.runPartyMeta.mockResolvedValue(undefined);
    mocks.handleFallbackRange.mockResolvedValue(undefined);
    mocks.existsSync.mockReturnValue(false);
  });

  it('calls handleFallbackRange when no term dates found', async () => {
    mocks.fetchTermStartDates.mockResolvedValueOnce([]);

    await runRange(OPTS);

    expect(mocks.handleFallbackRange).toHaveBeenCalledTimes(1);
    expect(mocks.runSnapshot).not.toHaveBeenCalled();
  });

  it('generates snapshots for each unique start date', async () => {
    mocks.fetchTermStartDates.mockResolvedValueOnce([
      { term: 'Q1', start: '2010-05-06T00:00:00Z' },
      { term: 'Q2', start: '2015-05-07T00:00:00Z' },
    ]);
    mocks.buildIndexEntry.mockReturnValue(makeEntry('2010-05-06T00:00:00Z'));

    await runRange(OPTS);

    expect(mocks.runSnapshot).toHaveBeenCalledTimes(2);
  });

  it('deduplicates identical start dates', async () => {
    mocks.fetchTermStartDates.mockResolvedValueOnce([
      { term: 'Q1', start: '2010-05-06T00:00:00Z' },
      { term: 'Q1b', start: '2010-05-06T00:00:00Z' },
    ]);
    mocks.buildIndexEntry.mockReturnValue(makeEntry('2010-05-06T00:00:00Z'));

    await runRange(OPTS);

    expect(mocks.runSnapshot).toHaveBeenCalledTimes(1);
  });

  it('skips snapshot generation when file exists and force is false', async () => {
    mocks.fetchTermStartDates.mockResolvedValueOnce([
      { term: 'Q1', start: '2010-05-06T00:00:00Z' },
    ]);
    mocks.existsSync.mockReturnValue(true); // OUTPUT_DIR + snapshot exist
    mocks.buildIndexEntry.mockReturnValue(makeEntry('2010-05-06T00:00:00Z'));

    await runRange({ ...OPTS, force: false });

    expect(mocks.runSnapshot).not.toHaveBeenCalled();
    expect(mocks.runPartyMeta).toHaveBeenCalled();
  });

  it('regenerates snapshot when file exists and force is true', async () => {
    mocks.fetchTermStartDates.mockResolvedValueOnce([
      { term: 'Q1', start: '2010-05-06T00:00:00Z' },
    ]);
    mocks.existsSync.mockReturnValue(true);
    mocks.buildIndexEntry.mockReturnValue(makeEntry('2010-05-06T00:00:00Z'));

    await runRange({ ...OPTS, force: true });

    expect(mocks.runSnapshot).toHaveBeenCalledTimes(1);
  });

  it('continues to next date when runSnapshot throws', async () => {
    mocks.fetchTermStartDates.mockResolvedValueOnce([
      { term: 'Q1', start: '2010-05-06T00:00:00Z' },
      { term: 'Q2', start: '2015-05-07T00:00:00Z' },
    ]);
    mocks.runSnapshot
      .mockRejectedValueOnce(new Error('snap fail'))
      .mockResolvedValueOnce(undefined);
    mocks.buildIndexEntry.mockReturnValue(makeEntry('2015-05-07T00:00:00Z'));

    await runRange(OPTS);

    expect(mocks.runPartyMeta).toHaveBeenCalledTimes(1); // only second
  });

  it('continues when runPartyMeta throws', async () => {
    mocks.fetchTermStartDates.mockResolvedValueOnce([
      { term: 'Q1', start: '2010-05-06T00:00:00Z' },
    ]);
    mocks.runPartyMeta.mockRejectedValueOnce(new Error('meta fail'));
    mocks.buildIndexEntry.mockReturnValue(makeEntry('2010-05-06T00:00:00Z'));

    await expect(runRange(OPTS)).resolves.toBeUndefined();
  });

  it('writes sorted index after processing all dates', async () => {
    mocks.fetchTermStartDates.mockResolvedValueOnce([
      { term: 'Q2', start: '2015-05-07T00:00:00Z' },
      { term: 'Q1', start: '2010-05-06T00:00:00Z' },
    ]);
    mocks.buildIndexEntry
      .mockReturnValueOnce(makeEntry('2015-05-07T00:00:00Z'))
      .mockReturnValueOnce(makeEntry('2010-05-06T00:00:00Z'));

    await runRange(OPTS);

    const written = JSON.parse(mocks.writeFileSync.mock.calls[0][1] as string);
    expect(written[0].date).toBe('2010-05-06T00:00:00Z');
    expect(written[1].date).toBe('2015-05-07T00:00:00Z');
  });

  it('loads existing index from parliament.index.json when it exists', async () => {
    mocks.fetchTermStartDates.mockResolvedValueOnce([]);
    mocks.existsSync
      .mockReturnValueOnce(true) // OUTPUT_DIR
      .mockReturnValueOnce(true); // PARLIAMENT_INDEX
    mocks.readFileSync.mockReturnValueOnce(
      JSON.stringify([makeEntry('2008-01-01T00:00:00Z')])
    );

    await runRange(OPTS);

    expect(mocks.readFileSync).toHaveBeenCalled();
  });
});
