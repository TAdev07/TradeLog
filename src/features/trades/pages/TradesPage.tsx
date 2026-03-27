import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LineChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TradeCard } from '../components/TradeCard'
import { TradeFilters, type TradeFilterValues } from '../components/TradeFilters'
import { useTrades } from '../hooks/useTrades'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'

const PAGE_SIZE = 20

export function TradesPage() {
  const { data: trades, isLoading } = useTrades()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<TradeFilterValues>({
    pair: 'all',
    status: 'all',
    search: '',
  })
  const [page, setPage] = useState(1)

  const filteredTrades = useMemo(() => {
    if (!trades) return []
    return trades.filter((trade) => {
      if (filters.pair !== 'all' && trade.pair !== filters.pair) return false
      if (filters.status !== 'all' && trade.status !== filters.status) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const inNotes = trade.emotion_notes?.toLowerCase().includes(q)
        const inTags = trade.error_tags.some((t) => t.toLowerCase().includes(q))
        const inPair = trade.pair.toLowerCase().includes(q)
        if (!inNotes && !inTags && !inPair) return false
      }
      return true
    })
  }, [trades, filters])

  const totalPages = Math.ceil(filteredTrades.length / PAGE_SIZE)
  const paginatedTrades = filteredTrades.slice(0, page * PAGE_SIZE)
  const hasMore = page < totalPages

  // Reset page when filters change
  const handleFilterChange = (newFilters: TradeFilterValues) => {
    setFilters(newFilters)
    setPage(1)
  }

  if (isLoading) return <LoadingSpinner className="mt-20" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Nhật ký lệnh</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            Ghi chép và theo dõi tất cả giao dịch của bạn
          </p>
        </div>
        <Button size="sm" className="sm:size-default" onClick={() => navigate('/trades/new')}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Thêm lệnh</span>
        </Button>
      </div>

      {trades && trades.length > 0 && (
        <div className="mb-4">
          <TradeFilters filters={filters} onChange={handleFilterChange} />
        </div>
      )}

      {!trades || trades.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="Chưa có lệnh nào"
          description="Bắt đầu ghi lại các giao dịch của bạn để theo dõi hiệu suất."
          action={
            <Button onClick={() => navigate('/trades/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm lệnh đầu tiên
            </Button>
          }
        />
      ) : filteredTrades.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="Không tìm thấy lệnh nào"
          description="Thử thay đổi bộ lọc để xem kết quả khác."
        />
      ) : (
        <div className="space-y-3">
          {paginatedTrades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              onClick={() => navigate(`/trades/${trade.id}`)}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
              >
                Xem thêm ({filteredTrades.length - paginatedTrades.length} lệnh còn lại)
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground pt-2">
            Hiển thị {paginatedTrades.length} / {filteredTrades.length} lệnh
          </p>
        </div>
      )}
    </div>
  )
}
