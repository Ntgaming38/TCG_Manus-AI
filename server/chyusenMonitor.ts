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
  const now = new Date();
  const sources = await chyusenDb.listDueChyusenSources(now);
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
        detectedCount: changed ? (source.detectedCount || 0) + 1 : source.detectedCount,
        failureCount: 0,
        nextCheckAt: new Date(now.getTime() + source.checkIntervalMinutes * 60_000),
      });
      if (changed) {
        summary.sourceChanges += 1;
        await chyusenDb.recordChyusenSourceHistory({
          userId: source.userId,
          sourceId: source.id,
          entryId: source.entryId ?? null,
          previousHash: source.contentHash ?? null,
          currentHash: fetched.contentHash,
          changeType: source.contentHash ? "content_changed" : "first_seen",
          summary: `Nội dung công khai của ${source.label || "nguồn theo dõi"} đã thay đổi; cần người dùng mở preview để xác nhận.`,
        });
        const settings = await chyusenDb.getChyusenNotificationSettings(source.userId);
        if (settings?.lotteryChanged !== 0) {
          await chyusenDb.createChyusenNotification({
            userId: source.userId,
            entryId: source.entryId ?? null,
            sourceId: source.id,
            type: "source_changed",
            category: "chyusen",
            priority: "medium",
            notificationKey: `source-changed:${source.id}:${fetched.contentHash}`,
            title: "Nguồn Chyusen có thay đổi",
            message: `Nội dung công khai của ${source.label || "nguồn theo dõi"} đã thay đổi. Hãy mở Chyusen và bấm "Đọc thông tin" để xem preview trước khi cập nhật.`,
            isRead: 0,
          });
        }
      }
    } catch (error) {
      summary.unavailableSources += 1;
      const failureCount = (source.failureCount || 0) + 1;
      const retryMinutes = failureCount === 1 ? 5 : failureCount === 2 ? 15 : 60;
      await chyusenDb.updateChyusenSourceStatus(source.id, {
        latestStatus: "unavailable",
        latestError: error instanceof Error ? error.message.slice(0, 800) : "Không thể truy cập nguồn công khai.",
        failureCount,
        nextCheckAt: new Date(now.getTime() + retryMinutes * 60_000),
      });
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const resultWindowEnd = new Date(now.getTime() + 24 * 3_600_000);
  const entries = await db.select().from(chyusenEntries)
    .where(and(eq(chyusenEntries.applicationStatus, "not_registered"), gte(chyusenEntries.applicationEnd, now)));
  for (const entry of entries) {
    const settings = await chyusenDb.getChyusenNotificationSettings(entry.userId);
    if (settings?.lotteryExpiring === 0 || !entry.applicationEnd) continue;
    const hoursRemaining = (entry.applicationEnd.getTime() - now.getTime()) / 3_600_000;
    for (const threshold of settings?.deadlineHours || []) {
      if (hoursRemaining > threshold || hoursRemaining <= Math.max(0, threshold - 1.15)) continue;
      summary.remindersCreated += 1;
      await chyusenDb.createChyusenNotification({
        userId: entry.userId,
        entryId: entry.id,
        type: `deadline_${threshold}h`,
        category: "chyusen",
        priority: threshold <= 1 ? "critical" : threshold <= 24 ? "high" : "medium",
        notificationKey: `deadline_${threshold}h:${entry.id}`,
        title: `Chyusen sắp hết hạn trong ${threshold} giờ`,
        message: `${entry.title} sẽ hết hạn đăng ký lúc ${entry.applicationEnd.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}.`,
        isRead: 0,
      });
    }
  }

  const resultEntries = await db.select().from(chyusenEntries)
    .where(and(eq(chyusenEntries.resultStatus, "pending"), gte(chyusenEntries.resultDate, now), lte(chyusenEntries.resultDate, resultWindowEnd)));
  for (const entry of resultEntries) {
    const settings = await chyusenDb.getChyusenNotificationSettings(entry.userId);
    if (settings?.lotteryResult === 0) continue;
    summary.remindersCreated += 1;
    await chyusenDb.createChyusenNotification({
      userId: entry.userId,
      entryId: entry.id,
      type: "result_day",
      category: "chyusen",
      priority: "high",
      notificationKey: `result-day:${entry.id}:${entry.resultDate?.toISOString() || "unknown"}`,
      title: "Hôm nay có công bố kết quả Chyusen",
      message: `Hãy kiểm tra kết quả cho ${entry.title} và cập nhật trạng thái Trúng/Trượt trong TCG Manager.`,
      isRead: 0,
    });
  }
  return summary;
}
