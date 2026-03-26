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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nhat ky ngay</h1>
          <p className="text-sm text-muted-foreground">
            Ghi chep nhan dinh va tam ly giao dich hang ngay
          </p>
        </div>
        <Button onClick={() => navigate('/journal/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Them nhat ky
        </Button>
      </div>

      {!journals || journals.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chua co nhat ky nao"
          description="Bat dau ghi lai nhat ky giao dich hang ngay de theo doi tam ly."
          action={
            <Button onClick={() => navigate('/journal/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Them nhat ky dau tien
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
