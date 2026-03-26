import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ruleSchema, type RuleFormData } from '../schemas/rule.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import type { TradingRule } from '@/types/database'

interface RuleFormProps {
  rule?: TradingRule
  onSubmit: (data: RuleFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function RuleForm({ rule, onSubmit, onCancel, isLoading }: RuleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      title: rule?.title ?? '',
      description: rule?.description ?? '',
      is_active: rule?.is_active ?? true,
    },
  })

  const isActive = watch('is_active')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tieu de quy tac</Label>
        <Input
          id="title"
          placeholder="VD: Khong giao dich khi chua co ke hoach"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mo ta chi tiet</Label>
        <Textarea
          id="description"
          placeholder="Mo ta chi tiet ve quy tac nay..."
          rows={3}
          {...register('description')}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue('is_active', checked === true)}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Kich hoat quy tac
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Huy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Dang luu...' : rule ? 'Cap nhat' : 'Them moi'}
        </Button>
      </div>
    </form>
  )
}
