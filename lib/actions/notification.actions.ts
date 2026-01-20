"use server";

import { db } from "@/lib/database/db";
import { notifications } from "@/lib/database/schema";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { desc, sql } from "drizzle-orm";

export type NotificationType =
  | "announcement"
  | "terms_update"
  | "minutes_update";

export async function createNotification(input: {
  title?: string;
  message?: string;
  type: NotificationType;
}) {
  const [created] = await db
    .insert(notifications)
    .values({
      title: input.title ?? null,
      message: input.message ?? null,
      type: input.type,
    })
    .returning();

  return created;
}

export async function getUserNotifications(includeDeleted = false) {
  const user = await getCurrentUser();
  if (!user) return [];

  if (includeDeleted) {
    return db
      .select()
      .from(notifications)
      .where(sql`${user.id} = ANY(${notifications.deletedBy})`)
      .orderBy(desc(notifications.createdAt));
  }

  return db
    .select()
    .from(notifications)
    .where(sql`NOT (${user.id} = ANY(${notifications.deletedBy}))`)
    .orderBy(desc(notifications.createdAt));
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;

  await db.execute(sql`
    UPDATE notifications
    SET read_by = array_append(read_by, ${user.id})
    WHERE NOT (${user.id} = ANY(read_by))
      AND NOT (${user.id} = ANY(deleted_by))
  `);
}

export async function deleteNotification(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await db.execute(sql`
    UPDATE notifications
    SET deleted_by = array_append(deleted_by, ${user.id})
    WHERE id = ${notificationId}
      AND NOT (${user.id} = ANY(deleted_by))
  `);
}

export async function permanentlyDeleteNotification(
  notificationId: string
) {
  await db
    .delete(notifications)
    .where(sql`${notifications.id} = ${notificationId}`);
}
