import { z } from 'zod';
import { ISODateSchema } from './isoDateSchema.ts';

export const EventSchema = z.object({
  date: ISODateSchema,
  type: z.enum([
    'generalElection',
    'byElection',
    'partySwitch',
    'seatChange',
    'vacancyStart',
    'vacancyEnd',
  ]),
  memberId: z.number().int().optional(),
  constituencyId: z.string().optional(),
  fromPartyId: z.string().optional(),
  toPartyId: z.string().optional(),
  note: z.string().optional(),
});

export type Event = z.infer<typeof EventSchema>;
