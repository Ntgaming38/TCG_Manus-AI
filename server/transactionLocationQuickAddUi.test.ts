import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("địa điểm giao dịch tự thêm", () => {
  it("cho phép lưu và chọn lại cửa hàng mới trong Mua Hàng", () => {
    const source = readFileSync(join(process.cwd(), "client/src/pages/Purchases.tsx"), "utf8");
    expect(source).toContain("ADD_PURCHASE_SHOP_VALUE");
    expect(source).toContain("trpc.shops.list.useQuery()");
    expect(source).toContain("savePurchaseShop.mutate");
    expect(source).toContain("+ Thêm cửa hàng");
  });

  it("cho phép lưu và chọn lại nơi bán mới trong Bán Hàng", () => {
    const source = readFileSync(join(process.cwd(), "client/src/pages/Sales.tsx"), "utf8");
    expect(source).toContain("ADD_SALE_LOCATION_VALUE");
    expect(source).toContain("saveSaleLocation.mutate");
    expect(source).toContain("+ Thêm nơi bán");
  });
});
