/**
 * M-Pesa Daraja (Safaricom) integration for Lipa Na M-Pesa Online (STK Push).
 *
 * Configure MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET / MPESA_PASSKEY in .env
 * to enable live/sandbox STK pushes. When credentials are absent the platform
 * falls back to a clearly-labelled SIMULATION mode so the subscription workflow
 * can still be exercised end-to-end.
 *
 * Security: subscriptions are only ever activated from a *verified* payment:
 *   1. the Daraja callback (server-to-server, matched by CheckoutRequestID and
 *      amount), or
 *   2. an explicit STK status query, or
 *   3. manual confirmation by an administrator.
 */

const BASE_URLS = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
} as const;

export function isMpesaConfigured(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_PASSKEY
  );
}

function baseUrl(): string {
  const env = process.env.MPESA_ENV === "production" ? "production" : "sandbox";
  return BASE_URLS[env];
}

function shortcode(): string {
  return process.env.MPESA_SHORTCODE || "174379";
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const response = await fetch(
    `${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(`M-Pesa authentication failed (${response.status})`);
  }
  const data = (await response.json()) as { access_token: string; expires_in: string };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3599) * 1000,
  };
  return data.access_token;
}

/** Timestamp in the YYYYMMDDHHmmss format Daraja expects (East Africa Time). */
function timestamp(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

function stkPassword(): string {
  const ts = timestamp();
  const passkey = process.env.MPESA_PASSKEY!;
  return Buffer.from(`${shortcode()}${passkey}${ts}`).toString("base64");
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  success: boolean;
  description: string;
}

/** Triggers an STK push prompt on the buyer's phone. */
export async function stkPush(params: {
  phone: string; // 2547XXXXXXXX
  amount: number;
  accountReference: string;
  description: string;
  callbackUrl: string;
}): Promise<StkPushResult> {
  const token = await getAccessToken();
  const ts = timestamp();

  const response = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode(),
      Password: stkPassword(),
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: params.amount,
      PartyA: params.phone,
      PartyB: shortcode(),
      PhoneNumber: params.phone,
      CallBackURL: params.callbackUrl,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: params.description.slice(0, 20),
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (response.ok && String(data.ResponseCode ?? "1") === "0") {
    return {
      merchantRequestId: String(data.MerchantRequestID ?? ""),
      checkoutRequestId: String(data.CheckoutRequestID ?? ""),
      success: true,
      description: String(data.CustomerMessage ?? "Request sent. Check your phone."),
    };
  }
  return {
    merchantRequestId: String(data.MerchantRequestID ?? ""),
    checkoutRequestId: "",
    success: false,
    description:
      String(data.errorMessage ?? data.ResponseDescription ?? "M-Pesa request failed"),
  };
}

export interface StkQueryResult {
  resultCode: string;
  resultDesc: string;
  mpesaReceipt?: string;
}

/** Queries the status of a previous STK push (used if a callback is missed). */
export async function stkQuery(checkoutRequestId: string): Promise<StkQueryResult> {
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode(),
      Password: stkPassword(),
      Timestamp: timestamp(),
      CheckoutRequestID: checkoutRequestId,
    }),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    resultCode: String(data.ResultCode ?? "1"),
    resultDesc: String(data.ResultDesc ?? "Unknown M-Pesa status"),
    mpesaReceipt: data.MpesaReceiptNumber ? String(data.MpesaReceiptNumber) : undefined,
  };
}

/** Public callback URL for Daraja to POST transaction results to. */
export function mpesaCallbackUrl(paymentId: string): string {
  if (process.env.MPESA_CALLBACK_URL) {
    return `${process.env.MPESA_CALLBACK_URL}?paymentId=${paymentId}`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/api/mpesa/callback?paymentId=${paymentId}`;
}
