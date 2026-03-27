import { z } from 'zod'

const optionalPositiveNumber = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (val === '' || val === undefined || val === null) return undefined
    const num = Number(val)
    return isNaN(num) ? undefined : num
  })
  .pipe(z.number().positive('Giá trị phải lớn hơn 0').optional())

export const tradeEntrySchema = z.object({
  pair: z.string().min(1, 'Chọn cặp tiền'),
  direction: z.enum(['long', 'short'], { message: 'Chọn vị thế' }),
  lot_size: z.coerce.number().positive('Lot size phải lớn hơn 0'),
  entry_price: z.coerce.number().positive('Giá vào lệnh phải lớn hơn 0'),
  stop_loss: optionalPositiveNumber,
  take_profit: optionalPositiveNumber,
})

export const tradeCloseSchema = z.object({
  status: z.enum(['win', 'loss', 'breakeven'], { message: 'Chọn trạng thái' }),
  close_price: z.coerce.number().positive('Giá đóng lệnh phải lớn hơn 0'),
  pnl_dollars: z.coerce.number(),
  pnl_pips: z.coerce.number(),
  emotion_notes: z.string().optional(),
  error_tags: z.array(z.string()).default([]),
})

export type TradeEntryFormData = z.infer<typeof tradeEntrySchema>
export type TradeCloseFormData = z.infer<typeof tradeCloseSchema>
