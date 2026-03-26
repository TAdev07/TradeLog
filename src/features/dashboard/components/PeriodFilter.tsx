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
        <TabsTrigger value="week">Tuan nay</TabsTrigger>
        <TabsTrigger value="month">Thang nay</TabsTrigger>
        <TabsTrigger value="all">Tat ca</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
