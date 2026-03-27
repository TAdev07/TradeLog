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
import { calculatePips } from '@/lib/utils'

interface TradeFormProps {
  onSubmit: (data: TradeEntryFormData) => void
  isLoading?: boolean
}

function toLocalDatetime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
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
      opened_at: toLocalDatetime(new Date()),
    },
  })

  const direction = watch('direction')
  const pair = watch('pair')
  const entryPrice = watch('entry_price')
  const stopLoss = watch('stop_loss')
  const takeProfit = watch('take_profit')

  const slPips = entryPrice && stopLoss
    ? Math.abs(calculatePips(pair, entryPrice, stopLoss))
    : null
  const tpPips = entryPrice && takeProfit
    ? Math.abs(calculatePips(pair, entryPrice, takeProfit))
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Pair */}
        <div className="space-y-2">
          <Label>Cặp tiền</Label>
          <Select
            defaultValue="XAUUSD"
            onValueChange={(v) => setValue('pair', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn cặp tiền" />
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
          <Label>Vị thế</Label>
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
          <Label htmlFor="lot_size">Khối lượng (Lot)</Label>
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
          <Label htmlFor="entry_price">Giá vào lệnh</Label>
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
          <Label htmlFor="stop_loss">
            Stoploss
            {slPips !== null && (
              <span className="text-xs text-loss ml-2">({slPips.toFixed(1)} pips)</span>
            )}
          </Label>
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
          <Label htmlFor="take_profit">
            Take Profit
            {tpPips !== null && (
              <span className="text-xs text-profit ml-2">({tpPips.toFixed(1)} pips)</span>
            )}
          </Label>
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

      {/* R:R Preview */}
      {slPips && tpPips ? (
        <div className="text-sm bg-muted/50 rounded-lg p-3">
          <span className="text-muted-foreground">R:R dự kiến: </span>
          <span className="font-medium">{(tpPips / slPips).toFixed(2)}</span>
        </div>
      ) : null}

      {/* Opened At */}
      <div className="space-y-2">
        <Label htmlFor="opened_at">Thời gian vào lệnh</Label>
        <Input
          id="opened_at"
          type="datetime-local"
          {...register('opened_at')}
        />
        {errors.opened_at && (
          <p className="text-sm text-destructive">{errors.opened_at.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Đang lưu...' : 'Mở lệnh'}
      </Button>
    </form>
  )
}
