"use server";

import { db } from "@/lib/database/db";
import { transactions, users, userProfiles } from "@/lib/database/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "./user.actions";
import { getMyProfile } from "./user.systeme";
import { stkPush } from "@/lib/daraja";
import { unstable_noStore as noStore } from "next/cache";

/* ---------------- TYPES ---------------- */

export type TransactionDTO = {
  id: string;
  userId: string;
  month: string;
  amount: number;
  name: string;
  type: "credit" | "debit";
  status: "pending" | "verified" | "declined";
  category: string;
  transactionCode: string;
  occurredAt: Date;
  createdAt: Date;
};

export type CreateTransactionInput = {
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

/* ---------------- CORE ---------------- */

export async function createTransaction(input: CreateTransactionInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const [tx] = await db
    .insert(transactions)
    .values({
      userId: currentUser.id,
      ...input,
      status: "pending",
    })
    .returning();

  return tx;
}

/* ---------------- DARAJA ---------------- */

export async function initiateDeposit(amount: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const profile = await getMyProfile();
  if (!profile?.phone) throw new Error("NO_PHONE");

  const tx = await createTransaction({
    month: new Date().toISOString().slice(0, 7),
    amount: Math.floor(amount),
    type: "credit",
    category: "mpesa",
    transactionCode: "PENDING",
    occurredAt: new Date(),
  });

  await stkPush({
    phone: profile.phone, // normalized inside stkPush
    amount: Math.floor(amount),
    reference: tx.id,
  });

  return { success: true };
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
