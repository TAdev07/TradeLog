-- ============================================================
-- TradeLog - Initial Database Schema
-- ============================================================

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trading Rules table
CREATE TABLE trading_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trading_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own rules"
  ON trading_rules FOR ALL USING (auth.uid() = user_id);

-- Daily Journals table
CREATE TABLE daily_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sessions TEXT[],
  session_notes TEXT,
  macro_events TEXT,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  mood_notes TEXT,
  daily_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own journals"
  ON daily_journals FOR ALL USING (auth.uid() = user_id);

-- Trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  journal_id UUID REFERENCES daily_journals(id) ON DELETE SET NULL,

  -- Trade Entry
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  lot_size DECIMAL(10,2) NOT NULL,
  entry_price DECIMAL(20,5) NOT NULL,
  stop_loss DECIMAL(20,5),
  take_profit DECIMAL(20,5),

  -- Trade Close
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'win', 'loss', 'breakeven')),
  close_price DECIMAL(20,5),
  pnl_dollars DECIMAL(15,2),
  pnl_pips DECIMAL(10,1),
  risk_reward_ratio DECIMAL(5,2),

  -- Psychology
  emotion_notes TEXT,
  error_tags TEXT[] DEFAULT '{}',

  -- Screenshots
  screenshot_urls TEXT[] DEFAULT '{}',

  -- Checklist
  checklist_completed BOOLEAN DEFAULT false,

  -- Timestamps
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own trades"
  ON trades FOR ALL USING (auth.uid() = user_id);

-- Checklist Logs table
CREATE TABLE checklist_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES trading_rules(id) ON DELETE CASCADE,
  checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE checklist_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own checklist logs"
  ON checklist_logs FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_opened_at ON trades(opened_at DESC);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_daily_journals_user_date ON daily_journals(user_id, date DESC);
CREATE INDEX idx_trading_rules_user_id ON trading_rules(user_id);

-- Storage bucket for trade screenshots
-- Run this in Supabase Dashboard > Storage:
-- 1. Create bucket 'trade-screenshots' (public)
-- 2. Add policy: authenticated users can upload to their own folder
--    Policy: (bucket_id = 'trade-screenshots') AND (auth.uid()::text = (storage.foldername(name))[1])
