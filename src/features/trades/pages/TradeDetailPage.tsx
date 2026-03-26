import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TradeCloseForm } from '../components/TradeCloseForm'
import { useTrade, useCloseTrade, useDeleteTrade } from '../hooks/useTrades'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn, formatCurrency, formatPips, getPnlColor } from '@/lib/utils'
import { STATUS_LABELS, ERROR_TAGS } from '@/lib/constants'
import type { TradeCloseFormData } from '../schemas/trade.schema'

export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: trade, isLoading } = useTrade(id!)
  const closeTrade = useCloseTrade()
  const deleteTrade = useDeleteTrade()
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)

  if (isLoading || !trade) return <LoadingSpinner className="mt-20" />

  const handleClose = async (data: TradeCloseFormData) => {
    await closeTrade.mutateAsync({ id: trade.id, data })
    setCloseDialogOpen(false)
  }

  const handleDelete = async () => {
    if (window.confirm('Ban co chac muon xoa lenh nay?')) {
      await deleteTrade.mutateAsync(trade.id)
      navigate('/trades')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/trades')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
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
            <div>
              <h1 className="text-2xl font-bold">{trade.pair}</h1>
              <p className="text-sm text-muted-foreground">
                {trade.direction === 'long' ? 'Long' : 'Short'} · {trade.lot_size} lot · {format(new Date(trade.opened_at), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>
        <Badge
          variant={
            trade.status === 'win' ? 'profit'
              : trade.status === 'loss' ? 'loss'
                : trade.status === 'breakeven' ? 'breakeven'
                  : 'secondary'
          }
          className="text-base px-3 py-1"
        >
          {STATUS_LABELS[trade.status] ?? trade.status}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Price info */}
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Entry</p>
              <p className="font-mono font-semibold">{trade.entry_price}</p>
            </div>
            {trade.close_price && (
              <div>
                <p className="text-sm text-muted-foreground">Close</p>
                <p className="font-mono font-semibold">{trade.close_price}</p>
              </div>
            )}
            {trade.stop_loss && (
              <div>
                <p className="text-sm text-muted-foreground">Stoploss</p>
                <p className="font-mono text-loss">{trade.stop_loss}</p>
              </div>
            )}
            {trade.take_profit && (
              <div>
                <p className="text-sm text-muted-foreground">Take Profit</p>
                <p className="font-mono text-profit">{trade.take_profit}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PnL */}
        {trade.pnl_dollars !== null && (
          <Card>
            <CardContent className="flex items-center justify-around p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">PnL</p>
                <p className={cn('text-2xl font-bold', getPnlColor(trade.pnl_dollars!))}>
                  {formatCurrency(trade.pnl_dollars!)}
                </p>
              </div>
              {trade.pnl_pips !== null && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pips</p>
                  <p className={cn('text-2xl font-bold', getPnlColor(trade.pnl_pips!))}>
                    {formatPips(trade.pnl_pips!)}
                  </p>
                </div>
              )}
              {trade.risk_reward_ratio !== null && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">R:R</p>
                  <p className="text-2xl font-bold">
                    {trade.risk_reward_ratio!.toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error tags & Notes */}
        {(trade.error_tags.length > 0 || trade.emotion_notes) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tam ly & Loi sai</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trade.error_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {trade.error_tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-loss border-loss/30">
                      {ERROR_TAGS.find((t) => t.value === tag)?.label ?? tag}
                    </Badge>
                  ))}
                </div>
              )}
              {trade.emotion_notes && (
                <p className="text-sm text-muted-foreground">{trade.emotion_notes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Screenshots */}
        {trade.screenshot_urls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bieu do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {trade.screenshot_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Chart ${i + 1}`}
                    className="rounded-lg border w-full"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {trade.status === 'open' && (
            <Button className="flex-1" onClick={() => setCloseDialogOpen(true)}>
              Dong lenh
            </Button>
          )}
          <Button
            variant="outline"
            className="text-destructive"
            onClick={handleDelete}
          >
            Xoa lenh
          </Button>
        </div>
      </div>

      {/* Close trade dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dong lenh {trade.pair}</DialogTitle>
          </DialogHeader>
          <TradeCloseForm
            onSubmit={handleClose}
            onCancel={() => setCloseDialogOpen(false)}
            isLoading={closeTrade.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
