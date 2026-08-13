import { and, desc, eq, inArray } from "drizzle-orm";
import {
  chyusenEntries,
  chyusenHistory,
  chyusenMonitorConfig,
  chyusenNotifications,
  chyusenSources,
} from "../drizzle/schema";
import { getDb } from "./db";
import { getChyusenTimeState, getChyusenUrgency } from "./chyusenUtils";

export type ChyusenEntryInput = {
  title: string;
  productName: string;
  series?: string;
  productType?: "card" | "box" | "pack" | "set" | "other";
  shop?: string;
  customShopName?: string;
  sourceUrl: string;
  imageUrl?: string;
  price?: number | null;
  quantityLimit?: string;
  applicationStart?: Date | null;
  applicationEnd?: Date | null;
  resultDate?: Date | null;
  pickupStart?: Date | null;
  pickupEnd?: Date | null;
  requirements?: string;
  applicationStatus?: "not_registered" | "registered" | "cancelled" | "won" | "lost" | "not_participating";
  resultStatus?: "pending" | "won" | "lost" | "unknown";
  sourceTimezone?: string;
  parserStatus?: "manual" | "partial" | "detected" | "unavailable";
  parserNote?: string;
  fieldConfidence?: Record<string, string>;
  sourceContentHash?: string;
};

const editableFields = [
  "title", "productName", "series", "productType", "shop", "customShopName", "sourceUrl", "imageUrl", "price",
  "quantityLimit", "applicationStart", "applicationEnd", "resultDate", "pickupStart", "pickupEnd", "requirements",
  "applicationStatus", "resultStatus", "sourceTimezone", "parserStatus", "parserNote", "fieldConfidence", "sourceContentHash",
] as const;

const serialize = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : JSON.stringify(value);
};

export async function listChyusenEntries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(chyusenEntries)
    .where(eq(chyusenEntries.userId, userId))
    .orderBy(desc(chyusenEntries.updatedAt));
  return rows.map((entry) => ({
    ...entry,
    timeState: getChyusenTimeState(entry),
    urgency: getChyusenUrgency(entry.applicationEnd),
    fieldConfidence: entry.fieldConfidence ? JSON.parse(entry.fieldConfidence) : {},
  }));
}

export async function getChyusenEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [entry] = await db.select().from(chyusenEntries)
    .where(and(eq(chyusenEntries.id, entryId), eq(chyusenEntries.userId, userId)))
    .limit(1);
  if (!entry) return undefined;
  const history = await db.select().from(chyusenHistory)
    .where(and(eq(chyusenHistory.entryId, entryId), eq(chyusenHistory.userId, userId)))
    .orderBy(desc(chyusenHistory.createdAt));
  return {
    ...entry,
    timeState: getChyusenTimeState(entry),
    urgency: getChyusenUrgency(entry.applicationEnd),
    fieldConfidence: entry.fieldConfidence ? JSON.parse(entry.fieldConfidence) : {},
    history,
  };
}

