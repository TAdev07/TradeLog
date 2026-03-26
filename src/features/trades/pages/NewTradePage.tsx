import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PreTradeChecklist } from '@/features/rules/components/PreTradeChecklist'
import { TradeForm } from '../components/TradeForm'
import { ScreenshotUpload } from '../components/ScreenshotUpload'
import { useCreateTrade } from '../hooks/useTrades'
import { useAppStore } from '@/stores/useAppStore'
import type { TradeEntryFormData } from '../schemas/trade.schema'

export function NewTradePage() {
  const [checklistDone, setChecklistDone] = useState(false)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const createTrade = useCreateTrade()
  const navigate = useNavigate()
  const resetChecklist = useAppStore((s) => s.resetChecklist)

  const handleSubmit = async (data: TradeEntryFormData) => {
    await createTrade.mutateAsync({
      ...data,
      screenshot_urls: screenshots,
    })
    resetChecklist()
    navigate('/trades')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Thêm lệnh mới</h1>

      {!checklistDone ? (
        <PreTradeChecklist onComplete={() => setChecklistDone(true)} />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin lệnh</CardTitle>
            </CardHeader>
            <CardContent>
              <TradeForm
                onSubmit={handleSubmit}
                isLoading={createTrade.isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ảnh chụp biểu đồ</CardTitle>
            </CardHeader>
            <CardContent>
              <ScreenshotUpload
                urls={screenshots}
                onChange={setScreenshots}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
