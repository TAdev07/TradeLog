import { useAppStore } from '@/stores/useAppStore'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { StatsOverview } from '../components/StatsOverview'
import { PnLChart } from '../components/PnLChart'
import { ErrorTagPieChart } from '../components/ErrorTagPieChart'
import { PeriodFilter } from '../components/PeriodFilter'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

export function DashboardPage() {
  const dashboardPeriod = useAppStore((s) => s.dashboardPeriod)
  const { data, isLoading } = useDashboardStats(dashboardPeriod)

  if (isLoading) return <LoadingSpinner className="mt-20" />

  if (!data) return null

  const { stats } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tổng quan hiệu suất giao dịch của bạn
          </p>
        </div>
        <PeriodFilter />
      </div>

      {/* Stats Cards */}
      <StatsOverview stats={stats} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PnLChart data={data.pnlData} />
        </div>
        <div className="space-y-6">
          <ErrorTagPieChart data={data.errorTagStats} />

          {/* Quick summary card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lệnh tốt nhất</span>
                <span className={cn('text-sm font-semibold', stats.bestTrade >= 0 ? 'text-profit' : 'text-loss')}>
                  {formatCurrency(stats.bestTrade)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lệnh tệ nhất</span>
                <span className={cn('text-sm font-semibold', stats.worstTrade >= 0 ? 'text-profit' : 'text-loss')}>
                  {formatCurrency(stats.worstTrade)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trung bình mỗi lệnh</span>
                <span className={cn('text-sm font-semibold',
                  stats.totalTrades > 0
                    ? (stats.totalPnlDollars / stats.totalTrades) >= 0 ? 'text-profit' : 'text-loss'
                    : 'text-muted-foreground'
                )}>
                  {stats.totalTrades > 0
                    ? formatCurrency(stats.totalPnlDollars / stats.totalTrades)
                    : '$0.00'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
