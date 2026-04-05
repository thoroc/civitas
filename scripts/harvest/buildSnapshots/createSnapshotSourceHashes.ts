import type { Event, MemberCore } from '../schemas.ts';
import { hashObject } from './hashObject.ts';
import type { SnapshotSourceHashes } from './types.ts';

export const createSnapshotSourceHashes = (
  members: MemberCore[],
  events: Event[]
): SnapshotSourceHashes => ({
  membersHash: hashObject(members),
  eventsHash: hashObject(events),
});
