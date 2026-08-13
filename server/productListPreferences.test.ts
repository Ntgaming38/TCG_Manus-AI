import { describe, expect, it } from "vitest";
import { buildProductsCsv } from "../shared/productListPreferences";

describe("buildProductsCsv", () => {
  it("xuất các cột đã chọn và giữ ký tự tiếng Nhật trong CSV", () => {
    const csv = buildProductsCsv([{ name: "メガルカリオex", type: "card", quantity: 2, buyPrice: 400, marketPrice: 66666, series: "Pokemon", setName: "Mega Dream", rarity: "SAR", status: "in_stock" }], ["quantity", "profit", "rarity"]);
    expect(csv).toContain('"Tên","Loại","Số lượng","Lợi nhuận","Độ hiếm"');
    expect(csv).toContain('"メガルカリオex","card","2","66266","SAR"');
  });
});
