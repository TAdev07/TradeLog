import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp, ArrowDown, Type, Undo2, Check, X, Move, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Marker {
  id: string
  type: 'buy' | 'sell'
  x: number // percentage 0-1
  y: number // percentage 0-1
  size: number // scale factor, default 1
  label: string
}

interface ChartAnnotatorProps {
  imageSrc: string
  markers: Marker[]
  onChange: (markers: Marker[]) => void
  onClose: () => void
  onSave: (dataUrl: string) => void
}

type Tool = 'buy' | 'sell' | null

const BASE_ARROW_FACTOR = 0.03
const MIN_ARROW = 16

function getArrowSize(canvasWidth: number, markerSize: number) {
  return Math.max(MIN_ARROW, canvasWidth * BASE_ARROW_FACTOR) * markerSize
}

function hitTest(
  mx: number, my: number,
  marker: Marker,
  canvasWidth: number, canvasHeight: number
): 'body' | 'resize' | null {
  const px = marker.x * canvasWidth
  const py = marker.y * canvasHeight
  const arrowSize = getArrowSize(canvasWidth, marker.size)

  // Resize handle (bottom-right corner of bounding box)
  const handleX = px + arrowSize * 0.7
  const handleY = py + arrowSize * 1.1
  const handleR = 8
  if (Math.hypot(mx - handleX, my - handleY) < handleR + 4) return 'resize'

  // Body hit (bounding box)
  if (
    mx >= px - arrowSize * 0.7 && mx <= px + arrowSize * 0.7 &&
    my >= py - arrowSize * 1.1 && my <= py + arrowSize * 1.1
  ) return 'body'

  return null
}

