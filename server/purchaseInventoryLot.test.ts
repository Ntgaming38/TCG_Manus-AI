import { describe, expect, it } from "vitest";
import { getPurchaseUnitPrice } from "../shared/purchaseInventoryLot";

describe("purchase inventory lots", () => {
  it("derives the whole-JPY per-item buy price from one lot total", () => {
    expect(getPurchaseUnitPrice(6120, 17)).toBe(360);
    expect(getPurchaseUnitPrice(6240, 13)).toBe(480);
  });

  it("does not attempt to select or merge a prior inventory lot", () => {
    const helperSource = getPurchaseUnitPrice.toString();
    expect(helperSource).not.toContain("find");
  });
});
