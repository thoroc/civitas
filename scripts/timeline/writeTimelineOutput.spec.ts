import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  toSafeFilename: vi.fn((d: string) => d.replace(/:/g, '-')),
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: mocks.existsSync,
    mkdirSync: mocks.mkdirSync,
    writeFileSync: mocks.writeFileSync,
  },
}));
vi.mock('../lib/paths.ts', () => ({
  OFFICIAL_DIR: '/test/official',
  OFFICIAL_INDEX: '/test/official/official.index.json',
}));
vi.mock('../lib/toSafeFilename.ts', () => ({
  toSafeFilename: mocks.toSafeFilename,
}));

import { writeTimelineOutput } from './writeTimelineOutput.ts';

const makeSnapshot = (
  date: string,
  total = 5,
  eventType: 'general' | 'by-election' | 'other' | 'unknown' = 'unknown'
): object => ({
  date,
  eventType,
  total,
  meta: { date, generatedAt: '2024-01-01T00:00:00Z', total },
  members: [],
});

describe('writeTimelineOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.existsSync.mockReturnValue(true);
  });

  it('creates OFFICIAL_DIR when it does not exist', () => {
    mocks.existsSync.mockReturnValueOnce(false);

    writeTimelineOutput([], []);

    expect(mocks.mkdirSync).toHaveBeenCalledWith('/test/official', {
      recursive: true,
    });
  });

  it('skips mkdirSync when OFFICIAL_DIR already exists', () => {
    mocks.existsSync.mockReturnValueOnce(true);

    writeTimelineOutput([], []);

    expect(mocks.mkdirSync).not.toHaveBeenCalled();
  });

  it('writes events.json with serialized events', () => {
    const events = [{ type: 'join', memberId: 'Q1' }];

    writeTimelineOutput([], events);

    const eventsCall = mocks.writeFileSync.mock.calls.find(([p]: string[]) =>
      p.includes('events.json')
    );
    expect(eventsCall).toBeDefined();
    const written = JSON.parse(eventsCall?.[1] as string);
    expect(written).toEqual(events);
  });

  it('writes a per-snapshot file for each snapshot', () => {
    const sn1 = makeSnapshot('2021-01-01T00:00:00Z', 3);
    const sn2 = makeSnapshot('2022-06-01T00:00:00Z', 7);

    writeTimelineOutput([sn1, sn2] as never, []);

    const snapshotCalls = mocks.writeFileSync.mock.calls.filter(
      ([p]: string[]) => p.includes('official-parliament-')
    );
    expect(snapshotCalls).toHaveLength(2);
  });

  it('per-snapshot filename uses toSafeFilename result', () => {
    mocks.toSafeFilename.mockReturnValue('2021-01-01T00-00-00Z');
    const sn = makeSnapshot('2021-01-01T00:00:00Z');

    writeTimelineOutput([sn] as never, []);

    const snCall = mocks.writeFileSync.mock.calls.find(([p]: string[]) =>
      p.includes('official-parliament-')
    );
    expect(snCall?.[0]).toContain(
      'official-parliament-2021-01-01T00-00-00Z.json'
    );
  });

  it('writes the index file with entries for each snapshot', () => {
    const sn = makeSnapshot('2021-01-01T00:00:00Z', 10, 'general');

    writeTimelineOutput([sn] as never, []);

    const indexCall = mocks.writeFileSync.mock.calls.find(
      ([p]: string[]) => p === '/test/official/official.index.json'
    );
    expect(indexCall).toBeDefined();
    const index = JSON.parse(indexCall?.[1] as string);
    expect(index).toHaveLength(1);
    expect(index[0].date).toBe('2021-01-01T00:00:00Z');
    expect(index[0].total).toBe(10);
    expect(index[0].eventType).toBe('general');
  });

  it('writes empty index when no snapshots', () => {
    writeTimelineOutput([], []);

    const indexCall = mocks.writeFileSync.mock.calls.find(
      ([p]: string[]) => p === '/test/official/official.index.json'
    );
    const index = JSON.parse(indexCall?.[1] as string);
    expect(index).toEqual([]);
  });

  it('index entry includes generatedAt from snapshot meta', () => {
    const sn = makeSnapshot('2021-01-01T00:00:00Z');

    writeTimelineOutput([sn] as never, []);

    const indexCall = mocks.writeFileSync.mock.calls.find(
      ([p]: string[]) => p === '/test/official/official.index.json'
    );
    const index = JSON.parse(indexCall?.[1] as string);
    expect(index[0].generatedAt).toBe('2024-01-01T00:00:00Z');
  });
});
