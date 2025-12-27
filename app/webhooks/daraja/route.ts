// Handles all Safaricom Daraja callbacks (STK Push + B2C)
import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { transactions } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";

/* ---------------- TYPES ---------------- */

type CallbackItem =
  | { Name: "Amount"; Value: number }
  | { Name: "MpesaReceiptNumber"; Value: string }
  | { Name: "TransactionDate"; Value: number }
  | { Name: "PhoneNumber"; Value: number }
  | { Name: string; Value?: never };

type CallbackMetadata = {
  Item: CallbackItem[];
};

type StkCallback = {
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: CallbackMetadata;
};

type B2CResult = {
  Result: {
    ConversationID: string;
    ResultCode: number;
    ResultDesc: string;
  };
};

type DarajaWebhook = { Body: { stkCallback: StkCallback } } | B2CResult;

/* ---------------- HELPERS ---------------- */

function extract(metadata?: CallbackMetadata): {
  receipt?: string;
  occurredAt?: Date;
} {
  if (!metadata) return {};

  let receipt: string | undefined;
  let occurredAt: Date | undefined;

  for (const item of metadata.Item) {
    if (item.Value === undefined) continue;

    if (item.Name === "MpesaReceiptNumber" && typeof item.Value === "string") {
      receipt = item.Value;
    }

    if (item.Name === "TransactionDate" && typeof item.Value === "number") {
      occurredAt = new Date(
        item.Value.toString().replace(
          /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
          "$1-$2-$3T$4:$5:$6"
        )
      );
    }
  }

  return { receipt, occurredAt };
}

/* ---------------- ROUTE ---------------- */

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("secret") !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ ResultCode: 1 }, { status: 401 });
  }

  let body: DarajaWebhook;

  try {
    body = (await req.json()) as DarajaWebhook;
  } catch {
    return NextResponse.json({ ResultCode: 0 });
  }

  /* ---------- STK PUSH ---------- */
  if ("Body" in body && body.Body.stkCallback) {
    const cb = body.Body.stkCallback;

    if (cb.ResultCode !== 0) {
      await db
        .update(transactions)
        .set({ status: "declined" })
        .where(
          and(
            eq(transactions.checkoutRequestId, cb.CheckoutRequestID),
            eq(transactions.status, "pending")
          )
        );

      return NextResponse.json({ ResultCode: 0 });
    }

    const { receipt, occurredAt } = extract(cb.CallbackMetadata);
    if (!receipt || !occurredAt) return NextResponse.json({ ResultCode: 0 });

    await db
      .update(transactions)
      .set({
        status: "verified",
        transactionCode: receipt,
        occurredAt,
      })
      .where(
        and(
          eq(transactions.checkoutRequestId, cb.CheckoutRequestID),
          eq(transactions.status, "pending")
        )
      );

    return NextResponse.json({ ResultCode: 0 });
  }

  /* ---------- B2C ---------- */
  if ("Result" in body) {
    const status = body.Result.ResultCode === 0 ? "verified" : "declined";

    await db
      .update(transactions)
      .set({ status })
      .where(
        and(
          eq(transactions.checkoutRequestId, body.Result.ConversationID),
          eq(transactions.status, "pending")
        )
      );

    return NextResponse.json({ ResultCode: 0 });
  }

  return NextResponse.json({ ResultCode: 0 });
}
