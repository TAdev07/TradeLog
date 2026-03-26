import { z } from 'zod'

export const journalSchema = z.object({
  date: z.string().min(1, 'Chon ngay'),
  sessions: z.array(z.enum(['asian', 'european', 'us'])).default([]),
  session_notes: z.string().optional(),
  macro_events: z.string().optional(),
  mood_score: z.coerce.number().min(1).max(10).optional(),
  mood_notes: z.string().optional(),
  daily_summary: z.string().optional(),
})

export type JournalFormData = z.infer<typeof journalSchema>
