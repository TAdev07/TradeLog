import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Trade } from '@/types/database'
import type { DashboardStats, PnlDataPoint, ErrorTagStat } from '@/types/database'
import { ERROR_TAGS } from '@/lib/constants'
import { startOfWeek, startOfMonth, isAfter } from 'date-fns'

function getDateFilter(period: 'week' | 'month' | 'all'): Date | null {
  if (period === 'week') return startOfWeek(new Date(), { weekStartsOn: 1 })
  if (period === 'month') return startOfMonth(new Date())
  return null
}

function calculateStats(trades: Trade[]): DashboardStats {
  const closedTrades = trades.filter((t) => t.status !== 'open')
  const wins = closedTrades.filter((t) => t.status === 'win')
  const losses = closedTrades.filter((t) => t.status === 'loss')
  const breakevens = closedTrades.filter((t) => t.status === 'breakeven')

  const totalPnlDollars = closedTrades.reduce((sum, t) => sum + (t.pnl_dollars ?? 0), 0)
  const totalPnlPips = closedTrades.reduce((sum, t) => sum + (t.pnl_pips ?? 0), 0)
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0

  const rrs = closedTrades
    .filter((t) => t.risk_reward_ratio !== null)
    .map((t) => t.risk_reward_ratio!)
  const avgRiskReward = rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0

  const pnls = closedTrades.map((t) => t.pnl_dollars ?? 0)
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0

  // Current streak
  let currentStreak = 0
  for (let i = 0; i < closedTrades.length; i++) {
    if (i === 0) {
      currentStreak = closedTrades[0].status === 'win' ? 1 : -1
    } else {
      const isWin = closedTrades[i].status === 'win'
      if ((currentStreak > 0 && isWin) || (currentStreak < 0 && !isWin)) {
        currentStreak += currentStreak > 0 ? 1 : -1
      } else {
        break
      }
    }
  }

  return {
    totalTrades: closedTrades.length,
    winRate,
    avgRiskReward,
    totalPnlDollars,
    totalPnlPips,
    winCount: wins.length,
    lossCount: losses.length,
    breakevenCount: breakevens.length,
    bestTrade,
    worstTrade,
    currentStreak,
  }
}

function calculatePnlData(trades: Trade[]): PnlDataPoint[] {
  const closedTrades = trades
    .filter((t) => t.status !== 'open' && t.closed_at)
    .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime())

  let cumulativeDollars = 0
  let cumulativePips = 0

  return closedTrades.map((t) => {
    cumulativeDollars += t.pnl_dollars ?? 0
    cumulativePips += t.pnl_pips ?? 0
    return {
      date: t.closed_at!,
      pnlDollars: t.pnl_dollars ?? 0,
      pnlPips: t.pnl_pips ?? 0,
      cumulativePnlDollars: cumulativeDollars,
      cumulativePnlPips: cumulativePips,
    }
  })
}

function calculateErrorTagStats(trades: Trade[]): ErrorTagStat[] {
  const tagCounts: Record<string, number> = {}
  let totalTags = 0

  trades.forEach((t) => {
    t.error_tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
      totalTags++
    })
  })

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({
      tag,
      label: ERROR_TAGS.find((t) => t.value === tag)?.label ?? tag,
      count,
      percentage: totalTags > 0 ? (count / totalTags) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export function useDashboardStats(period: 'week' | 'month' | 'all') {
  return useQuery({
    queryKey: ['dashboard-stats', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('opened_at', { ascending: false })

      if (error) throw error

      const trades = (data ?? []) as Trade[]
      const dateFilter = getDateFilter(period)
      const filteredTrades = dateFilter
        ? trades.filter((t) => isAfter(new Date(t.opened_at), dateFilter))
        : trades

      return {
        stats: calculateStats(filteredTrades),
        pnlData: calculatePnlData(filteredTrades),
        errorTagStats: calculateErrorTagStats(filteredTrades),
      }
    },
    staleTime: 60 * 1000,
  })
}
