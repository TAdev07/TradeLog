import { Pencil, Trash2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import type { TradingRule } from '@/types/database'

interface RuleListProps {
  rules: TradingRule[]
  onEdit: (rule: TradingRule) => void
  onDelete: (id: string) => void
}

export function RuleList({ rules, onEdit, onDelete }: RuleListProps) {
  if (rules.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="Chưa có quy tắc nào"
        description="Bắt đầu thêm các quy tắc giao dịch để xây dựng kỷ luật trading."
      />
    )
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <Card key={rule.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{rule.title}</h3>
                {rule.is_active ? (
                  <Badge variant="secondary">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
              {rule.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {rule.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Button variant="ghost" size="icon" onClick={() => onEdit(rule)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(rule.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
