import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp, ArrowDown, Type, Undo2, Check, X, Move, Trash2, Pen, Square, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Marker, Line, Shape, ScreenshotAnnotation } from '../types/annotation'
import { LINE_COLORS } from './ChartOverlay'

interface ChartAnnotatorProps {
  imageSrc: string
  annotations: ScreenshotAnnotation
  onChange: (annotations: ScreenshotAnnotation) => void
  onClose: () => void
  onSave: (annotations: ScreenshotAnnotation) => void
}

type Tool = 'buy' | 'sell' | 'line' | 'rect' | 'ellipse' | null

const BASE_ARROW_FACTOR = 0.03
const MIN_ARROW = 16
const LINE_WIDTHS = [
  { label: 'Mỏng', value: 0.5 },
  { label: 'Vừa', value: 1 },
  { label: 'Dày', value: 2 },
]
const SHAPE_OPACITIES = [
  { label: 'Nhạt', value: 0.15 },
  { label: 'Vừa', value: 0.25 },
  { label: 'Đậm', value: 0.4 },
]
const SHAPE_STROKE_WIDTHS = [
  { label: 'Không', value: 0 },
  { label: '0.5', value: 0.5 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
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

function hitTestLine(mx: number, my: number, line: Line, cw: number, ch: number): boolean {
  for (let i = 0; i < line.points.length - 1; i++) {
    const ax = line.points[i].x * cw, ay = line.points[i].y * ch
    const bx = line.points[i + 1].x * cw, by = line.points[i + 1].y * ch
    const dx = bx - ax, dy = by - ay
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) continue
    const t = Math.max(0, Math.min(1, ((mx - ax) * dx + (my - ay) * dy) / lenSq))
    if (Math.hypot(mx - (ax + t * dx), my - (ay + t * dy)) < 8) return true
  }
  return false
}

function hitTestLineAnchor(mx: number, my: number, line: Line, cw: number, ch: number): number {
  for (let i = 0; i < line.points.length; i++) {
    if (Math.hypot(mx - line.points[i].x * cw, my - line.points[i].y * ch) < 10) return i
  }
  return -1
}

function hitTestShape(mx: number, my: number, shape: Shape, cw: number, ch: number): boolean {
  const sx = shape.x * cw, sy = shape.y * ch, sw = shape.w * cw, sh = shape.h * ch
  if (shape.type === 'rect') {
    return mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh
  }
  const rx = Math.abs(sw / 2), ry = Math.abs(sh / 2)
  if (rx === 0 || ry === 0) return false
  const nx = (mx - (sx + sw / 2)) / rx, ny = (my - (sy + sh / 2)) / ry
  return nx * nx + ny * ny <= 1
}

// 8 anchors: TL(0) TM(1) TR(2) ML(3) MR(4) BL(5) BM(6) BR(7)
function getShapeAnchors(shape: Shape, cw: number, ch: number): { x: number; y: number }[] {
  const sx = shape.x * cw, sy = shape.y * ch, sw = shape.w * cw, sh = shape.h * ch
  return [
    { x: sx,          y: sy },
    { x: sx + sw / 2, y: sy },
    { x: sx + sw,     y: sy },
    { x: sx,          y: sy + sh / 2 },
    { x: sx + sw,     y: sy + sh / 2 },
    { x: sx,          y: sy + sh },
    { x: sx + sw / 2, y: sy + sh },
    { x: sx + sw,     y: sy + sh },
  ]
}

function hitTestShapeAnchor(mx: number, my: number, shape: Shape, cw: number, ch: number): number {
  const anchors = getShapeAnchors(shape, cw, ch)
  for (let i = 0; i < anchors.length; i++) {
    if (Math.hypot(mx - anchors[i].x, my - anchors[i].y) < 10) return i
  }
  return -1
}

export function ChartAnnotator({ imageSrc, annotations, onChange, onClose, onSave }: ChartAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [tool, setTool] = useState<Tool>(null)
  const [editingMarker, setEditingMarker] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState('')

  // Unified selection model
  const [selectedType, setSelectedType] = useState<'marker' | 'line' | 'shape' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  // Marker drag state
  const [dragging, setDragging] = useState<{
    id: string; mode: 'move' | 'resize'
    startX: number; startY: number
    origX: number; origY: number; origSize: number
  } | null>(null)

  // Line anchor drag state
  const [draggingAnchor, setDraggingAnchor] = useState<{
    lineId: string; pointIndex: number
    startX: number; startY: number
    origX: number; origY: number
  } | null>(null)

  // Shape drag state
  const [draggingShape, setDraggingShape] = useState<{
    id: string; mode: 'move' | 'anchor'; anchorIndex: number
    startX: number; startY: number
    origX: number; origY: number; origW: number; origH: number
  } | null>(null)

  // Shape drawing preview
  const [drawingShape, setDrawingShape] = useState<{
    type: 'rect' | 'ellipse'
    startX: number; startY: number; currentX: number; currentY: number
  } | null>(null)

  // Line drawing state
  const [lineColor, setLineColor] = useState('#ef4444')
  const [lineWidth, setLineWidth] = useState(1)
  const [lineDash, setLineDash] = useState(false)
  const [drawingLine, setDrawingLine] = useState<{ x: number; y: number }[] | null>(null)

  // Shape options
  const [shapeColor, setShapeColor] = useState('#ef4444')
  const [shapeOpacity, setShapeOpacity] = useState(0.25)
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(1)
  const [shapeDash, setShapeDash] = useState(false)

  const { markers, lines } = annotations
  const shapes = annotations.shapes ?? []
  const setMarkers = (m: Marker[]) => onChange({ ...annotations, markers: m })
  const setLines = (l: Line[]) => onChange({ ...annotations, lines: l })
  const setShapes = (s: Shape[]) => onChange({ ...annotations, shapes: s })

  const deselect = () => { setSelectedType(null); setSelectedId(null) }

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

    // Shape drawing tools
    if (tool === 'rect' || tool === 'ellipse') {
      e.preventDefault()
      setDrawingShape({ type: tool, startX: mx, startY: my, currentX: mx, currentY: my })
      return
    }

    // Line tool: add point
    if (tool === 'line') {
      e.preventDefault()
      const nx = mx / size.width, ny = my / size.height
      setDrawingLine(drawingLine ? [...drawingLine, { x: nx, y: ny }] : [{ x: nx, y: ny }])
      return
    }

    // Check anchor points of selected line first
    if (selectedType === 'line' && selectedId) {
      const line = lines.find(l => l.id === selectedId)
      if (line) {
        const ai = hitTestLineAnchor(mx, my, line, size.width, size.height)
        if (ai >= 0) {
          e.preventDefault()
          setDraggingAnchor({ lineId: selectedId, pointIndex: ai, startX: mx, startY: my, origX: line.points[ai].x, origY: line.points[ai].y })
          return
        }
      }
    }

    // Check anchor points of selected shape first
    if (selectedType === 'shape' && selectedId) {
      const shape = shapes.find(s => s.id === selectedId)
      if (shape) {
        const ai = hitTestShapeAnchor(mx, my, shape, size.width, size.height)
        if (ai >= 0) {
          e.preventDefault()
          setDraggingShape({ id: selectedId, mode: 'anchor', anchorIndex: ai, startX: mx, startY: my, origX: shape.x, origY: shape.y, origW: shape.w, origH: shape.h })
          return
        }
        if (hitTestShape(mx, my, shape, size.width, size.height)) {
          e.preventDefault()
          setDraggingShape({ id: selectedId, mode: 'move', anchorIndex: -1, startX: mx, startY: my, origX: shape.x, origY: shape.y, origW: shape.w, origH: shape.h })
          return
        }
      }
    }

    // Check markers
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i]
      const hit = hitTestMarker(mx, my, m, size.width, size.height)
      if (hit) {
        e.preventDefault()
        setSelectedType('marker'); setSelectedId(m.id); setTool(null)
        setDragging({ id: m.id, mode: hit === 'resize' ? 'resize' : 'move', startX: mx, startY: my, origX: m.x, origY: m.y, origSize: m.size })
        return
      }
    }

    // Check shapes
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i]
      if (hitTestShape(mx, my, shape, size.width, size.height)) {
        e.preventDefault()
        setSelectedType('shape'); setSelectedId(shape.id); setTool(null)
        setDraggingShape({ id: shape.id, mode: 'move', anchorIndex: -1, startX: mx, startY: my, origX: shape.x, origY: shape.y, origW: shape.w, origH: shape.h })
        return
      }
    }

    // Check lines
    for (let i = lines.length - 1; i >= 0; i--) {
      if (hitTestLine(mx, my, lines[i], size.width, size.height)) {
        e.preventDefault()
        setSelectedType('line'); setSelectedId(lines[i].id); setTool(null)
        return
      }
    }

    // Place new marker
    if (tool === 'buy' || tool === 'sell') {
      const nx = mx / size.width, ny = my / size.height
      const newMarker: Marker = { id: crypto.randomUUID(), type: tool, x: nx, y: ny, size: 1, label: '' }
      setMarkers([...markers, newMarker])
      setSelectedType('marker'); setSelectedId(newMarker.id)
      setEditingMarker(newMarker.id); setLabelInput('')
      return
    }

    deselect()
  }

  const applyShapeAnchorResize = (anchorIndex: number, mx: number, my: number, origX: number, origY: number, origW: number, origH: number) => {
    const mnx = mx / size.width, mny = my / size.height
    const ox2 = origX + origW, oy2 = origY + origH
    let nx = origX, ny = origY, nw = origW, nh = origH
    if (anchorIndex === 0) { nx = mnx; ny = mny; nw = ox2 - mnx; nh = oy2 - mny }
    else if (anchorIndex === 1) { ny = mny; nh = oy2 - mny }
    else if (anchorIndex === 2) { ny = mny; nw = mnx - origX; nh = oy2 - mny }
    else if (anchorIndex === 3) { nx = mnx; nw = ox2 - mnx }
    else if (anchorIndex === 4) { nw = mnx - origX }
    else if (anchorIndex === 5) { nx = mnx; nw = ox2 - mnx; nh = mny - origY }
    else if (anchorIndex === 6) { nh = mny - origY }
    else if (anchorIndex === 7) { nw = mnx - origX; nh = mny - origY }
    if (nw < 0) { nx = nx + nw; nw = Math.abs(nw) }
    if (nh < 0) { ny = ny + nh; nh = Math.abs(nh) }
    nx = Math.max(0, Math.min(1, nx)); ny = Math.max(0, Math.min(1, ny))
    nw = Math.max(0.01, Math.min(1 - nx, nw)); nh = Math.max(0.01, Math.min(1 - ny, nh))
    return { nx, ny, nw, nh }
  }

  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x: mx, y: my, screenX, screenY } = getSvgPos(e)

    if (dragging) {
      e.preventDefault()
      const marker = markers.find(m => m.id === dragging.id)
      if (!marker) return
      if (dragging.mode === 'move') {
        const nx = Math.max(0, Math.min(1, dragging.origX + (mx - dragging.startX) / size.width))
        const ny = Math.max(0, Math.min(1, dragging.origY + (my - dragging.startY) / size.height))
        setMarkers(markers.map(m => m.id === dragging.id ? { ...m, x: nx, y: ny } : m))
      } else {
        const cx = marker.x * size.width, cy = marker.y * size.height
        const origDist = Math.hypot(dragging.startX - cx, dragging.startY - cy)
        const newDist = Math.hypot(mx - cx, my - cy)
        const ratio = origDist > 10 ? newDist / origDist : 1
        setMarkers(markers.map(m => m.id === dragging.id ? { ...m, size: Math.max(0.4, Math.min(4, dragging.origSize * ratio)) } : m))
      }
      return
    }

    if (draggingAnchor) {
      e.preventDefault()
      const nx = Math.max(0, Math.min(1, draggingAnchor.origX + (mx - draggingAnchor.startX) / size.width))
      const ny = Math.max(0, Math.min(1, draggingAnchor.origY + (my - draggingAnchor.startY) / size.height))
      setLines(lines.map(l => {
        if (l.id !== draggingAnchor.lineId) return l
        const pts = [...l.points]
        pts[draggingAnchor.pointIndex] = { x: nx, y: ny }
        return { ...l, points: pts }
      }))
      return
    }

    if (draggingShape) {
      e.preventDefault()
      const shape = shapes.find(s => s.id === draggingShape.id)
      if (!shape) return
      if (draggingShape.mode === 'move') {
        const nx = Math.max(0, Math.min(1 - shape.w, draggingShape.origX + (mx - draggingShape.startX) / size.width))
        const ny = Math.max(0, Math.min(1 - shape.h, draggingShape.origY + (my - draggingShape.startY) / size.height))
        setShapes(shapes.map(s => s.id === draggingShape.id ? { ...s, x: nx, y: ny } : s))
      } else {
        const { nx, ny, nw, nh } = applyShapeAnchorResize(draggingShape.anchorIndex, mx, my, draggingShape.origX, draggingShape.origY, draggingShape.origW, draggingShape.origH)
        setShapes(shapes.map(s => s.id === draggingShape.id ? { ...s, x: nx, y: ny, w: nw, h: nh } : s))
      }
      return
    }

    if (drawingShape) {
      setDrawingShape({ ...drawingShape, currentX: mx, currentY: my })
      return
    }

    // Hover tooltip
    let found = false
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i]
      if (m.label && hitTestMarker(mx, my, m, size.width, size.height) === 'body') {
        setHoveredId(m.id); setTooltipPos({ x: screenX, y: screenY }); found = true; break
      }
    }
    if (!found) { setHoveredId(null); setTooltipPos(null) }
  }

  const handlePointerUp = () => {
    if (drawingShape) {
      const { type, startX, startY, currentX, currentY } = drawingShape
      const x = Math.min(startX, currentX) / size.width
      const y = Math.min(startY, currentY) / size.height
      const w = Math.abs(currentX - startX) / size.width
      const h = Math.abs(currentY - startY) / size.height
      if (w > 0.01 && h > 0.01) {
        const newShape: Shape = { id: crypto.randomUUID(), type, x, y, w, h, color: shapeColor, opacity: shapeOpacity, strokeWidth: shapeStrokeWidth, dash: shapeDash }
        setShapes([...shapes, newShape])
        setSelectedType('shape'); setSelectedId(newShape.id)
      }
      setDrawingShape(null)
      return
    }
    setDragging(null); setDraggingAnchor(null); setDraggingShape(null)
  }

  // Line tool: double-click to finish
  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'line' && drawingLine && drawingLine.length >= 2) {
      e.preventDefault()
      finishLine()
    }
  }

  // Touch handlers mirror mouse handlers
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length !== 1) return
    const { x: mx, y: my } = getSvgPos(e)

    if (tool === 'rect' || tool === 'ellipse') {
      e.preventDefault()
      setDrawingShape({ type: tool, startX: mx, startY: my, currentX: mx, currentY: my })
      return
    }
    if (tool === 'line') {
      e.preventDefault()
      setDrawingLine(drawingLine ? [...drawingLine, { x: mx / size.width, y: my / size.height }] : [{ x: mx / size.width, y: my / size.height }])
      return
    }
    if (selectedType === 'line' && selectedId) {
      const line = lines.find(l => l.id === selectedId)
      if (line) {
        const ai = hitTestLineAnchor(mx, my, line, size.width, size.height)
        if (ai >= 0) { e.preventDefault(); setDraggingAnchor({ lineId: selectedId, pointIndex: ai, startX: mx, startY: my, origX: line.points[ai].x, origY: line.points[ai].y }); return }
      }
    }
    if (selectedType === 'shape' && selectedId) {
      const shape = shapes.find(s => s.id === selectedId)
      if (shape) {
        const ai = hitTestShapeAnchor(mx, my, shape, size.width, size.height)
        if (ai >= 0) { e.preventDefault(); setDraggingShape({ id: selectedId, mode: 'anchor', anchorIndex: ai, startX: mx, startY: my, origX: shape.x, origY: shape.y, origW: shape.w, origH: shape.h }); return }
        if (hitTestShape(mx, my, shape, size.width, size.height)) { e.preventDefault(); setDraggingShape({ id: selectedId, mode: 'move', anchorIndex: -1, startX: mx, startY: my, origX: shape.x, origY: shape.y, origW: shape.w, origH: shape.h }); return }
      }
    }
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i], hit = hitTestMarker(mx, my, m, size.width, size.height)
      if (hit) { e.preventDefault(); setSelectedType('marker'); setSelectedId(m.id); setTool(null); setDragging({ id: m.id, mode: hit === 'resize' ? 'resize' : 'move', startX: mx, startY: my, origX: m.x, origY: m.y, origSize: m.size }); return }
    }
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitTestShape(mx, my, shapes[i], size.width, size.height)) { e.preventDefault(); setSelectedType('shape'); setSelectedId(shapes[i].id); setTool(null); setDraggingShape({ id: shapes[i].id, mode: 'move', anchorIndex: -1, startX: mx, startY: my, origX: shapes[i].x, origY: shapes[i].y, origW: shapes[i].w, origH: shapes[i].h }); return }
    }
    for (let i = lines.length - 1; i >= 0; i--) {
      if (hitTestLine(mx, my, lines[i], size.width, size.height)) { e.preventDefault(); setSelectedType('line'); setSelectedId(lines[i].id); setTool(null); return }
    }
    if (tool === 'buy' || tool === 'sell') {
      const newMarker: Marker = { id: crypto.randomUUID(), type: tool, x: mx / size.width, y: my / size.height, size: 1, label: '' }
      setMarkers([...markers, newMarker]); setSelectedType('marker'); setSelectedId(newMarker.id); setEditingMarker(newMarker.id); setLabelInput('')
      return
    }
    deselect()
  }

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length !== 1) return
    const { x: mx, y: my } = getSvgPos(e)
    if (dragging) {
      e.preventDefault()
      const marker = markers.find(m => m.id === dragging.id)
      if (!marker) return
      if (dragging.mode === 'move') {
        setMarkers(markers.map(m => m.id === dragging.id ? { ...m, x: Math.max(0, Math.min(1, dragging.origX + (mx - dragging.startX) / size.width)), y: Math.max(0, Math.min(1, dragging.origY + (my - dragging.startY) / size.height)) } : m))
      } else {
        const cx = marker.x * size.width, cy = marker.y * size.height
        const ratio = Math.hypot(dragging.startX - cx, dragging.startY - cy) > 10 ? Math.hypot(mx - cx, my - cy) / Math.hypot(dragging.startX - cx, dragging.startY - cy) : 1
        setMarkers(markers.map(m => m.id === dragging.id ? { ...m, size: Math.max(0.4, Math.min(4, dragging.origSize * ratio)) } : m))
      }
      return
    }
    if (draggingAnchor) {
      e.preventDefault()
      const nx = Math.max(0, Math.min(1, draggingAnchor.origX + (mx - draggingAnchor.startX) / size.width))
      const ny = Math.max(0, Math.min(1, draggingAnchor.origY + (my - draggingAnchor.startY) / size.height))
      setLines(lines.map(l => { if (l.id !== draggingAnchor.lineId) return l; const pts = [...l.points]; pts[draggingAnchor.pointIndex] = { x: nx, y: ny }; return { ...l, points: pts } }))
      return
    }
    if (draggingShape) {
      e.preventDefault()
      const shape = shapes.find(s => s.id === draggingShape.id)
      if (!shape) return
      if (draggingShape.mode === 'move') {
        setShapes(shapes.map(s => s.id === draggingShape.id ? { ...s, x: Math.max(0, Math.min(1 - shape.w, draggingShape.origX + (mx - draggingShape.startX) / size.width)), y: Math.max(0, Math.min(1 - shape.h, draggingShape.origY + (my - draggingShape.startY) / size.height)) } : s))
      } else {
        const { nx, ny, nw, nh } = applyShapeAnchorResize(draggingShape.anchorIndex, mx, my, draggingShape.origX, draggingShape.origY, draggingShape.origW, draggingShape.origH)
        setShapes(shapes.map(s => s.id === draggingShape.id ? { ...s, x: nx, y: ny, w: nw, h: nh } : s))
      }
      return
    }
    if (drawingShape) { e.preventDefault(); setDrawingShape({ ...drawingShape, currentX: mx, currentY: my }) }
  }

  const handleLabelSave = () => {
    if (!editingMarker) return
    setMarkers(markers.map(m => m.id === editingMarker ? { ...m, label: labelInput } : m))
    setEditingMarker(null); setLabelInput('')
  }
  const handleLabelSkip = () => { setEditingMarker(null); setLabelInput('') }
  const handleEditLabel = () => {
    if (!selectedId) return
    const m = markers.find(m => m.id === selectedId)
    if (!m) return
    setEditingMarker(selectedId); setLabelInput(m.label)
  }

  const handleDeleteSelected = () => {
    if (!selectedId) return
    if (selectedType === 'marker') setMarkers(markers.filter(m => m.id !== selectedId))
    else if (selectedType === 'line') setLines(lines.filter(l => l.id !== selectedId))
    else if (selectedType === 'shape') setShapes(shapes.filter(s => s.id !== selectedId))
    deselect()
  }

  const toggleSelectedLineDash = () => {
    if (selectedType !== 'line' || !selectedId) return
    setLines(lines.map(l => l.id === selectedId ? { ...l, dash: !l.dash } : l))
  }
  const toggleSelectedShapeDash = () => {
    if (selectedType !== 'shape' || !selectedId) return
    setShapes(shapes.map(s => s.id === selectedId ? { ...s, dash: !s.dash } : s))
  }

  const handleUndo = () => {
    if (tool === 'line' && drawingLine) {
      drawingLine.length > 1 ? setDrawingLine(drawingLine.slice(0, -1)) : setDrawingLine(null)
      return
    }
    if (shapes.length > 0 && shapes.length >= lines.length && shapes.length >= markers.length) setShapes(shapes.slice(0, -1))
    else if (markers.length > 0 && markers.length >= lines.length) setMarkers(markers.slice(0, -1))
    else if (lines.length > 0) setLines(lines.slice(0, -1))
    deselect(); setEditingMarker(null)
  }

  const finishLine = () => {
    if (drawingLine && drawingLine.length >= 2) {
      setLines([...lines, { id: crypto.randomUUID(), points: drawingLine, color: lineColor, width: lineWidth, dash: lineDash }])
    }
    setDrawingLine(null)
  }

  const handleSave = () => {
    const finalLines = drawingLine && drawingLine.length >= 2
      ? [...lines, { id: crypto.randomUUID(), points: drawingLine, color: lineColor, width: lineWidth, dash: lineDash }]
      : lines
    onSave({ markers, lines: finalLines, shapes })
  }

  const selectedMarker = selectedType === 'marker' && selectedId ? markers.find(m => m.id === selectedId) : null
  const selectedLine = selectedType === 'line' && selectedId ? lines.find(l => l.id === selectedId) : null
  const selectedShape = selectedType === 'shape' && selectedId ? shapes.find(s => s.id === selectedId) : null
  const tooltipMarker = hoveredId ? markers.find(m => m.id === hoveredId) : null
  const isAnyDragging = !!(dragging || draggingAnchor || draggingShape)

  const renderShape = (shape: Shape, isSelected: boolean) => {
    const sx = shape.x * size.width, sy = shape.y * size.height
    const sw = shape.w * size.width, sh = shape.h * size.height
    const stroke = shape.strokeWidth > 0 ? shape.color : 'none'
    const strokeDash = shape.dash ? '8 4' : undefined
    const shapeEl = shape.type === 'rect' ? (
      <rect x={sx} y={sy} width={sw} height={sh} fill={shape.color} fillOpacity={shape.opacity}
        stroke={stroke} strokeWidth={shape.strokeWidth > 0 ? shape.strokeWidth : undefined} strokeDasharray={strokeDash} />
    ) : (
      <ellipse cx={sx + sw / 2} cy={sy + sh / 2} rx={Math.abs(sw / 2)} ry={Math.abs(sh / 2)}
        fill={shape.color} fillOpacity={shape.opacity}
        stroke={stroke} strokeWidth={shape.strokeWidth > 0 ? shape.strokeWidth : undefined} strokeDasharray={strokeDash} />
    )
    if (!isSelected) return <g key={shape.id}>{shapeEl}</g>
    const anchors = getShapeAnchors(shape, size.width, size.height)
    return (
      <g key={shape.id}>
        {shapeEl}
        <rect x={sx} y={sy} width={sw} height={sh} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1} strokeDasharray="4 4" />
        {anchors.map((a, i) => <circle key={i} cx={a.x} cy={a.y} r={6} fill="#fff" stroke="#666" strokeWidth={1.5} />)}
      </g>
    )
  }

  const renderLine = (line: Line, isSelected: boolean) => {
    const pts = line.points.map(p => `${p.x * size.width},${p.y * size.height}`).join(' ')
    return (
      <g key={line.id}>
        <polyline points={pts} fill="none" stroke={line.color} strokeWidth={Math.max(1, 2 * line.width)}
          strokeLinecap="round" strokeLinejoin="round" strokeDasharray={line.dash ? '8 4' : undefined} />
        {isSelected && line.points.map((p, i) => (
          <circle key={i} cx={p.x * size.width} cy={p.y * size.height} r={6} fill="#fff" stroke="#666" strokeWidth={1.5} />
        ))}
      </g>
    )
  }

  const renderDrawingShapePreview = () => {
    if (!drawingShape) return null
    const { type, startX, startY, currentX, currentY } = drawingShape
    const sx = Math.min(startX, currentX), sy = Math.min(startY, currentY)
    const sw = Math.abs(currentX - startX), sh = Math.abs(currentY - startY)
    if (type === 'rect') return <rect x={sx} y={sy} width={sw} height={sh} fill={shapeColor} fillOpacity={shapeOpacity * 0.7} stroke={shapeColor} strokeWidth={1} strokeDasharray="6 3" opacity={0.8} />
    return <ellipse cx={sx + sw / 2} cy={sy + sh / 2} rx={sw / 2} ry={sh / 2} fill={shapeColor} fillOpacity={shapeOpacity * 0.7} stroke={shapeColor} strokeWidth={1} strokeDasharray="6 3" opacity={0.8} />
  }

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

  const isShapeTool = tool === 'rect' || tool === 'ellipse'

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button type="button" size="sm" variant={tool === 'buy' ? 'default' : 'outline'}
          className={cn(tool === 'buy' && 'bg-profit hover:bg-profit/90 text-white')}
          onClick={() => { setTool(tool === 'buy' ? null : 'buy'); deselect(); finishLine() }}>
          <ArrowUp className="h-4 w-4 mr-1" />Mua
        </Button>
        <Button type="button" size="sm" variant={tool === 'sell' ? 'default' : 'outline'}
          className={cn(tool === 'sell' && 'bg-loss hover:bg-loss/90 text-white')}
          onClick={() => { setTool(tool === 'sell' ? null : 'sell'); deselect(); finishLine() }}>
          <ArrowDown className="h-4 w-4 mr-1" />Bán
        </Button>
        <Button type="button" size="sm" variant={tool === 'line' ? 'default' : 'outline'}
          onClick={() => { if (tool === 'line') { finishLine(); setTool(null) } else { setTool('line'); deselect() } }}>
          <Pen className="h-4 w-4 mr-1" />Đường
        </Button>
        <Button type="button" size="sm" variant={tool === 'rect' ? 'default' : 'outline'}
          onClick={() => { setTool(tool === 'rect' ? null : 'rect'); deselect(); finishLine() }}>
          <Square className="h-4 w-4 mr-1" />HCN
        </Button>
        <Button type="button" size="sm" variant={tool === 'ellipse' ? 'default' : 'outline'}
          onClick={() => { setTool(tool === 'ellipse' ? null : 'ellipse'); deselect(); finishLine() }}>
          <Circle className="h-4 w-4 mr-1" />Elip
        </Button>

        {/* Line options */}
        {tool === 'line' && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex gap-1">
              {Object.keys(LINE_COLORS).map((c) => (
                <button key={c} type="button"
                  className={cn('w-5 h-5 rounded-full border-2 transition-transform', lineColor === c ? 'border-white scale-125' : 'border-transparent')}
                  style={{ backgroundColor: c }} onClick={() => setLineColor(c)} />
              ))}
            </div>
            <div className="flex gap-1">
              {LINE_WIDTHS.map(({ label, value }) => (
                <Button key={value} type="button" size="sm" variant={lineWidth === value ? 'default' : 'outline'}
                  className="h-6 px-2 text-xs" onClick={() => setLineWidth(value)}>{label}</Button>
              ))}
            </div>
            <Button type="button" size="sm" variant={lineDash ? 'default' : 'outline'} className="h-6 px-2 text-xs" onClick={() => setLineDash(!lineDash)}>- - -</Button>
            {drawingLine && drawingLine.length >= 2 && (
              <Button type="button" size="sm" variant="outline" onClick={finishLine}><Check className="h-3 w-3 mr-1" />Xong</Button>
            )}
          </>
        )}

        {/* Shape options */}
        {isShapeTool && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex gap-1">
              {Object.keys(LINE_COLORS).map((c) => (
                <button key={c} type="button"
                  className={cn('w-5 h-5 rounded-full border-2 transition-transform', shapeColor === c ? 'border-white scale-125' : 'border-transparent')}
                  style={{ backgroundColor: c }} onClick={() => setShapeColor(c)} />
              ))}
            </div>
            <div className="flex gap-1">
              {SHAPE_OPACITIES.map(({ label, value }) => (
                <Button key={value} type="button" size="sm" variant={shapeOpacity === value ? 'default' : 'outline'}
                  className="h-6 px-2 text-xs" onClick={() => setShapeOpacity(value)}>{label}</Button>
              ))}
            </div>
            <div className="flex gap-1">
              {SHAPE_STROKE_WIDTHS.map(({ label, value }) => (
                <Button key={value} type="button" size="sm" variant={shapeStrokeWidth === value ? 'default' : 'outline'}
                  className="h-6 px-2 text-xs" onClick={() => setShapeStrokeWidth(value)}>{label}</Button>
              ))}
            </div>
            <Button type="button" size="sm" variant={shapeDash ? 'default' : 'outline'} className="h-6 px-2 text-xs" onClick={() => setShapeDash(!shapeDash)}>- - -</Button>
          </>
        )}

        {/* Selected marker actions */}
        {selectedMarker && !editingMarker && (
          <>
            <div className="w-px h-6 bg-border" />
            <Button type="button" size="sm" variant="outline" onClick={handleEditLabel}>
              <Type className="h-4 w-4 mr-1" />{selectedMarker.label ? 'Sửa chú thích' : 'Thêm chú thích'}
            </Button>
            <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={handleDeleteSelected}><Trash2 className="h-4 w-4" /></Button>
          </>
        )}

        {/* Selected line actions */}
        {selectedLine && (
          <>
            <div className="w-px h-6 bg-border" />
            <Button type="button" size="sm" variant={selectedLine.dash ? 'default' : 'outline'} className="h-6 px-2 text-xs" onClick={toggleSelectedLineDash}>- - -</Button>
            <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={handleDeleteSelected}><Trash2 className="h-4 w-4" /></Button>
          </>
        )}

        {/* Selected shape actions */}
        {selectedShape && (
          <>
            <div className="w-px h-6 bg-border" />
            <Button type="button" size="sm" variant={selectedShape.dash ? 'default' : 'outline'} className="h-6 px-2 text-xs" onClick={toggleSelectedShapeDash}>- - -</Button>
            <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={handleDeleteSelected}><Trash2 className="h-4 w-4" /></Button>
          </>
        )}

        {!selectedId && tool !== 'line' && (
          <Button type="button" size="sm" variant="outline" onClick={handleUndo}
            disabled={markers.length === 0 && lines.length === 0 && shapes.length === 0}>
            <Undo2 className="h-4 w-4 mr-1" />Hoàn tác
          </Button>
        )}

        <div className="flex-1" />
        <Button type="button" size="sm" variant="outline" onClick={onClose}><X className="h-4 w-4 mr-1" />Huỷ</Button>
        <Button type="button" size="sm" onClick={handleSave}><Check className="h-4 w-4 mr-1" />Lưu</Button>
      </div>

      {/* Label input */}
      {editingMarker && (
        <div className="flex gap-2 items-center bg-muted/50 rounded-lg p-2">
          <Type className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input value={labelInput} onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Nhập chú thích (Enter để lưu)..." className="h-8 text-sm" autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleLabelSave(); if (e.key === 'Escape') handleLabelSkip() }} />
          <Button type="button" size="sm" variant="ghost" onClick={handleLabelSave}>Lưu</Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleLabelSkip}>Bỏ qua</Button>
        </div>
      )}

      {/* Image + SVG overlay */}
      <div ref={containerRef} className="w-full relative">
        <img src={imageSrc} alt="Chart" className="w-full rounded-lg border" onLoad={updateSize} draggable={false} />
        {size.width > 0 && (
          <svg
            className={cn('absolute inset-0 w-full h-full touch-none', tool ? 'cursor-crosshair' : isAnyDragging ? 'cursor-grabbing' : 'cursor-default')}
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
            {/* Shapes (bottom layer) */}
            {shapes.map((shape) => renderShape(shape, shape.id === selectedId && selectedType === 'shape'))}
            {/* Lines */}
            {lines.map((line) => renderLine(line, line.id === selectedId && selectedType === 'line'))}
            {/* Drawing line preview */}
            {drawingLine && drawingLine.length > 0 && (
              <polyline points={drawingLine.map(p => `${p.x * size.width},${p.y * size.height}`).join(' ')}
                fill="none" stroke={lineColor} strokeWidth={Math.max(1, 2 * lineWidth)}
                strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" opacity={0.7} />
            )}
            {/* Markers (top layer) */}
            {markers.map((marker) => renderArrow(marker, marker.id === selectedId && selectedType === 'marker'))}
            {/* Shape drawing preview */}
            {renderDrawingShapePreview()}
          </svg>
        )}

        {tooltipMarker && tooltipPos && !isAnyDragging && (
          <div className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border max-w-[200px]"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 30 }}>
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
      {tool === 'line' && <p className="text-xs text-muted-foreground text-center">Nhấp để thêm điểm · Nhấp đúp hoặc bấm "Xong" để kết thúc đường</p>}
      {isShapeTool && <p className="text-xs text-muted-foreground text-center">Kéo để vẽ {tool === 'rect' ? 'hình chữ nhật' : 'hình elip'}</p>}
      {selectedId && !tool && !editingMarker && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Move className="h-3 w-3" /> Kéo để di chuyển · {selectedType !== 'marker' ? 'Kéo điểm neo để chỉnh sửa · ' : 'Kéo góc để resize · '}Nhấp ngoài để bỏ chọn
        </p>
      )}
    </div>
  )
}

export type { Marker, Line, Shape, ScreenshotAnnotation }
