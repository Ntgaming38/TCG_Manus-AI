import { describe, expect, it } from "vitest";
import { findMatchingPurchaseInventoryLot, getPurchaseUnitPrice } from "../shared/purchaseInventoryLot";

describe("purchase inventory lot grouping", () => {
  const lots = [
    { id: 1, type: "junk_pack", buyPrice: "360" },
    { id: 2, type: "junk_pack", buyPrice: "480" },
    { id: 3, type: "pack", buyPrice: "360" },
    { id: 4, type: "box", buyPrice: "6120" },
  ];

  it("uses the whole-JPY per-item price as the grouping key", () => {
    expect(getPurchaseUnitPrice(6120, 17)).toBe(360);
    expect(getPurchaseUnitPrice(6240, 13)).toBe(480);
  });

  it("merges only lots with the same product type and buy price", () => {
    expect(findMatchingPurchaseInventoryLot(lots, "junk_pack", 360)?.id).toBe(1);
    expect(findMatchingPurchaseInventoryLot(lots, "junk_pack", 480)?.id).toBe(2);
    expect(findMatchingPurchaseInventoryLot(lots, "pack", 360)?.id).toBe(3);
    expect(findMatchingPurchaseInventoryLot(lots, "junk_pack", 6120)).toBeUndefined();
  });
});
