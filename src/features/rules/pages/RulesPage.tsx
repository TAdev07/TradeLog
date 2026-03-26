import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RuleList } from '../components/RuleList'
import { RuleForm } from '../components/RuleForm'
import { useRules, useCreateRule, useUpdateRule, useDeleteRule } from '../hooks/useRules'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { TradingRule } from '@/types/database'
import type { RuleFormData } from '../schemas/rule.schema'

export function RulesPage() {
  const { data: rules, isLoading } = useRules()
  const createRule = useCreateRule()
  const updateRule = useUpdateRule()
  const deleteRule = useDeleteRule()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<TradingRule | undefined>()
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingRule(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (rule: TradingRule) => {
    setEditingRule(rule)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: RuleFormData) => {
    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, data })
    } else {
      await createRule.mutateAsync(data)
    }
    setDialogOpen(false)
  }

  const handleDeleteConfirm = async () => {
    if (deletingRuleId) {
      await deleteRule.mutateAsync(deletingRuleId)
      setDeletingRuleId(null)
    }
  }

  if (isLoading) return <LoadingSpinner className="mt-20" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kỷ luật giao dịch</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các quy tắc và checklist trước khi vào lệnh
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm quy tắc
        </Button>
      </div>

      <RuleList
        rules={rules ?? []}
        onEdit={handleEdit}
        onDelete={(id) => setDeletingRuleId(id)}
      />

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Sửa quy tắc' : 'Thêm quy tắc mới'}
            </DialogTitle>
          </DialogHeader>
          <RuleForm
            rule={editingRule}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isLoading={createRule.isPending || updateRule.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deletingRuleId} onOpenChange={() => setDeletingRuleId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xoá quy tắc</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xoá quy tắc này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingRuleId(null)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteRule.isPending}>
              {deleteRule.isPending ? 'Đang xoá...' : 'Xoá quy tắc'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
