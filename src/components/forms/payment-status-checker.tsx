"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { checkPaymentStatusAction } from "@/app/actions/payment-actions";

/** Lets the seller manually re-query M-Pesa for the STK push result. */
export function PaymentStatusChecker({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useActionState(checkPaymentStatusAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={paymentId} />
      {state.error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm font-medium text-forest-800">
          {state.success}
        </p>
      )}
      <SubmitButton className="btn-secondary btn-md w-full" pendingLabel="Asking M-Pesa…">
        Check payment status now
      </SubmitButton>
    </form>
  );
}
