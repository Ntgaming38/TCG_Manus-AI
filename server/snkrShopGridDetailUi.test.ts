import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const homeSource = readFileSync(resolve(root, "client/src/pages/SnkrShop.tsx"), "utf8");
const detailSource = readFileSync(resolve(root, "client/src/pages/SnkrShopDetail.tsx"), "utf8");
const appSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");

describe("Shop SNKR grid and detail navigation", () => {
  it("opens a dedicated detail route from compact product grid cards", () => {
    expect(homeSource).toContain("ShopGridCard");
    expect(homeSource).toContain("setLocation(`/shop-snkr/${item.id}`)");
    expect(appSource).toContain('path={"/shop-snkr/:id"}');
  });

  it("uses independent detail data, direct product image and price history", () => {
    expect(detailSource).toContain("trpc.snkrShop.get.useQuery");
    expect(detailSource).toContain("trpc.snkrShop.priceHistory.useQuery");
    expect(detailSource).toContain("referrerPolicy=\"no-referrer\"");
    expect(detailSource).toContain("không được đưa vào Kho Hàng hoặc báo cáo tài chính");
  });

  it("shows an RGB type label and a custom product name over the grid image", () => {
    expect(homeSource).toContain("const customImageLabel");
    expect(homeSource).toContain("rgb-action-label");
    expect(homeSource).toContain("right-2 top-2");
  });

  it("orders grid controls as sync, edit, then a red delete action with confirmation", () => {
    expect(homeSource).toContain("onDelete={() => setDeleteConfirmItem(item)}");
    expect(homeSource).toContain("Xóa sản phẩm theo dõi?");
    expect(homeSource).toContain("border-red-500/55 bg-red-950/35");
    const syncControl = homeSource.indexOf("aria-label={`Đồng bộ ${displayName}`}");
    const editControl = homeSource.indexOf("aria-label={`Sửa ${displayName}`}");
    const deleteControl = homeSource.indexOf("aria-label={`Xóa ${displayName}`}");
    expect(syncControl).toBeGreaterThan(-1);
    expect(editControl).toBeGreaterThan(syncControl);
    expect(deleteControl).toBeGreaterThan(editControl);
  });
});
