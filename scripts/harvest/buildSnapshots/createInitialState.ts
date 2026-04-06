import type { NormalizedData } from '../schemas';
import type { ActiveState } from './types.ts';

export const createInitialState = (
  normalized: NormalizedData,
  firstDate?: string
): Map<number, ActiveState> => {
  const state = new Map<number, ActiveState>();

  if (!firstDate) return state;

  for (const ss of normalized.seatSpells) {
    if (ss.start <= firstDate && (!ss.end || ss.end >= firstDate)) {
      const p = normalized.partySpells.find(
        ps =>
          ps.memberId === ss.memberId &&
          ps.start <= firstDate &&
          (!ps.end || ps.end >= firstDate)
      );
      if (p) {
        state.set(ss.memberId, {
          party: p.partyId,
          partyName: p.partyName,
          constituency: ss.constituencyId,
          constituencyName: ss.constituencyName,
        });
      }
    }
  }

  return state;
};
