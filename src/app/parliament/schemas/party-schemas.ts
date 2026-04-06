import { z } from 'zod';

export const PartySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1), // Accept any non-empty; UI assumes valid CSS color
});

export const ConstituencySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const MemberSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  constituency: ConstituencySchema.nullable(),
  party: PartySchema.nullable(),
  gender: z.string().min(1).nullable(),
  age: z.number().int().nonnegative().max(130).nullable(),
});

export type Party = z.infer<typeof PartySchema>;
export type Constituency = z.infer<typeof ConstituencySchema>;
export type Member = z.infer<typeof MemberSchema>;
