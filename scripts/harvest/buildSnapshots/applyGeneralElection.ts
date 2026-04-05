import type { NormalizedData } from '../schemas.ts';
import type { ActiveState } from './types.ts';

export const applyGeneralElection = (
  state: Map<number, ActiveState>,
  normalized: NormalizedData,
  date: string
): void => {
  state.clear();
  for (const ss of normalized.seatSpells) {
    if (ss.start <= date && (!ss.end || ss.end >= date)) {
      const p = normalized.partySpells.find(
        ps =>
          ps.memberId === ss.memberId &&
          ps.start <= date &&
          (!ps.end || ps.end >= date)
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
};
