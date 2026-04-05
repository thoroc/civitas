import { z } from 'zod';
import { ISODateSchema } from './isoDateSchema.ts';

export const MemberCoreSchema = z.object({
  memberId: z.number().int().nonnegative(),
  name: z.string().min(1),
  slug: z.string().optional(),
  dateOfBirth: ISODateSchema.optional(),
});

export type MemberCore = z.infer<typeof MemberCoreSchema>;