export async function upsertChyusenSource(userId: number, sourceUrl: string, values: {
  entryId?: number;
  label?: string;
  latestStatus?: "monitoring" | "detected" | "unavailable";
  latestError?: string | null;
  contentHash?: string | null;
  lastDetectedAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [existing] = await db.select().from(chyusenSources)
    .where(and(eq(chyusenSources.userId, userId), eq(chyusenSources.sourceUrl, sourceUrl)))
    .limit(1);
  const now = new Date();
  if (existing) {
    await db.update(chyusenSources).set({
      entryId: values.entryId ?? existing.entryId,
      label: values.label ?? existing.label,
      latestStatus: values.latestStatus ?? existing.latestStatus,
      latestError: values.latestError === undefined ? existing.latestError : values.latestError,
      contentHash: values.contentHash === undefined ? existing.contentHash : values.contentHash,
      lastCheckedAt: now,
      lastDetectedAt: values.lastDetectedAt === undefined ? existing.lastDetectedAt : values.lastDetectedAt,
    }).where(eq(chyusenSources.id, existing.id));
    return { id: existing.id, created: false };
  }
  const result = await db.insert(chyusenSources).values({
    userId,
    sourceUrl,
    entryId: values.entryId ?? null,
    label: values.label ?? null,
    isActive: 1,
    latestStatus: values.latestStatus ?? "monitoring",
    latestError: values.latestError ?? null,
    contentHash: values.contentHash ?? null,
    lastCheckedAt: now,
    lastDetectedAt: values.lastDetectedAt ?? null,
  });
  return { id: result[0].insertId, created: true };
}

export async function createChyusenEntry(userId: number, input: ChyusenEntryInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chyusenEntries).values({
    userId,
    title: input.title,
    productName: input.productName,
    series: input.series || "Pokemon",
    productType: input.productType || "other",
    shop: input.shop || "Khác",
    customShopName: input.customShopName || null,
    sourceUrl: input.sourceUrl,
    imageUrl: input.imageUrl || null,
    price: input.price === undefined || input.price === null ? null : String(input.price),
    quantityLimit: input.quantityLimit || null,
    applicationStart: input.applicationStart || null,
    applicationEnd: input.applicationEnd || null,
    resultDate: input.resultDate || null,
    pickupStart: input.pickupStart || null,
    pickupEnd: input.pickupEnd || null,
    requirements: input.requirements || null,
    applicationStatus: input.applicationStatus || "not_registered",
    resultStatus: input.resultStatus || "pending",
    sourceTimezone: input.sourceTimezone || "Asia/Tokyo",
    parserStatus: input.parserStatus || "manual",
    parserNote: input.parserNote || null,
    fieldConfidence: input.fieldConfidence ? JSON.stringify(input.fieldConfidence) : null,
    sourceContentHash: input.sourceContentHash || null,
    lastCheckedAt: input.sourceContentHash ? new Date() : null,
  });
  const entryId = result[0].insertId;
  const source = await upsertChyusenSource(userId, input.sourceUrl, {
    entryId,
    label: input.shop || "Nguồn Chyusen",
    latestStatus: input.parserStatus === "unavailable" ? "unavailable" : "monitoring",
    contentHash: input.sourceContentHash || null,
  });
  await db.insert(chyusenHistory).values({
    userId,
    entryId,
    fieldName: "created",
    oldValue: null,
    newValue: "Chyusen đã được lưu sau khi người dùng xác nhận.",
    changeSource: input.parserStatus === "manual" ? "manual" : "source_import",
  });
  return { id: entryId, sourceId: source.id };
}

export async function updateChyusenEntry(userId: number, entryId: number, input: Partial<ChyusenEntryInput>, changeSource: "manual" | "source_refresh" = "manual") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [existing] = await db.select().from(chyusenEntries)
    .where(and(eq(chyusenEntries.id, entryId), eq(chyusenEntries.userId, userId))).limit(1);
  if (!existing) throw new Error("Chương trình Chyusen không tồn tại hoặc không thuộc tài khoản này.");

  const update: Record<string, unknown> = {};
  const historyRows: Array<typeof chyusenHistory.$inferInsert> = [];
  for (const field of editableFields) {
    const value = input[field];
    if (value === undefined) continue;
    const normalized = field === "price" && value !== null ? String(value) : field === "fieldConfidence" && value !== null ? JSON.stringify(value) : value;
    const previous = (existing as Record<string, unknown>)[field];
    if (serialize(previous) !== serialize(normalized)) {
      update[field] = normalized;
      historyRows.push({
        userId,
        entryId,
        fieldName: field,
        oldValue: serialize(previous),
        newValue: serialize(normalized),
        changeSource,
      });
    }
  }
  if (Object.keys(update).length > 0) {
    await db.update(chyusenEntries).set(update).where(eq(chyusenEntries.id, entryId));
    if (historyRows.length) await db.insert(chyusenHistory).values(historyRows);
  }
  if (input.sourceUrl && input.sourceUrl !== existing.sourceUrl) {
    await upsertChyusenSource(userId, input.sourceUrl, { entryId, label: input.shop || existing.shop || "Nguồn Chyusen" });
  }
  return { updated: Object.keys(update).length > 0 };
}

