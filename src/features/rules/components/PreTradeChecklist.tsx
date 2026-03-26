import { CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/useAppStore'
import { useRules } from '../hooks/useRules'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'

interface PreTradeChecklistProps {
  onComplete: () => void
}

export function PreTradeChecklist({ onComplete }: PreTradeChecklistProps) {
  const { data: rules, isLoading } = useRules()
  const { checklistItems, setChecklistItem, isChecklistComplete } = useAppStore()

  if (isLoading) return <LoadingSpinner />

  const activeRules = rules?.filter((r) => r.is_active) ?? []
  const allChecked = isChecklistComplete(activeRules.map((r) => r.id))

  if (activeRules.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Chưa có quy tắc nào. Hãy vào trang Kỷ luật để thêm quy tắc trước.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pre-Trade Checklist</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tick tất cả các quy tắc trước khi mở lệnh giao dịch
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeRules.map((rule) => {
          const isChecked = checklistItems[rule.id] === true
          return (
            <button
              key={rule.id}
              onClick={() => setChecklistItem(rule.id, !isChecked)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                isChecked
                  ? 'border-profit/30 bg-profit/5'
                  : 'border-border hover:bg-accent'
              )}
            >
              {isChecked ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-profit" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{rule.title}</p>
                {rule.description && (
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                )}
              </div>
            </button>
          )
        })}

        <Button
          className="w-full mt-4"
          disabled={!allChecked}
          onClick={onComplete}
        >
          {allChecked ? 'Mở form nhập lệnh' : `Còn ${activeRules.length - Object.values(checklistItems).filter(Boolean).length} quy tắc chưa tick`}
        </Button>
      </CardContent>
    </Card>
  )
}
