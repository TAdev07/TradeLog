import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DailyJournal } from '@/types/database'
import type { JournalFormData } from '../schemas/journal.schema'

const JOURNAL_KEY = ['daily-journals']

export function useJournals() {
  return useQuery({
    queryKey: JOURNAL_KEY,
    queryFn: async (): Promise<DailyJournal[]> => {
      const { data, error } = await supabase
        .from('daily_journals')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useJournal(id: string) {
  return useQuery({
    queryKey: [...JOURNAL_KEY, id],
    queryFn: async (): Promise<DailyJournal> => {
      const { data, error } = await supabase
        .from('daily_journals')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateJournal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: JournalFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: journal, error } = await supabase
        .from('daily_journals')
        .insert({
          user_id: user.id,
          date: data.date,
          sessions: data.sessions,
          session_notes: data.session_notes ?? null,
          macro_events: data.macro_events ?? null,
          mood_score: data.mood_score ?? null,
          mood_notes: data.mood_notes ?? null,
          daily_summary: data.daily_summary ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return journal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEY })
    },
  })
}

export function useUpdateJournal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: JournalFormData }) => {
      const { data: journal, error } = await supabase
        .from('daily_journals')
        .update({
          date: data.date,
          sessions: data.sessions,
          session_notes: data.session_notes ?? null,
          macro_events: data.macro_events ?? null,
          mood_score: data.mood_score ?? null,
          mood_notes: data.mood_notes ?? null,
          daily_summary: data.daily_summary ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return journal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEY })
    },
  })
}
