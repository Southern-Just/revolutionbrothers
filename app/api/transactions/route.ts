import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { transactions } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    if (userId) {
      const data = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));

      return NextResponse.json(data);
    }

    const data = await db.select().from(transactions);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const [created] = await db
      .insert(transactions)
      .values({
        userId: body.userId,
        name: body.name,
        amount: body.amount,
        type: body.type,
        status: body.status,
        category: body.category,
        transactionCode: body.transactionCode,
        occurredAt: new Date(body.occurredAt),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
