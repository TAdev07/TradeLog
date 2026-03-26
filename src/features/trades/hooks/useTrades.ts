import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Trade } from '@/types/database'
import type { TradeEntryFormData, TradeCloseFormData } from '../schemas/trade.schema'

const TRADES_KEY = ['trades']

export function useTrades() {
  return useQuery({
    queryKey: TRADES_KEY,
    queryFn: async (): Promise<Trade[]> => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('opened_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTrade(id: string) {
  return useQuery({
    queryKey: [...TRADES_KEY, id],
    queryFn: async (): Promise<Trade> => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateTrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TradeEntryFormData & { screenshot_urls?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: trade, error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          pair: data.pair,
          direction: data.direction,
          lot_size: data.lot_size,
          entry_price: data.entry_price,
          stop_loss: data.stop_loss ?? null,
          take_profit: data.take_profit ?? null,
          status: 'open',
          screenshot_urls: data.screenshot_urls ?? [],
          error_tags: [],
          checklist_completed: true,
          journal_id: null,
          close_price: null,
          pnl_dollars: null,
          pnl_pips: null,
          risk_reward_ratio: null,
          emotion_notes: null,
          opened_at: new Date().toISOString(),
          closed_at: null,
        })
        .select()
        .single()

      if (error) throw error
      return trade
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRADES_KEY })
    },
  })
}

export function useCloseTrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TradeCloseFormData }) => {
      const rr = data.pnl_dollars !== 0 ? Math.abs(data.pnl_dollars / (data.pnl_dollars < 0 ? data.pnl_dollars : 1)) : null

      const { data: trade, error } = await supabase
        .from('trades')
        .update({
          status: data.status,
          close_price: data.close_price,
          pnl_dollars: data.pnl_dollars,
          pnl_pips: data.pnl_pips,
          emotion_notes: data.emotion_notes ?? null,
          error_tags: data.error_tags,
          risk_reward_ratio: rr,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return trade
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRADES_KEY })
    },
  })
}

export function useDeleteTrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trades').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRADES_KEY })
    },
  })
}
