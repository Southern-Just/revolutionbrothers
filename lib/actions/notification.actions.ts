"use server";

import { db } from "@/lib/database/db";
import { notifications } from "@/lib/database/schema";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { desc, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | "announcement"
  | "terms_update"
  | "minutes_update";

/* ------------------------------------------------------------------ */
/* CREATE                                                             */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* FETCH (Inbox / Bin)                                                 */
/* ------------------------------------------------------------------ */

export async function getUserNotifications(
  includeDeleted: boolean = false
) {
  const user = await getCurrentUser();
  if (!user) return [];

  if (includeDeleted) {
    // 🧺 BIN
    return db
      .select()
      .from(notifications)
      .where(sql`${user.id} = ANY(${notifications.deletedBy})`)
      .orderBy(desc(notifications.createdAt));
  }

  // 📥 INBOX
  return db
    .select()
    .from(notifications)
    .where(sql`NOT (${user.id} = ANY(${notifications.deletedBy}))`)
    .orderBy(desc(notifications.createdAt));
}

/* ------------------------------------------------------------------ */
/* MARK ALL AS READ                                                    */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* DELETE (Move to Bin)                                                */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* RESTORE FROM BIN                                                    */
/* ------------------------------------------------------------------ */

export async function restoreNotification(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await db.execute(sql`
    UPDATE notifications
    SET deleted_by = array_remove(deleted_by, ${user.id})
    WHERE id = ${notificationId}
  `);
}

/* ------------------------------------------------------------------ */
/* PERMANENT DELETE (optional / admin / cleanup job)                   */
/* ------------------------------------------------------------------ */

export async function permanentlyDeleteNotification(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  // Optional: restrict to admin roles if needed

  await db
    .delete(notifications)
    .where(sql`${notifications.id} = ${notificationId}`);
}
