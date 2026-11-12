"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireUser, isEmailVerified } from "@/lib/auth";
import { isMpesaConfigured, stkPush, stkQuery, mpesaCallbackUrl } from "@/lib/mpesa";
import { normalizeKenyanPhone } from "@/lib/validation";
import { confirmPaymentAndActivate } from "@/lib/payments";
import type { FormState } from "@/lib/form";

/* ------------------------- Initiate a subscription payment ----------------- */

export async function initiatePaymentAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { profile } = await requireUser("/dashboard/subscription");

  if (!(await isEmailVerified(profile.id))) {
    return {
      error:
        "Please verify your email address before subscribing — check your inbox or visit the verification page.",
    };
  }

  const planId = String(formData.get("planId") ?? "");
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!plan || !plan.active) {
    return { error: "That subscription plan is not available." };
  }

  const useMpesa = isMpesaConfigured();
  const payment = await prisma.payment.create({
    data: {
      userId: profile.id,
      planId: plan.id,
      amount: plan.priceKes, // never trust an amount from the browser
      phone: profile.phone,
      method: useMpesa ? "MPESA" : "SIMULATION",
      status: "PENDING",
    },
  });

  if (useMpesa) {
    const phone = profile.phone ? normalizeKenyanPhone(profile.phone) : null;
    if (!phone) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", failureReason: "No valid phone on file" },
      });
      return {
        error: "Add a valid Kenyan mobile number in Account settings first.",
      };
    }

    const result = await stkPush({
      phone,
      amount: plan.priceKes,
      accountReference: `SN${payment.id.slice(0, 8)}`,
      description: `${plan.name} subscription`,
      callbackUrl: mpesaCallbackUrl(payment.id),
    });

    if (!result.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", failureReason: result.description },
      });
      return { error: `M-Pesa request failed: ${result.description}` };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "VERIFYING",
        merchantRequestId: result.merchantRequestId,
        checkoutRequestId: result.checkoutRequestId,
        phone,
      },
    });
  }

  redirect(`/dashboard/subscription/pay/${payment.id}`);
}

/* ------------------------------ Simulated payment --------------------------- */

/**
 * Completes a SIMULATION-mode payment (only possible when Daraja
 * credentials are not configured). Clearly flagged in the seller's payment
 * history and the admin dashboard so simulated payments are never mistaken
 * for real M-Pesa transactions.
 */
export async function simulatePaymentAction(formData: FormData): Promise<void> {
  const { profile } = await requireUser("/dashboard/subscription");
  const id = String(formData.get("id") ?? "");

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.userId !== profile.id) {
    redirect("/dashboard/subscription?error=payment-not-found");
  }
  if (payment.method !== "SIMULATION" || payment.status !== "PENDING") {
    redirect(`/dashboard/subscription/pay/${id}?error=not-simulatable`);
  }

  await confirmPaymentAndActivate(id, {
    simulated: true,
    receipt: `SIM-${Date.now().toString(36).toUpperCase()}`,
  });

  revalidatePath("/dashboard/subscription");
  redirect("/dashboard?subscribed=1");
}

/* --------------------------- Check M-Pesa status ---------------------------- */

export async function checkPaymentStatusAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { profile } = await requireUser("/dashboard/subscription");
  const id = String(formData.get("id") ?? "");

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.userId !== profile.id) {
    return { error: "Payment not found." };
  }
  if (payment.status === "CONFIRMED") {
    return { success: "This payment has been verified." };
  }
  if (payment.method !== "MPESA" || !payment.checkoutRequestId) {
    return { error: "Status checks are only available for M-Pesa payments." };
  }

  const result = await stkQuery(payment.checkoutRequestId);
  if (result.resultCode === "0") {
    await confirmPaymentAndActivate(id, { receipt: result.mpesaReceipt });
    revalidatePath("/dashboard/subscription");
    return {
      success:
        "Payment confirmed by M-Pesa. Your subscription is now active — head back to your dashboard.",
    };
  }
  return {
    error: `M-Pesa says: ${result.resultDesc}. If you have not entered your PIN yet, try again in a moment.`,
  };
}
