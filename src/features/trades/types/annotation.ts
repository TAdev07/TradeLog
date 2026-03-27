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
}

export interface ScreenshotAnnotation {
  markers: Marker[]
  lines: Line[]
}
