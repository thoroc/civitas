import { z } from 'zod';

export const EventTypeSchema = z.enum([
  'general',
  'by-election',
  'other',
  'unknown',
]);

export type EventType = z.infer<typeof EventTypeSchema>;
