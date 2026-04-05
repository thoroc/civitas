import { z } from 'zod';

export const SnapshotMemberSchema = z.object({
  memberId: z.number().int(),
  name: z.string(),
  constituencyId: z.string(),
  constituencyName: z.string(),
  partyId: z.string(),
  partyName: z.string(),
  provisional: z.boolean().optional(),
});

export type SnapshotMember = z.infer<typeof SnapshotMemberSchema>;
