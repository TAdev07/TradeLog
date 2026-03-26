import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (email: string, password: string) => {
    if (mode === 'login') {
      await signIn(email, password)
    } else {
      await signUp(email, password)
    }
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthForm
        mode={mode}
        onSubmit={handleSubmit}
        onToggleMode={() => setMode(mode === 'login' ? 'register' : 'login')}
      />
    </div>
  )
}
