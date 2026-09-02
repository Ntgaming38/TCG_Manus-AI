import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRODUCT_IMAGE_ZOOM,
  PRODUCT_IMAGE_ZOOM_OPTIONS,
  normalizeProductImageZoom,
  productImageZoomLabel,
} from "../client/src/lib/productImageDisplay";

describe("product image display settings", () => {
  it("uses the approved default zoom", () => {
    expect(DEFAULT_PRODUCT_IMAGE_ZOOM).toBe(1.12);
    expect(PRODUCT_IMAGE_ZOOM_OPTIONS).toContain(DEFAULT_PRODUCT_IMAGE_ZOOM);
  });

  it("normalizes unsupported values to the default", () => {
    expect(normalizeProductImageZoom(1.18)).toBe(1.18);
    expect(normalizeProductImageZoom("1.19")).toBe(DEFAULT_PRODUCT_IMAGE_ZOOM);
    expect(normalizeProductImageZoom(null)).toBe(DEFAULT_PRODUCT_IMAGE_ZOOM);
  });

  it("keeps the setting label in Vietnamese", () => {
    expect(productImageZoomLabel(1.24)).toContain("Phóng to 124%");
  });
});
