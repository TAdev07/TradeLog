import { useRef, useState } from 'react'
import { ImagePlus, X, Pencil, ZoomIn, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChartAnnotator, type Marker } from './ChartAnnotator'
import { resizeImage } from '@/lib/image-utils'

export interface LocalScreenshot {
  id: string
  /** Data URL or blob URL for local preview */
  previewUrl: string
  /** The resized Blob ready for upload */
  blob: Blob
  /** Annotation markers (retained for re-editing) */
  markers: Marker[]
  /** Original image data URL (before markers baked in) */
  originalDataUrl: string
}

interface ScreenshotUploadProps {
  screenshots: LocalScreenshot[]
  onChange: (screenshots: LocalScreenshot[]) => void
}

export function ScreenshotUpload({ screenshots, onChange }: ScreenshotUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setLoading(true)
    try {
      const newScreenshots: LocalScreenshot[] = []

      for (const file of Array.from(files)) {
        const resizedBlob = await resizeImage(file)
        const dataUrl = await blobToDataUrl(resizedBlob)

        newScreenshots.push({
          id: crypto.randomUUID(),
          previewUrl: dataUrl,
          blob: resizedBlob,
          markers: [],
          originalDataUrl: dataUrl,
        })
      }

      onChange([...screenshots, ...newScreenshots])
    } catch (err) {
      console.error('Failed to process image:', err)
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeScreenshot = (index: number) => {
    onChange(screenshots.filter((_, i) => i !== index))
  }

  const handleAnnotationSave = (index: number, dataUrl: string, markers: Marker[]) => {
    const updated = [...screenshots]
    const blob = dataUrlToBlob(dataUrl)
    updated[index] = {
      ...updated[index],
      previewUrl: dataUrl,
      blob,
      markers,
    }
    onChange(updated)
    setEditingIndex(null)
  }

  const editingScreenshot = editingIndex !== null ? screenshots[editingIndex] : null
  const previewScreenshot = previewIndex !== null ? screenshots[previewIndex] : null

  const openFullscreen = (src: string) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Preview</title><style>
      *{margin:0;padding:0;background:#000}
      img{width:100vw;height:100vh;object-fit:contain}
    </style></head><body><img src="${src}" /></body></html>`)
    win.document.close()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {screenshots.map((screenshot, i) => (
          <div
            key={screenshot.id}
            className="relative group rounded-lg border overflow-hidden w-28 h-20 sm:w-32 sm:h-24"
          >
            <img
              src={screenshot.previewUrl}
              alt={`Chart ${i + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Overlay buttons */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setPreviewIndex(i)}
                className="rounded-full bg-black/60 p-1.5"
              >
                <ZoomIn className="h-3.5 w-3.5 text-white" />
              </button>
              <button
                type="button"
                onClick={() => setEditingIndex(i)}
                className="rounded-full bg-black/60 p-1.5"
              >
                <Pencil className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            {/* Marker count badge */}
            {screenshot.markers.length > 0 && (
              <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                {screenshot.markers.length}
              </div>
            )}
            <button
              type="button"
              onClick={() => removeScreenshot(i)}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="flex flex-col items-center justify-center w-28 h-20 sm:w-32 sm:h-24 rounded-lg border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors"
        >
          <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">
            {loading ? 'Đang xử lý...' : 'Thêm ảnh'}
          </span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Annotation editor dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={() => setEditingIndex(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa biểu đồ</DialogTitle>
          </DialogHeader>
          {editingScreenshot && editingIndex !== null && (
            <ChartAnnotator
              imageSrc={editingScreenshot.originalDataUrl}
              markers={editingScreenshot.markers}
              onChange={(markers) => {
                const updated = [...screenshots]
                updated[editingIndex] = { ...updated[editingIndex], markers }
                onChange(updated)
              }}
              onClose={() => setEditingIndex(null)}
              onSave={(dataUrl) =>
                handleAnnotationSave(
                  editingIndex,
                  dataUrl,
                  screenshots[editingIndex].markers
                )
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={previewIndex !== null} onOpenChange={() => setPreviewIndex(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-2 sm:p-4">
          {previewScreenshot && (
            <div className="relative">
              <img
                src={previewScreenshot.previewUrl}
                alt="Preview"
                className="w-full rounded-lg"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={() => openFullscreen(previewScreenshot.previewUrl)}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helpers
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)![1]
  const bytes = atob(parts[1])
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i)
  }
  return new Blob([arr], { type: mime })
}
