import { describe, expect, it } from "vitest";
import { isChyusenResultAnnouncementToday } from "../shared/chyusenResultReminder";

describe("Chyusen result reminder", () => {
  const now = new Date("2026-08-17T10:00:00+09:00");

  it("nhắc Chyusen chờ kết quả đúng ngày công bố theo lịch Nhật", () => {
    expect(isChyusenResultAnnouncementToday({ applicationStatus: "registered", resultStatus: "pending", resultDate: "2026-08-17T00:00:00+09:00" }, now)).toBe(true);
  });

  it("không nhắc mục đã có kết quả hoặc chưa đến ngày", () => {
    expect(isChyusenResultAnnouncementToday({ applicationStatus: "registered", resultStatus: "pending", resultDate: "2026-08-18T00:00:00+09:00" }, now)).toBe(false);
    expect(isChyusenResultAnnouncementToday({ applicationStatus: "won", resultStatus: "won", resultDate: "2026-08-17T00:00:00+09:00" }, now)).toBe(false);
  });
});
