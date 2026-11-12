"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { initiatePaymentAction } from "@/app/actions/payment-actions";
import { cn } from "@/lib/utils";

/**
 * Starts the M-Pesa (or simulated) payment flow for a plan.
 * On success the action redirects to the payment page.
 */
export function SubscribeButton({
  planId,
  planName,
  highlight = false,
  label,
}: {
  planId: string;
  planName: string;
  highlight?: boolean;
  label?: string;
}) {
  const [state, formAction] = useActionState(initiatePaymentAction, {});

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="planId" value={planId} />
      {state.error && (
        <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {state.error}
        </p>
      )}
      <SubmitButton
        className={cn("btn-md w-full", highlight ? "btn-primary" : "btn-secondary")}
        pendingLabel="Starting…"
      >
        {label ?? `Get ${planName}`}
      </SubmitButton>
    </form>
  );
}
