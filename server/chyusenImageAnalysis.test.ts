import { describe, expect, it } from "vitest";
import { parseChyusenImageAnalysis } from "./chyusenImageAnalysis";

describe("parseChyusenImageAnalysis", () => {
  it("chỉ chấp nhận dữ liệu ảnh theo schema Chyusen", () => {
    const raw = JSON.stringify({ title: "Joshin 抽選", productName: "Pikachu Box", series: "Pokemon", productType: "box", shop: "Joshin", price: 5400, quantityLimit: "1 Box", applicationStart: null, applicationEnd: "2026-09-01T10:00:00+09:00", resultDate: "2026-09-05T12:00:00+09:00", pickupStart: null, pickupNote: "Đầu tháng 9", requirements: null, fieldConfidence: { title: "high", applicationEnd: "medium", pickupNote: "low" }, note: "Đọc từ ảnh" });
    expect(parseChyusenImageAnalysis(raw)).toMatchObject({ title: "Joshin 抽選", pickupNote: "Đầu tháng 9", productType: "box", fieldConfidence: { title: "high" } });
  });

  it("chuẩn hóa ngày tháng nhìn thấy rõ nhưng thiếu năm thành ngày JST cần kiểm tra", () => {
    const raw = JSON.stringify({ title: "抽選", productName: "Pikachu Box", series: "Pokemon", productType: "box", shop: "Joshin", price: null, quantityLimit: null, applicationStart: "08/10", applicationEnd: "08/15", resultDate: null, pickupStart: null, pickupNote: null, requirements: null, fieldConfidence: { applicationStart: "high", applicationEnd: "high" }, note: "Đọc từ ảnh" });
    const parsed = parseChyusenImageAnalysis(raw);
    expect(parsed.applicationStart).toMatch(/^20\d{2}-08-10T00:00:00\+09:00$/);
    expect(parsed.fieldConfidence.applicationStart).toBe("medium");
    expect(parsed.note).toContain("năm hiện tại");
  });
});
