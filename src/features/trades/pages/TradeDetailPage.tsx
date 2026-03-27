import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Trash2, Pencil } from 'lucide-react'
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
import { useTrade, useCloseTrade, useUpdateClosedTrade, useDeleteTrade } from '../hooks/useTrades'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn, formatCurrency, formatPips, getPnlColor } from '@/lib/utils'
import { STATUS_LABELS, ERROR_TAGS } from '@/lib/constants'
import type { TradeCloseFormData } from '../schemas/trade.schema'

export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: trade, isLoading } = useTrade(id!)
  const closeTrade = useCloseTrade()
  const updateClosedTrade = useUpdateClosedTrade()
  const deleteTrade = useDeleteTrade()
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (isLoading || !trade) return <LoadingSpinner className="mt-20" />

  const handleClose = async (data: TradeCloseFormData) => {
    await closeTrade.mutateAsync({ id: trade.id, data, trade })
    setCloseDialogOpen(false)
  }

  const handleEdit = async (data: TradeCloseFormData) => {
    await updateClosedTrade.mutateAsync({ id: trade.id, data, trade })
    setEditDialogOpen(false)
  }

  const handleDelete = async () => {
    await deleteTrade.mutateAsync(trade.id)
    setDeleteDialogOpen(false)
    navigate('/trades')
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/trades')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                'flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0',
                trade.direction === 'long' ? 'bg-profit/10' : 'bg-loss/10'
              )}
            >
              {trade.direction === 'long' ? (
                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-profit" />
              ) : (
                <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-loss" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold">{trade.pair}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
          className="text-sm sm:text-base px-2 sm:px-3 py-1 shrink-0"
        >
          {STATUS_LABELS[trade.status] ?? trade.status}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Price info */}
        <Card>
          <CardContent className="grid grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6">
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
            <CardContent className="flex items-center justify-around p-4 sm:p-6">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">PnL</p>
                <p className={cn('text-lg sm:text-2xl font-bold', getPnlColor(trade.pnl_dollars!))}>
                  {formatCurrency(trade.pnl_dollars!)}
                </p>
              </div>
              {trade.pnl_pips !== null && (
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Pips</p>
                  <p className={cn('text-lg sm:text-2xl font-bold', getPnlColor(trade.pnl_pips!))}>
                    {formatPips(trade.pnl_pips!)}
                  </p>
                </div>
              )}
              {trade.risk_reward_ratio !== null && (
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">R:R</p>
                  <p className="text-lg sm:text-2xl font-bold">
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
              <CardTitle className="text-base">Tâm lý & Lỗi sai</CardTitle>
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
              <CardTitle className="text-base">Biểu đồ</CardTitle>
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
              Đóng lệnh
            </Button>
          )}
          {trade.status !== 'open' && (
            <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xoá lệnh
          </Button>
        </div>
      </div>

      {/* Close trade dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đóng lệnh {trade.pair}</DialogTitle>
          </DialogHeader>
          <TradeCloseForm
            trade={trade}
            onSubmit={handleClose}
            onCancel={() => setCloseDialogOpen(false)}
            isLoading={closeTrade.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit closed trade dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lệnh {trade.pair}</DialogTitle>
          </DialogHeader>
          <TradeCloseForm
            trade={trade}
            onSubmit={handleEdit}
            onCancel={() => setEditDialogOpen(false)}
            isLoading={updateClosedTrade.isPending}
            isEditing
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xoá lệnh</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xoá lệnh <strong>{trade.pair}</strong>? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTrade.isPending}>
              {deleteTrade.isPending ? 'Đang xoá...' : 'Xoá lệnh'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
