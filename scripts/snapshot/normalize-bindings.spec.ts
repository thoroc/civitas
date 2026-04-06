import { describe, expect, it } from 'vitest';

import { normalizeBindings } from './normalize-bindings.ts';

const WD = 'http://www.wikidata.org/entity/';

const makeBinding = (overrides = {}) => ({
  mp: { value: `${WD}Q100` },
  mpLabel: { value: 'Jane Smith' },
  genderLabel: { value: 'female' },
  age: { value: '45' },
  ...overrides,
});

describe('normalizeBindings', () => {
  it('returns empty array when results.bindings is absent', () => {
    expect(normalizeBindings({})).toEqual([]);
    expect(normalizeBindings({ results: {} })).toEqual([]);
    expect(normalizeBindings(null)).toEqual([]);
  });

  it('maps bindings to Member objects', () => {
    const raw = { results: { bindings: [makeBinding()] } };
    const [member] = normalizeBindings(raw);
    expect(member.id).toBe('Q100');
    expect(member.label).toBe('Jane Smith');
    expect(member.gender).toBe('female');
    expect(member.age).toBe(45);
  });

  it('falls back to mp URI for id/label when mpLabel is absent', () => {
    const [member] = normalizeBindings({
      results: { bindings: [makeBinding({ mpLabel: undefined })] },
    });
    expect(member.id).toBe('Q100');
    expect(member.label).toBe('Q100');
  });

  it('sets gender to null when absent', () => {
    const [member] = normalizeBindings({
      results: { bindings: [makeBinding({ genderLabel: undefined })] },
    });
    expect(member.gender).toBeNull();
  });

  it('sets age to null when absent', () => {
    const [member] = normalizeBindings({
      results: { bindings: [makeBinding({ age: undefined })] },
    });
    expect(member.age).toBeNull();
  });

  it('maps constituency via buildConstituencyFromBinding', () => {
    const [member] = normalizeBindings({
      results: {
        bindings: [
          makeBinding({
            constituency: { value: 'http://wd/Q50' },
            constituencyLabel: { value: 'Hackney North' },
          }),
        ],
      },
    });
    expect(member.constituency?.label).toBe('Hackney North');
  });

  it('maps party via buildPartyFromBinding', () => {
    const [member] = normalizeBindings({
      results: {
        bindings: [
          makeBinding({
            partyText: { value: `${WD}Q9630` },
            partyLabel: { value: 'Labour' },
          }),
        ],
      },
    });
    expect(member.party?.label).toBe('Labour');
  });

  it('handles multiple bindings', () => {
    const raw = {
      results: {
        bindings: [makeBinding(), makeBinding({ mp: { value: `${WD}Q200` } })],
      },
    };
    expect(normalizeBindings(raw)).toHaveLength(2);
  });
});
