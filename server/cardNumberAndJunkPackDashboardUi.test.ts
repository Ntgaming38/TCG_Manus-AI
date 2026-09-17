import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const productsSource = readFileSync(join(root, "client/src/pages/Products.tsx"), "utf8");
const inventorySource = readFileSync(join(root, "client/src/pages/Inventory.tsx"), "utf8");
const dashboardSource = readFileSync(join(root, "client/src/pages/Dashboard.tsx"), "utf8");

describe("Card Number and Pack Rác dashboard display", () => {
  it("shows a supplied Card Number immediately after the Card name in product and inventory lists", () => {
    for (const source of [productsSource, inventorySource]) {
      expect(source).toContain('product.type === "card" && product.cardNumber');
      expect(source).toContain('title={`Card Number: ${product.cardNumber}`}');
      expect(source).toContain('>#{product.cardNumber}</span>');
    }

    expect(productsSource).toContain('<Label>Card Number</Label><Input value={editingProduct.cardNumber}');
  });

  it("provides a dedicated amber summary card for Pack Rác currently in stock", () => {
    expect(dashboardSource).toContain("Pack Rác hiện có");
    expect(dashboardSource).toContain("Tổng số lượng Pack Rác đang có trạng thái Trong kho.");
    expect(dashboardSource).toContain("{inStockJunkPacks}</p>");
    expect(dashboardSource).toContain("<PackageOpen className=");
    expect(dashboardSource).toContain("border-amber-400/30");
  });
});
