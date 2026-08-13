import { and, eq, gte, lte } from "drizzle-orm";
import { chyusenEntries } from "../drizzle/schema";
import * as chyusenDb from "./chyusenDb";
import { getDb } from "./db";
import { fetchPublicChyusenSource } from "./chyusenSource";
import { getChyusenUrgency } from "./chyusenUtils";

export type ChyusenMonitorSummary = {
  sourcesChecked: number;
  sourceChanges: number;
  remindersCreated: number;
  unavailableSources: number;
};

/**
 * Deterministic monitor for public sources. It never calls the LLM and never
 * overwrites a user entry: differences only create a user-scoped notification.
 */
export async function runChyusenMonitor(taskUid: string): Promise<ChyusenMonitorSummary> {
  const config = await chyusenDb.getChyusenMonitorConfig();
  if (!config?.isEnabled || !config.scheduleCronTaskUid || config.scheduleCronTaskUid !== taskUid) {
    return { sourcesChecked: 0, sourceChanges: 0, remindersCreated: 0, unavailableSources: 0 };
  }

  const summary: ChyusenMonitorSummary = { sourcesChecked: 0, sourceChanges: 0, remindersCreated: 0, unavailableSources: 0 };
  const sources = await chyusenDb.listActiveChyusenSources();
  for (const source of sources) {
    summary.sourcesChecked += 1;
    try {
      const fetched = await fetchPublicChyusenSource(source.sourceUrl);
      const changed = Boolean(source.contentHash && source.contentHash !== fetched.contentHash);
      await chyusenDb.updateChyusenSourceStatus(source.id, {
        latestStatus: changed ? "detected" : "monitoring",
        latestError: null,
        contentHash: fetched.contentHash,
        lastDetectedAt: changed ? new Date() : undefined,
      });
      if (changed && source.entryId) {
        summary.sourceChanges += 1;
        await chyusenDb.createChyusenNotification({
          userId: source.userId,
          entryId: source.entryId,
          sourceId: source.id,
          type: "source_changed",
          notificationKey: `source-changed:${source.id}:${fetched.contentHash}`,
          title: "Nguồn Chyusen có thay đổi",
          message: `Nội dung công khai của ${source.label || "nguồn theo dõi"} đã thay đổi. Hãy mở Chyusen và bấm "Đọc thông tin" để xem preview trước khi cập nhật.`,
          isRead: 0,
        });
      }
    } catch (error) {
      summary.unavailableSources += 1;
      await chyusenDb.updateChyusenSourceStatus(source.id, {
        latestStatus: "unavailable",
        latestError: error instanceof Error ? error.message.slice(0, 800) : "Không thể truy cập nguồn công khai.",
      });
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const resultWindowEnd = new Date(now.getTime() + 24 * 3_600_000);
  const entries = await db.select().from(chyusenEntries)
    .where(and(eq(chyusenEntries.applicationStatus, "not_registered"), gte(chyusenEntries.applicationEnd, now)));
  for (const entry of entries) {
    const urgency = getChyusenUrgency(entry.applicationEnd, now);
    if (!urgency) continue;
    summary.remindersCreated += 1;
    const label = urgency === "deadline_3h" ? "3 giờ" : urgency === "deadline_24h" ? "24 giờ" : "72 giờ";
    await chyusenDb.createChyusenNotification({
      userId: entry.userId,
      entryId: entry.id,
      type: urgency,
      notificationKey: `${urgency}:${entry.id}`,
      title: `Chyusen sắp hết hạn trong ${label}`,
      message: `${entry.title} sẽ hết hạn đăng ký lúc ${entry.applicationEnd?.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) || "không rõ"}.`,
      isRead: 0,
    });
  }

  const resultEntries = await db.select().from(chyusenEntries)
    .where(and(eq(chyusenEntries.resultStatus, "pending"), gte(chyusenEntries.resultDate, now), lte(chyusenEntries.resultDate, resultWindowEnd)));
  for (const entry of resultEntries) {
    summary.remindersCreated += 1;
    await chyusenDb.createChyusenNotification({
      userId: entry.userId,
      entryId: entry.id,
      type: "result_day",
      notificationKey: `result-day:${entry.id}:${entry.resultDate?.toISOString() || "unknown"}`,
      title: "Hôm nay có công bố kết quả Chyusen",
      message: `Hãy kiểm tra kết quả cho ${entry.title} và cập nhật trạng thái Trúng/Trượt trong TCG Manager.`,
      isRead: 0,
    });
  }
  return summary;
}
