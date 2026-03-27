import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp, ArrowDown, Type, Undo2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Marker {
  id: string
  type: 'buy' | 'sell'
  x: number // percentage 0-1
  y: number // percentage 0-1
  label: string
}

interface ChartAnnotatorProps {
  imageSrc: string
  markers: Marker[]
  onChange: (markers: Marker[]) => void
  onClose: () => void
  onSave: (dataUrl: string) => void
}

type Tool = 'buy' | 'sell' | 'label' | null

export function ChartAnnotator({ imageSrc, markers, onChange, onClose, onSave }: ChartAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [tool, setTool] = useState<Tool>(null)
  const [editingMarker, setEditingMarker] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      updateCanvasSize()
    }
    img.src = imageSrc
  }, [imageSrc])

  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img) return

    const containerWidth = container.clientWidth
    const ratio = img.height / img.width
    const width = containerWidth
    const height = Math.round(containerWidth * ratio)

    setCanvasSize({ width, height })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [updateCanvasSize])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || canvasSize.width === 0) return

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height)

    // Draw markers
    markers.forEach((marker) => {
      const x = marker.x * canvasSize.width
      const y = marker.y * canvasSize.height
      drawMarker(ctx, x, y, marker)
    })
  }, [markers, canvasSize])

  const drawMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, marker: Marker) => {
    const isBuy = marker.type === 'buy'
    const color = isBuy ? '#4ade80' : '#f87171'
    const arrowSize = Math.max(16, canvasSize.width * 0.03)

    ctx.save()

    // Draw arrow
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.beginPath()

    if (isBuy) {
      // Up arrow
      ctx.moveTo(x, y - arrowSize)
      ctx.lineTo(x - arrowSize * 0.6, y + arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y + arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y + arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y + arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y + arrowSize * 0.3)
      ctx.lineTo(x + arrowSize * 0.6, y + arrowSize * 0.3)
      ctx.closePath()
    } else {
      // Down arrow
      ctx.moveTo(x, y + arrowSize)
      ctx.lineTo(x - arrowSize * 0.6, y - arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y - arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y - arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y - arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y - arrowSize * 0.3)
      ctx.lineTo(x + arrowSize * 0.6, y - arrowSize * 0.3)
      ctx.closePath()
    }

    ctx.fill()
    ctx.stroke()

    // Draw label
    if (marker.label) {
      const fontSize = Math.max(12, canvasSize.width * 0.025)
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      ctx.textAlign = 'center'
      const labelY = isBuy ? y - arrowSize - 6 : y + arrowSize + fontSize + 4

      // Background
      const metrics = ctx.measureText(marker.label)
      const padding = 4
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.beginPath()
      ctx.roundRect(
        x - metrics.width / 2 - padding,
        labelY - fontSize + 2,
        metrics.width + padding * 2,
        fontSize + padding,
        4
      )
      ctx.fill()

      // Text
      ctx.fillStyle = '#fff'
      ctx.fillText(marker.label, x, labelY)
    }

    ctx.restore()
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tool || tool === 'label') return

    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / canvasSize.width
    const y = (e.clientY - rect.top) / canvasSize.height

    const newMarker: Marker = {
      id: crypto.randomUUID(),
      type: tool,
      x,
      y,
      label: '',
    }

    onChange([...markers, newMarker])
    setEditingMarker(newMarker.id)
    setLabelInput('')
  }

  const handleLabelSave = () => {
    if (!editingMarker) return
    onChange(
      markers.map((m) =>
        m.id === editingMarker ? { ...m, label: labelInput } : m
      )
    )
    setEditingMarker(null)
    setLabelInput('')
  }

  const handleLabelSkip = () => {
    setEditingMarker(null)
    setLabelInput('')
  }

  const handleUndo = () => {
    if (markers.length === 0) return
    onChange(markers.slice(0, -1))
    setEditingMarker(null)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Render at full resolution for export
    const img = imgRef.current
    if (!img) return

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = img.width
    exportCanvas.height = img.height
    const ctx = exportCanvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    // Draw markers at full resolution
    markers.forEach((marker) => {
      const x = marker.x * img.width
      const y = marker.y * img.height
      // Scale marker drawing to full resolution
      const origWidth = canvasSize.width
      const scale = img.width / origWidth

      const isBuy = marker.type === 'buy'
      const color = isBuy ? '#4ade80' : '#f87171'
      const arrowSize = Math.max(16, origWidth * 0.03) * scale

      ctx.save()
      ctx.fillStyle = color
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5 * scale

      ctx.beginPath()
      if (isBuy) {
        ctx.moveTo(x, y - arrowSize)
        ctx.lineTo(x - arrowSize * 0.6, y + arrowSize * 0.3)
        ctx.lineTo(x - arrowSize * 0.2, y + arrowSize * 0.3)
        ctx.lineTo(x - arrowSize * 0.2, y + arrowSize)
        ctx.lineTo(x + arrowSize * 0.2, y + arrowSize)
        ctx.lineTo(x + arrowSize * 0.2, y + arrowSize * 0.3)
        ctx.lineTo(x + arrowSize * 0.6, y + arrowSize * 0.3)
        ctx.closePath()
      } else {
        ctx.moveTo(x, y + arrowSize)
        ctx.lineTo(x - arrowSize * 0.6, y - arrowSize * 0.3)
        ctx.lineTo(x - arrowSize * 0.2, y - arrowSize * 0.3)
        ctx.lineTo(x - arrowSize * 0.2, y - arrowSize)
        ctx.lineTo(x + arrowSize * 0.2, y - arrowSize)
        ctx.lineTo(x + arrowSize * 0.2, y - arrowSize * 0.3)
        ctx.lineTo(x + arrowSize * 0.6, y - arrowSize * 0.3)
        ctx.closePath()
      }
      ctx.fill()
      ctx.stroke()

      if (marker.label) {
        const fontSize = Math.max(12, origWidth * 0.025) * scale
        ctx.font = `bold ${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        const labelY = isBuy ? y - arrowSize - 6 * scale : y + arrowSize + fontSize + 4 * scale

        const metrics = ctx.measureText(marker.label)
        const padding = 4 * scale
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.beginPath()
        ctx.roundRect(
          x - metrics.width / 2 - padding,
          labelY - fontSize + 2 * scale,
          metrics.width + padding * 2,
          fontSize + padding,
          4 * scale
        )
        ctx.fill()

        ctx.fillStyle = '#fff'
        ctx.fillText(marker.label, x, labelY)
      }

      ctx.restore()
    })

    const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.9)
    onSave(dataUrl)
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          size="sm"
          variant={tool === 'buy' ? 'default' : 'outline'}
          className={cn(tool === 'buy' && 'bg-profit hover:bg-profit/90 text-white')}
          onClick={() => setTool(tool === 'buy' ? null : 'buy')}
        >
          <ArrowUp className="h-4 w-4 mr-1" />
          Mua (Buy)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tool === 'sell' ? 'default' : 'outline'}
          className={cn(tool === 'sell' && 'bg-loss hover:bg-loss/90 text-white')}
          onClick={() => setTool(tool === 'sell' ? null : 'sell')}
        >
          <ArrowDown className="h-4 w-4 mr-1" />
          Bán (Sell)
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleUndo}
          disabled={markers.length === 0}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Hoàn tác
        </Button>
        <div className="flex-1" />
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-1" />
          Huỷ
        </Button>
        <Button type="button" size="sm" onClick={handleSave}>
          <Check className="h-4 w-4 mr-1" />
          Lưu ảnh
        </Button>
      </div>

      {/* Label input */}
      {editingMarker && (
        <div className="flex gap-2 items-center bg-muted/50 rounded-lg p-2">
          <Type className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Nhập chú thích (Enter để lưu, Esc để bỏ qua)..."
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelSave()
              if (e.key === 'Escape') handleLabelSkip()
            }}
          />
          <Button type="button" size="sm" variant="ghost" onClick={handleLabelSave}>
            Lưu
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleLabelSkip}>
            Bỏ qua
          </Button>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="w-full">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleCanvasClick}
          className={cn(
            'w-full rounded-lg border cursor-crosshair',
            !tool && 'cursor-default'
          )}
        />
      </div>

      {tool && (
        <p className="text-xs text-muted-foreground text-center">
          Nhấp vào biểu đồ để đặt marker {tool === 'buy' ? 'Mua (xanh)' : 'Bán (đỏ)'}
        </p>
      )}
    </div>
  )
}
