import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { TradesPage } from '@/features/trades/pages/TradesPage'
import { NewTradePage } from '@/features/trades/pages/NewTradePage'
import { TradeDetailPage } from '@/features/trades/pages/TradeDetailPage'
import { JournalPage } from '@/features/journal/pages/JournalPage'
import { JournalEntryPage } from '@/features/journal/pages/JournalEntryPage'
import { RulesPage } from '@/features/rules/pages/RulesPage'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'trades', element: <TradesPage /> },
      { path: 'trades/new', element: <NewTradePage /> },
      { path: 'trades/:id', element: <TradeDetailPage /> },
      { path: 'journal', element: <JournalPage /> },
      { path: 'journal/new', element: <JournalEntryPage /> },
      { path: 'journal/:id', element: <JournalEntryPage /> },
      { path: 'rules', element: <RulesPage /> },
    ],
  },
])
