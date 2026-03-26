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
    resolver: zodResolver(ruleSchema) as never,
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
        <Label htmlFor="title">Tiêu đề quy tắc</Label>
        <Input
          id="title"
          placeholder="VD: Không giao dịch khi chưa có kế hoạch"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả chi tiết</Label>
        <Textarea
          id="description"
          placeholder="Mô tả chi tiết về quy tắc này..."
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
          Kích hoạt quy tắc
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : rule ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  )
}
