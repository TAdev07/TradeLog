import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp, ArrowDown, Type, Undo2, Check, X, Move, Trash2, Pen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Marker, Line, ScreenshotAnnotation } from '../types/annotation'
import { LINE_COLORS } from './ChartOverlay'

interface ChartAnnotatorProps {
  imageSrc: string
  annotations: ScreenshotAnnotation
  onChange: (annotations: ScreenshotAnnotation) => void
  onClose: () => void
  onSave: (annotations: ScreenshotAnnotation) => void
}

type Tool = 'buy' | 'sell' | 'line' | null

const BASE_ARROW_FACTOR = 0.03
const MIN_ARROW = 16
const LINE_WIDTHS = [
  { label: 'Mỏng', value: 0.5 },
  { label: 'Vừa', value: 1 },
  { label: 'Dày', value: 2 },
]

function getArrowSize(containerWidth: number, markerSize: number) {
  return Math.max(MIN_ARROW, containerWidth * BASE_ARROW_FACTOR) * markerSize
}

function hitTestMarker(
  mx: number, my: number,
  marker: Marker,
  cw: number, ch: number
): 'body' | 'resize' | null {
  const px = marker.x * cw
  const py = marker.y * ch
  const arrowSize = getArrowSize(cw, marker.size)

  const handleX = px + arrowSize * 0.7
  const handleY = py + arrowSize * 1.1
  if (Math.hypot(mx - handleX, my - handleY) < 12) return 'resize'

  if (
    mx >= px - arrowSize * 0.7 && mx <= px + arrowSize * 0.7 &&
    my >= py - arrowSize * 1.1 && my <= py + arrowSize * 1.1
  ) return 'body'

  return null
}

