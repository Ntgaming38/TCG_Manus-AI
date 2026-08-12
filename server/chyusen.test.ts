import { describe, expect, it } from "vitest";
import { getChyusenDeadlineUrgency, getChyusenTimelineStatus } from "../shared/chyusen";

const now = new Date("2026-08-12T00:00:00.000Z").getTime();

function entry(overrides: Partial<Parameters<typeof getChyusenTimelineStatus>[0]> = {}) {
  return {
    registrationStartAt: new Date("2026-08-01T00:00:00.000Z"),
    registrationDeadline: new Date("2026-08-30T00:00:00.000Z"),
    drawAt: new Date("2026-09-01T00:00:00.000Z"),
    resultStatus: "pending" as const,
    ...overrides,
  };
}

describe("Chyusen timeline status", () => {
  it("marks a future registration as upcoming", () => {
    expect(getChyusenTimelineStatus(entry({ registrationStartAt: new Date("2026-08-20T00:00:00.000Z") }), now)).toBe("upcoming");
  });

  it("marks a deadline within three days as deadline", () => {
    expect(getChyusenTimelineStatus(entry({ registrationDeadline: new Date("2026-08-14T00:00:00.000Z") }), now)).toBe("deadline");
  });

  it("marks a passed deadline as expired", () => {
    expect(getChyusenTimelineStatus(entry({ registrationDeadline: new Date("2026-08-10T00:00:00.000Z") }), now)).toBe("expired");
  });

  it("prioritizes an explicit result over timeline dates", () => {
    expect(getChyusenTimelineStatus(entry({ resultStatus: "won", registrationDeadline: new Date("2026-08-10T00:00:00.000Z") }), now)).toBe("result");
  });

  it("uses notice, urgent, and critical tiers for 72, 24, and 6 hour reminders", () => {
    expect(getChyusenDeadlineUrgency(entry({ registrationDeadline: new Date("2026-08-14T00:00:00.000Z") }), now)).toBe("notice");
    expect(getChyusenDeadlineUrgency(entry({ registrationDeadline: new Date("2026-08-12T20:00:00.000Z") }), now)).toBe("urgent");
    expect(getChyusenDeadlineUrgency(entry({ registrationDeadline: new Date("2026-08-12T05:00:00.000Z") }), now)).toBe("critical");
  });

  it("does not assign an urgency tier to expired or completed programs", () => {
    expect(getChyusenDeadlineUrgency(entry({ registrationDeadline: new Date("2026-08-10T00:00:00.000Z") }), now)).toBeNull();
    expect(getChyusenDeadlineUrgency(entry({ resultStatus: "won", registrationDeadline: new Date("2026-08-12T05:00:00.000Z") }), now)).toBeNull();
  });
});
