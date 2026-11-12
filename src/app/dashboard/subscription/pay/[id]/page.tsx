import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CircleCheck,
  CircleX,
  FlaskConical,
  Loader2,
  Smartphone,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { simulatePaymentAction } from "@/app/actions/payment-actions";
import { PaymentStatusChecker } from "@/components/forms/payment-status-checker";
import { AutoRefresh } from "@/components/auto-refresh";
import { PaymentMethodBadge, PaymentStatusBadge } from "@/components/badges";
import { formatKes, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Subscription payment" };

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireUser("/dashboard/subscription");

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!payment || payment.userId !== profile.id) notFound();

  const isSimulation = payment.method === "SIMULATION";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="section-title">Subscription payment</h1>
        <p className="section-subtitle">
          {payment.plan.name} — {formatKes(payment.amount)} for{" "}
          {payment.plan.durationDays} days
        </p>
      </div>

      {/* Summary card */}
      <div className="card space-y-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-500">Plan</p>
          <p className="text-sm font-semibold text-ink-900">
            {payment.plan.name}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-500">Amount</p>
          <p className="text-sm font-semibold text-ink-900">
            {formatKes(payment.amount)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-500">Started</p>
          <p className="text-sm text-ink-700">
            {formatDateTime(payment.createdAt)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-500">Method</p>
          <PaymentMethodBadge method={payment.method} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-500">Status</p>
          <PaymentStatusBadge status={payment.status} />
        </div>
      </div>

      {/* ------------------------------ Status flows ---------------------------- */}

      {payment.status === "CONFIRMED" && (
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-100 text-forest-700">
            <CircleCheck className="h-9 w-9" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold text-ink-900">
            Payment confirmed
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
            {isSimulation
              ? "This simulated payment was confirmed and your subscription is active. In production this confirmation comes from M-Pesa."
              : "M-Pesa confirmed this payment and your subscription is now active."}
          </p>
          {payment.mpesaReceipt && (
            <p className="mt-3 font-mono text-xs text-ink-500">
              Receipt: {payment.mpesaReceipt}
            </p>
          )}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="btn-primary btn-md">
              Back to dashboard
            </Link>
            <Link href="/dashboard/listings/new" className="btn-secondary btn-md">
              Create a listing
            </Link>
          </div>
        </div>
      )}

      {payment.status === "FAILED" && (
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <CircleX className="h-9 w-9" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold text-ink-900">
            Payment failed
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
            {payment.failureReason ??
              "The payment could not be completed. No money was deducted for a failed attempt."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard/subscription" className="btn-primary btn-md">
              Try again
            </Link>
            <Link href="/contact" className="btn-secondary btn-md">
              Get help
            </Link>
          </div>
        </div>
      )}

      {payment.status === "PENDING" && isSimulation && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 p-6">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-purple-900">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              Simulation mode — no real money
            </p>
            <p className="mt-2 text-sm leading-relaxed text-purple-800">
              M-Pesa Daraja credentials are not configured on this deployment,
              so this checkout is simulated. &ldquo;Confirming&rdquo; the
              payment below marks it as{" "}
              <strong>Simulated — CONFIRMED</strong> in your history and the
              admin dashboard; it processes exactly like the real flow but no
              money moves. Your subscription activates only after this
              confirmation, just like a verified M-Pesa payment.
            </p>
          </div>
          <form action={simulatePaymentAction}>
            <input type="hidden" name="id" value={payment.id} />
            <button
              type="submit"
              className="btn-primary btn-lg w-full"
            >
              <Smartphone className="h-5 w-5" aria-hidden="true" />
              Simulate M-Pesa confirmation
            </button>
          </form>
          <p className="text-center text-xs text-ink-500">
            Changed your mind?{" "}
            <Link
              href="/dashboard/subscription"
              className="font-medium text-forest-700 hover:underline"
            >
              Choose a different plan
            </Link>
          </p>
        </div>
      )}

      {payment.status === "PENDING" && !isSimulation && (
        <div className="card p-6">
          <p className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <Loader2 className="h-4 w-4 animate-spin text-forest-700" aria-hidden="true" />
            Waiting for M-Pesa to report the outcome of your STK push…
          </p>
          <p className="mt-2 text-sm text-ink-500">
            If you did not receive the prompt, or cancelled it, start a new
            checkout from the subscription page.
          </p>
          <div className="mt-4">
            <PaymentStatusChecker paymentId={payment.id} />
          </div>
        </div>
      )}

      {payment.status === "VERIFYING" && !isSimulation && (
        <div className="card p-6">
          <p className="flex items-center gap-3 text-sm font-medium text-ink-800">
            <Loader2 className="h-5 w-5 animate-spin text-forest-700" aria-hidden="true" />
            Enter your M-Pesa PIN on your phone
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            We&apos;ve sent an M-Pesa request for{" "}
            <span className="font-semibold text-ink-900">
              {formatKes(payment.amount)}
            </span>{" "}
            {payment.phone ? `to ${payment.phone}` : "to your phone"}. Enter
            your PIN to authorise the payment. This page updates itself while
            we wait for confirmation.
          </p>
          <div className="mt-4">
            <PaymentStatusChecker paymentId={payment.id} />
          </div>
          <AutoRefresh intervalMs={5000} enabled />
        </div>
      )}

      {/* VERIFYING shouldn't persist for simulations, but cover it anyway */}
      {payment.status === "VERIFYING" && isSimulation && (
        <div className="card p-6">
          <p className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <Loader2 className="h-4 w-4 animate-spin text-forest-700" aria-hidden="true" />
            Waiting for confirmation…
          </p>
          <div className="mt-4">
            <PaymentStatusChecker paymentId={payment.id} />
          </div>
          <AutoRefresh intervalMs={5000} enabled />
        </div>
      )}
    </div>
  );
}
