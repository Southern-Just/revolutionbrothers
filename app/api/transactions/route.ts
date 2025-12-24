import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { transactions } from "@/lib/database/schema";
import { eq, desc } from "drizzle-orm";  // Add desc import here

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    let data;
    if (userId) {
      data = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.occurredAt));  // Use desc() wrapper
    } else {
      data = await db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.occurredAt));  // Use desc() wrapper
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching transactions for userId=", userId, err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}