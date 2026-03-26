import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const TradesPage = lazy(() => import('@/features/trades/pages/TradesPage').then(m => ({ default: m.TradesPage })))
const NewTradePage = lazy(() => import('@/features/trades/pages/NewTradePage').then(m => ({ default: m.NewTradePage })))
const TradeDetailPage = lazy(() => import('@/features/trades/pages/TradeDetailPage').then(m => ({ default: m.TradeDetailPage })))
const JournalPage = lazy(() => import('@/features/journal/pages/JournalPage').then(m => ({ default: m.JournalPage })))
const JournalEntryPage = lazy(() => import('@/features/journal/pages/JournalEntryPage').then(m => ({ default: m.JournalEntryPage })))
const RulesPage = lazy(() => import('@/features/rules/pages/RulesPage').then(m => ({ default: m.RulesPage })))

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner className="mt-20" />}>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LazyPage><LoginPage /></LazyPage>,
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
      { path: 'dashboard', element: <LazyPage><DashboardPage /></LazyPage> },
      { path: 'trades', element: <LazyPage><TradesPage /></LazyPage> },
      { path: 'trades/new', element: <LazyPage><NewTradePage /></LazyPage> },
      { path: 'trades/:id', element: <LazyPage><TradeDetailPage /></LazyPage> },
      { path: 'journal', element: <LazyPage><JournalPage /></LazyPage> },
      { path: 'journal/new', element: <LazyPage><JournalEntryPage /></LazyPage> },
      { path: 'journal/:id', element: <LazyPage><JournalEntryPage /></LazyPage> },
      { path: 'rules', element: <LazyPage><RulesPage /></LazyPage> },
    ],
  },
])
