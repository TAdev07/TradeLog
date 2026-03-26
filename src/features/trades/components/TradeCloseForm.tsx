import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeCloseSchema, type TradeCloseFormData } from '../schemas/trade.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ErrorTagSelect } from './ErrorTagSelect'
import { cn } from '@/lib/utils'

interface TradeCloseFormProps {
  onSubmit: (data: TradeCloseFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function TradeCloseForm({ onSubmit, onCancel, isLoading }: TradeCloseFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TradeCloseFormData>({
    resolver: zodResolver(tradeCloseSchema) as never,
    defaultValues: {
      error_tags: [],
    },
  })

  const status = watch('status')
  const errorTags = watch('error_tags')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Status */}
      <div className="space-y-2">
        <Label>Ket qua</Label>
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
              {s === 'win' ? 'Win' : s === 'loss' ? 'Loss' : 'Hoa von'}
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
          <Label htmlFor="close_price">Gia dong</Label>
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
          <Label htmlFor="pnl_dollars">PnL ($)</Label>
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
          <Label htmlFor="pnl_pips">Pips</Label>
          <Input
            id="pnl_pips"
            type="number"
            step="0.1"
            placeholder="0.0"
            {...register('pnl_pips')}
          />
        </div>
      </div>

      {/* Error Tags */}
      <div className="space-y-2">
        <Label>Loi sai (tags)</Label>
        <ErrorTagSelect
          value={errorTags}
          onChange={(tags) => setValue('error_tags', tags)}
        />
      </div>

      {/* Emotion Notes */}
      <div className="space-y-2">
        <Label htmlFor="emotion_notes">Ghi chu cam xuc</Label>
        <Textarea
          id="emotion_notes"
          rows={3}
          placeholder="Cam xuc khi giao dich, ly do vao lenh, bai hoc rut ra..."
          {...register('emotion_notes')}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Huy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Dang luu...' : 'Dong lenh'}
        </Button>
      </div>
    </form>
  )
}
