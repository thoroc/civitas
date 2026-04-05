import { z } from 'zod';
import { isoDateTime } from './isoDateTimeSchema.ts';

export const PartyMetaRecordSchema = z.object({
  id: z.string().min(1),
  leaning: z.enum(['left', 'center', 'right']),
});

export const PartyMetaPayloadSchema = z.object({
  parties: z.array(PartyMetaRecordSchema),
  snapshotDate: isoDateTime.optional(),
});

export type PartyMetaRecord = z.infer<typeof PartyMetaRecordSchema>;
export type PartyMetaPayload = z.infer<typeof PartyMetaPayloadSchema>;
