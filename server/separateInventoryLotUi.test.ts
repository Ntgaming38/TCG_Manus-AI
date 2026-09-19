import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const productsSource = readFileSync(join(process.cwd(), "client/src/pages/Products.tsx"), "utf8");
const inventorySource = readFileSync(join(process.cwd(), "client/src/pages/Inventory.tsx"), "utf8");
const salesSource = readFileSync(join(process.cwd(), "client/src/pages/Sales.tsx"), "utf8");
const databaseSource = readFileSync(join(process.cwd(), "server/db.ts"), "utf8");

describe("standalone inventory lots", () => {
  it("stores the total entered into direct product forms as a per-item buy price", () => {
    expect(productsSource).toContain("Tổng giá mua (¥)");
    expect(productsSource).toContain("Giá mua/SP tự tính:");
    expect(databaseSource).toContain("const unitPrice = getPurchaseUnitPrice(totalBuyPrice, quantity)");
  });

  it("shows quantity, unit cost, and the calculated lot total without combining lots", () => {
    expect(productsSource).toContain("{product.quantity} × {formatYen(Number(product.buyPrice))}/{productTypeLabel(product.type)}");
    expect(inventorySource).toContain("{product.quantity} × {formatYen(Number(product.buyPrice))}/{productTypeLabel(product.type)}");
    expect(salesSource).toContain("Lô đang chọn:");
  });

  it("creates one distinct product row for every purchase", () => {
    expect(databaseSource).toContain("One purchase always creates one independent inventory lot");
    expect(databaseSource).not.toContain("findMatchingPurchaseInventoryLot");
  });
});
