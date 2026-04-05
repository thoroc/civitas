import type { Event } from '../schemas.ts';
import type { ActiveState } from './types.ts';

export const applyVacancyStart = (
  state: Map<number, ActiveState>,
  event: Event
): void => {
  if (!event.constituencyId) return;

  for (const [memberId, active] of Array.from(state.entries())) {
    if (active.constituency === event.constituencyId) {
      state.delete(memberId);
    }
  }
};
