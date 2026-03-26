import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JournalForm } from '../components/JournalForm'
import { useJournal, useCreateJournal, useUpdateJournal } from '../hooks/useJournal'
import { useTrades } from '@/features/trades/hooks/useTrades'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn, formatCurrency, getPnlColor } from '@/lib/utils'
import { STATUS_LABELS } from '@/lib/constants'
import type { JournalFormData } from '../schemas/journal.schema'

export function JournalEntryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: journal, isLoading } = useJournal(id ?? '')
  const createJournal = useCreateJournal()
  const updateJournal = useUpdateJournal()
  const { data: allTrades } = useTrades()

  const isEditing = !!id

  // Trades of the day (matching journal date)
  const dayTrades = useMemo(() => {
    if (!allTrades || !journal?.date) return []
    return allTrades.filter((t) => {
      const tradeDate = format(new Date(t.opened_at), 'yyyy-MM-dd')
      return tradeDate === journal.date
    })
  }, [allTrades, journal?.date])

  if (isEditing && isLoading) return <LoadingSpinner className="mt-20" />

  const handleSubmit = async (data: JournalFormData) => {
    if (isEditing && id) {
      await updateJournal.mutateAsync({ id, data })
    } else {
      await createJournal.mutateAsync(data)
    }
    navigate('/journal')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/journal')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Sửa nhật ký' : 'Thêm nhật ký mới'}
        </h1>
      </div>

      <JournalForm
        journal={journal}
        onSubmit={handleSubmit}
        isLoading={createJournal.isPending || updateJournal.isPending}
      />

      {/* Trades of the day */}
      {isEditing && dayTrades.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">
              Lệnh trong ngày ({dayTrades.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dayTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/trades/${trade.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{trade.pair}</span>
                  <Badge variant={
                    trade.status === 'win' ? 'profit'
                      : trade.status === 'loss' ? 'loss'
                        : trade.status === 'breakeven' ? 'breakeven'
                          : 'secondary'
                  }>
                    {STATUS_LABELS[trade.status] ?? trade.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {trade.direction === 'long' ? 'Long' : 'Short'} · {trade.lot_size} lot
                  </span>
                </div>
                {trade.pnl_dollars !== null && (
                  <span className={cn('font-medium', getPnlColor(trade.pnl_dollars))}>
                    {formatCurrency(trade.pnl_dollars)}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
