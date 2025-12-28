import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { transactions } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

/* ---------------- TYPES ---------------- */

type CallbackItem =
  | { Name: "Amount"; Value: number }
  | { Name: "MpesaReceiptNumber"; Value: string }
  | { Name: "TransactionDate"; Value: number }
  | { Name: "PhoneNumber"; Value: number };

type CallbackMetadata = {
  Item: CallbackItem[];
};

type StkCallback = {
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: CallbackMetadata;
};

type DarajaWebhook = {
  Body?: {
    stkCallback?: StkCallback;
  };
};

/* ---------------- ROUTE ---------------- */

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("secret") !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ ResultCode: 1 });
  }

  const body = (await req.json()) as DarajaWebhook;
  const cb = body.Body?.stkCallback;

  if (!cb) return NextResponse.json({ ResultCode: 0 });

  /* ---------- DECLINED ---------- */
  if (cb.ResultCode !== 0) {
    await db
      .update(transactions)
      .set({ status: "declined" })
      .where(eq(transactions.checkoutRequestId, cb.CheckoutRequestID));

    return NextResponse.json({ ResultCode: 0 });
  }

  /* ---------- VERIFIED ---------- */
  const items = cb.CallbackMetadata?.Item ?? [];

  const receiptItem = items.find(
    (i): i is Extract<CallbackItem, { Name: "MpesaReceiptNumber" }> =>
      i.Name === "MpesaReceiptNumber"
  );

  const dateItem = items.find(
    (i): i is Extract<CallbackItem, { Name: "TransactionDate" }> =>
      i.Name === "TransactionDate"
  );

  if (!receiptItem || !dateItem) {
    return NextResponse.json({ ResultCode: 0 });
  }

  const occurredAt = new Date(
    dateItem.Value.toString().replace(
      /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
      "$1-$2-$3T$4:$5:$6"
    )
  );

  await db
    .update(transactions)
    .set({
      status: "verified",
      mpesaReceipt: receiptItem.Value,
      occurredAt,
    })
    .where(eq(transactions.checkoutRequestId, cb.CheckoutRequestID));

  return NextResponse.json({ ResultCode: 0 });
}
