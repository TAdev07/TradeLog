import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Providers } from './providers'
import { router } from './routes'

export function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
        <Toaster
        position="top-right"
        richColors
        theme="dark"
        toastOptions={{
          duration: 3000,
        }}
      />
      </Providers>
    </ErrorBoundary>
  )
}
