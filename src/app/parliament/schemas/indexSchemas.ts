import { z } from 'zod';
import { EventTypeSchema, inferEventType } from './eventTypeSchema.ts';
import { isoDateTime } from './isoDateTimeSchema.ts';

const ParliamentIndexEntryBaseSchema = z.object({
  date: isoDateTime,
  safeDate: z.string().min(1),
  file: z.string().min(1),
  partyMetaFile: z.string().min(1).nullable().optional().default(null),
  total: z.number().int().positive(),
  generatedAt: isoDateTime,
  eventType: EventTypeSchema.optional(),
});

export const ParliamentIndexEntrySchema =
  ParliamentIndexEntryBaseSchema.transform(entry => ({
    ...entry,
    eventType: entry.eventType ?? inferEventType(entry.date),
  }));

export const ParliamentIndexSchema = z.array(ParliamentIndexEntrySchema);

export type ParliamentIndexEntry = z.infer<typeof ParliamentIndexEntrySchema>;
