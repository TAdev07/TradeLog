import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/useAppStore'

export function PeriodFilter() {
  const { dashboardPeriod, setDashboardPeriod } = useAppStore()

  return (
    <Tabs
      value={dashboardPeriod}
      onValueChange={(v) => setDashboardPeriod(v as 'week' | 'month' | 'all')}
    >
      <TabsList>
        <TabsTrigger value="week">Tuần này</TabsTrigger>
        <TabsTrigger value="month">Tháng này</TabsTrigger>
        <TabsTrigger value="all">Tất cả</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
