import axios, { AxiosError } from "axios";

const BASE_URL = "https://sandbox.safaricom.co.ke";

/* ---------------- AUTH ---------------- */

export async function getDarajaToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("MPESA_CREDENTIALS_MISSING");
  }

  const auth = Buffer.from(
    `${consumerKey}:${consumerSecret}`
  ).toString("base64");

  const res = await axios.get<{ access_token: string }>(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  return res.data.access_token;
}

/* ---------------- HELPERS ---------------- */

function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-T:\.Z]/g, "")
    .slice(0, 14);
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;

  throw new Error("INVALID_PHONE_FORMAT");
}

/* ---------------- STK PUSH ---------------- */

export async function stkPush(input: {
  phone: string;
  amount: number;
  reference: string;
}): Promise<unknown> {
  if (input.amount < 1) {
    throw new Error("INVALID_AMOUNT");
  }

  const token = await getDarajaToken();
  const timestamp = getTimestamp();

  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error("MPESA_ENV_MISSING");
  }

  const password = Buffer.from(
    `${shortcode}${passkey}${timestamp}`
  ).toString("base64");

  const payload = {
    BusinessShortCode: Number(shortcode),
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.floor(input.amount),
    PartyA: normalizePhone(input.phone),
    PartyB: Number(shortcode),
    PhoneNumber: normalizePhone(input.phone),
    CallBackURL: callbackUrl,
    AccountReference: input.reference,
    TransactionDesc: "Deposit",
  };

  try {
    const res = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (error) {
    const err = error as AxiosError;

    console.error("DARAJA ERROR:", err.response?.data || err.message);

    throw new Error("STK_PUSH_FAILED");
  }
}