export function ChartAnnotator({ imageSrc, annotations, onChange, onClose, onSave }: ChartAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [tool, setTool] = useState<Tool>(null)
  const [editingMarker, setEditingMarker] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{
    id: string; mode: 'move' | 'resize'
    startX: number; startY: number
    origX: number; origY: number; origSize: number
  } | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  // Line drawing state
  const [lineColor, setLineColor] = useState('#ef4444')
  const [lineWidth, setLineWidth] = useState(1)
  const [drawingLine, setDrawingLine] = useState<{ x: number; y: number }[] | null>(null)

  const { markers, lines } = annotations
  const setMarkers = (m: Marker[]) => onChange({ ...annotations, markers: m })
  const setLines = (l: Line[]) => onChange({ ...annotations, lines: l })

  const updateSize = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const img = el.querySelector('img')
    if (!img || !img.naturalWidth) return
    setSize({ width: img.clientWidth, height: img.clientHeight })
  }, [])

  useEffect(() => {
    const observer = new ResizeObserver(updateSize)
    const el = containerRef.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [updateSize])

  const getSvgPos = (e: React.MouseEvent | React.TouchEvent) => {
    const el = containerRef.current?.querySelector('svg')
    if (!el) return { x: 0, y: 0, screenX: 0, screenY: 0 }
    const rect = el.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      screenX: clientX,
      screenY: clientY,
    }
  }

  const handlePointerDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x: mx, y: my } = getSvgPos(e)

    // Line tool: add point
    if (tool === 'line') {
      e.preventDefault()
      const nx = mx / size.width
      const ny = my / size.height
      if (drawingLine) {
        setDrawingLine([...drawingLine, { x: nx, y: ny }])
      } else {
        setDrawingLine([{ x: nx, y: ny }])
      }
      return
    }

    // Check marker hit
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i]
      const hit = hitTestMarker(mx, my, m, size.width, size.height)
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

    // Place new marker
    if (tool === 'buy' || tool === 'sell') {
      const nx = mx / size.width
      const ny = my / size.height
      const newMarker: Marker = {
        id: crypto.randomUUID(),
        type: tool,
        x: nx, y: ny,
        size: 1,
        label: '',
      }
      setMarkers([...markers, newMarker])
      setSelectedId(newMarker.id)
      setEditingMarker(newMarker.id)
      setLabelInput('')
    }
  }

  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x: mx, y: my, screenX, screenY } = getSvgPos(e)

    if (dragging) {
      e.preventDefault()
      const marker = markers.find(m => m.id === dragging.id)
      if (!marker) return

      if (dragging.mode === 'move') {
        const dx = (mx - dragging.startX) / size.width
        const dy = (my - dragging.startY) / size.height
        const nx = Math.max(0, Math.min(1, dragging.origX + dx))
        const ny = Math.max(0, Math.min(1, dragging.origY + dy))
        setMarkers(markers.map(m => m.id === dragging.id ? { ...m, x: nx, y: ny } : m))
      } else {
        const cx = marker.x * size.width
        const cy = marker.y * size.height
        const origDist = Math.hypot(dragging.startX - cx, dragging.startY - cy)
        const newDist = Math.hypot(mx - cx, my - cy)
        const ratio = origDist > 10 ? newDist / origDist : 1
        const newSize = Math.max(0.4, Math.min(4, dragging.origSize * ratio))
        setMarkers(markers.map(m => m.id === dragging.id ? { ...m, size: newSize } : m))
      }
      return
    }

    // Hover tooltip
    let found = false
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i]
      if (m.label && hitTestMarker(mx, my, m, size.width, size.height) === 'body') {
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

  // Line tool: double-click to finish
  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'line' && drawingLine && drawingLine.length >= 2) {
      e.preventDefault()
      const newLine: Line = {
        id: crypto.randomUUID(),
        points: drawingLine,
        color: lineColor,
        width: lineWidth,
      }
      setLines([...lines, newLine])
      setDrawingLine(null)
    }
  }

  // Touch support
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length !== 1) return
    const { x: mx, y: my } = getSvgPos(e)

    if (tool === 'line') {
      e.preventDefault()
      const nx = mx / size.width
      const ny = my / size.height
      if (drawingLine) {
        setDrawingLine([...drawingLine, { x: nx, y: ny }])
      } else {
        setDrawingLine([{ x: nx, y: ny }])
      }
      return
    }

    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i]
      const hit = hitTestMarker(mx, my, m, size.width, size.height)
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
    if (tool === 'buy' || tool === 'sell') {
      const nx = mx / size.width
      const ny = my / size.height
      const newMarker: Marker = {
        id: crypto.randomUUID(),
        type: tool,
        x: nx, y: ny,
        size: 1,
        label: '',
      }
      setMarkers([...markers, newMarker])
      setSelectedId(newMarker.id)
      setEditingMarker(newMarker.id)
      setLabelInput('')
    }
  }

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!dragging || e.touches.length !== 1) return
    e.preventDefault()
    const { x: mx, y: my } = getSvgPos(e)
    const marker = markers.find(m => m.id === dragging.id)
    if (!marker) return

    if (dragging.mode === 'move') {
      const dx = (mx - dragging.startX) / size.width
      const dy = (my - dragging.startY) / size.height
      const nx = Math.max(0, Math.min(1, dragging.origX + dx))
      const ny = Math.max(0, Math.min(1, dragging.origY + dy))
      setMarkers(markers.map(m => m.id === dragging.id ? { ...m, x: nx, y: ny } : m))
    } else {
      const cx = marker.x * size.width
      const cy = marker.y * size.height
      const origDist = Math.hypot(dragging.startX - cx, dragging.startY - cy)
      const newDist = Math.hypot(mx - cx, my - cy)
      const ratio = origDist > 10 ? newDist / origDist : 1
      const newSize = Math.max(0.4, Math.min(4, dragging.origSize * ratio))
      setMarkers(markers.map(m => m.id === dragging.id ? { ...m, size: newSize } : m))
    }
  }

  const handleLabelSave = () => {
    if (!editingMarker) return
    setMarkers(markers.map(m => m.id === editingMarker ? { ...m, label: labelInput } : m))
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
    setMarkers(markers.filter(m => m.id !== selectedId))
    setSelectedId(null)
  }

  const handleUndo = () => {
    if (tool === 'line' && drawingLine) {
      if (drawingLine.length > 1) {
        setDrawingLine(drawingLine.slice(0, -1))
      } else {
        setDrawingLine(null)
      }
      return
    }
    // Undo last marker or line
    if (markers.length > 0 && (lines.length === 0 || markers.length >= lines.length)) {
      setMarkers(markers.slice(0, -1))
    } else if (lines.length > 0) {
      setLines(lines.slice(0, -1))
    }
    setSelectedId(null)
    setEditingMarker(null)
  }

  const finishLine = () => {
    if (drawingLine && drawingLine.length >= 2) {
      const newLine: Line = {
        id: crypto.randomUUID(),
        points: drawingLine,
        color: lineColor,
        width: lineWidth,
      }
      setLines([...lines, newLine])
    }
    setDrawingLine(null)
  }

  const handleSave = () => {
    if (drawingLine && drawingLine.length >= 2) {
      const newLine: Line = {
        id: crypto.randomUUID(),
        points: drawingLine,
        color: lineColor,
        width: lineWidth,
      }
      onSave({ markers, lines: [...lines, newLine] })
    } else {
      onSave({ markers, lines })
    }
  }

  const selectedMarker = selectedId ? markers.find(m => m.id === selectedId) : null
  const tooltipMarker = hoveredId ? markers.find(m => m.id === hoveredId) : null

  // Render arrow SVG
  const renderArrow = (marker: Marker, isSelected: boolean) => {
    const isBuy = marker.type === 'buy'
    const color = isBuy ? '#4ade80' : '#f87171'
    const cx = marker.x * size.width
    const cy = marker.y * size.height
    const s = getArrowSize(size.width, marker.size)

    const pts = isBuy
      ? [[0, -1], [-0.6, 0.3], [-0.2, 0.3], [-0.2, 1], [0.2, 1], [0.2, 0.3], [0.6, 0.3]]
      : [[0, 1], [-0.6, -0.3], [-0.2, -0.3], [-0.2, -1], [0.2, -1], [0.2, -0.3], [0.6, -0.3]]

    const pointsStr = pts.map(([dx, dy]) => `${cx + dx * s},${cy + dy * s}`).join(' ')
    const dotY = isBuy ? cy - s - 6 : cy + s + 6

    return (
      <g key={marker.id}>
        <polygon points={pointsStr} fill={color} stroke={isSelected ? '#fff' : color} strokeWidth={isSelected ? 3 : 2} />
        {marker.label && (
          <circle cx={cx} cy={dotY} r={4} fill="#fff" stroke={color} strokeWidth={1.5} />
        )}
        {isSelected && (
          <>
            <rect
              x={cx - s * 0.7} y={cy - s * 1.1}
              width={s * 1.4} height={s * 2.2}
              fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1}
              strokeDasharray="4 4"
            />
            <circle
              cx={cx + s * 0.7} cy={cy + s * 1.1}
              r={6} fill="#fff" stroke="#666" strokeWidth={1.5}
            />
          </>
        )}
      </g>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button" size="sm"
          variant={tool === 'buy' ? 'default' : 'outline'}
          className={cn(tool === 'buy' && 'bg-profit hover:bg-profit/90 text-white')}
          onClick={() => { setTool(tool === 'buy' ? null : 'buy'); setSelectedId(null); finishLine() }}
        >
          <ArrowUp className="h-4 w-4 mr-1" />
          Mua
        </Button>
        <Button
          type="button" size="sm"
          variant={tool === 'sell' ? 'default' : 'outline'}
          className={cn(tool === 'sell' && 'bg-loss hover:bg-loss/90 text-white')}
          onClick={() => { setTool(tool === 'sell' ? null : 'sell'); setSelectedId(null); finishLine() }}
        >
          <ArrowDown className="h-4 w-4 mr-1" />
          Bán
        </Button>
        <Button
          type="button" size="sm"
          variant={tool === 'line' ? 'default' : 'outline'}
          onClick={() => {
            if (tool === 'line') { finishLine(); setTool(null) }
            else { setTool('line'); setSelectedId(null) }
          }}
        >
          <Pen className="h-4 w-4 mr-1" />
          Vẽ đường
        </Button>

        {/* Line options */}
        {tool === 'line' && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex gap-1">
              {Object.keys(LINE_COLORS).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-transform',
                    lineColor === c ? 'border-white scale-125' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setLineColor(c)}
                />
              ))}
            </div>
            <div className="flex gap-1">
              {LINE_WIDTHS.map(({ label, value }) => (
                <Button
                  key={value}
                  type="button" size="sm" variant={lineWidth === value ? 'default' : 'outline'}
                  className="h-6 px-2 text-xs"
                  onClick={() => setLineWidth(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {drawingLine && drawingLine.length >= 2 && (
              <Button type="button" size="sm" variant="outline" onClick={finishLine}>
                <Check className="h-3 w-3 mr-1" />
                Xong
              </Button>
            )}
          </>
        )}

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

        {!selectedMarker && tool !== 'line' && (
          <Button type="button" size="sm" variant="outline" onClick={handleUndo} disabled={markers.length === 0 && lines.length === 0}>
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
          Lưu
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

      {/* Image + SVG overlay */}
      <div ref={containerRef} className="w-full relative">
        <img
          src={imageSrc}
          alt="Chart"
          className="w-full rounded-lg border"
          onLoad={updateSize}
          draggable={false}
        />
        {size.width > 0 && (
          <svg
            className={cn(
              'absolute inset-0 w-full h-full touch-none',
              tool ? 'cursor-crosshair' : dragging ? 'cursor-grabbing' : 'cursor-default'
            )}
            viewBox={`0 0 ${size.width} ${size.height}`}
            preserveAspectRatio="none"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={() => { handlePointerUp(); setHoveredId(null); setTooltipPos(null) }}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handlePointerUp}
          >
            {/* Lines */}
            {lines.map((line) => (
              <polyline
                key={line.id}
                points={line.points.map(p => `${p.x * size.width},${p.y * size.height}`).join(' ')}
                fill="none"
                stroke={line.color}
                strokeWidth={Math.max(1, 2 * line.width)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Drawing line preview */}
            {drawingLine && drawingLine.length > 0 && (
              <polyline
                points={drawingLine.map(p => `${p.x * size.width},${p.y * size.height}`).join(' ')}
                fill="none"
                stroke={lineColor}
                strokeWidth={Math.max(1, 2 * lineWidth)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6 3"
                opacity={0.7}
              />
            )}

            {/* Markers */}
            {markers.map((marker) => renderArrow(marker, marker.id === selectedId))}
          </svg>
        )}

        {/* Tooltip */}
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
      {(tool === 'buy' || tool === 'sell') && (
        <p className="text-xs text-muted-foreground text-center">
          Nhấp vào biểu đồ để đặt marker {tool === 'buy' ? 'Mua (xanh)' : 'Bán (đỏ)'}
        </p>
      )}
      {tool === 'line' && (
        <p className="text-xs text-muted-foreground text-center">
          Nhấp để thêm điểm · Nhấp đúp hoặc bấm "Xong" để kết thúc đường
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

export type { Marker, Line, ScreenshotAnnotation }
