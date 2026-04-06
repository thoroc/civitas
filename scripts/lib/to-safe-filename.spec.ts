import { describe, expect, it } from 'vitest';

import { toSafeFilename } from './to-safe-filename.ts';

describe('toSafeFilename', () => {
  it('replaces all colons with dashes', () => {
    expect(toSafeFilename('2021-01-01T00:00:00Z')).toBe('2021-01-01T00-00-00Z');
  });

  it('leaves strings without colons unchanged', () => {
    expect(toSafeFilename('2021-01-01T00-00-00Z')).toBe('2021-01-01T00-00-00Z');
  });

  it('replaces multiple colons', () => {
    expect(toSafeFilename('10:30:45')).toBe('10-30-45');
  });
});
