import { and, desc, eq, isNull } from "drizzle-orm";
import { trashItems } from "../drizzle/schema";
import { getDb } from "./db";

export type TrashEntityType = "product" | "purchase" | "sale" | "chyusen" | "source" | "notification";

export async function createTrashItem(userId: number, input: {
  entityType: TrashEntityType;
  entityId: number;
  title: string;
  snapshot: unknown;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trashItems).values({
    userId,
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    snapshot: JSON.stringify(input.snapshot),
  });
  return { id: result[0].insertId };
}

export async function listTrashItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: trashItems.id,
    entityType: trashItems.entityType,
    entityId: trashItems.entityId,
    title: trashItems.title,
    deletedAt: trashItems.deletedAt,
  }).from(trashItems)
    .where(and(eq(trashItems.userId, userId), isNull(trashItems.restoredAt)))
    .orderBy(desc(trashItems.deletedAt));
}

export async function getTrashItem(userId: number, trashId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [item] = await db.select().from(trashItems)
    .where(and(eq(trashItems.id, trashId), eq(trashItems.userId, userId), isNull(trashItems.restoredAt)))
    .limit(1);
  if (!item) throw new Error("Mục Thùng rác không tồn tại hoặc đã được khôi phục.");
  return item;
}

export async function markTrashItemRestored(userId: number, trashId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trashItems).set({ restoredAt: new Date() })
    .where(and(eq(trashItems.id, trashId), eq(trashItems.userId, userId), isNull(trashItems.restoredAt)));
}

export async function markLatestTrashItemRestored(userId: number, entityType: TrashEntityType, entityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [item] = await db.select({ id: trashItems.id }).from(trashItems)
    .where(and(eq(trashItems.userId, userId), eq(trashItems.entityType, entityType), eq(trashItems.entityId, entityId), isNull(trashItems.restoredAt)))
    .orderBy(desc(trashItems.deletedAt))
    .limit(1);
  if (item) await markTrashItemRestored(userId, item.id);
}
