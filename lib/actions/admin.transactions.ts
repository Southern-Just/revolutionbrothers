"use server";

import { db } from "@/lib/database/db";
import { transactions, users, userProfiles } from "@/lib/database/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "./user.actions";
import { getMyProfile, getTreasurerPhone } from "./user.systeme";

export type TransactionStatus = "pending" | "verified" | "declined";
export type TransactionType = "credit" | "debit";

export type BulkTransactionInput = {
  userId: string;
  month: string;
  amount: number;
  type: TransactionType;
  category: string;
  transactionCode: string;
  occurredAt: Date;
  status: TransactionStatus;
};

export async function getUserIdByName(name: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(sql`${userProfiles.name} = ${name} OR ${users.email} = ${name}`)
    .limit(1);

  return user?.id ?? null;
}

export async function parseAndBulkCreateTransactions(
  csvText: string,
  isPersonalView: boolean
): Promise<{ success: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const treasurerPhone = await getTreasurerPhone();
  const userProfile = await getMyProfile();
  if (!userProfile?.phone || userProfile.phone !== treasurerPhone) {
    throw new Error("ACCESS_DENIED: Only the treasurer can upload transactions");
  }

  try {
    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 4) throw new Error("Invalid CSV format: Not enough lines");

    const headers = lines[3].split(",").map((h) => h.trim());
    const expectedHeaders = isPersonalView
      ? ["Amount", "Type", "Status", "Date", "Transaction Code", "Category"]
      : ["Name", "Amount", "Type", "Status", "Date", "Transaction Code", "Category"];

    if (headers.length !== expectedHeaders.length || !headers.every((h, i) => h === expectedHeaders[i])) {
      throw new Error("CSV headers do not match expected format");
    }

    const transactionsToInsert: BulkTransactionInput[] = [];

    for (let i = 4; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length !== headers.length) continue;

      let userId: string;
      if (isPersonalView) {
        userId = currentUser.id;
      } else {
        const name = values[0].replace(/"/g, "");
        userId = (await getUserIdByName(name)) ?? "";
        if (!userId) continue;
      }

      const amount = parseFloat(values[isPersonalView ? 0 : 1]);
      const type = values[isPersonalView ? 1 : 2] as TransactionType;
      const status = values[isPersonalView ? 2 : 3] as TransactionStatus;
      const occurredAt = new Date(values[isPersonalView ? 3 : 4]);
      const transactionCode = values[isPersonalView ? 4 : 5];
      const category = values[isPersonalView ? 5 : 6];

      if (isNaN(amount) || !["credit", "debit"].includes(type) || !["pending", "verified", "declined"].includes(status) || isNaN(occurredAt.getTime())) {
        continue;
      }

      transactionsToInsert.push({
        userId,
        month: occurredAt.toISOString().slice(0, 7),
        amount,
        type,
        category,
        transactionCode,
        occurredAt,
        status,
      });
    }

    if (transactionsToInsert.length === 0) {
      return { success: false, message: "No valid transactions to upload." };
    }

    await db.insert(transactions).values(transactionsToInsert);

    return { success: true, message: `Successfully uploaded ${transactionsToInsert.length} transactions.` };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, message: `Upload failed: ${error.message}` };
    }
    return { success: false, message: "Upload failed: Unknown error" };
  }
}
