import { useRef } from "react";
import { FALLBACK_PRODUCT_IMAGE_URL } from "@/const";
import { productImageFrameStyle, productImageImageStyle } from "@/lib/productImageDisplay";

export type ImageEditPosition = { x: number; y: number };

type Props = {
  src?: string | null;
  alt: string;
  zoom: number;
  position: ImageEditPosition;
  onZoomChange: (zoom: number) => void;
  onPositionChange: (position: ImageEditPosition) => void;
};

const clamp = (value: number) => Math.min(50, Math.max(-50, value));

export function ProductImageEditControls({ src, alt, zoom, position, onZoomChange, onPositionChange }: Props) {
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const startDrag = (event: React.PointerEvent<HTMLImageElement>) => {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, x: position.x, y: position.y };
  };
  const moveDrag = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!dragStart.current) return;
    onPositionChange({ x: clamp(dragStart.current.x + (event.clientX - dragStart.current.pointerX) / 3), y: clamp(dragStart.current.y + (event.clientY - dragStart.current.pointerY) / 3) });
  };
  const endDrag = () => { dragStart.current = null; };

  return <div className="grid gap-3 rounded-xl border border-border bg-background/50 p-3 sm:grid-cols-[150px_1fr]">
    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white" style={productImageFrameStyle()}>
      <img src={src || FALLBACK_PRODUCT_IMAGE_URL} alt={alt} draggable={false} className={`h-full w-full object-contain transition-transform duration-300 motion-reduce:transition-none ${zoom > 1 ? "cursor-grab touch-none active:cursor-grabbing" : ""}`} style={productImageImageStyle(zoom, position)} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} />
    </div>
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-3"><LabelText>Zoom ảnh</LabelText><strong className="text-teal-300">{Math.round(zoom * 100)}%</strong></div>
      <input type="range" min="1" max="1.5" step="0.01" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} className="w-full accent-teal-400" aria-label="Mức zoom ảnh trong biểu mẫu sửa" />
      <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-xs text-muted-foreground">Vị trí ngang<input type="range" min="-50" max="50" step="1" value={position.x} onChange={(event) => onPositionChange({ ...position, x: Number(event.target.value) })} className="accent-teal-400" /></label><label className="grid gap-1 text-xs text-muted-foreground">Vị trí dọc<input type="range" min="-50" max="50" step="1" value={position.y} onChange={(event) => onPositionChange({ ...position, y: Number(event.target.value) })} className="accent-teal-400" /></label></div>
      <p className="text-xs leading-5 text-muted-foreground">Kéo trực tiếp ảnh trong khung để căn vị trí sau khi phóng to. Nền trắng luôn phủ kín khung.</p>
    </div>
  </div>;
}

function LabelText({ children }: { children: React.ReactNode }) { return <span className="font-semibold text-foreground">{children}</span>; }
