import { describe, expect, it } from "vitest";
import { marketplaceMetricFilter } from "../shared/marketplaceMetricFilter";

describe("marketplaceMetricFilter", () => {
  it("ánh xạ mỗi ô tổng quan đến đúng bộ lọc Marketplace", () => {
    expect(marketplaceMetricFilter).toEqual({
      total: "all",
      synced: "synced",
      pending: "pending",
      unlinked: "unlinked",
    });
  });
});
