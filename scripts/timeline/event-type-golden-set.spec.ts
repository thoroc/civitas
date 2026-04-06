import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fixtureUrl = new URL(
  '../../tests/data/eventTypeGoldenSet.json',
  import.meta.url
);
const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf-8')) as {
  general: string[];
  'by-election': string[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('event type golden set', () => {
  it('contains non-empty general and by-election date lists', () => {
    expect(Array.isArray(fixture.general)).toBe(true);
    expect(Array.isArray(fixture['by-election'])).toBe(true);
    expect(fixture.general.length).toBeGreaterThan(0);
    expect(fixture['by-election'].length).toBeGreaterThan(0);
  });

  it('uses ISO date strings', () => {
    for (const date of [...fixture.general, ...fixture['by-election']]) {
      expect(date).toMatch(ISO_DATE);
    }
  });

  it.todo('classifies each golden-set date via classifyEventType');
});
