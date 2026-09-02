import { useEffect, useState } from "react";
import {
  PRODUCT_IMAGE_ZOOM_CHANGED_EVENT,
  readProductImageZoomFromWindow,
  type ProductImageZoom,
} from "@/lib/productImageDisplay";

export function useProductImageZoom(): ProductImageZoom {
  const [zoom, setZoom] = useState<ProductImageZoom>(() => readProductImageZoomFromWindow());

  useEffect(() => {
    const syncZoom = () => setZoom(readProductImageZoomFromWindow());
    window.addEventListener("storage", syncZoom);
    window.addEventListener(PRODUCT_IMAGE_ZOOM_CHANGED_EVENT, syncZoom);
    return () => {
      window.removeEventListener("storage", syncZoom);
      window.removeEventListener(PRODUCT_IMAGE_ZOOM_CHANGED_EVENT, syncZoom);
    };
  }, []);

  return zoom;
}
