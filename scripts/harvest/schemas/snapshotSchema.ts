import { z } from 'zod';
import { EventTypeSchema } from './eventTypeSchema.ts';
import { ISODateSchema } from './isoDateSchema.ts';
import { SnapshotMemberSchema } from './snapshotMemberSchema.ts';

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
