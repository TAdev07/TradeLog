export const TRADING_PAIRS = [
  'XAUUSD',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'AUDUSD',
  'USDCHF',
  'USDCAD',
  'NZDUSD',
  'GBPJPY',
  'EURJPY',
] as const

export const TRADE_DIRECTIONS = ['long', 'short'] as const

export const TRADE_STATUSES = ['open', 'win', 'loss', 'breakeven'] as const

export const TRADING_SESSIONS = ['asian', 'european', 'us'] as const

export const ERROR_TAGS = [
  { value: 'fomo', label: 'FOMO' },
  { value: 'slippage', label: 'Trượt giá / Slippage' },
  { value: 'moved_sl', label: 'Dời SL' },
  { value: 'early_cut', label: 'Cắt lỗ sớm' },
  { value: 'overtrading', label: 'Overtrading' },
  { value: 'revenge_trade', label: 'Revenge Trade' },
  { value: 'no_plan', label: 'Không có kế hoạch' },
  { value: 'wrong_size', label: 'Sai khối lượng' },
  { value: 'late_entry', label: 'Vào lệnh muộn' },
  { value: 'early_tp', label: 'Chốt lời sớm' },
] as const

export const SESSION_LABELS: Record<string, string> = {
  asian: 'Phiên Á',
  european: 'Phiên Âu',
  us: 'Phiên Mỹ',
}

export const STATUS_LABELS: Record<string, string> = {
  open: 'Đang mở',
  win: 'Win',
  loss: 'Loss',
  breakeven: 'Hòa vốn',
}
