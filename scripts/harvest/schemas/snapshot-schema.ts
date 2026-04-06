import { z } from 'zod';
import { EventTypeSchema } from './event-type-schema.ts';
import { ISODateSchema } from './iso-date-schema.ts';
import { SnapshotMemberSchema } from './snapshot-member-schema.ts';

export const SnapshotSchema = z.object({
  date: ISODateSchema,
  eventType: EventTypeSchema,
  meta: z.object({
    generatedAt: ISODateSchema,
    source: z.object({ membersHash: z.string(), eventsHash: z.string() }),
  }),
  members: z.array(SnapshotMemberSchema),
  parties: z.record(z.number()),
  total: z.number().int(),
});

export type Snapshot = z.infer<typeof SnapshotSchema>;
