import { useRef, useState } from 'react'
import { ImagePlus, X, Pencil, ZoomIn, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChartAnnotator } from './ChartAnnotator'
import { ChartOverlay } from './ChartOverlay'
import { resizeImage } from '@/lib/image-utils'
import type { Marker, Line, Shape, ScreenshotAnnotation } from '../types/annotation'

export interface LocalScreenshot {
  id: string
  /** Data URL for local preview (original image, no baked markers) */
  previewUrl: string
  /** The resized Blob ready for upload (original, no baked markers) */
  blob: Blob
  /** Annotation markers */
  markers: Marker[]
  /** Annotation lines */
  lines: Line[]
  /** Annotation shapes */
  shapes: Shape[]
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
          lines: [],
          shapes: [],
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

  const handleAnnotationSave = (index: number, annotations: ScreenshotAnnotation) => {
    const updated = [...screenshots]
    updated[index] = {
      ...updated[index],
      markers: annotations.markers,
      lines: annotations.lines,
      shapes: annotations.shapes ?? [],
    }
    onChange(updated)
    setEditingIndex(null)
  }

  const editingScreenshot = editingIndex !== null ? screenshots[editingIndex] : null
  const previewScreenshot = previewIndex !== null ? screenshots[previewIndex] : null

  const openFullscreen = (screenshot: LocalScreenshot) => {
    const win = window.open('', '_blank')
    if (!win) return
    const markersJson = JSON.stringify(screenshot.markers)
    const linesJson = JSON.stringify(screenshot.lines)
    const shapesJson = JSON.stringify(screenshot.shapes ?? [])
    win.document.write(`<!DOCTYPE html><html><head><title>Preview</title>
<style>*{margin:0;padding:0;background:#000}.container{position:relative;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}img{max-width:100vw;max-height:100vh;object-fit:contain}</style></head><body>
<div class="container" id="c"><img id="img" src="${screenshot.previewUrl}" /></div>
<script>
  var img=document.getElementById('img'),markers=${markersJson},lines=${linesJson},shapes=${shapesJson};
  img.onload=function(){
    var w=img.clientWidth,h=img.clientHeight;
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 '+w+' '+h);
    var rect=img.getBoundingClientRect();
    svg.style.cssText='position:absolute;width:'+w+'px;height:'+h+'px;left:'+rect.left+'px;top:'+rect.top+'px;pointer-events:none';
    shapes.forEach(function(s){
      var el,sx=s.x*w,sy=s.y*h,sw=s.w*w,sh=s.h*h,stroke=s.strokeWidth>0?s.color:'none',dash=s.dash?'8 4':'';
      if(s.type==='rect'){el=document.createElementNS('http://www.w3.org/2000/svg','rect');el.setAttribute('x',sx);el.setAttribute('y',sy);el.setAttribute('width',sw);el.setAttribute('height',sh);}
      else{el=document.createElementNS('http://www.w3.org/2000/svg','ellipse');el.setAttribute('cx',sx+sw/2);el.setAttribute('cy',sy+sh/2);el.setAttribute('rx',Math.abs(sw/2));el.setAttribute('ry',Math.abs(sh/2));}
      el.setAttribute('fill',s.color);el.setAttribute('fill-opacity',s.opacity);el.setAttribute('stroke',stroke);if(s.strokeWidth>0)el.setAttribute('stroke-width',s.strokeWidth);if(dash)el.setAttribute('stroke-dasharray',dash);
      svg.appendChild(el);
    });
    lines.forEach(function(line){
      if(line.points.length<2)return;
      var pl=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      pl.setAttribute('points',line.points.map(function(p){return(p.x*w)+','+(p.y*h)}).join(' '));
      pl.setAttribute('fill','none');pl.setAttribute('stroke',line.color);pl.setAttribute('stroke-width',Math.max(1,2*line.width));pl.setAttribute('stroke-linecap','round');
      if(line.dash)pl.setAttribute('stroke-dasharray','8 4');
      svg.appendChild(pl);
    });
    markers.forEach(function(m){
      var isBuy=m.type==='buy',color=isBuy?'#4ade80':'#f87171',cx=m.x*w,cy=m.y*h,s=Math.max(16,w*0.03)*m.size;
      var pts=isBuy?[[0,-1],[-0.6,0.3],[-0.2,0.3],[-0.2,1],[0.2,1],[0.2,0.3],[0.6,0.3]]:[[0,1],[-0.6,-0.3],[-0.2,-0.3],[-0.2,-1],[0.2,-1],[0.2,-0.3],[0.6,-0.3]];
      var poly=document.createElementNS('http://www.w3.org/2000/svg','polygon');
      poly.setAttribute('points',pts.map(function(d){return(cx+d[0]*s)+','+(cy+d[1]*s)}).join(' '));
      poly.setAttribute('fill',color);poly.setAttribute('stroke',color);poly.setAttribute('stroke-width','2');
      svg.appendChild(poly);
    });
    document.getElementById('c').appendChild(svg);
  };
</script></body></html>`)
    win.document.close()
  }

  const annotationCount = (s: LocalScreenshot) => s.markers.length + s.lines.length + (s.shapes?.length ?? 0)

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
            {/* Annotation count badge */}
            {annotationCount(screenshot) > 0 && (
              <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                {annotationCount(screenshot)}
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
              imageSrc={editingScreenshot.previewUrl}
              annotations={{ markers: editingScreenshot.markers, lines: editingScreenshot.lines, shapes: editingScreenshot.shapes ?? [] }}
              onChange={(annotations) => {
                const updated = [...screenshots]
                updated[editingIndex] = {
                  ...updated[editingIndex],
                  markers: annotations.markers,
                  lines: annotations.lines,
                  shapes: annotations.shapes ?? [],
                }
                onChange(updated)
              }}
              onClose={() => setEditingIndex(null)}
              onSave={(annotations) => handleAnnotationSave(editingIndex, annotations)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview dialog with overlay */}
      <Dialog open={previewIndex !== null} onOpenChange={() => setPreviewIndex(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-2 sm:p-4">
          {previewScreenshot && (
            <div className="relative">
              <ChartOverlay
                imageSrc={previewScreenshot.previewUrl}
                annotations={{ markers: previewScreenshot.markers, lines: previewScreenshot.lines, shapes: previewScreenshot.shapes ?? [] }}
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={() => openFullscreen(previewScreenshot)}
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
