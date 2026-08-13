import { describe, expect, it } from "vitest";
import { EMPTY_CHYUSEN_DRAFT } from "../client/src/lib/chyusenDraft";
import { buildChyusenSubmission } from "../client/src/lib/chyusenSubmission";

describe("buildChyusenSubmission", () => {
  it("chuyển ngày dd/mm của bản ghi chỉnh sửa thành Date năm hiện tại theo JST", () => {
    const payload = buildChyusenSubmission({
      ...EMPTY_CHYUSEN_DRAFT,
      title: "Chỉnh sửa Chyusen", productName: "Pikachu Box", applicationEnd: "05/01",
    }, new Date("2027-01-02T10:00:00.000Z"));

    expect(payload.applicationEnd?.toISOString()).toBe("2027-01-04T15:00:00.000Z");
    expect(payload.sourceUrl).toBeUndefined();
  });

  it("báo lỗi nếu ngày submit không theo dạng dd/mm", () => {
    expect(() => buildChyusenSubmission({
      ...EMPTY_CHYUSEN_DRAFT,
      title: "Chỉnh sửa Chyusen", productName: "Pikachu Box", applicationEnd: "2027-01-05",
    })).toThrow("Hết hạn đăng ký phải có dạng ngày/tháng");
  });
});
