import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScreenshot } from '../hooks/useScreenshot'

interface ScreenshotUploadProps {
  urls: string[]
  onChange: (urls: string[]) => void
}

export function ScreenshotUpload({ urls, onChange }: ScreenshotUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useScreenshot()
  const [previewError, setPreviewError] = useState<Record<number, boolean>>({})

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      try {
        const url = await upload(file)
        onChange([...urls, url])
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }

    if (fileRef.current) fileRef.current.value = ''
  }

  const removeUrl = (index: number) => {
    onChange(urls.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div
            key={i}
            className="relative group rounded-lg border overflow-hidden w-32 h-24"
          >
            {previewError[i] ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                Preview error
              </div>
            ) : (
              <img
                src={url}
                alt={`Chart ${i + 1}`}
                className="w-full h-full object-cover"
                onError={() => setPreviewError((prev) => ({ ...prev, [i]: true }))}
              />
            )}
            <button
              type="button"
              onClick={() => removeUrl(i)}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-32 h-24 rounded-lg border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors"
        >
          <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">
            {uploading ? 'Uploading...' : 'Them anh'}
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
    </div>
  )
}
