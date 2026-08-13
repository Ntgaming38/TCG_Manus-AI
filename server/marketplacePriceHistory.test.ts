import { describe, expect, it } from "vitest";
import { getMarketplacePriceChange, getMarketplacePriceTrend, marketplacePriceSourceLabel } from "../shared/marketplacePriceHistory";

describe("marketplace price history helpers", () => {
  const points = [
    { id: 1, oldPrice: "1000", newPrice: "1200", source: "manual", createdAt: new Date("2026-08-01T00:00:00Z") },
    { id: 2, oldPrice: "1200", newPrice: "1500", source: "snkrdunk_auto", createdAt: new Date("2026-08-02T00:00:00Z") },
  ];

  it("tính xu hướng và chênh lệch từ chuỗi điểm giá theo thứ tự thời gian", () => {
    expect(getMarketplacePriceTrend(points)).toBe("up");
    expect(getMarketplacePriceChange(points)).toEqual({ amount: 300, percent: 25 });
  });

  it("không suy diễn xu hướng khi chỉ có một điểm giá", () => {
    expect(getMarketplacePriceTrend(points.slice(0, 1))).toBe("flat");
    expect(getMarketplacePriceChange(points.slice(0, 1))).toEqual({ amount: 0, percent: 0 });
  });

  it("hiển thị nguồn giá dễ hiểu", () => {
    expect(marketplacePriceSourceLabel("snkrdunk_auto")).toBe("SNKRDUNK");
    expect(marketplacePriceSourceLabel("manual")).toBe("Thủ công");
  });
});
