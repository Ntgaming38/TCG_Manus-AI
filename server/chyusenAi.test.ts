import { describe, expect, it } from "vitest";
import { normalizeChyusenAiSchedule, parseChyusenAiOutput } from "./chyusenAi";

describe("Chyusen AI schedule normalization", () => {
  it("keeps explicitly extracted JST timestamps", () => {
    const result = normalizeChyusenAiSchedule({
      title: "抽選販売 ONE PIECE",
      registrationStartAt: "2026-08-07T17:00:00+09:00",
      registrationDeadline: "2026-08-18T23:00:00+09:00",
      drawAt: null,
      confidence: "high",
      note: "Ngày và giờ được nêu rõ trong bài đăng.",
    });
    expect(result.registrationStartAt?.toISOString()).toBe("2026-08-07T08:00:00.000Z");
    expect(result.registrationDeadline?.toISOString()).toBe("2026-08-18T14:00:00.000Z");
  });

  it("leaves absent or invalid dates empty instead of inventing a calendar value", () => {
    const result = normalizeChyusenAiSchedule({
      title: null,
      registrationStartAt: null,
      registrationDeadline: "8/18 23:00",
      drawAt: null,
      confidence: "low",
      note: "Bài đăng thiếu năm rõ ràng.",
    });
    expect(result.registrationStartAt).toBeNull();
    expect(result.registrationDeadline).toBeNull();
    expect(result.confidence).toBe("low");
  });

  it("accepts a plain JSON response while retaining exact-only date validation", () => {
    const result = parseChyusenAiOutput(JSON.stringify({
      title: "ONE PIECE CARD GAME",
      registrationStartAt: "2026-08-07T17:00:00+09:00",
      registrationDeadline: null,
      drawAt: null,
      confidence: "medium",
      note: "Bài đăng không có hạn cuối rõ ràng.",
    }));
    expect(result.title).toBe("ONE PIECE CARD GAME");
    expect(result.registrationStartAt?.toISOString()).toBe("2026-08-07T08:00:00.000Z");
    expect(result.registrationDeadline).toBeNull();
  });
});
