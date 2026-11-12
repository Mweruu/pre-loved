import type { Metadata } from "next";
import { Banknote, FlaskConical, ShieldCheck, XCircle } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  adminConfirmPaymentAction,
  adminFailPaymentAction,
} from "@/app/actions/admin-actions";
import { EmptyState } from "@/components/empty-state";
import {
  PaymentMethodBadge,
  PaymentStatusBadge,
} from "@/components/badges";
import { formatKes, formatDateTime } from "@/lib/format";
import { param } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Payments" };

const DONE_MESSAGES: Record<string, string> = {
  confirmed:
    "Payment confirmed and subscription activated. Use this only after independently verifying the money arrived.",
  failed: "Payment marked as failed. The seller can retry from their subscription page.",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const done = param(sp.done);
  const error = param(sp.error);
  const filter = param(sp.status);

  const where = filter ? { status: filter as never } : {};
  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
      plan: { select: { name: true } },
      subscription: { select: { id: true, status: true } },
    },
  });

  const [pendingCount, confirmedRevenue] = await Promise.all([
    prisma.payment.count({ where: { status: { in: ["PENDING", "VERIFYING"] } } }),
    prisma.payment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true },
    }),
  ]);

  const FILTERS = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "VERIFYING", label: "Verifying" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "FAILED", label: "Failed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Payments</h1>
        <p className="section-subtitle">
          {formatKes(confirmedRevenue._sum.amount ?? 0)} confirmed lifetime ·{" "}
          {pendingCount} awaiting verification.
        </p>
      </div>

      <div className="rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-forest-900">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          When to confirm manually
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-forest-800">
          M-Pesa payments confirm automatically via the Daraja callback or
          status query. Only confirm manually after independently verifying
          the money actually arrived (e.g. an M-Pesa statement) — a manual
          confirmation activates the seller&apos;s subscription exactly like a
          verified one. Never confirm an unverified payment.
        </p>
      </div>

      {done && DONE_MESSAGES[done] && (
        <p className="rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4 text-sm font-medium text-forest-900">
          {DONE_MESSAGES[done]}
        </p>
      )}
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <a
            key={f.value}
            href={f.value ? `/admin/payments?status=${f.value}` : "/admin/payments"}
            className={`badge border px-3 py-1.5 transition ${
              (filter ?? "") === f.value
                ? "border-forest-700 bg-forest-700 text-white"
                : "border-sand-300 bg-white text-ink-700 hover:border-forest-400"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No payments"
          description={
            filter
              ? `No ${filter.toLowerCase()} payments.`
              : "No subscription payments have been made yet."
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Receipt</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="min-w-[10rem]">
                    <p className="font-medium text-ink-900">{payment.user.name}</p>
                    <p className="text-xs text-ink-500">{payment.user.email}</p>
                  </td>
                  <td>{payment.plan.name}</td>
                  <td className="whitespace-nowrap font-medium">
                    {formatKes(payment.amount)}
                  </td>
                  <td>
                    <div className="flex flex-col items-start gap-1">
                      <PaymentMethodBadge method={payment.method} />
                      {payment.simulated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-purple-700">
                          <FlaskConical className="h-3 w-3" aria-hidden="true" />
                          simulation
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <PaymentStatusBadge status={payment.status} />
                    {payment.failureReason && (
                      <span className="mt-1 block max-w-[12rem] text-xs text-red-600">
                        {payment.failureReason}
                      </span>
                    )}
                    {payment.subscription && (
                      <span className="mt-1 block text-xs text-ink-500">
                        sub: {payment.subscription.status}
                      </span>
                    )}
                  </td>
                  <td className="font-mono text-xs text-ink-500">
                    {payment.mpesaReceipt ?? "—"}
                  </td>
                  <td className="whitespace-nowrap text-xs text-ink-500">
                    {formatDateTime(payment.createdAt)}
                  </td>
                  <td>
                    {(payment.status === "PENDING" ||
                      payment.status === "VERIFYING") && (
                      <div className="flex flex-col gap-1.5">
                        <form action={adminConfirmPaymentAction}>
                          <input type="hidden" name="id" value={payment.id} />
                          <button type="submit" className="btn-primary btn-sm">
                            Confirm
                          </button>
                        </form>
                        <form action={adminFailPaymentAction}>
                          <input type="hidden" name="id" value={payment.id} />
                          <button type="submit" className="btn-danger btn-sm">
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Fail
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
