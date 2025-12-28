"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { transactions, users, userProfiles } from "@/lib/database/schema";
import { and, desc, eq, sql } from "drizzle-orm";
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
  mpesaReceipt: string | null;
  occurredAt: Date;
  createdAt: Date;
};

/* ---------------- AUTH ---------------- */

function requireAuth(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) redirect("/");
  return user;
}

/* ---------------- DEPOSIT ---------------- */

function generateTransactionCode() {
  return `TX-${Date.now()}`;
}

export async function initiateDeposit(amount: number) {
  const user = requireAuth(await getCurrentUser());
  const profile = await getMyProfile();

  if (!profile?.phone) redirect("/");

  const [tx] = await db
    .insert(transactions)
    .values({
      userId: user.id,
      month: new Date().toISOString().slice(0, 7),
      amount: Math.floor(amount),
      type: "credit",
      category: "mpesa",
      transactionCode: generateTransactionCode(),
      status: "pending",
      occurredAt: new Date(),
    })
    .returning();

  // 🔑 PASS TRANSACTION ID
  await stkPush({
    phone: profile.phone,
    amount,
    transactionId: tx.id,
  });

  return tx;
}

/* ---------------- READ ---------------- */

export async function getMyTransactions(): Promise<TransactionDTO[]> {
  const user = requireAuth(await getCurrentUser());

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
      mpesaReceipt: transactions.mpesaReceipt,
      occurredAt: transactions.occurredAt,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(users, eq(users.id, transactions.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.createdAt));
}

/* ---------------- BALANCE ---------------- */

export async function getTotalBalance(): Promise<number> {
  const credits = await db
    .select({ sum: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(eq(transactions.type, "credit"), eq(transactions.status, "verified")));

  const debits = await db
    .select({ sum: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(eq(transactions.type, "debit"), eq(transactions.status, "verified")));

  return (credits[0]?.sum ?? 0) - (debits[0]?.sum ?? 0);
}
