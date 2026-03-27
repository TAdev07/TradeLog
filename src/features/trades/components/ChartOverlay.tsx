import { useState, useRef, useEffect, useCallback } from 'react'
import type { ScreenshotAnnotation, Marker, Line } from '../types/annotation'

interface ChartOverlayProps {
  imageSrc: string
  annotations: ScreenshotAnnotation
  className?: string
}

const LINE_COLORS: Record<string, string> = {
  '#ef4444': '#ef4444',
  '#22c55e': '#22c55e',
  '#eab308': '#eab308',
  '#ffffff': '#ffffff',
  '#3b82f6': '#3b82f6',
}

function ArrowMarkerSvg({
  marker,
  containerWidth,
  containerHeight,
  onHover,
  onLeave,
}: {
  marker: Marker
  containerWidth: number
  containerHeight: number
  onHover: (e: React.MouseEvent | React.TouchEvent) => void
  onLeave: () => void
}) {
  const isBuy = marker.type === 'buy'
  const color = isBuy ? '#4ade80' : '#f87171'
  const cx = marker.x * containerWidth
  const cy = marker.y * containerHeight
  const baseSize = Math.max(16, containerWidth * 0.03) * marker.size

  // Arrow shape points (same geometry as canvas version)
  const points = isBuy
    ? [
        [0, -1],
        [-0.6, 0.3],
        [-0.2, 0.3],
        [-0.2, 1],
        [0.2, 1],
        [0.2, 0.3],
        [0.6, 0.3],
      ]
    : [
        [0, 1],
        [-0.6, -0.3],
        [-0.2, -0.3],
        [-0.2, -1],
        [0.2, -1],
        [0.2, -0.3],
        [0.6, -0.3],
      ]

  const pointsStr = points
    .map(([dx, dy]) => `${cx + dx * baseSize},${cy + dy * baseSize}`)
    .join(' ')

  // Label indicator dot
  const dotY = isBuy ? cy - baseSize - 6 : cy + baseSize + 6

  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      style={{ cursor: marker.label ? 'pointer' : 'default' }}
    >
      <polygon
        points={pointsStr}
        fill={color}
        stroke={color}
        strokeWidth={2}
      />
      {marker.label && (
        <circle
          cx={cx}
          cy={dotY}
          r={4}
          fill="#fff"
          stroke={color}
          strokeWidth={1.5}
        />
      )}
    </g>
  )
}

function LineSvg({ line, containerWidth, containerHeight }: {
  line: Line
  containerWidth: number
  containerHeight: number
}) {
  if (line.points.length < 2) return null
  const pointsStr = line.points
    .map((p) => `${p.x * containerWidth},${p.y * containerHeight}`)
    .join(' ')

  return (
    <polyline
      points={pointsStr}
      fill="none"
      stroke={line.color}
      strokeWidth={Math.max(1, 2 * line.width)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

export function ChartOverlay({ imageSrc, annotations, className }: ChartOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

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

  const handleImageLoad = () => updateSize()

  const handleMarkerHover = (marker: Marker) => (e: React.MouseEvent | React.TouchEvent) => {
    if (!marker.label) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    setTooltip({
      text: marker.label,
      x: clientX - rect.left,
      y: clientY - rect.top,
    })
  }

  const hasAnnotations = annotations.markers.length > 0 || annotations.lines.length > 0

  return (
    <div ref={containerRef} className={`relative inline-block ${className ?? ''}`}>
      <img
        src={imageSrc}
        alt="Chart"
        className="w-full rounded-lg"
        onLoad={handleImageLoad}
        draggable={false}
      />
      {hasAnnotations && size.width > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
        >
          {annotations.lines.map((line) => (
            <LineSvg
              key={line.id}
              line={line}
              containerWidth={size.width}
              containerHeight={size.height}
            />
          ))}
          {annotations.markers.map((marker) => (
            <g key={marker.id} style={{ pointerEvents: 'auto' }}>
              <ArrowMarkerSvg
                marker={marker}
                containerWidth={size.width}
                containerHeight={size.height}
                onHover={handleMarkerHover(marker)}
                onLeave={() => setTooltip(null)}
              />
            </g>
          ))}
        </svg>
      )}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none px-2.5 py-1.5 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border max-w-[200px]"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 30,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

export { LINE_COLORS }
