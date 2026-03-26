import { useNavigate } from 'react-router-dom'
import { Plus, LineChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TradeCard } from '../components/TradeCard'
import { useTrades } from '../hooks/useTrades'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'

export function TradesPage() {
  const { data: trades, isLoading } = useTrades()
  const navigate = useNavigate()

  if (isLoading) return <LoadingSpinner className="mt-20" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nhat ky lenh</h1>
          <p className="text-sm text-muted-foreground">
            Ghi chep va theo doi tat ca giao dich cua ban
          </p>
        </div>
        <Button onClick={() => navigate('/trades/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Them lenh
        </Button>
      </div>

      {!trades || trades.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="Chua co lenh nao"
          description="Bat dau ghi lai cac giao dich cua ban de theo doi hieu suat."
          action={
            <Button onClick={() => navigate('/trades/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Them lenh dau tien
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              onClick={() => navigate(`/trades/${trade.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
