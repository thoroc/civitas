import { z } from 'zod';
import { ISODateSchema } from './iso-date-schema.ts';

export const PartySpellSchema = z.object({
  memberId: z.number().int().nonnegative(),
  partyId: z.string().min(1),
  partyName: z.string().min(1),
  start: ISODateSchema,
  end: ISODateSchema.optional(),
  provisional: z.boolean().optional(),
});

export type PartySpell = z.infer<typeof PartySpellSchema>;
