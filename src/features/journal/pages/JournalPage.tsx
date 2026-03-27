import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useJournals } from '../hooks/useJournal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SESSION_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function JournalPage() {
  const { data: journals, isLoading } = useJournals()
  const navigate = useNavigate()

  if (isLoading) return <LoadingSpinner className="mt-20" />

  const getMoodColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground'
    if (score <= 3) return 'text-loss'
    if (score <= 6) return 'text-breakeven'
    return 'text-profit'
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Nhật ký ngày</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            Ghi chép nhận định và tâm lý giao dịch hàng ngày
          </p>
        </div>
        <Button size="sm" className="sm:size-default" onClick={() => navigate('/journal/new')}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Thêm nhật ký</span>
        </Button>
      </div>

      {!journals || journals.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có nhật ký nào"
          description="Bắt đầu ghi lại nhật ký giao dịch hàng ngày để theo dõi tâm lý."
          action={
            <Button onClick={() => navigate('/journal/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm nhật ký đầu tiên
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {journals.map((journal) => (
            <Card
              key={journal.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/journal/${journal.id}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">
                    {format(new Date(journal.date), 'dd/MM/yyyy')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {journal.sessions?.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {SESSION_LABELS[s]}
                      </Badge>
                    ))}
                  </div>
                  {journal.daily_summary && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {journal.daily_summary}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {journal.mood_score && (
                    <p className={cn('text-2xl font-bold', getMoodColor(journal.mood_score))}>
                      {journal.mood_score}
                      <span className="text-sm font-normal text-muted-foreground">/10</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
