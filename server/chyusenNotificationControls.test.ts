import { describe, expect, it } from "vitest";
import { getChyusenNotificationFilterGroup, matchesChyusenNotificationFilter, shouldPlayChyusenAlert } from "@shared/chyusenNotificationFilter";

describe("chyusen notification controls", () => {
  it("phân loại hạn đăng ký và kết quả để lọc thông báo", () => {
    expect(getChyusenNotificationFilterGroup("deadline_24h")).toBe("deadline");
    expect(getChyusenNotificationFilterGroup("result_day")).toBe("result");
    expect(matchesChyusenNotificationFilter("deadline_3h", "deadline")).toBe(true);
    expect(matchesChyusenNotificationFilter("source_changed", "result")).toBe(false);
  });

  it("chỉ phát âm thanh khi tùy chọn tương ứng được bật", () => {
    expect(shouldPlayChyusenAlert({ priority: "medium", soundNewEnabled: true })).toBe(true);
    expect(shouldPlayChyusenAlert({ priority: "critical", soundUrgentEnabled: true })).toBe(true);
    expect(shouldPlayChyusenAlert({ priority: "critical", soundNewEnabled: true, soundUrgentEnabled: false })).toBe(false);
  });
});
