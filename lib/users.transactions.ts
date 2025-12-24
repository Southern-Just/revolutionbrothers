"use server";

import { db } from "@/lib/database/db";
import { transactions } from "@/lib/database/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/user.actions";

export async function getTransactions(userId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  if (userId) {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.occurredAt));
  }

  return db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.occurredAt));
}

export async function getTransactionById(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id));

  if (!transaction) throw new Error("NOT_FOUND");

  return transaction;
}

export async function updateTransaction(
  id: string,
  data: Partial<typeof transactions.$inferInsert>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const [updated] = await db
    .update(transactions)
    .set(data)
    .where(eq(transactions.id, id))
    .returning();

  if (!updated) throw new Error("NOT_FOUND");

  return updated;
}

export async function deleteTransaction(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const result = await db
    .delete(transactions)
    .where(eq(transactions.id, id));

  return { success: true };
}
