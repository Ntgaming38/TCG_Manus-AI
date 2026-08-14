import { describe, expect, it } from "vitest";
import { getSalesProfitBreakdown, getStockMetricBreakdown } from "../shared/dashboardMetricBreakdown";

describe("phân rã chỉ số Tổng quan", () => {
  const products = [
    { id: 1, type: "card", quantity: 2, buyPrice: 100, marketPrice: 150 },
    { id: 2, type: "box", quantity: 1, buyPrice: 500, marketPrice: null },
    { id: 3, type: "pack", quantity: 3, buyPrice: 20, marketPrice: 25 },
  ];

  it("phân rã tổng vốn và giá trị hiện tại theo Card, Box, Pack", () => {
    expect(getStockMetricBreakdown(products, "capital")).toEqual({ card: 200, box: 500, pack: 60 });
    expect(getStockMetricBreakdown(products, "market")).toEqual({ card: 300, box: 500, pack: 75 });
  });

  it("phân rã lợi nhuận bán hàng theo loại sản phẩm", () => {
    expect(getSalesProfitBreakdown([{ productId: 1, profit: 80 }, { productId: 3, profit: -10 }], products)).toEqual({ card: 80, box: 0, pack: -10 });
  });
});
