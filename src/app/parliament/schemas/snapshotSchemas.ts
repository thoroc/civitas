import { z } from 'zod';
import { isoDateTime } from './isoDateTimeSchema.ts';
import { MemberSchema } from './partySchemas.ts';

export const ParliamentSnapshotMetaSchema = z.object({
  date: isoDateTime,
  generatedAt: isoDateTime,
  total: z.number().int().positive(),
});

export const ParliamentSnapshotSchema = z
  .object({
    meta: ParliamentSnapshotMetaSchema,
    members: z.array(MemberSchema),
  })
  .refine(obj => obj.meta.total === obj.members.length, {
    message: 'meta.total must equal members.length',
    path: ['meta', 'total'],
  });

export type ParliamentSnapshotMeta = z.infer<
  typeof ParliamentSnapshotMetaSchema
>;
export type ParliamentSnapshot = z.infer<typeof ParliamentSnapshotSchema>;
