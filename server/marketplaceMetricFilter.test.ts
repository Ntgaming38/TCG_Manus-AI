import { describe, expect, it } from "vitest";
import { marketplaceMetricFilter, parseMarketplaceFilter } from "../shared/marketplaceMetricFilter";

describe("marketplaceMetricFilter", () => {
  it("ánh xạ mỗi ô tổng quan đến đúng bộ lọc Marketplace", () => {
    expect(marketplaceMetricFilter).toEqual({
      total: "all",
      synced: "synced",
      pending: "pending",
      unlinked: "unlinked",
    });
  });

  it("khôi phục bộ lọc hợp lệ và bỏ qua giá trị lưu không hợp lệ", () => {
    expect(parseMarketplaceFilter("synced")).toBe("synced");
    expect(parseMarketplaceFilter("unknown")).toBe("all");
    expect(parseMarketplaceFilter(null)).toBe("all");
  });
});
