export interface Marker {
  id: string
  type: 'buy' | 'sell'
  x: number // percentage 0-1
  y: number // percentage 0-1
  size: number // scale factor, default 1
  label: string
}

export interface Line {
  id: string
  points: { x: number; y: number }[] // percentage 0-1, min 2 points
  color: string // hex color
  width: number // scale factor, default 1
  dash: boolean
}

export type ShapeType = 'rect' | 'ellipse'

export interface Shape {
  id: string
  type: ShapeType
  x: number      // top-left x (0-1)
  y: number      // top-left y (0-1)
  w: number      // width (0-1)
  h: number      // height (0-1)
  color: string
  opacity: number // fill opacity (0.1-0.5)
  strokeWidth: number // 0 = no border, 0.5/1/2
  dash: boolean
}

export interface ScreenshotAnnotation {
  markers: Marker[]
  lines: Line[]
  shapes: Shape[]
}
