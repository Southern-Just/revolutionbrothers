import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { transactions } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";

/* ---------------- TYPES ---------------- */

type MpesaCallbackItem =
  | { Name: "Amount"; Value: number }
  | { Name: "MpesaReceiptNumber"; Value: string }
  | { Name: "TransactionDate"; Value: number }
  | { Name: "PhoneNumber"; Value: number }
  | { Name: string; Value?: never };

type MpesaCallbackMetadata = {
  Item: MpesaCallbackItem[];
};

type MpesaStkCallback = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: MpesaCallbackMetadata;
};

type MpesaWebhookBody = {
  Body?: {
    stkCallback?: MpesaStkCallback;
  };
};

/* ---------------- TYPE GUARDS ---------------- */

function isMpesaWebhookBody(value: unknown): value is MpesaWebhookBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "Body" in value
  );
}

function extractMetadata(
  metadata?: MpesaCallbackMetadata
): {
  amount?: number;
  receipt?: string;
  transactionDate?: Date;
  phone?: string;
} {
  if (!metadata) return {};

  const result: {
    amount?: number;
    receipt?: string;
    transactionDate?: Date;
    phone?: string;
  } = {};

  for (const item of metadata.Item) {
    if (!("Value" in item)) continue;

    switch (item.Name) {
      case "Amount": {
        if (typeof item.Value === "number") {
          result.amount = item.Value;
        }
        break;
      }

      case "MpesaReceiptNumber": {
        if (typeof item.Value === "string") {
          result.receipt = item.Value;
        }
        break;
      }

      case "TransactionDate": {
        if (typeof item.Value === "number") {
          result.transactionDate = new Date(
            item.Value
              .toString()
              .replace(
                /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
                "$1-$2-$3T$4:$5:$6"
              )
          );
        }
        break;
      }

      case "PhoneNumber": {
        if (typeof item.Value === "number") {
          result.phone = item.Value.toString();
        }
        break;
      }
    }
  }

  return result;
}


/* ---------------- WEBHOOK ---------------- */

export async function POST(req: Request) {
  /* -------- Secret validation -------- */
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Unauthorized" },
      { status: 401 }
    );
  }

  /* -------- Parse body safely -------- */
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 0 });
  }

  if (!isMpesaWebhookBody(payload)) {
    return NextResponse.json({ ResultCode: 0 });
  }

  const callback = payload.Body?.stkCallback;

  if (!callback) {
    return NextResponse.json({ ResultCode: 0 });
  }

  const {
    ResultCode,
    CheckoutRequestID,
    CallbackMetadata,
  } = callback;

  /* -------- Handle failure -------- */
  if (ResultCode !== 0) {
    await db
      .update(transactions)
      .set({ status: "declined" })
      .where(
        and(
          eq(transactions.id, CheckoutRequestID),
          eq(transactions.status, "pending")
        )
      );

    return NextResponse.json({ ResultCode: 0 });
  }

  /* -------- Handle success -------- */
  const { receipt, transactionDate } =
    extractMetadata(CallbackMetadata);

  if (!receipt || !transactionDate) {
    return NextResponse.json({ ResultCode: 0 });
  }

  // Idempotent update
  await db
    .update(transactions)
    .set({
      status: "verified",
      transactionCode: receipt,
      occurredAt: transactionDate,
    })
    .where(
      and(
        eq(transactions.id, CheckoutRequestID),
        eq(transactions.status, "pending")
      )
    );

  return NextResponse.json({
    ResultCode: 0,
    ResultDesc: "Accepted",
  });
}
