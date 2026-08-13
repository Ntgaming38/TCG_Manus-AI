import { describe, expect, it } from "vitest";
import { summarizeChyusenDashboard } from "../shared/chyusenDashboardStats";

describe("summarizeChyusenDashboard", () => {
  it("đưa Chyusen đã đăng ký vào Chờ kết quả ngay cả khi hạn đăng ký chưa hết", () => {
    expect(summarizeChyusenDashboard([
      { timeState: "expiring", urgency: "deadline_24h", daysRemaining: 1, applicationStatus: "registered" },
      { timeState: "expiring", urgency: "deadline_72h", daysRemaining: 1, applicationStatus: "not_registered" },
      { timeState: "expiring", urgency: "deadline_24h", daysRemaining: 2, applicationStatus: "not_registered" },
      { timeState: "waiting_result", applicationStatus: "not_registered" },
      { timeState: "waiting_result", applicationStatus: "won" },
      { timeState: "expired", applicationStatus: "lost" },
    ])).toEqual({ waitingResult: 2, expiring: 1, won: 1, lost: 1 });
  });
});
