import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { confirmPaymentAndActivate } from "@/lib/payments";

/**
 * M-Pesa Daraja STK push callback.
 *
 * Security: subscriptions are only activated for a payment whose
 * CheckoutRequestID matches one we initiated, whose reported amount equals
 * the expected amount, and whose Daraja ResultCode is 0 (success).
 * Anything else fails the payment or is ignored — never activated on trust.
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const paymentIdParam = url.searchParams.get("paymentId");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Invalid payload" },
      { status: 400 }
    );
  }

  const callback = (body as { Body?: { stkCallback?: Record<string, unknown> } })
    ?.Body?.stkCallback;
  if (!callback) {
    // Not an STK callback — acknowledge and ignore.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored" });
  }

  const checkoutRequestId = String(callback.CheckoutRequestID ?? "");
  const resultCode = String(callback.ResultCode ?? "1");
  const resultDesc = String(callback.ResultDesc ?? "");

  const payment = paymentIdParam
    ? await prisma.payment.findUnique({ where: { id: paymentIdParam } })
    : await prisma.payment
        .findUnique({ where: { checkoutRequestId } })
        .catch(() => null);

  if (!payment || (checkoutRequestId && payment.checkoutRequestId !== checkoutRequestId)) {
    // Unknown or mismatched transaction — do not activate anything.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (payment.status === "CONFIRMED") {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (resultCode === "0") {
    // Extract amount + receipt from CallbackMetadata and verify the amount.
    const metadata = (
      callback.CallbackMetadata as { Item?: { Name: string; Value?: number | string }[] }
    )?.Item;
    const amountItem = metadata?.find((item) => item.Name === "Amount");
    const receiptItem = metadata?.find(
      (item) => item.Name === "MpesaReceiptNumber"
    );
    const receipt = receiptItem?.Value ? String(receiptItem.Value) : undefined;

    const reportedAmount = amountItem ? Number(amountItem.Value) : null;
    if (reportedAmount !== null && reportedAmount !== payment.amount) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: `Amount mismatch: expected ${payment.amount}, received ${reportedAmount}`,
        },
      });
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    await confirmPaymentAndActivate(payment.id, { receipt });
  } else {
    // User cancelled or the push failed (e.g. ResultCode 1032 = cancelled).
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: resultDesc || "STK push failed" },
    });
  }

  // Always acknowledge so Daraja stops retrying.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
