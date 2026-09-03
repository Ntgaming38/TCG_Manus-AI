import { useEffect, useRef, useState } from "react";
import { FALLBACK_PRODUCT_IMAGE_URL } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  normalizeCustomProductImageZoom,
  productImageFrameStyle,
  productImageImageStyle,
  type ProductImageKind,
} from "@/lib/productImageDisplay";

const DEFAULT_ZOOM = 1.12;

type ProductImageAdjusterProps = {
  entity: "product" | "snkr";
  id: number;
  kind: ProductImageKind;
  src: string | null | undefined;
  alt: string;
  initialZoom?: number | string | null;
  initialPositionX?: number | string | null;
  initialPositionY?: number | string | null;
  className?: string;
  eager?: boolean;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
};

type ImagePosition = { x: number; y: number };

function normalizePosition(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.min(50, Math.max(-50, numeric)) : 0;
}

export function ProductImageAdjuster({ entity, id, kind, src, alt, initialZoom, initialPositionX, initialPositionY, className = "", eager = false, referrerPolicy }: ProductImageAdjusterProps) {
  const [zoom, setZoom] = useState(() => normalizeCustomProductImageZoom(initialZoom, DEFAULT_ZOOM));
  const [position, setPosition] = useState<ImagePosition>(() => ({ x: normalizePosition(initialPositionX), y: normalizePosition(initialPositionY) }));
  const [failed, setFailed] = useState(false);
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const productZoom = trpc.products.updateImageZoom.useMutation();
  const snkrZoom = trpc.snkrShop.updateImageZoom.useMutation();

  useEffect(() => {
    setZoom(normalizeCustomProductImageZoom(initialZoom, DEFAULT_ZOOM));
    setPosition({ x: normalizePosition(initialPositionX), y: normalizePosition(initialPositionY) });
    setFailed(false);
  }, [initialZoom, initialPositionX, initialPositionY, src]);

  const commit = (nextZoom: number, nextPosition: ImagePosition) => {
    const safeZoom = normalizeCustomProductImageZoom(nextZoom, DEFAULT_ZOOM);
    const safePosition = { x: normalizePosition(nextPosition.x), y: normalizePosition(nextPosition.y) };
    setZoom(safeZoom);
    setPosition(safePosition);
    const input = { id, imageZoom: safeZoom, imagePositionX: safePosition.x, imagePositionY: safePosition.y };
    if (entity === "product") productZoom.mutate(input);
    else snkrZoom.mutate(input);
  };

  const imageUrl = src && !failed ? src : FALLBACK_PRODUCT_IMAGE_URL;
  const isSaving = productZoom.isPending || snkrZoom.isPending;
  const onPointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, x: position.x, y: position.y };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!dragStart.current) return;
    const next = { x: dragStart.current.x + (event.clientX - dragStart.current.pointerX) / 3, y: dragStart.current.y + (event.clientY - dragStart.current.pointerY) / 3 };
    setPosition({ x: normalizePosition(next.x), y: normalizePosition(next.y) });
  };
  const onPointerUp = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!dragStart.current) return;
    const next = { x: dragStart.current.x + (event.clientX - dragStart.current.pointerX) / 3, y: dragStart.current.y + (event.clientY - dragStart.current.pointerY) / 3 };
    dragStart.current = null;
    commit(zoom, next);
  };

  return <div className={`relative flex aspect-square min-h-0 items-center justify-center overflow-hidden bg-white ${className}`} style={productImageFrameStyle()} onClick={(event) => event.stopPropagation()}>
    <img src={imageUrl} alt={alt} className={`h-full w-full bg-white object-contain transition-transform duration-300 motion-reduce:transition-none ${zoom > 1 ? "cursor-grab active:cursor-grabbing touch-none" : ""}`} style={productImageImageStyle(zoom, position)} loading={eager ? "eager" : "lazy"} referrerPolicy={referrerPolicy} draggable={false} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { dragStart.current = null; }} onError={(event) => { event.currentTarget.onerror = null; setFailed(true); }} />
    {isSaving && <span className="pointer-events-none absolute right-2 top-2 rounded bg-slate-950/75 px-1.5 py-0.5 text-[9px] font-semibold text-white">Đang lưu vị trí…</span>}
  </div>;
}

export const PRODUCT_IMAGE_DEFAULT_ZOOM = DEFAULT_ZOOM;
