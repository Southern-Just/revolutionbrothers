"use server";

import { db } from "@/lib/database/db";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { notifications } from "@/lib/database/schema";
import { desc, sql } from "drizzle-orm";

/* ---------------- CREATE ---------------- */

export async function createNotification(input: {
  title?: string;
  message?: string;
  type: "announcement" | "terms_update" | "minutes_update";
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

/* ---------------- FETCH ---------------- */

export async function getUserNotifications() {
  return db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt));
}

/* ---------------- MARK ALL AS READ ---------------- */

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;

  await db.execute(sql`
    UPDATE notifications
    SET read_by = array_append(read_by, ${user.id})
    WHERE NOT (${user.id} = ANY(read_by))
  `);
}
