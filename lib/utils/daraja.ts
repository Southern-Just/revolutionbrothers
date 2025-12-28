import axios from "axios";
import { db } from "@/lib/database/db";
import { transactions } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://sandbox.safaricom.co.ke";

/* ---------------- AUTH ---------------- */

async function getToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await axios.get<{ access_token: string }>(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  return res.data.access_token;
}

/* ---------------- HELPERS ---------------- */

function timestamp(): string {
  return new Date().toISOString().replace(/[-T:\.Z]/g, "").slice(0, 14);
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("254") ? digits : `254${digits.slice(1)}`;
}

/* ---------------- STK PUSH ---------------- */

export async function stkPush(input: {
  phone: string;
  amount: number;
  transactionId: string;
}) {
  const token = await getToken();
  const ts = timestamp();

  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const callbackUrl = process.env.MPESA_CALLBACK_URL!;
  const secret = process.env.MPESA_WEBHOOK_SECRET!;

  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: Number(shortcode),
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.floor(input.amount),
      PartyA: normalizePhone(input.phone),
      PartyB: Number(shortcode),
      PhoneNumber: normalizePhone(input.phone),
      CallBackURL: `${callbackUrl}?secret=${secret}`,
      AccountReference: input.transactionId,
      TransactionDesc: "Deposit",
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  await db
    .update(transactions)
    .set({ checkoutRequestId: res.data.CheckoutRequestID })
    .where(eq(transactions.id, input.transactionId));
}
