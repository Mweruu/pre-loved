import { prisma } from "@/lib/db";

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export interface ConfirmResult {
  ok: boolean;
  message: string;
}

/**
 * Marks a payment as CONFIRMED and activates/extends the seller's
 * subscription. Runs inside a transaction that re-checks the payment status,
 * so concurrent callbacks cannot double-activate a subscription.
 *
 * Only call this after the payment has been *verified* (Daraja callback with
 * a matching amount, an STK status query, admin confirmation, or an explicit
 * simulated payment in demo mode).
 */
export async function confirmPaymentAndActivate(
  paymentId: string,
  opts: { receipt?: string; simulated?: boolean } = {}
): Promise<ConfirmResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { plan: true },
      });
      if (!payment) return { ok: false, message: "Payment not found." };
      if (payment.status === "CONFIRMED") {
        return { ok: true, message: "Payment was already confirmed." };
      }

      const now = new Date();

      const existing = await tx.subscription.findFirst({
        where: { userId: payment.userId, status: "ACTIVE" },
        orderBy: { endsAt: "desc" },
      });

      let subscriptionId: string;
      if (existing) {
        const base = existing.endsAt > now ? existing.endsAt : now;
        const updated = await tx.subscription.update({
          where: { id: existing.id },
          data: {
            endsAt: addDays(base, payment.plan.durationDays),
            status: "ACTIVE",
            maxActiveListings: payment.plan.maxActiveListings,
            planId: payment.planId,
          },
        });
        subscriptionId = updated.id;
      } else {
        const created = await tx.subscription.create({
          data: {
            userId: payment.userId,
            planId: payment.planId,
            startsAt: now,
            endsAt: addDays(now, payment.plan.durationDays),
            maxActiveListings: payment.plan.maxActiveListings,
            status: "ACTIVE",
          },
        });
        subscriptionId = created.id;
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "CONFIRMED",
          verifiedAt: now,
          subscriptionId,
          mpesaReceipt: opts.receipt ?? payment.mpesaReceipt,
          simulated: opts.simulated ?? payment.simulated,
        },
      });

      return {
        ok: true,
        message: `Your ${payment.plan.name} subscription is now active.`,
      };
    });
  } catch (error) {
    console.error("confirmPaymentAndActivate failed:", error);
    return {
      ok: false,
      message: "Could not activate the subscription. Please contact support.",
    };
  }
}
