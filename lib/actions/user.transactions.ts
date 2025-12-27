"use server";

import { db } from "@/lib/database/db";
import { transactions, users, userProfiles } from "@/lib/database/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getCurrentUser } from "./user.actions";
import { getMyProfile } from "./user.systeme";
import { stkPush } from "@/lib/utils/daraja";
import { unstable_noStore as noStore } from "next/cache";
import { CreateTransactionInput, TransactionDTO, UpdateTransactionInput } from "@/types";


export async function createTransaction(input: CreateTransactionInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const [tx] = await db
    .insert(transactions)
    .values({
      userId: currentUser.id,
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

/* ---------------- STK PUSH (AUTO CODE) ---------------- */

function generateTransactionCode() {
  return `MPESA-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function initiateDeposit(amount: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const profile = await getMyProfile();
  if (!profile?.phone) throw new Error("NO_PHONE");

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

  await stkPush({
    phone: profile.phone,
    amount,
    reference: transactionCode,
  });

  return tx;
}

/* ---------------- READ ---------------- */

export async function getMyTransactions(): Promise<TransactionDTO[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

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
    .where(eq(transactions.userId, currentUser.id))
    .orderBy(desc(transactions.occurredAt));
}

export async function getAllTransactions(): Promise<TransactionDTO[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

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
    .orderBy(desc(transactions.occurredAt));
}

export async function getRecentTransactionsAllUsers(
  limit = 6
): Promise<TransactionDTO[]> {
  noStore();

  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

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
    .orderBy(desc(transactions.occurredAt))
    .limit(limit);
}

/* ---------------- UPDATE / DELETE ---------------- */

export async function updateTransaction(
  transactionId: string,
  input: UpdateTransactionInput
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

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

  if (!updated) throw new Error("NOT_FOUND");
  return updated;
}

export async function deleteTransaction(transactionId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const deleted = await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, currentUser.id)
      )
    )
    .returning();

  if (!deleted.length) throw new Error("NOT_FOUND");
  return { success: true };
}



export async function getTotalBalance(): Promise<number> {
  const credits = await db
    .select({ sum: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(eq(transactions.type, 'credit'), inArray(transactions.status, ['verified', 'pending'])));

  const debits = await db
    .select({ sum: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(eq(transactions.type, 'debit'), inArray(transactions.status, ['verified', 'pending'])));

  const totalCredits = credits[0]?.sum || 0;
  const totalDebits = debits[0]?.sum || 0;

  return totalCredits - totalDebits;
}