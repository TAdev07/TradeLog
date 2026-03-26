import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatPips(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)} pips`
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function getPnlColor(value: number): string {
  if (value > 0) return 'text-profit'
  if (value < 0) return 'text-loss'
  return 'text-breakeven'
}

export function getPipMultiplier(pair: string): number {
  if (pair === 'XAUUSD') return 10 // 1 pip = 0.1
  if (pair.includes('JPY')) return 100 // 1 pip = 0.01
  return 10000 // 1 pip = 0.0001
}

export function calculatePips(pair: string, price1: number, price2: number): number {
  const multiplier = getPipMultiplier(pair)
  return Math.round((price2 - price1) * multiplier * 10) / 10
}

export function calculateRiskReward(
  entryPrice: number,
  closePrice: number,
  stopLoss: number | null,
  direction: 'long' | 'short'
): number | null {
  if (!stopLoss) return null
  const risk = Math.abs(entryPrice - stopLoss)
  if (risk === 0) return null
  const reward = direction === 'long'
    ? closePrice - entryPrice
    : entryPrice - closePrice
  return Math.round((reward / risk) * 100) / 100
}
