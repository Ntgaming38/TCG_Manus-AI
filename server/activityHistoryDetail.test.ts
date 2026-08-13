import { describe, expect, it } from "vitest";
import { getActivityTone, getChangedFields } from "../client/src/pages/ActivityHistory";

describe("ActivityHistory detail changes", () => {
  it("chỉ trả về các trường thực sự thay đổi để hiển thị trong Lịch sử", () => {
    const changes = getChangedFields(
      JSON.stringify({ name: "Pikachu ex", quantity: 2, marketPrice: "12000" }),
      JSON.stringify({ name: "Pikachu ex", quantity: 3, marketPrice: "13000" }),
    );

    expect(changes).toEqual([
      { key: "quantity", before: 2, after: 3 },
      { key: "marketPrice", before: "12000", after: "13000" },
    ]);
  });

  it("xử lý an toàn dữ liệu nhật ký cũ không phải JSON", () => {
    expect(getChangedFields("nhật ký cũ", null)).toEqual([]);
  });

  it("ưu tiên màu xóa đỏ, sửa cam, mua xanh lá và bán vàng", () => {
    expect(getActivityTone("sale_deleted", "sale").badgeClass).toContain("rose");
    expect(getActivityTone("purchase_updated", "purchase").badgeClass).toContain("orange");
    expect(getActivityTone("purchase_created", "purchase").badgeClass).toContain("emerald");
    expect(getActivityTone("sale_created", "sale").badgeClass).toContain("yellow");
  });
});
