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

  const handleDelete = async (id: string) => {
    if (window.confirm('Ban co chac muon xoa quy tac nay?')) {
      await deleteRule.mutateAsync(id)
    }
  }

  if (isLoading) return <LoadingSpinner className="mt-20" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ky luat giao dich</h1>
          <p className="text-sm text-muted-foreground">
            Quan ly cac quy tac va checklist truoc khi vao lenh
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Them quy tac
        </Button>
      </div>

      <RuleList
        rules={rules ?? []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Sua quy tac' : 'Them quy tac moi'}
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
    </div>
  )
}
