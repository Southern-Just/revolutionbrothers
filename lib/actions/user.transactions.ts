"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { transactions, users, userProfiles } from "@/lib/database/schema";
import { and, desc, eq, inArray, sql, lt } from "drizzle-orm";
import { getCurrentUser } from "./user.actions";
import { getMyProfile } from "./user.systeme";
import { stkPush } from "@/lib/utils/daraja";
import { unstable_noStore as noStore } from "next/cache";

/* ---------------- TYPES ---------------- */

export type TransactionDTO = {
  id: string;
  userId: string;
  name: string;
  month: string;
  amount: number;
  type: "credit" | "debit";
  status: "pending" | "verified" | "declined";
  category: string;
  transactionCode: string;
  occurredAt: Date;
  createdAt: Date;
};

export type CreateTransactionInput = {
  userId?: string; // Added optional userId for treasurers
  month: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  transactionCode: string;
  occurredAt: Date;
};

export type UpdateTransactionInput = Partial<{
  month: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  occurredAt: Date;
  status: "pending" | "verified" | "declined";
}>;

/* ---------------- AUTH GUARD ---------------- */
function requireAuth(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) redirect("/"); // replaces throwing UNAUTHORIZED
  return user;
}

/* ---------------- CREATE ---------------- */

export async function createTransaction(input: CreateTransactionInput) {
  const currentUser = requireAuth(await getCurrentUser());

  const userId = input.userId || currentUser.id;

  // Authorization: Only treasurers can create for others, or users for themselves
  if (currentUser.role !== "treasurer" && userId !== currentUser.id) {
    throw new Error("Unauthorized");
  }

  const [tx] = await db
    .insert(transactions)
    .values({
      userId,
      month: input.month,
      amount: input.amount,
      type: input.type,
      category: input.category,
      transactionCode: input.transactionCode,
      status: "pending",
      occurredAt: input.occurredAt,
    })
    .returning();

  return tx;
}

/* ---------------- STK PUSH ---------------- */

function generateTransactionCode() {
  return `MPESA-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function initiateDeposit(amount: number) {
  const user = requireAuth(await getCurrentUser());
  const profile = await getMyProfile();

  if (!profile?.phone) redirect("/"); // replaces NO_PHONE

  const transactionCode = generateTransactionCode();

  const [tx] = await db
    .insert(transactions)
    .values({
      userId: user.id,
      month: new Date().toISOString().slice(0, 7),
      amount: Math.floor(amount),
      type: "credit",
      category: "mpesa",
      transactionCode,
      status: "pending",
      occurredAt: new Date(),
    })
    .returning();

  try {
    await stkPush({
      phone: profile.phone,
      amount,
      reference: transactionCode,
    });
  } catch (error) {
    // If STK push fails, clean up the pending transaction
    await db
      .delete(transactions)
      .where(eq(transactions.id, tx.id));
    throw error;  // Re-throw to let the UI handle the error
  }

  return tx;
}

/* ---------------- READ ---------------- */

export async function getMyTransactions(): Promise<TransactionDTO[]> {
  const currentUser = requireAuth(await getCurrentUser());

  return db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      name: sql<string>`coalesce(${userProfiles.name}, ${users.email})`,
      month: transactions.month,
      amount: transactions.amount,
      type: transactions.type,
      status: transactions.status,
      category: transactions.category,
      transactionCode: transactions.transactionCode,
      occurredAt: transactions.occurredAt,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(users, eq(users.id, transactions.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(transactions.userId, currentUser.id))  // Include pending now
    .orderBy(desc(transactions.occurredAt));
}

export async function getAllTransactions(): Promise<TransactionDTO[]> {
  const currentUser = requireAuth(await getCurrentUser());

  return db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      name: sql<string>`coalesce(${userProfiles.name}, ${users.email})`,
      month: transactions.month,
      amount: transactions.amount,
      type: transactions.type,
      status: transactions.status,
      category: transactions.category,
      transactionCode: transactions.transactionCode,
      occurredAt: transactions.occurredAt,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(users, eq(users.id, transactions.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .orderBy(desc(transactions.occurredAt));  // Include pending now
}

export async function getRecentTransactionsAllUsers(limit = 6): Promise<TransactionDTO[]> {
  noStore();

  const currentUser = requireAuth(await getCurrentUser());

  return db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      name: sql<string>`coalesce(${userProfiles.name}, ${users.email})`,
      month: transactions.month,
      amount: transactions.amount,
      type: transactions.type,
      status: transactions.status,
      category: transactions.category,
      transactionCode: transactions.transactionCode,
      occurredAt: transactions.occurredAt,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(users, eq(users.id, transactions.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .orderBy(desc(transactions.occurredAt))  // Include pending now
    .limit(limit);
}

/* ---------------- UPDATE / DELETE ---------------- */

export async function updateTransaction(transactionId: string, input: UpdateTransactionInput) {
  const currentUser = requireAuth(await getCurrentUser());

  const [updated] = await db
    .update(transactions)
    .set(input)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, currentUser.id)
      )
    )
    .returning();

  if (!updated) redirect("/"); // replaces NOT_FOUND

  return updated;
}

export async function deleteTransaction(transactionId: string) {
  const currentUser = requireAuth(await getCurrentUser());

  const deleted = await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, currentUser.id)
      )
    )
    .returning();

  if (!deleted.length) redirect("/"); // replaces NOT_FOUND
  return { success: true };
}

/* ---------------- TOTAL BALANCE ---------------- */

export async function getTotalBalance(): Promise<number> {
  const credits = await db
    .select({ sum: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(eq(transactions.type, "credit"), eq(transactions.status, "verified")));  // Only verified

  const debits = await db
    .select({ sum: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(eq(transactions.type, "debit"), eq(transactions.status, "verified")));  // Only verified

  const totalCredits = credits[0]?.sum || 0;
  const totalDebits = debits[0]?.sum || 0;

  return totalCredits - totalDebits;
}

/* ---------------- CLEANUP ---------------- */

export async function cleanupStalePendingTransactions() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);  // 24 hours ago

  await db
    .update(transactions)
    .set({ status: "declined" })
    .where(
      and(
        eq(transactions.status, "pending"),
        lt(transactions.createdAt, cutoff)
      )
    );
}

/* ---------------- MY TOTAL BALANCE ---------------- */

export async function getMyTotalBalance(): Promise<number> {
  const currentUser = requireAuth(await getCurrentUser());

  const credits = await db
    .select({ sum: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(eq(transactions.userId, currentUser.id), eq(transactions.type, "credit"), eq(transactions.status, "verified")));

  const debits = await db
    .select({ sum: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(eq(transactions.userId, currentUser.id), eq(transactions.type, "debit"), eq(transactions.status, "verified")));

  const totalCredits = credits[0]?.sum || 0;
  const totalDebits = debits[0]?.sum || 0;

  return totalCredits - totalDebits;
}