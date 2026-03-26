import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatPips, getPnlColor } from '@/lib/utils'
import { STATUS_LABELS, ERROR_TAGS } from '@/lib/constants'
import type { Trade } from '@/types/database'
import { format } from 'date-fns'

interface TradeCardProps {
  trade: Trade
  onClick: () => void
}

export function TradeCard({ trade, onClick }: TradeCardProps) {
  const statusVariant = trade.status === 'win'
    ? 'profit'
    : trade.status === 'loss'
      ? 'loss'
      : trade.status === 'breakeven'
        ? 'breakeven'
        : 'secondary'

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          {/* Direction icon */}
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              trade.direction === 'long' ? 'bg-profit/10' : 'bg-loss/10'
            )}
          >
            {trade.direction === 'long' ? (
              <ArrowUpRight className="h-5 w-5 text-profit" />
            ) : (
              <ArrowDownRight className="h-5 w-5 text-loss" />
            )}
          </div>

          {/* Trade info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{trade.pair}</span>
              <Badge variant={statusVariant as "profit" | "loss" | "breakeven" | "secondary"}>
                {STATUS_LABELS[trade.status] ?? trade.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{trade.direction === 'long' ? 'Long' : 'Short'}</span>
              <span>·</span>
              <span>{trade.lot_size} lot</span>
              <span>·</span>
              <span>{format(new Date(trade.opened_at), 'dd/MM HH:mm')}</span>
            </div>
          </div>
        </div>

        {/* PnL */}
        <div className="text-right">
          {trade.pnl_dollars !== null && (
            <p className={cn('font-semibold', getPnlColor(trade.pnl_dollars))}>
              {formatCurrency(trade.pnl_dollars)}
            </p>
          )}
          {trade.pnl_pips !== null && (
            <p className={cn('text-sm', getPnlColor(trade.pnl_pips))}>
              {formatPips(trade.pnl_pips)}
            </p>
          )}
          {trade.status === 'open' && (
            <p className="text-sm text-muted-foreground">Dang mo</p>
          )}
        </div>
      </CardContent>

      {/* Error tags row */}
      {trade.error_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 pb-3">
          {trade.error_tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {ERROR_TAGS.find((t) => t.value === tag)?.label ?? tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}
