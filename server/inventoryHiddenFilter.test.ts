import { describe, expect, it } from "vitest";
import { getInventoryEmptyState, INVENTORY_HIDDEN_STATUS, isInventoryHiddenFilter } from "../shared/inventoryHiddenFilter";

describe("inventory hidden filter", () => {
  it("liên kết bộ lọc Đã ẩn với trạng thái sản phẩm đã bán hết", () => {
    expect(INVENTORY_HIDDEN_STATUS).toBe("sold");
    expect(isInventoryHiddenFilter("sold")).toBe(true);
    expect(isInventoryHiddenFilter("in_stock")).toBe(false);
  });

  it("hiển thị thông điệp trống hướng dẫn nhập lại sản phẩm đã ẩn", () => {
    expect(getInventoryEmptyState("sold")).toMatchObject({
      title: "Chưa có sản phẩm đã ẩn",
      description: expect.stringContaining("nhập mua lại"),
    });
  });
});
