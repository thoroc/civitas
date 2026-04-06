import type { Event, NormalizedData } from '../schemas';
import type { ActiveState } from './types.ts';

export const applyPartySwitch = (
  state: Map<number, ActiveState>,
  normalized: NormalizedData,
  event: Event
): void => {
  if (!event.memberId || !event.toPartyId) return;

  const current = state.get(event.memberId);
  if (!current) return;

  const partySpell = normalized.partySpells.find(
    p =>
      p.memberId === event.memberId &&
      p.partyId === event.toPartyId &&
      p.start === event.date
  );

  if (partySpell) {
    current.party = partySpell.partyId;
    current.partyName = partySpell.partyName;
    state.set(event.memberId, current);
  }
};
