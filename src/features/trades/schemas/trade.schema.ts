import { z } from 'zod'

export const tradeEntrySchema = z.object({
  pair: z.string().min(1, 'Chon cap tien'),
  direction: z.enum(['long', 'short'], { required_error: 'Chon vi the' }),
  lot_size: z.coerce.number().positive('Lot size phai lon hon 0'),
  entry_price: z.coerce.number().positive('Gia vao lenh phai lon hon 0'),
  stop_loss: z.coerce.number().positive('Stoploss phai lon hon 0').optional(),
  take_profit: z.coerce.number().positive('Take profit phai lon hon 0').optional(),
})

export const tradeCloseSchema = z.object({
  status: z.enum(['win', 'loss', 'breakeven'], { required_error: 'Chon trang thai' }),
  close_price: z.coerce.number().positive('Gia dong lenh phai lon hon 0'),
  pnl_dollars: z.coerce.number(),
  pnl_pips: z.coerce.number(),
  emotion_notes: z.string().optional(),
  error_tags: z.array(z.string()).default([]),
})

export type TradeEntryFormData = z.infer<typeof tradeEntrySchema>
export type TradeCloseFormData = z.infer<typeof tradeCloseSchema>
