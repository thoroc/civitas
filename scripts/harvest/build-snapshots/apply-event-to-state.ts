import type { Event, NormalizedData } from '../schemas';
import { applyByElection } from './apply-by-election.ts';
import { applyGeneralElection } from './apply-general-election.ts';
import { applyPartySwitch } from './apply-party-switch.ts';
import { applyVacancyStart } from './apply-vacancy-start.ts';
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
