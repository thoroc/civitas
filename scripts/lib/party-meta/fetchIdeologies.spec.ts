import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

import axios from 'axios';
import { fetchIdeologies } from './fetchIdeologies.ts';

const mockedGet = vi.mocked(axios.get);

describe('fetchIdeologies', () => {
  beforeEach(() => mockedGet.mockReset());

  it('returns empty map for empty QID list without calling API', async () => {
    const result = await fetchIdeologies([]);
    expect(result.size).toBe(0);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('returns ideology labels keyed by QID', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        results: {
          bindings: [
            {
              party: { value: 'http://www.wikidata.org/entity/Q9630' },
              ideologyLabel: { value: 'social democracy' },
            },
            {
              party: { value: 'http://www.wikidata.org/entity/Q9630' },
              ideologyLabel: { value: 'labour movement' },
            },
          ],
        },
      },
    });
    const result = await fetchIdeologies(['Q9630']);
    expect(result.get('Q9630')).toEqual([
      'social democracy',
      'labour movement',
    ]);
  });

  it('ignores bindings with no ideologyLabel', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        results: {
          bindings: [{ party: { value: 'http://www.wikidata.org/entity/Q1' } }],
        },
      },
    });
    const result = await fetchIdeologies(['Q1']);
    expect(result.get('Q1')).toBeUndefined();
  });

  it('ignores bindings with no party URI', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        results: {
          bindings: [{ ideologyLabel: { value: 'socialism' } }],
        },
      },
    });
    const result = await fetchIdeologies(['Q1']);
    expect(result.size).toBe(0);
  });

  it('handles empty bindings array', async () => {
    mockedGet.mockResolvedValueOnce({ data: { results: { bindings: [] } } });
    const result = await fetchIdeologies(['Q1']);
    expect(result.size).toBe(0);
  });

  it('maps multiple distinct QIDs', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        results: {
          bindings: [
            {
              party: { value: 'http://www.wikidata.org/entity/Q1' },
              ideologyLabel: { value: 'left' },
            },
            {
              party: { value: 'http://www.wikidata.org/entity/Q2' },
              ideologyLabel: { value: 'right' },
            },
          ],
        },
      },
    });
    const result = await fetchIdeologies(['Q1', 'Q2']);
    expect(result.get('Q1')).toEqual(['left']);
    expect(result.get('Q2')).toEqual(['right']);
  });
});
