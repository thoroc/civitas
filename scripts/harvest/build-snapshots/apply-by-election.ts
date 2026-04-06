import type { Event, NormalizedData } from '../schemas';
import type { ActiveState } from './types.ts';

export const applyByElection = (
  state: Map<number, ActiveState>,
  normalized: NormalizedData,
  event: Event
): void => {
  if (!event.memberId || !event.constituencyId) return;

  const seatSpell = normalized.seatSpells.find(
    s =>
      s.memberId === event.memberId &&
      s.constituencyId === event.constituencyId &&
      s.start === event.date
  );
  const partySpell = normalized.partySpells.find(
    p =>
      p.memberId === event.memberId &&
      p.start <= event.date &&
      (!p.end || p.end >= event.date)
  );

  if (seatSpell && partySpell) {
    state.set(event.memberId, {
      party: partySpell.partyId,
      partyName: partySpell.partyName,
      constituency: seatSpell.constituencyId,
      constituencyName: seatSpell.constituencyName,
    });
  }
};
