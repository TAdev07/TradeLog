import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeCloseSchema, type TradeCloseFormData } from '../schemas/trade.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ErrorTagSelect } from './ErrorTagSelect'
import { cn, calculatePips, calculateRiskReward, getPnlColor } from '@/lib/utils'
import type { Trade } from '@/types/database'

function toLocalDatetime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface TradeCloseFormProps {
  trade: Trade
  onSubmit: (data: TradeCloseFormData) => void
  onCancel: () => void
  isLoading?: boolean
  isEditing?: boolean
}

export function TradeCloseForm({ trade, onSubmit, onCancel, isLoading, isEditing }: TradeCloseFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TradeCloseFormData>({
    resolver: zodResolver(tradeCloseSchema) as never,
    defaultValues: isEditing
      ? {
          status: trade.status as 'win' | 'loss' | 'breakeven',
          close_price: trade.close_price ?? undefined,
          pnl_dollars: trade.pnl_dollars ?? 0,
          pnl_pips: trade.pnl_pips ?? 0,
          emotion_notes: trade.emotion_notes ?? '',
          error_tags: trade.error_tags ?? [],
          closed_at: trade.closed_at ? toLocalDatetime(new Date(trade.closed_at)) : toLocalDatetime(new Date()),
        }
      : {
          error_tags: [],
          pnl_pips: 0,
          pnl_dollars: 0,
          closed_at: toLocalDatetime(new Date()),
        },
  })

  const status = watch('status')
  const errorTags = watch('error_tags')
  const closePrice = watch('close_price')
  const prevClosePrice = useRef<number | undefined>(undefined)

  // Auto-calculate pips when close price changes
  const directedPips = closePrice
    ? (trade.direction === 'long'
        ? calculatePips(trade.pair, trade.entry_price, closePrice)
        : calculatePips(trade.pair, closePrice, trade.entry_price))
    : null

  // Auto-calculate R:R
  const autoRR = closePrice
    ? calculateRiskReward(trade.entry_price, closePrice, trade.stop_loss, trade.direction)
    : null

  // Auto-calculate PnL ($) estimate
  // For XAUUSD: PnL = pips * 10 * lot_size (1 pip = $10 per lot)
  // For JPY pairs: PnL = pips * 1000 * lot_size / 100 (approximate)
  // For standard pairs: PnL = pips * 100000 * lot_size / 10000 = pips * 10 * lot_size
  const autoPnlDollars = directedPips !== null
    ? Math.round(directedPips * 10 * trade.lot_size * 100) / 100
    : null

  // Auto-fill pips and PnL when close price changes
  useEffect(() => {
    if (closePrice && closePrice > 0 && closePrice !== prevClosePrice.current) {
      prevClosePrice.current = closePrice
      if (directedPips !== null) {
        setValue('pnl_pips', directedPips)
      }
      if (autoPnlDollars !== null) {
        setValue('pnl_dollars', autoPnlDollars)
      }
    }
  }, [closePrice, directedPips, autoPnlDollars, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Status */}
      <div className="space-y-2">
        <Label>Kết quả</Label>
        <div className="flex gap-2">
          {(['win', 'loss', 'breakeven'] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant={status === s ? 'default' : 'outline'}
              className={cn(
                'flex-1',
                status === s && s === 'win' && 'bg-profit hover:bg-profit/90 text-white',
                status === s && s === 'loss' && 'bg-loss hover:bg-loss/90 text-white',
                status === s && s === 'breakeven' && 'bg-breakeven hover:bg-breakeven/90 text-black'
              )}
              onClick={() => setValue('status', s)}
            >
              {s === 'win' ? 'Win' : s === 'loss' ? 'Loss' : 'Hoà vốn'}
            </Button>
          ))}
        </div>
        {errors.status && (
          <p className="text-sm text-destructive">{errors.status.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Close Price */}
        <div className="space-y-2">
          <Label htmlFor="close_price">Giá đóng</Label>
          <Input
            id="close_price"
            type="number"
            step="0.00001"
            {...register('close_price')}
          />
          {errors.close_price && (
            <p className="text-sm text-destructive">{errors.close_price.message}</p>
          )}
        </div>

        {/* PnL Dollars */}
        <div className="space-y-2">
          <Label htmlFor="pnl_dollars">
            PnL ($)
            {autoPnlDollars !== null && (
              <span className={cn('ml-1 text-xs', getPnlColor(autoPnlDollars))}>
                (tự tính)
              </span>
            )}
          </Label>
          <Input
            id="pnl_dollars"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('pnl_dollars')}
          />
        </div>

        {/* PnL Pips */}
        <div className="space-y-2">
          <Label htmlFor="pnl_pips">
            Pips
            {directedPips !== null && (
              <span className={cn('ml-1 text-xs', getPnlColor(directedPips))}>
                (tự tính)
              </span>
            )}
          </Label>
          <Input
            id="pnl_pips"
            type="number"
            step="0.1"
            placeholder="0.0"
            {...register('pnl_pips')}
          />
        </div>
      </div>

      {/* Auto-calculated preview */}
      {closePrice > 0 && (
        <div className="flex gap-4 text-sm bg-muted/50 rounded-lg p-3">
          {directedPips !== null && (
            <div>
              <span className="text-muted-foreground">Pips ước tính: </span>
              <span className={cn('font-medium', getPnlColor(directedPips))}>
                {directedPips > 0 ? '+' : ''}{directedPips.toFixed(1)}
              </span>
            </div>
          )}
          {autoPnlDollars !== null && (
            <div>
              <span className="text-muted-foreground">PnL ước tính: </span>
              <span className={cn('font-medium', getPnlColor(autoPnlDollars))}>
                {autoPnlDollars > 0 ? '+' : ''}{autoPnlDollars.toFixed(2)}$
              </span>
            </div>
          )}
          {autoRR !== null && (
            <div>
              <span className="text-muted-foreground">R:R: </span>
              <span className={cn('font-medium', getPnlColor(autoRR))}>
                {autoRR.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Closed At */}
      <div className="space-y-2">
        <Label htmlFor="closed_at">Thời gian đóng lệnh</Label>
        <Input
          id="closed_at"
          type="datetime-local"
          {...register('closed_at')}
        />
        {errors.closed_at && (
          <p className="text-sm text-destructive">{errors.closed_at.message}</p>
        )}
      </div>

      {/* Error Tags */}
      <div className="space-y-2">
        <Label>Lỗi sai (tags)</Label>
        <ErrorTagSelect
          value={errorTags}
          onChange={(tags) => setValue('error_tags', tags)}
        />
      </div>

      {/* Emotion Notes */}
      <div className="space-y-2">
        <Label htmlFor="emotion_notes">Ghi chú cảm xúc</Label>
        <Textarea
          id="emotion_notes"
          rows={3}
          placeholder="Cảm xúc khi giao dịch, lý do vào lệnh, bài học rút ra..."
          {...register('emotion_notes')}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Đóng lệnh'}
        </Button>
      </div>
    </form>
  )
}
