import { describe, expect, it } from "vitest";
import { formatChyusenDayMonth, formatChyusenDayMonthInput, isChyusenRegistrationExpired, parseChyusenDayMonth } from "../shared/chyusenDate";

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

  it("tự chèn dấu gạch chéo sau khi người dùng nhập ngày", () => {
    expect(formatChyusenDayMonthInput("1a2-3")).toBe("12/3");
    expect(formatChyusenDayMonthInput("12034")).toBe("12/03");
  });

  it("chỉ cảnh báo quá hạn sau khi đã qua hết ngày đăng ký theo giờ Nhật Bản", () => {
    expect(isChyusenRegistrationExpired("2026-08-13T00:00:00+09:00", new Date("2026-08-13T12:00:00+09:00"))).toBe(false);
    expect(isChyusenRegistrationExpired("2026-08-13T00:00:00+09:00", new Date("2026-08-14T00:01:00+09:00"))).toBe(true);
  });
});
