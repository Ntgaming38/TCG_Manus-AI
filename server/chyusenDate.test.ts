import { describe, expect, it } from "vitest";
import { formatChyusenDayMonth, parseChyusenDayMonth } from "../shared/chyusenDate";

describe("Chyusen day/month dates", () => {
  it("hiển thị ngày theo dd/mm và bỏ năm, giờ", () => {
    expect(formatChyusenDayMonth(new Date("2026-08-13T01:30:00.000Z"))).toBe("13/08");
  });

  it("tự gán năm tại thời điểm lưu theo múi giờ Nhật Bản", () => {
    const saved = parseChyusenDayMonth("05/01", new Date("2027-01-02T10:00:00.000Z"));
    expect(saved?.toISOString()).toBe("2027-01-04T15:00:00.000Z");
  });

  it("không chấp nhận ngày hoặc tháng không hợp lệ", () => {
    expect(parseChyusenDayMonth("31/02", new Date("2027-01-02T10:00:00.000Z"))).toBeNull();
    expect(parseChyusenDayMonth("05-01", new Date("2027-01-02T10:00:00.000Z"))).toBeNull();
  });
});
