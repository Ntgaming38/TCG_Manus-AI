import { useEffect, useState } from "react";
import { FALLBACK_PRODUCT_IMAGE_URL } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  normalizeCustomProductImageZoom,
  productImageFrameStyle,
  productImageImageStyle,
  type ProductImageKind,
} from "@/lib/productImageDisplay";

const MIN_ZOOM = 1;
const MAX_ZOOM = 1.5;
const STEP = 0.01;

type ProductImageAdjusterProps = {
  entity: "product" | "snkr";
  id: number;
  kind: ProductImageKind;
  src: string | null | undefined;
  alt: string;
  initialZoom?: number | string | null;
  className?: string;
  eager?: boolean;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
};

export function ProductImageAdjuster({ entity, id, kind, src, alt, initialZoom, className = "", eager = false, referrerPolicy }: ProductImageAdjusterProps) {
  const fallbackZoom = kind === "card" ? 1.12 : 1.12;
  const [zoom, setZoom] = useState<number>(() => normalizeCustomProductImageZoom(initialZoom, fallbackZoom));
  const [failed, setFailed] = useState(false);
  const productZoom = trpc.products.updateImageZoom.useMutation();
  const snkrZoom = trpc.snkrShop.updateImageZoom.useMutation();

  useEffect(() => {
    setZoom(normalizeCustomProductImageZoom(initialZoom, fallbackZoom));
    setFailed(false);
  }, [initialZoom, fallbackZoom, src]);

  const commitZoom = (nextValue: number) => {
    const next = normalizeCustomProductImageZoom(nextValue, fallbackZoom);
    setZoom(next);
    if (entity === "product") productZoom.mutate({ id, imageZoom: next });
    else snkrZoom.mutate({ id, imageZoom: next });
  };

  const imageUrl = src && !failed ? src : FALLBACK_PRODUCT_IMAGE_URL;
  const isSaving = productZoom.isPending || snkrZoom.isPending;

  return <div className={`relative flex aspect-square min-h-0 items-center justify-center overflow-hidden bg-white ${className}`} style={productImageFrameStyle()} onClick={(event) => event.stopPropagation()}>
    <img src={imageUrl} alt={alt} className="h-full w-full bg-white object-contain transition-transform duration-300 motion-reduce:transition-none" style={productImageImageStyle(zoom)} loading={eager ? "eager" : "lazy"} referrerPolicy={referrerPolicy} onError={(event) => { event.currentTarget.onerror = null; setFailed(true); }} />
    <details className="absolute inset-x-2 bottom-2 z-10 rounded-md bg-slate-950/80 p-1.5 text-white shadow-sm backdrop-blur" onClick={(event) => event.stopPropagation()}>
      <summary className="cursor-pointer list-none text-center text-[10px] font-semibold text-white">Zoom ảnh · {Math.round(zoom * 100)}%{isSaving ? " · Đang lưu…" : ""}</summary>
      <div className="px-1 pb-1 pt-2">
        <label className="sr-only" htmlFor={`image-zoom-${entity}-${id}`}>Mức zoom ảnh</label>
        <input id={`image-zoom-${entity}-${id}`} type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={STEP} value={zoom} onChange={(event) => setZoom(normalizeCustomProductImageZoom(event.target.value, fallbackZoom))} onPointerUp={(event) => commitZoom(Number(event.currentTarget.value))} onBlur={(event) => commitZoom(Number(event.currentTarget.value))} className="w-full accent-teal-400" aria-label="Điều chỉnh zoom ảnh riêng" />
        <div className="mt-1 flex items-center justify-between text-[9px] text-white/70"><span>100%</span><button type="button" className="font-semibold text-teal-200 hover:text-white" onClick={() => commitZoom(fallbackZoom)}>Khôi phục ảnh</button><span>{Math.round(MAX_ZOOM * 100)}%</span></div>
      </div>
    </details>
  </div>;
}
