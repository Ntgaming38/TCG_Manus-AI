export const PRODUCT_IMAGE_ZOOM_STORAGE_KEY = "tcg-product-image-zoom";
export const PRODUCT_IMAGE_ZOOM_CHANGED_EVENT = "tcg-product-image-zoom-changed";
export const DEFAULT_PRODUCT_IMAGE_ZOOM = 1.12;
export const PRODUCT_IMAGE_ZOOM_OPTIONS = [1, 1.06, 1.12, 1.18, 1.24] as const;

export type ProductImageZoom = (typeof PRODUCT_IMAGE_ZOOM_OPTIONS)[number];

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function normalizeProductImageZoom(value: unknown): ProductImageZoom {
  const numeric = typeof value === "number" ? value : Number(value);
  return PRODUCT_IMAGE_ZOOM_OPTIONS.includes(numeric as ProductImageZoom) ? numeric as ProductImageZoom : DEFAULT_PRODUCT_IMAGE_ZOOM;
}

export function readProductImageZoom(storage?: StorageLike): ProductImageZoom {
  if (!storage) return DEFAULT_PRODUCT_IMAGE_ZOOM;
  return normalizeProductImageZoom(storage.getItem(PRODUCT_IMAGE_ZOOM_STORAGE_KEY));
}

export function saveProductImageZoom(value: ProductImageZoom, storage?: StorageLike) {
  storage?.setItem(PRODUCT_IMAGE_ZOOM_STORAGE_KEY, String(normalizeProductImageZoom(value)));
}

export function productImageZoomLabel(value: ProductImageZoom) {
  const zoom = normalizeProductImageZoom(value);
  if (zoom === 1) return "Mặc định (100%)";
  return `Phóng to ${Math.round(zoom * 100)}%`;
}

export function productImageScaleClass(value: ProductImageZoom) {
  return `scale-[${normalizeProductImageZoom(value)}]`;
}

export function productImageFrameClass() {
  return "flex aspect-square items-center justify-center overflow-hidden bg-white";
}

export function productImageFrameStyle() {
  return { backgroundColor: "#FFFFFF" } as const;
}

export function productImageAlt(name: string, hasImage: boolean) {
  return hasImage ? name : `${name} — chưa có ảnh`;
}

export const PRODUCT_IMAGE_ZOOM_OPTIONS_WITH_LABELS = PRODUCT_IMAGE_ZOOM_OPTIONS.map((value) => ({
  value,
  label: productImageZoomLabel(value),
}));

export function readProductImageZoomFromWindow() {
  return readProductImageZoom(typeof window === "undefined" ? undefined : window.localStorage);
}

export function saveProductImageZoomToWindow(value: ProductImageZoom) {
  saveProductImageZoom(value, typeof window === "undefined" ? undefined : window.localStorage);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PRODUCT_IMAGE_ZOOM_CHANGED_EVENT));
}
