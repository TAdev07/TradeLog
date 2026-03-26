import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { TRADING_PAIRS, TRADE_STATUSES, STATUS_LABELS } from '@/lib/constants'

export interface TradeFilterValues {
  pair: string
  status: string
  search: string
}

interface TradeFiltersProps {
  filters: TradeFilterValues
  onChange: (filters: TradeFilterValues) => void
}

export function TradeFilters({ filters, onChange }: TradeFiltersProps) {
  const hasFilters = filters.pair !== 'all' || filters.status !== 'all' || filters.search !== ''

  const clearFilters = () => {
    onChange({ pair: 'all', status: 'all', search: '' })
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm ghi chú..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.pair}
        onValueChange={(v) => onChange({ ...filters, pair: v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Cặp tiền" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả cặp</SelectItem>
          {TRADING_PAIRS.map((pair) => (
            <SelectItem key={pair} value={pair}>{pair}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          {TRADE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Xoá bộ lọc
        </Button>
      )}
    </div>
  )
}