export async function deleteChyusenEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [entry] = await db.select().from(chyusenEntries)
    .where(and(eq(chyusenEntries.id, entryId), eq(chyusenEntries.userId, userId))).limit(1);
  if (!entry) throw new Error("Chương trình Chyusen không tồn tại hoặc không thuộc tài khoản này.");
  await db.delete(chyusenNotifications).where(and(eq(chyusenNotifications.userId, userId), eq(chyusenNotifications.entryId, entryId)));
  await db.delete(chyusenHistory).where(and(eq(chyusenHistory.userId, userId), eq(chyusenHistory.entryId, entryId)));
  await db.update(chyusenSources).set({ entryId: null }).where(and(eq(chyusenSources.userId, userId), eq(chyusenSources.entryId, entryId)));
  await db.delete(chyusenEntries).where(eq(chyusenEntries.id, entryId));
}

export async function markChyusenPurchaseCreated(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [entry] = await db.select().from(chyusenEntries)
    .where(and(eq(chyusenEntries.id, entryId), eq(chyusenEntries.userId, userId))).limit(1);
  if (!entry) throw new Error("Chương trình Chyusen không tồn tại hoặc không thuộc tài khoản này.");
  await db.update(chyusenEntries).set({ purchaseCreatedAt: new Date() }).where(eq(chyusenEntries.id, entryId));
  await db.insert(chyusenHistory).values({
    userId,
    entryId,
    fieldName: "purchaseCreatedAt",
    oldValue: serialize(entry.purchaseCreatedAt),
    newValue: new Date().toISOString(),
    changeSource: "manual",
  });
}

export async function listChyusenNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chyusenNotifications)
    .where(eq(chyusenNotifications.userId, userId))
    .orderBy(desc(chyusenNotifications.createdAt));
}

export async function markChyusenNotificationRead(userId: number, notificationId: number, isRead: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chyusenNotifications).set({ isRead: isRead ? 1 : 0 })
    .where(and(eq(chyusenNotifications.id, notificationId), eq(chyusenNotifications.userId, userId)));
}

export async function createChyusenNotification(values: typeof chyusenNotifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chyusenNotifications).values(values).onDuplicateKeyUpdate({ set: { notificationKey: values.notificationKey } });
}

export async function listActiveChyusenSources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chyusenSources).where(eq(chyusenSources.isActive, 1));
}

export async function getChyusenMonitorConfig() {
  const db = await getDb();
  if (!db) return undefined;
  const [config] = await db.select().from(chyusenMonitorConfig).limit(1);
  return config;
}

export async function setChyusenMonitorTask(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [config] = await db.select().from(chyusenMonitorConfig).limit(1);
  if (config) {
    await db.update(chyusenMonitorConfig).set({ scheduleCronTaskUid: taskUid, isEnabled: 1 }).where(eq(chyusenMonitorConfig.id, config.id));
  } else {
    await db.insert(chyusenMonitorConfig).values({
      scheduleCronTaskUid: taskUid,
      cronExpression: "0 0 */6 * * *",
      isEnabled: 1,
    });
  }
}

export async function updateChyusenSourceStatus(sourceId: number, update: { latestStatus?: "monitoring" | "detected" | "unavailable"; latestError?: string | null; contentHash?: string | null; lastDetectedAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chyusenSources).set({ ...update, lastCheckedAt: new Date() }).where(eq(chyusenSources.id, sourceId));
}

export async function listChyusenEntriesByIds(userId: number, entryIds: number[]) {
  const db = await getDb();
  if (!db || entryIds.length === 0) return [];
  return db.select().from(chyusenEntries).where(and(eq(chyusenEntries.userId, userId), inArray(chyusenEntries.id, entryIds)));
}
