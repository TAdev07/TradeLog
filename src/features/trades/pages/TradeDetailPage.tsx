import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Trash2, Pencil, Maximize } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TradeCloseForm } from '../components/TradeCloseForm'
import { ChartOverlay } from '../components/ChartOverlay'
import { ScreenshotUpload, type LocalScreenshot } from '../components/ScreenshotUpload'
import { useTrade, useCloseTrade, useUpdateClosedTrade, useDeleteTrade } from '../hooks/useTrades'
import { useScreenshot } from '../hooks/useScreenshot'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn, formatCurrency, formatPips, getPnlColor } from '@/lib/utils'
import { STATUS_LABELS, ERROR_TAGS } from '@/lib/constants'
import type { TradeCloseFormData } from '../schemas/trade.schema'
import type { ScreenshotAnnotation } from '../types/annotation'

export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: trade, isLoading } = useTrade(id!)
  const closeTrade = useCloseTrade()
  const updateClosedTrade = useUpdateClosedTrade()
  const deleteTrade = useDeleteTrade()
  const { uploadMultiple, uploading } = useScreenshot()
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  // Screenshot editing state for edit dialog
  const [editScreenshots, setEditScreenshots] = useState<LocalScreenshot[] | null>(null)

  if (isLoading || !trade) return <LoadingSpinner className="mt-20" />

  const annotations: ScreenshotAnnotation[] = trade.screenshot_annotations ?? []

  const handleClose = async (data: TradeCloseFormData) => {
    await closeTrade.mutateAsync({ id: trade.id, data, trade })
    setCloseDialogOpen(false)
  }

  const handleOpenEdit = () => {
    // Initialize edit screenshots from existing trade data
    const existing: LocalScreenshot[] = trade.screenshot_urls.map((url, i) => ({
      id: crypto.randomUUID(),
      previewUrl: url,
      blob: new Blob(), // existing images don't need re-upload unless changed
      markers: annotations[i]?.markers ?? [],
      lines: annotations[i]?.lines ?? [],
      shapes: annotations[i]?.shapes ?? [],
    }))
    setEditScreenshots(existing)
    setEditDialogOpen(true)
  }

  const handleEdit = async (data: TradeCloseFormData) => {
    const currentScreenshots = editScreenshots ?? []

    // Determine which screenshots need uploading (new ones have blob size > 0)
    const screenshotUrls: string[] = []
    const screenshotAnnotations: ScreenshotAnnotation[] = []
    const newBlobs: { index: number; blob: Blob }[] = []

    for (let i = 0; i < currentScreenshots.length; i++) {
      const s = currentScreenshots[i]
      if (s.blob.size > 0) {
        // New screenshot, needs upload
        newBlobs.push({ index: i, blob: s.blob })
        screenshotUrls.push('') // placeholder
      } else {
        // Existing screenshot, keep URL
        screenshotUrls.push(s.previewUrl)
      }
      screenshotAnnotations.push({ markers: s.markers, lines: s.lines, shapes: s.shapes ?? [] })
    }

    // Upload new blobs
    if (newBlobs.length > 0) {
      const urls = await uploadMultiple(newBlobs.map(b => b.blob))
      newBlobs.forEach((b, j) => {
        screenshotUrls[b.index] = urls[j]
      })
    }

    await updateClosedTrade.mutateAsync({
      id: trade.id,
      data,
      trade,
      screenshot_urls: screenshotUrls,
      screenshot_annotations: screenshotAnnotations,
    })
    setEditDialogOpen(false)
    setEditScreenshots(null)
  }

  const handleDelete = async () => {
    await deleteTrade.mutateAsync(trade.id)
    setDeleteDialogOpen(false)
    navigate('/trades')
  }

  const openFullscreen = (index: number) => {
    const url = trade.screenshot_urls[index]
    const ann = annotations[index] ?? { markers: [], lines: [], shapes: [] }
    const win = window.open('', '_blank')
    if (!win) return
    const markersJson = JSON.stringify(ann.markers)
    const linesJson = JSON.stringify(ann.lines)
    const shapesJson = JSON.stringify(ann.shapes ?? [])
    win.document.write(`<!DOCTYPE html><html><head><title>Preview</title>
<style>*{margin:0;padding:0;background:#000}.container{position:relative;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}img{max-width:100vw;max-height:100vh;object-fit:contain}</style></head><body>
<div class="container" id="c"><img id="img" src="${url}" /></div>
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

  const previewAnnotation = previewIndex !== null
    ? annotations[previewIndex] ?? { markers: [], lines: [], shapes: [] }
    : { markers: [], lines: [], shapes: [] }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/trades')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                'flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0',
                trade.direction === 'long' ? 'bg-profit/10' : 'bg-loss/10'
              )}
            >
              {trade.direction === 'long' ? (
                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-profit" />
              ) : (
                <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-loss" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold">{trade.pair}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {trade.direction === 'long' ? 'Long' : 'Short'} · {trade.lot_size} lot · {format(new Date(trade.opened_at), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>
        <Badge
          variant={
            trade.status === 'win' ? 'profit'
              : trade.status === 'loss' ? 'loss'
                : trade.status === 'breakeven' ? 'breakeven'
                  : 'secondary'
          }
          className="text-sm sm:text-base px-2 sm:px-3 py-1 shrink-0"
        >
          {STATUS_LABELS[trade.status] ?? trade.status}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Price info */}
        <Card>
          <CardContent className="grid grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6">
            <div>
              <p className="text-sm text-muted-foreground">Entry</p>
              <p className="font-mono font-semibold">{trade.entry_price}</p>
            </div>
            {trade.close_price && (
              <div>
                <p className="text-sm text-muted-foreground">Close</p>
                <p className="font-mono font-semibold">{trade.close_price}</p>
              </div>
            )}
            {trade.stop_loss && (
              <div>
                <p className="text-sm text-muted-foreground">Stoploss</p>
                <p className="font-mono text-loss">{trade.stop_loss}</p>
              </div>
            )}
            {trade.take_profit && (
              <div>
                <p className="text-sm text-muted-foreground">Take Profit</p>
                <p className="font-mono text-profit">{trade.take_profit}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PnL */}
        {trade.pnl_dollars !== null && (
          <Card>
            <CardContent className="flex items-center justify-around p-4 sm:p-6">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">PnL</p>
                <p className={cn('text-lg sm:text-2xl font-bold', getPnlColor(trade.pnl_dollars!))}>
                  {formatCurrency(trade.pnl_dollars!)}
                </p>
              </div>
              {trade.pnl_pips !== null && (
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Pips</p>
                  <p className={cn('text-lg sm:text-2xl font-bold', getPnlColor(trade.pnl_pips!))}>
                    {formatPips(trade.pnl_pips!)}
                  </p>
                </div>
              )}
              {trade.risk_reward_ratio !== null && (
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">R:R</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {trade.risk_reward_ratio!.toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error tags & Notes */}
        {(trade.error_tags.length > 0 || trade.emotion_notes) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tâm lý & Lỗi sai</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trade.error_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {trade.error_tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-loss border-loss/30">
                      {ERROR_TAGS.find((t) => t.value === tag)?.label ?? tag}
                    </Badge>
                  ))}
                </div>
              )}
              {trade.emotion_notes && (
                <p className="text-sm text-muted-foreground">{trade.emotion_notes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Screenshots with overlay */}
        {trade.screenshot_urls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biểu đồ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {trade.screenshot_urls.map((url, i) => {
                  const ann = annotations[i] ?? { markers: [], lines: [], shapes: [] }
                  return (
                    <div key={i} className="relative group cursor-pointer" onClick={() => setPreviewIndex(i)}>
                      <ChartOverlay
                        imageSrc={url}
                        annotations={ann}
                        className="w-full"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                        <Maximize className="h-6 w-6 text-white drop-shadow" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {trade.status === 'open' && (
            <Button className="flex-1" onClick={() => setCloseDialogOpen(true)}>
              Đóng lệnh
            </Button>
          )}
          {trade.status !== 'open' && (
            <Button variant="outline" className="flex-1" onClick={handleOpenEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xoá lệnh
          </Button>
        </div>
      </div>

      {/* Close trade dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đóng lệnh {trade.pair}</DialogTitle>
          </DialogHeader>
          <TradeCloseForm
            trade={trade}
            onSubmit={handleClose}
            onCancel={() => setCloseDialogOpen(false)}
            isLoading={closeTrade.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit closed trade dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) setEditScreenshots(null)
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lệnh {trade.pair}</DialogTitle>
          </DialogHeader>

          {/* Screenshot editing */}
          {editScreenshots !== null && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ảnh biểu đồ</p>
              <ScreenshotUpload
                screenshots={editScreenshots}
                onChange={setEditScreenshots}
              />
            </div>
          )}

          <TradeCloseForm
            trade={trade}
            onSubmit={handleEdit}
            onCancel={() => { setEditDialogOpen(false); setEditScreenshots(null) }}
            isLoading={updateClosedTrade.isPending || uploading}
            isEditing
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xoá lệnh</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xoá lệnh <strong>{trade.pair}</strong>? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTrade.isPending}>
              {deleteTrade.isPending ? 'Đang xoá...' : 'Xoá lệnh'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screenshot preview dialog with overlay */}
      <Dialog open={previewIndex !== null} onOpenChange={() => setPreviewIndex(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-2 sm:p-4">
          {previewIndex !== null && (
            <div className="relative">
              <ChartOverlay
                imageSrc={trade.screenshot_urls[previewIndex]}
                annotations={previewAnnotation}
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={() => openFullscreen(previewIndex)}
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
