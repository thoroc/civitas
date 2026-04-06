import { describe, expect, it } from 'vitest';

import { buildConstituencyFromBinding } from './build-constituency-from-binding.ts';

describe('buildConstituencyFromBinding', () => {
  it('returns null when constituency binding is absent', () => {
    expect(buildConstituencyFromBinding({})).toBeNull();
  });

  it('builds a constituency with id and label', () => {
    const c = buildConstituencyFromBinding({
      constituency: { value: 'http://wd/Q1' },
      constituencyLabel: { value: 'Holborn and St Pancras' },
    });
    expect(c).toEqual({ id: 'http://wd/Q1', label: 'Holborn and St Pancras' });
  });

  it('falls back to id as label when constituencyLabel is absent', () => {
    const c = buildConstituencyFromBinding({
      constituency: { value: 'http://wd/Q2' },
    });
    expect(c?.label).toBe('http://wd/Q2');
  });
});
