import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TradingRule } from '@/types/database'
import type { RuleFormData } from '../schemas/rule.schema'

const RULES_KEY = ['trading-rules']

export function useRules() {
  return useQuery({
    queryKey: RULES_KEY,
    queryFn: async (): Promise<TradingRule[]> => {
      const { data, error } = await supabase
        .from('trading_rules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RuleFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: rule, error } = await supabase
        .from('trading_rules')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description ?? null,
          is_active: data.is_active,
          sort_order: 0,
        })
        .select()
        .single()

      if (error) throw error
      return rule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_KEY })
    },
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RuleFormData }) => {
      const { data: rule, error } = await supabase
        .from('trading_rules')
        .update({
          title: data.title,
          description: data.description ?? null,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return rule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_KEY })
    },
  })
}

export function useDeleteRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trading_rules').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_KEY })
    },
  })
}
