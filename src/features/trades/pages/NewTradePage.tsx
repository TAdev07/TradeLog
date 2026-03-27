import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PreTradeChecklist } from '@/features/rules/components/PreTradeChecklist'
import { TradeForm } from '../components/TradeForm'
import { ScreenshotUpload, type LocalScreenshot } from '../components/ScreenshotUpload'
import { useCreateTrade } from '../hooks/useTrades'
import { useScreenshot } from '../hooks/useScreenshot'
import { useAppStore } from '@/stores/useAppStore'
import type { TradeEntryFormData } from '../schemas/trade.schema'

export function NewTradePage() {
  const [checklistDone, setChecklistDone] = useState(false)
  const [screenshots, setScreenshots] = useState<LocalScreenshot[]>([])
  const createTrade = useCreateTrade()
  const { uploadMultiple, uploading } = useScreenshot()
  const navigate = useNavigate()
  const resetChecklist = useAppStore((s) => s.resetChecklist)

  const handleSubmit = async (data: TradeEntryFormData) => {
    // Upload all screenshots to server on save
    let screenshotUrls: string[] = []
    if (screenshots.length > 0) {
      screenshotUrls = await uploadMultiple(screenshots.map((s) => s.blob))
    }

    await createTrade.mutateAsync({
      ...data,
      screenshot_urls: screenshotUrls,
    })
    resetChecklist()
    navigate('/trades')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Thêm lệnh mới</h1>

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
                isLoading={createTrade.isPending || uploading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ảnh chụp biểu đồ</CardTitle>
            </CardHeader>
            <CardContent>
              <ScreenshotUpload
                screenshots={screenshots}
                onChange={setScreenshots}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
