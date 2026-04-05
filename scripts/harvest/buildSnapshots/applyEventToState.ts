import type { Event, NormalizedData } from '../schemas.ts';
import { applyByElection } from './applyByElection.ts';
import { applyGeneralElection } from './applyGeneralElection.ts';
import { applyPartySwitch } from './applyPartySwitch.ts';
import { applyVacancyStart } from './applyVacancyStart.ts';
import type { ActiveState } from './types.ts';

export const applyEventToState = (
  state: Map<number, ActiveState>,
  normalized: NormalizedData,
  event: Event
): void => {
  switch (event.type) {
    case 'generalElection':
      applyGeneralElection(state, normalized, event.date);
      return;
    case 'byElection':
      applyByElection(state, normalized, event);
      return;
    case 'partySwitch':
      applyPartySwitch(state, normalized, event);
      return;
    case 'vacancyStart':
      applyVacancyStart(state, event);
      return;
    case 'vacancyEnd':
      return;
    default:
      return;
  }
};
