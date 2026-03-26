import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const authSchema = z.object({
  email: z.string().email('Email khong hop le'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
})

type AuthFormData = z.infer<typeof authSchema>

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit: (email: string, password: string) => Promise<void>
  onToggleMode: () => void
}

export function AuthForm({ mode, onSubmit, onToggleMode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema) as never,
  })

  const handleFormSubmit = async (data: AuthFormData) => {
    try {
      setError(null)
      await onSubmit(data.email, data.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Da co loi xay ra')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            TL
          </div>
        </div>
        <CardTitle className="text-2xl">
          {mode === 'login' ? 'Dang nhap' : 'Dang ky'}
        </CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Dang nhap vao TradeLog de bat dau ghi nhat ky giao dich'
            : 'Tao tai khoan moi de bat dau su dung TradeLog'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mat khau</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? 'Dang xu ly...'
              : mode === 'login'
                ? 'Dang nhap'
                : 'Dang ky'}
          </Button>

          <div className="text-center text-sm">
            {mode === 'login' ? (
              <p>
                Chua co tai khoan?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Dang ky
                </button>
              </p>
            ) : (
              <p>
                Da co tai khoan?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Dang nhap
                </button>
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
