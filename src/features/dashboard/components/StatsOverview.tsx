import { TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency, formatPips, formatPercentage } from '@/lib/utils'
import type { DashboardStats } from '@/types/database'

interface StatsOverviewProps {
  stats: DashboardStats
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    {
      title: 'Tong PnL',
      value: formatCurrency(stats.totalPnlDollars),
      subtitle: formatPips(stats.totalPnlPips),
      icon: stats.totalPnlDollars >= 0 ? TrendingUp : TrendingDown,
      color: stats.totalPnlDollars >= 0 ? 'text-profit' : 'text-loss',
    },
    {
      title: 'Win Rate',
      value: formatPercentage(stats.winRate),
      subtitle: `${stats.winCount}W / ${stats.lossCount}L / ${stats.breakevenCount}BE`,
      icon: Target,
      color: stats.winRate >= 50 ? 'text-profit' : 'text-loss',
    },
    {
      title: 'R:R Trung binh',
      value: stats.avgRiskReward.toFixed(2),
      subtitle: `Best: ${formatCurrency(stats.bestTrade)}`,
      icon: BarChart3,
      color: 'text-foreground',
    },
    {
      title: 'Tong lenh',
      value: stats.totalTrades.toString(),
      subtitle: `Streak: ${stats.currentStreak > 0 ? '+' : ''}${stats.currentStreak}`,
      icon: BarChart3,
      color: 'text-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {card.title}
              </p>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
            <p className={cn('text-2xl font-bold', card.color)}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
