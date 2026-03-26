import { z } from 'zod'

export const ruleSchema = z.object({
  title: z.string().min(1, 'Tieu de khong duoc de trong'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type RuleFormData = z.infer<typeof ruleSchema>
