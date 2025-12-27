"use server";

import { db } from "@/lib/database/db";
import { transactions, users } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./user.actions";

type CSVTransactionRow = {
  name?: string;
  amount: number;
  type: "credit" | "debit";
  status: "pending" | "verified" | "declined";
  category: string;
  transactionCode: string;
  occurredAt: Date;
  month: string;
  userId: string;
};

function parseCSV(text: string): string[][] {
  return text
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)


    
    .map((row) =>
      row
        .split(",")
        .map((cell) => cell.replace(/^"|"$/g, "").trim())
    );
}

export async function uploadTransactionsCSV(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "treasurer") {
    throw new Error("UNAUTHORIZED");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("INVALID_FILE");
  }

  const csvText = await file.text();
  const rows = parseCSV(csvText);

  const headerIndex = rows.findIndex((r) =>
    r.includes("Amount") && r.includes("Transaction Code")
  );

  if (headerIndex === -1) {
    throw new Error("INVALID_CSV_FORMAT");
  }

  const headers = rows[headerIndex];
  const dataRows = rows.slice(headerIndex + 1);

  const headerMap = Object.fromEntries(
    headers.map((h, i) => [h.toLowerCase(), i])
  );

  const emails = dataRows
    .map((r) => r[headerMap["name"]])
    .filter(Boolean);

  const usersList = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, users.email));

  const userMap = new Map(
    usersList.map((u) => [u.email, u.id])
  );

  const transactionsToInsert: CSVTransactionRow[] = dataRows.map((row) => {
    const occurredAt = new Date(row[headerMap["date"]]);
    const month = occurredAt.toISOString().slice(0, 7);

    const email = row[headerMap["name"]];
    const userId = userMap.get(email);

    if (!userId) {
      throw new Error(`USER_NOT_FOUND: ${email}`);
    }

    return {
      userId,
      amount: Number(row[headerMap["amount"]]),
      type: row[headerMap["type"]] as "credit" | "debit",
      status: row[headerMap["status"]] as
        | "pending"
        | "verified"
        | "declined",
      category: row[headerMap["category"]],
      transactionCode: row[headerMap["transaction code"]],
      occurredAt,
      month,
    };
  });

  await db.insert(transactions).values(transactionsToInsert);

  return { success: true, count: transactionsToInsert.length };
}
