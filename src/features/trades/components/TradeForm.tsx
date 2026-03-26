import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeEntrySchema, type TradeEntryFormData } from '../schemas/trade.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TRADING_PAIRS } from '@/lib/constants'

interface TradeFormProps {
  onSubmit: (data: TradeEntryFormData) => void
  isLoading?: boolean
}

export function TradeForm({ onSubmit, isLoading }: TradeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TradeEntryFormData>({
    resolver: zodResolver(tradeEntrySchema) as never,
    defaultValues: {
      pair: 'XAUUSD',
      direction: 'long',
    },
  })

  const direction = watch('direction')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Pair */}
        <div className="space-y-2">
          <Label>Cap tien</Label>
          <Select
            defaultValue="XAUUSD"
            onValueChange={(v) => setValue('pair', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chon cap tien" />
            </SelectTrigger>
            <SelectContent>
              {TRADING_PAIRS.map((pair) => (
                <SelectItem key={pair} value={pair}>
                  {pair}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.pair && (
            <p className="text-sm text-destructive">{errors.pair.message}</p>
          )}
        </div>

        {/* Direction */}
        <div className="space-y-2">
          <Label>Vi the</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={direction === 'long' ? 'default' : 'outline'}
              className={direction === 'long' ? 'bg-profit hover:bg-profit/90 text-white flex-1' : 'flex-1'}
              onClick={() => setValue('direction', 'long')}
            >
              Long
            </Button>
            <Button
              type="button"
              variant={direction === 'short' ? 'default' : 'outline'}
              className={direction === 'short' ? 'bg-loss hover:bg-loss/90 text-white flex-1' : 'flex-1'}
              onClick={() => setValue('direction', 'short')}
            >
              Short
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Lot Size */}
        <div className="space-y-2">
          <Label htmlFor="lot_size">Khoi luong (Lot)</Label>
          <Input
            id="lot_size"
            type="number"
            step="0.01"
            placeholder="0.01"
            {...register('lot_size')}
          />
          {errors.lot_size && (
            <p className="text-sm text-destructive">{errors.lot_size.message}</p>
          )}
        </div>

        {/* Entry Price */}
        <div className="space-y-2">
          <Label htmlFor="entry_price">Gia vao lenh</Label>
          <Input
            id="entry_price"
            type="number"
            step="0.00001"
            placeholder="1.0000"
            {...register('entry_price')}
          />
          {errors.entry_price && (
            <p className="text-sm text-destructive">{errors.entry_price.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Stop Loss */}
        <div className="space-y-2">
          <Label htmlFor="stop_loss">Stoploss</Label>
          <Input
            id="stop_loss"
            type="number"
            step="0.00001"
            placeholder="Optional"
            {...register('stop_loss')}
          />
          {errors.stop_loss && (
            <p className="text-sm text-destructive">{errors.stop_loss.message}</p>
          )}
        </div>

        {/* Take Profit */}
        <div className="space-y-2">
          <Label htmlFor="take_profit">Take Profit</Label>
          <Input
            id="take_profit"
            type="number"
            step="0.00001"
            placeholder="Optional"
            {...register('take_profit')}
          />
          {errors.take_profit && (
            <p className="text-sm text-destructive">{errors.take_profit.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Dang luu...' : 'Mo lenh'}
      </Button>
    </form>
  )
}
