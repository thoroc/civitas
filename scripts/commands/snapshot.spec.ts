import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchWithRetry: vi.fn(),
  normalizeInputDate: vi.fn((d: string) => d),
  toSafeFilename: vi.fn((d: string) => d.replace(/:/g, '-')),
  normalizeBindings: vi.fn(),
  buildParliamentMembersQuery: vi.fn(() => 'SPARQL'),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('../lib/http.ts', () => ({ fetchWithRetry: mocks.fetchWithRetry }));
vi.mock('../lib/normalizeInputDate.ts', () => ({
  normalizeInputDate: mocks.normalizeInputDate,
}));
vi.mock('../lib/toSafeFilename.ts', () => ({
  toSafeFilename: mocks.toSafeFilename,
}));
vi.mock('./normalizeBindings.ts', () => ({
  normalizeBindings: mocks.normalizeBindings,
}));
vi.mock('../lib/wikidata/index.ts', () => ({
  WIKIDATA_SPARQL_ENDPOINT: 'https://query.wikidata.org/sparql',
  buildParliamentMembersQuery: mocks.buildParliamentMembersQuery,
}));
vi.mock('../lib/paths.ts', () => ({ OUTPUT_DIR: '/test/output' }));
vi.mock('node:fs', () => ({
  default: {
    existsSync: mocks.existsSync,
    mkdirSync: mocks.mkdirSync,
    writeFileSync: mocks.writeFileSync,
  },
}));

import { runSnapshot } from './snapshot.ts';

const mockMembers = [
  {
    id: 'Q1',
    label: 'MP One',
    party: null,
    constituency: null,
    gender: null,
    age: null,
  },
];

describe('runSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.existsSync.mockReturnValue(true);
    mocks.normalizeBindings.mockReturnValue(mockMembers);
  });

  it('writes snapshot JSON on successful fetch', async () => {
    mocks.fetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { bindings: [] } }),
    });

    await runSnapshot({ date: '2021-01-01T00:00:00Z', mergeLabourCoop: false });

    expect(mocks.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('parliament-'),
      expect.stringContaining('"members"')
    );
  });

  it('uses empty bindings on HTTP error response', async () => {
    mocks.fetchWithRetry.mockResolvedValueOnce({ ok: false, status: 503 });
    mocks.normalizeBindings.mockReturnValue([]);

    await runSnapshot({ date: '2021-01-01T00:00:00Z', mergeLabourCoop: false });

    expect(mocks.normalizeBindings).toHaveBeenCalledWith({
      results: { bindings: [] },
    });
    expect(mocks.writeFileSync).toHaveBeenCalled();
  });

  it('creates output dir when it does not exist', async () => {
    mocks.existsSync.mockReturnValueOnce(false);
    mocks.fetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { bindings: [] } }),
    });

    await runSnapshot({ date: '2021-01-01T00:00:00Z', mergeLabourCoop: false });

    expect(mocks.mkdirSync).toHaveBeenCalledWith('/test/output', {
      recursive: true,
    });
  });

  it('passes mergeLabourCoop to query builder', async () => {
    mocks.fetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { bindings: [] } }),
    });

    await runSnapshot({ date: '2021-01-01T00:00:00Z', mergeLabourCoop: true });

    expect(mocks.buildParliamentMembersQuery).toHaveBeenCalledWith(
      expect.any(String),
      true
    );
  });

  it('snapshot JSON includes meta with total and date', async () => {
    mocks.fetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { bindings: [] } }),
    });
    mocks.normalizeBindings.mockReturnValue(mockMembers);

    await runSnapshot({ date: '2021-01-01T00:00:00Z', mergeLabourCoop: false });

    const writtenJson = JSON.parse(
      mocks.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenJson.meta.total).toBe(1);
    expect(writtenJson.meta.date).toBe('2021-01-01T00:00:00Z');
  });
});
