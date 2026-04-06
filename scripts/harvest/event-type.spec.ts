import { describe, expect, it } from 'vitest';
import { classifyEventType, type EventTypeLookup } from './classify-event-type';

describe('classifyEventType', () => {
  const emptyLookup: EventTypeLookup = {
    general: new Set(),
    byElection: new Set(),
  };

  describe('Golden Set - General Elections', () => {
    const generalDates = [
      '2005-05-05',
      '2010-05-06',
      '2015-05-07',
      '2017-06-08',
      '2019-12-12',
      '2024-07-04',
    ];

    it.each(generalDates)('classifies %s as general election (fallback)', (date) => {
      expect(classifyEventType(date, emptyLookup)).toBe('general');
    });
  });

  describe('Golden Set - By-elections', () => {
    const byElectionDates = [
      '2005-07-14',
      '2006-02-09',
      '2007-07-19',
      '2008-06-26',
      '2008-11-06',
    ];

    it.each(byElectionDates)('classifies %s as by-election (fallback)', (date) => {
      expect(classifyEventType(date, emptyLookup)).toBe('by-election');
    });
  });

  describe('Lookup precedence', () => {
    it('prefers lookup over fallback', () => {
      const lookup: EventTypeLookup = {
        general: new Set(['2005-07-14']), // Override a known by-election date
        byElection: new Set(['2005-05-05']), // Override a known general election date
      };

      expect(classifyEventType('2005-07-14', lookup)).toBe('general');
      expect(classifyEventType('2005-05-05', lookup)).toBe('by-election');
    });
  });

  describe('Edge cases and unknown dates', () => {
    it('handles ISO datetime strings by taking the date part', () => {
      expect(classifyEventType('2019-12-12T12:00:00Z', emptyLookup)).toBe('general');
    });

    it('returns unknown for unrecognized dates', () => {
      expect(classifyEventType('1900-01-01', emptyLookup)).toBe('unknown');
    });

    it('returns unknown for malformed dates', () => {
      expect(classifyEventType('not-a-date', emptyLookup)).toBe('unknown');
    });
  });
});
