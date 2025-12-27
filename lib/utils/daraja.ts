import axios, { AxiosError } from "axios";
import { db } from "@/lib/database/db";
import { transactions } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { encryptInitiatorPassword } from "./daraja-crypto";

const BASE_URL = "https://sandbox.safaricom.co.ke";

/* ---------------- AUTH ---------------- */

export async function getDarajaToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("MPESA_CREDENTIALS_MISSING");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

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
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  throw new Error("INVALID_PHONE");
}

/* ---------------- STK PUSH ---------------- */

export async function stkPush(input: {
  phone: string;
  amount: number;
  reference: string;
}) {
  const token = await getDarajaToken();
  const ts = timestamp();

  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  const secret = process.env.MPESA_WEBHOOK_SECRET;

  if (!shortcode || !passkey || !callbackUrl || !secret) {
    throw new Error("MPESA_ENV_MISSING");
  }

  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  try {
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
        AccountReference: input.reference,
        TransactionDesc: "Deposit",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    await db
      .update(transactions)
      .set({ checkoutRequestId: res.data.CheckoutRequestID })
      .where(eq(transactions.id, input.reference));

    return res.data;
  } catch (e) {
    const err = e as AxiosError;
    console.error("STK PUSH ERROR:", err.response?.data ?? err.message);
    throw new Error("STK_PUSH_FAILED");
  }
}

/* ---------------- B2C ---------------- */

export async function b2cPayment(input: {
  phone: string;
  amount: number;
  reference: string;
}) {
  const token = await getDarajaToken();

  const shortcode = process.env.MPESA_SHORTCODE;
  const initiator = process.env.MPESA_INITIATOR_NAME;
  const initiatorPassword = process.env.MPESA_INITIATOR_PASSWORD;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  const secret = process.env.MPESA_WEBHOOK_SECRET;

  if (!shortcode || !initiator || !initiatorPassword || !callbackUrl || !secret) {
    throw new Error("MPESA_B2C_ENV_MISSING");
  }

  const securityCredential = encryptInitiatorPassword(initiatorPassword);

  try {
    const res = await axios.post(
      `${BASE_URL}/mpesa/b2c/v1/paymentrequest`,
      {
        InitiatorName: initiator,
        SecurityCredential: securityCredential,
        CommandID: "BusinessPayment",
        Amount: Math.floor(input.amount),
        PartyA: Number(shortcode),
        PartyB: normalizePhone(input.phone),
        Remarks: "Payout",
        QueueTimeOutURL: `${callbackUrl}?secret=${secret}`,
        ResultURL: `${callbackUrl}?secret=${secret}`,
        Occasion: input.reference,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    await db
      .update(transactions)
      .set({ checkoutRequestId: res.data.ConversationID })
      .where(eq(transactions.id, input.reference));

    return { ConversationID: res.data.ConversationID };
  } catch (e) {
    const err = e as AxiosError;
    console.error("B2C ERROR:", err.response?.data ?? err.message);
    throw new Error("B2C_PAYMENT_FAILED");
  }
}
