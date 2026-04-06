import { z } from 'zod';
import { MemberCoreSchema } from './member-core-schema.ts';
import { PartySpellSchema } from './party-spell-schema.ts';
import { SeatSpellSchema } from './seat-spell-schema.ts';

export const NormalizedDataSchema = z.object({
  members: z.array(MemberCoreSchema),
  seatSpells: z.array(SeatSpellSchema),
  partySpells: z.array(PartySpellSchema),
  parties: z.array(z.object({ partyId: z.string(), name: z.string() })),
  constituencies: z.array(
    z.object({ constituencyId: z.string(), name: z.string() })
  ),
});

export type NormalizedData = z.infer<typeof NormalizedDataSchema>;
