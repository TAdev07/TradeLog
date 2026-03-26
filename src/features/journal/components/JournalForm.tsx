import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { journalSchema, type JournalFormData } from '../schemas/journal.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SESSION_LABELS } from '@/lib/constants'
import type { DailyJournal, TradingSession } from '@/types/database'
import { format } from 'date-fns'

interface JournalFormProps {
  journal?: DailyJournal
  onSubmit: (data: JournalFormData) => void
  isLoading?: boolean
}

export function JournalForm({ journal, onSubmit, isLoading }: JournalFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JournalFormData>({
    resolver: zodResolver(journalSchema) as never,
    defaultValues: {
      date: journal?.date ?? format(new Date(), 'yyyy-MM-dd'),
      sessions: journal?.sessions ?? [],
      session_notes: journal?.session_notes ?? '',
      macro_events: journal?.macro_events ?? '',
      mood_score: journal?.mood_score ?? 5,
      mood_notes: journal?.mood_notes ?? '',
      daily_summary: journal?.daily_summary ?? '',
    },
  })

  const sessions = watch('sessions')
  const moodScore = watch('mood_score') ?? 5

  const toggleSession = (session: TradingSession) => {
    const current = sessions ?? []
    if (current.includes(session)) {
      setValue('sessions', current.filter((s) => s !== session))
    } else {
      setValue('sessions', [...current, session])
    }
  }

  const getMoodColor = (score: number) => {
    if (score <= 3) return 'text-loss'
    if (score <= 6) return 'text-breakeven'
    return 'text-profit'
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Ngày</Label>
        <Input id="date" type="date" {...register('date')} />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phiên giao dịch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {(['asian', 'european', 'us'] as const).map((session) => (
              <div key={session} className="flex items-center gap-2">
                <Checkbox
                  id={`session-${session}`}
                  checked={sessions?.includes(session)}
                  onCheckedChange={() => toggleSession(session)}
                />
                <Label htmlFor={`session-${session}`} className="cursor-pointer">
                  {SESSION_LABELS[session]}
                </Label>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="session_notes">Nhận định phiên</Label>
            <Textarea
              id="session_notes"
              rows={3}
              placeholder="Nhận định về diễn biến các phiên hôm nay..."
              {...register('session_notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Macro Events */}
      <div className="space-y-2">
        <Label htmlFor="macro_events">Tin tức vĩ mô</Label>
        <Textarea
          id="macro_events"
          rows={2}
          placeholder="VD: Non-farm, CPI, FOMC, ..."
          {...register('macro_events')}
        />
      </div>

      {/* Mood Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tâm lý giao dịch:{' '}
            <span className={getMoodColor(moodScore)}>{moodScore}/10</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            min={1}
            max={10}
            step={1}
            value={[moodScore]}
            onValueChange={([v]) => setValue('mood_score', v)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Rất tệ</span>
            <span>Bình thường</span>
            <span>Tuyệt vời</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mood_notes">Ghi chú tâm lý</Label>
            <Textarea
              id="mood_notes"
              rows={2}
              placeholder="Tình trạng tâm lý, cảm xúc trong ngày..."
              {...register('mood_notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <div className="space-y-2">
        <Label htmlFor="daily_summary">Tổng kết ngày</Label>
        <Textarea
          id="daily_summary"
          rows={3}
          placeholder="Bài học rút ra, điều cần cải thiện..."
          {...register('daily_summary')}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Đang lưu...' : journal ? 'Cập nhật' : 'Lưu nhật ký'}
      </Button>
    </form>
  )
}
