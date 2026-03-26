// ============================================================
// TradeLog Database Types
// ============================================================

export type TradingPair = typeof import('@/lib/constants').TRADING_PAIRS[number]
export type TradeDirection = 'long' | 'short'
export type TradeStatus = 'open' | 'win' | 'loss' | 'breakeven'
export type TradingSession = 'asian' | 'european' | 'us'
export type ErrorTag = string

// ============================================================
// Database Row Types
// ============================================================

export interface Profile {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export interface TradingRule {
  id: string
  user_id: string
  title: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Trade {
  id: string
  user_id: string
  journal_id: string | null
  pair: string
  direction: TradeDirection
  lot_size: number
  entry_price: number
  stop_loss: number | null
  take_profit: number | null
  status: TradeStatus
  close_price: number | null
  pnl_dollars: number | null
  pnl_pips: number | null
  risk_reward_ratio: number | null
  emotion_notes: string | null
  error_tags: string[]
  screenshot_urls: string[]
  checklist_completed: boolean
  opened_at: string
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface DailyJournal {
  id: string
  user_id: string
  date: string
  sessions: TradingSession[]
  session_notes: string | null
  macro_events: string | null
  mood_score: number | null
  mood_notes: string | null
  daily_summary: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistLog {
  id: string
  user_id: string
  trade_id: string
  rule_id: string
  checked: boolean
  checked_at: string
}

// ============================================================
// Insert/Update Types
// ============================================================

export type TradingRuleInsert = Omit<TradingRule, 'id' | 'created_at' | 'updated_at'>
export type TradingRuleUpdate = Partial<Omit<TradingRule, 'id' | 'user_id' | 'created_at'>>

export type TradeInsert = Omit<Trade, 'id' | 'created_at' | 'updated_at'>
export type TradeUpdate = Partial<Omit<Trade, 'id' | 'user_id' | 'created_at'>>

export type DailyJournalInsert = Omit<DailyJournal, 'id' | 'created_at' | 'updated_at'>
export type DailyJournalUpdate = Partial<Omit<DailyJournal, 'id' | 'user_id' | 'created_at'>>

// ============================================================
// Supabase Database Type (for typed client)
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      trading_rules: {
        Row: TradingRule
        Insert: TradingRuleInsert
        Update: TradingRuleUpdate
      }
      trades: {
        Row: Trade
        Insert: TradeInsert
        Update: TradeUpdate
      }
      daily_journals: {
        Row: DailyJournal
        Insert: DailyJournalInsert
        Update: DailyJournalUpdate
      }
      checklist_logs: {
        Row: ChecklistLog
        Insert: Omit<ChecklistLog, 'id' | 'checked_at'>
        Update: Partial<Omit<ChecklistLog, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ============================================================
// Dashboard Stats Types
// ============================================================

export interface DashboardStats {
  totalTrades: number
  winRate: number
  avgRiskReward: number
  totalPnlDollars: number
  totalPnlPips: number
  winCount: number
  lossCount: number
  breakevenCount: number
  bestTrade: number
  worstTrade: number
  currentStreak: number
}

export interface PnlDataPoint {
  date: string
  pnlDollars: number
  pnlPips: number
  cumulativePnlDollars: number
  cumulativePnlPips: number
}

export interface ErrorTagStat {
  tag: string
  label: string
  count: number
  percentage: number
}
