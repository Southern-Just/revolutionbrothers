import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { transactions } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, params.id));

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (err) {
    console.error("Error fetching transaction:", err);
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const [updated] = await db
      .update(transactions)
      .set(body)
      .where(eq(transactions.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating transaction:", err);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await db.delete(transactions).where(eq(transactions.id, params.id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
