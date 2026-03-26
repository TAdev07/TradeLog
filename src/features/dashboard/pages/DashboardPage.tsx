import { useAppStore } from '@/stores/useAppStore'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { StatsOverview } from '../components/StatsOverview'
import { PnLChart } from '../components/PnLChart'
import { ErrorTagPieChart } from '../components/ErrorTagPieChart'
import { PeriodFilter } from '../components/PeriodFilter'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function DashboardPage() {
  const dashboardPeriod = useAppStore((s) => s.dashboardPeriod)
  const { data, isLoading } = useDashboardStats(dashboardPeriod)

  if (isLoading) return <LoadingSpinner className="mt-20" />

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Tổng quan hiệu suất giao dịch
          </p>
        </div>
        <PeriodFilter />
      </div>

      <StatsOverview stats={data.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PnLChart data={data.pnlData} />
        </div>
        <div>
          <ErrorTagPieChart data={data.errorTagStats} />
        </div>
      </div>
    </div>
  )
}
