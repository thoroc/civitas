import { z } from 'zod';
import { ISODateSchema } from './isoDateSchema.ts';

export const SeatSpellSchema = z.object({
  memberId: z.number().int().nonnegative(),
  constituencyId: z.string().min(1),
  constituencyName: z.string().min(1),
  start: ISODateSchema,
  end: ISODateSchema.optional(),
  provisional: z.boolean().optional(),
});

export type SeatSpell = z.infer<typeof SeatSpellSchema>;
