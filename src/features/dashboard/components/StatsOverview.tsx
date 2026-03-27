import { TrendingUp, TrendingDown, Target, BarChart3, Trophy, Flame } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency, formatPips, formatPercentage } from '@/lib/utils'
import type { DashboardStats } from '@/types/database'

interface StatsOverviewProps {
  stats: DashboardStats
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {/* Tổng PnL */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Tổng PnL</p>
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              stats.totalPnlDollars >= 0 ? 'bg-profit/10' : 'bg-loss/10'
            )}>
              {stats.totalPnlDollars >= 0
                ? <TrendingUp className="h-4 w-4 text-profit" />
                : <TrendingDown className="h-4 w-4 text-loss" />}
            </div>
          </div>
          <p className={cn('text-lg sm:text-2xl font-bold', stats.totalPnlDollars >= 0 ? 'text-profit' : 'text-loss')}>
            {formatCurrency(stats.totalPnlDollars)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{formatPips(stats.totalPnlPips)}</p>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Tỷ lệ thắng</p>
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              stats.winRate >= 50 ? 'bg-profit/10' : 'bg-loss/10'
            )}>
              <Target className={cn('h-4 w-4', stats.winRate >= 50 ? 'text-profit' : 'text-loss')} />
            </div>
          </div>
          <p className={cn('text-lg sm:text-2xl font-bold', stats.winRate >= 50 ? 'text-profit' : 'text-loss')}>
            {formatPercentage(stats.winRate)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-profit font-medium">{stats.winCount}W</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-loss font-medium">{stats.lossCount}L</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-breakeven font-medium">{stats.breakevenCount}BE</span>
          </div>
          {/* Win rate bar */}
          {stats.totalTrades > 0 && (
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden flex">
              <div className="bg-profit h-full" style={{ width: `${(stats.winCount / stats.totalTrades) * 100}%` }} />
              <div className="bg-breakeven h-full" style={{ width: `${(stats.breakevenCount / stats.totalTrades) * 100}%` }} />
              <div className="bg-loss h-full" style={{ width: `${(stats.lossCount / stats.totalTrades) * 100}%` }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* R:R Trung bình */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">R:R Trung bình</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{stats.avgRiskReward.toFixed(2)}</p>
          <div className="mt-1">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-profit shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                Best: <span className="text-profit font-medium">{formatCurrency(stats.bestTrade)}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tổng lệnh & Streak */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Tổng lệnh</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Flame className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{stats.totalTrades}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground">Chuỗi hiện tại:</span>
            <span className={cn(
              'text-xs font-bold',
              stats.currentStreak > 0 ? 'text-profit' : stats.currentStreak < 0 ? 'text-loss' : 'text-muted-foreground'
            )}>
              {stats.currentStreak > 0 ? `+${stats.currentStreak} Win` : stats.currentStreak < 0 ? `${stats.currentStreak} Loss` : '0'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
