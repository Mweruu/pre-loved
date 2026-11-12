import { BadgeCheck } from "lucide-react";

import {
  CONDITION_BADGE_CLASSES,
  PAYMENT_BADGE_CLASSES,
  STATUS_BADGE_CLASSES,
  conditionLabel,
  listingStatusLabel,
  paymentStatusLabel,
} from "@/lib/constants";

export function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span
      className={`badge ${CONDITION_BADGE_CLASSES[condition] ?? "bg-sand-200 text-ink-800"}`}
    >
      {conditionLabel(condition)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${STATUS_BADGE_CLASSES[status] ?? "bg-sand-200 text-ink-800"}`}
    >
      {listingStatusLabel(status)}
    </span>
  );
}

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-forest-700">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

export function NegotiableBadge() {
  return (
    <span className="badge bg-gold-100 text-gold-800">Negotiable</span>
  );
}

export function PaymentMethodBadge({ method }: { method: string }) {
  return method === "SIMULATION" ? (
    <span className="badge bg-purple-100 text-purple-800">Simulated</span>
  ) : (
    <span className="badge bg-forest-100 text-forest-800">M-Pesa</span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${PAYMENT_BADGE_CLASSES[status] ?? "bg-sand-200 text-ink-800"}`}
    >
      {paymentStatusLabel(status)}
    </span>
  );
}
