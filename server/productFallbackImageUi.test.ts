import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readClientFile = (name: string) => readFileSync(join(process.cwd(), "client/src/pages", name), "utf8");

describe("ảnh fallback sản phẩm", () => {
  it("dùng chung URL fallback trong Kho Hàng, Shop SNKR và trang chi tiết", () => {
    const constantSource = readFileSync(join(process.cwd(), "client/src/const.ts"), "utf8");
    expect(constantSource).toContain("FALLBACK_PRODUCT_IMAGE_URL");
    expect(constantSource).toContain("/manus-storage/tcg-product-fallback_93dfd725.png");

    for (const fileName of ["Products.tsx", "SnkrShop.tsx", "SnkrShopDetail.tsx"]) {
      const source = readClientFile(fileName);
      expect(source).toContain("FALLBACK_PRODUCT_IMAGE_URL");
      expect(source).toContain("onError");
      expect(source).toContain("object-contain");
      expect(source).toContain("useProductImageZoom");
      expect(source).toContain("transform: `scale(${productImageZoom})`");
    }
  });

  it("không hiển thị trạng thái icon rỗng thay cho fallback", () => {
    expect(readClientFile("SnkrShop.tsx")).not.toContain("<ImageOff");
    expect(readClientFile("SnkrShopDetail.tsx")).not.toContain("Chưa có ảnh sản phẩm");
    expect(readClientFile("Products.tsx")).toContain("product.image || FALLBACK_PRODUCT_IMAGE_URL");
  });
});
