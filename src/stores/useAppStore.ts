import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Theme
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void

  // Dashboard filter
  dashboardPeriod: 'week' | 'month' | 'all'
  setDashboardPeriod: (period: 'week' | 'month' | 'all') => void

  // Pre-trade checklist (ephemeral - not persisted)
  checklistItems: Record<string, boolean>
  setChecklistItem: (ruleId: string, checked: boolean) => void
  resetChecklist: () => void
  isChecklistComplete: (ruleIds: string[]) => boolean
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Theme
      theme: 'dark',
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },

      // Dashboard filter
      dashboardPeriod: 'month',
      setDashboardPeriod: (period) => set({ dashboardPeriod: period }),

      // Pre-trade checklist
      checklistItems: {},
      setChecklistItem: (ruleId, checked) =>
        set((state) => ({
          checklistItems: { ...state.checklistItems, [ruleId]: checked },
        })),
      resetChecklist: () => set({ checklistItems: {} }),
      isChecklistComplete: (ruleIds) => {
        const items = get().checklistItems
        return ruleIds.every((id) => items[id] === true)
      },
    }),
    {
      name: 'tradelog-app-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        dashboardPeriod: state.dashboardPeriod,
      }),
    }
  )
)
