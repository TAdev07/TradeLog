import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const authSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
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
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
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
          {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Đăng nhập vào TradeLog để bắt đầu ghi nhật ký giao dịch'
            : 'Tạo tài khoản mới để bắt đầu sử dụng TradeLog'}
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
            <Label htmlFor="password">Mật khẩu</Label>
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
              ? 'Đang xử lý...'
              : mode === 'login'
                ? 'Đăng nhập'
                : 'Đăng ký'}
          </Button>

          <div className="text-center text-sm">
            {mode === 'login' ? (
              <p>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Đăng ký
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Đăng nhập
                </button>
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