export function ChartAnnotator({ imageSrc, markers, onChange, onClose, onSave }: ChartAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [tool, setTool] = useState<Tool>(null)
  const [editingMarker, setEditingMarker] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ id: string; mode: 'move' | 'resize'; startX: number; startY: number; origX: number; origY: number; origSize: number } | null>(null)

  // Tooltip position in screen coords
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const tooltipMarker = hoveredId ? markers.find(m => m.id === hoveredId) : null

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
    setCanvasSize({ width: containerWidth, height: Math.round(containerWidth * ratio) })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [updateCanvasSize])

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || canvasSize.width === 0) return

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height)

    markers.forEach((marker) => {
      const x = marker.x * canvasSize.width
      const y = marker.y * canvasSize.height
      const isSelected = marker.id === selectedId
      drawArrow(ctx, x, y, marker, canvasSize.width, isSelected)
    })
  }, [markers, canvasSize, selectedId])

  function drawArrow(
    ctx: CanvasRenderingContext2D, x: number, y: number,
    marker: Marker, cw: number, isSelected: boolean
  ) {
    const isBuy = marker.type === 'buy'
    const color = isBuy ? '#4ade80' : '#f87171'
    const arrowSize = getArrowSize(cw, marker.size)

    ctx.save()
    ctx.fillStyle = color
    ctx.strokeStyle = isSelected ? '#fff' : color
    ctx.lineWidth = isSelected ? 3 : 2

    ctx.beginPath()
    if (isBuy) {
      ctx.moveTo(x, y - arrowSize)
      ctx.lineTo(x - arrowSize * 0.6, y + arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y + arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y + arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y + arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y + arrowSize * 0.3)
      ctx.lineTo(x + arrowSize * 0.6, y + arrowSize * 0.3)
    } else {
      ctx.moveTo(x, y + arrowSize)
      ctx.lineTo(x - arrowSize * 0.6, y - arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y - arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y - arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y - arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y - arrowSize * 0.3)
      ctx.lineTo(x + arrowSize * 0.6, y - arrowSize * 0.3)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Label indicator dot (small circle if has label)
    if (marker.label) {
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      const dotY = isBuy ? y - arrowSize - 6 : y + arrowSize + 6
      ctx.beginPath()
      ctx.arc(x, dotY, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    // Selected: draw resize handle
    if (isSelected) {
      const hx = x + arrowSize * 0.7
      const hy = y + arrowSize * 1.1
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(hx, hy, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // selection box
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.strokeRect(
        x - arrowSize * 0.7, y - arrowSize * 1.1,
        arrowSize * 1.4, arrowSize * 2.2
      )
      ctx.setLineDash([])
    }

    ctx.restore()
  }

  // Export: draw markers with labels baked in (full res)
  function drawMarkerExport(
    ctx: CanvasRenderingContext2D, marker: Marker,
    imgWidth: number, imgHeight: number, displayWidth: number
  ) {
    const x = marker.x * imgWidth
    const y = marker.y * imgHeight
    const scale = imgWidth / displayWidth
    const isBuy = marker.type === 'buy'
    const color = isBuy ? '#4ade80' : '#f87171'
    const arrowSize = getArrowSize(displayWidth, marker.size) * scale

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
    } else {
      ctx.moveTo(x, y + arrowSize)
      ctx.lineTo(x - arrowSize * 0.6, y - arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y - arrowSize * 0.3)
      ctx.lineTo(x - arrowSize * 0.2, y - arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y - arrowSize)
      ctx.lineTo(x + arrowSize * 0.2, y - arrowSize * 0.3)
      ctx.lineTo(x + arrowSize * 0.6, y - arrowSize * 0.3)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Bake label into export image
    if (marker.label) {
      const fontSize = Math.max(12, displayWidth * 0.022) * scale
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      ctx.textAlign = 'center'
      const labelY = isBuy ? y - arrowSize - 8 * scale : y + arrowSize + fontSize + 6 * scale

      const metrics = ctx.measureText(marker.label)
      const padding = 5 * scale
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
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
  }

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      screenX: clientX,
      screenY: clientY,
    }
  }

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: mx, y: my } = getCanvasPos(e)

    // Check if clicking on an existing marker
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i]
      const hit = hitTest(mx, my, m, canvasSize.width, canvasSize.height)
      if (hit) {
        e.preventDefault()
        setSelectedId(m.id)
        setTool(null)
        setDragging({
          id: m.id,
          mode: hit === 'resize' ? 'resize' : 'move',
          startX: mx, startY: my,
          origX: m.x, origY: m.y,
          origSize: m.size,
        })
        return
      }
    }

    // Deselect
    setSelectedId(null)

    // Place new marker if tool active
    if (tool) {
      const nx = mx / canvasSize.width
      const ny = my / canvasSize.height
      const newMarker: Marker = {
        id: crypto.randomUUID(),
        type: tool,
        x: nx, y: ny,
        size: 1,
        label: '',
      }
      onChange([...markers, newMarker])
      setSelectedId(newMarker.id)
      setEditingMarker(newMarker.id)
      setLabelInput('')
    }
  }

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: mx, y: my, screenX, screenY } = getCanvasPos(e)

    if (dragging) {
      e.preventDefault()
      const marker = markers.find(m => m.id === dragging.id)
      if (!marker) return

      if (dragging.mode === 'move') {
        const dx = (mx - dragging.startX) / canvasSize.width
        const dy = (my - dragging.startY) / canvasSize.height
        const nx = Math.max(0, Math.min(1, dragging.origX + dx))
        const ny = Math.max(0, Math.min(1, dragging.origY + dy))
        onChange(markers.map(m => m.id === dragging.id ? { ...m, x: nx, y: ny } : m))
      } else {
        // Resize: distance from center determines size
        const cx = marker.x * canvasSize.width
        const cy = marker.y * canvasSize.height
        const origDist = Math.hypot(dragging.startX - cx, dragging.startY - cy)
        const newDist = Math.hypot(mx - cx, my - cy)
        const ratio = origDist > 10 ? newDist / origDist : 1
        const newSize = Math.max(0.4, Math.min(4, dragging.origSize * ratio))
        onChange(markers.map(m => m.id === dragging.id ? { ...m, size: newSize } : m))
      }
      return
    }

    // Hover detection for tooltip
    let found = false
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i]
      if (m.label && hitTest(mx, my, m, canvasSize.width, canvasSize.height) === 'body') {
        setHoveredId(m.id)
        setTooltipPos({ x: screenX, y: screenY })
        found = true
        break
      }
    }
    if (!found) {
      setHoveredId(null)
      setTooltipPos(null)
    }
  }

  const handlePointerUp = () => {
    setDragging(null)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const mx = touch.clientX - rect.left
    const my = touch.clientY - rect.top

    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i]
      const hit = hitTest(mx, my, m, canvasSize.width, canvasSize.height)
      if (hit) {
        e.preventDefault()
        setSelectedId(m.id)
        setTool(null)
        setDragging({
          id: m.id,
          mode: hit === 'resize' ? 'resize' : 'move',
          startX: mx, startY: my,
          origX: m.x, origY: m.y,
          origSize: m.size,
        })
        return
      }
    }

    setSelectedId(null)
    if (tool) {
      const nx = mx / canvasSize.width
      const ny = my / canvasSize.height
      const newMarker: Marker = {
        id: crypto.randomUUID(),
        type: tool,
        x: nx, y: ny,
        size: 1,
        label: '',
      }
      onChange([...markers, newMarker])
      setSelectedId(newMarker.id)
      setEditingMarker(newMarker.id)
      setLabelInput('')
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragging || e.touches.length !== 1) return
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const mx = touch.clientX - rect.left
    const my = touch.clientY - rect.top

    const marker = markers.find(m => m.id === dragging.id)
    if (!marker) return

    if (dragging.mode === 'move') {
      const dx = (mx - dragging.startX) / canvasSize.width
      const dy = (my - dragging.startY) / canvasSize.height
      const nx = Math.max(0, Math.min(1, dragging.origX + dx))
      const ny = Math.max(0, Math.min(1, dragging.origY + dy))
      onChange(markers.map(m => m.id === dragging.id ? { ...m, x: nx, y: ny } : m))
    } else {
      const cx = marker.x * canvasSize.width
      const cy = marker.y * canvasSize.height
      const origDist = Math.hypot(dragging.startX - cx, dragging.startY - cy)
      const newDist = Math.hypot(mx - cx, my - cy)
      const ratio = origDist > 10 ? newDist / origDist : 1
      const newSize = Math.max(0.4, Math.min(4, dragging.origSize * ratio))
      onChange(markers.map(m => m.id === dragging.id ? { ...m, size: newSize } : m))
    }
  }

  const handleLabelSave = () => {
    if (!editingMarker) return
    onChange(markers.map(m => m.id === editingMarker ? { ...m, label: labelInput } : m))
    setEditingMarker(null)
    setLabelInput('')
  }

  const handleLabelSkip = () => {
    setEditingMarker(null)
    setLabelInput('')
  }

  const handleEditLabel = () => {
    if (!selectedId) return
    const m = markers.find(m => m.id === selectedId)
    if (!m) return
    setEditingMarker(selectedId)
    setLabelInput(m.label)
  }

  const handleDeleteSelected = () => {
    if (!selectedId) return
    onChange(markers.filter(m => m.id !== selectedId))
    setSelectedId(null)
  }

  const handleUndo = () => {
    if (markers.length === 0) return
    onChange(markers.slice(0, -1))
    setSelectedId(null)
    setEditingMarker(null)
  }

  const handleSave = () => {
    const img = imgRef.current
    if (!img) return

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = img.width
    exportCanvas.height = img.height
    const ctx = exportCanvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    markers.forEach((marker) => {
      drawMarkerExport(ctx, marker, img.width, img.height, canvasSize.width)
    })

    onSave(exportCanvas.toDataURL('image/jpeg', 0.9))
  }

  const selectedMarker = selectedId ? markers.find(m => m.id === selectedId) : null

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button" size="sm"
          variant={tool === 'buy' ? 'default' : 'outline'}
          className={cn(tool === 'buy' && 'bg-profit hover:bg-profit/90 text-white')}
          onClick={() => { setTool(tool === 'buy' ? null : 'buy'); setSelectedId(null) }}
        >
          <ArrowUp className="h-4 w-4 mr-1" />
          Mua
        </Button>
        <Button
          type="button" size="sm"
          variant={tool === 'sell' ? 'default' : 'outline'}
          className={cn(tool === 'sell' && 'bg-loss hover:bg-loss/90 text-white')}
          onClick={() => { setTool(tool === 'sell' ? null : 'sell'); setSelectedId(null) }}
        >
          <ArrowDown className="h-4 w-4 mr-1" />
          Bán
        </Button>

        {/* Selected marker actions */}
        {selectedMarker && !editingMarker && (
          <>
            <div className="w-px h-6 bg-border" />
            <Button type="button" size="sm" variant="outline" onClick={handleEditLabel}>
              <Type className="h-4 w-4 mr-1" />
              {selectedMarker.label ? 'Sửa chú thích' : 'Thêm chú thích'}
            </Button>
            <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}

        {!selectedMarker && (
          <Button type="button" size="sm" variant="outline" onClick={handleUndo} disabled={markers.length === 0}>
            <Undo2 className="h-4 w-4 mr-1" />
            Hoàn tác
          </Button>
        )}

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
            placeholder="Nhập chú thích (Enter để lưu)..."
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelSave()
              if (e.key === 'Escape') handleLabelSkip()
            }}
          />
          <Button type="button" size="sm" variant="ghost" onClick={handleLabelSave}>Lưu</Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleLabelSkip}>Bỏ qua</Button>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="w-full relative">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={() => { handlePointerUp(); setHoveredId(null); setTooltipPos(null) }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handlePointerUp}
          className={cn(
            'w-full rounded-lg border touch-none',
            tool ? 'cursor-crosshair' : dragging ? 'cursor-grabbing' : 'cursor-default'
          )}
        />

        {/* Tooltip on hover */}
        {tooltipMarker && tooltipPos && !dragging && (
          <div
            className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border max-w-[200px]"
            style={{
              left: tooltipPos.x + 12,
              top: tooltipPos.y - 30,
            }}
          >
            {tooltipMarker.label}
          </div>
        )}
      </div>

      {/* Hints */}
      {tool && (
        <p className="text-xs text-muted-foreground text-center">
          Nhấp vào biểu đồ để đặt marker {tool === 'buy' ? 'Mua (xanh)' : 'Bán (đỏ)'}
        </p>
      )}
      {selectedId && !tool && !editingMarker && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Move className="h-3 w-3" /> Kéo để di chuyển · Kéo góc để resize · Nhấp ngoài để bỏ chọn
        </p>
      )}
    </div>
  )
}
