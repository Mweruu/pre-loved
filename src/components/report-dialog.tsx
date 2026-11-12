"use client";

import { useActionState, useState } from "react";
import { Flag, CircleCheck } from "lucide-react";

import { Modal } from "@/components/modal";
import { SubmitButton } from "@/components/submit-button";
import { REPORT_REASONS } from "@/lib/constants";
import { createReportAction } from "@/app/actions/report-actions";
import { cn } from "@/lib/utils";

/**
 * Report a listing or a seller. Available to guests and signed-in users.
 * Reports go straight to the admin moderation queue.
 */
export function ReportDialog({
  listingId,
  reportedUserId,
  isLoggedIn,
  triggerLabel = "Report",
  variant = "link",
}: {
  listingId?: string;
  reportedUserId?: string;
  isLoggedIn: boolean;
  triggerLabel?: string;
  variant?: "link" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createReportAction, {
    error: null,
    success: null,
  });

  const done = Boolean(state.success);

  return (
    <>
      {variant === "link" ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 transition hover:text-red-600"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          {triggerLabel}
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-secondary btn-md">
          <Flag className="h-4 w-4" aria-hidden="true" />
          {triggerLabel}
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Report to moderators">
        {done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CircleCheck
              className="h-12 w-12 text-forest-600"
              aria-hidden="true"
            />
            <p className="mt-4 font-medium text-ink-900">Report received</p>
            <p className="mt-1 max-w-sm text-sm text-ink-500">
              Thank you for keeping Sokoni Nyumbani safe. Our moderation team
              will review this report shortly.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="btn-primary btn-md mt-6"
            >
              Close
            </button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="listingId" value={listingId ?? ""} />
            <input
              type="hidden"
              name="reportedUserId"
              value={reportedUserId ?? ""}
            />
            <div>
              <label htmlFor="report-reason" className="label">
                Reason
              </label>
              <select id="report-reason" name="reason" className="input" required>
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="report-details" className="label">
                What happened?
              </label>
              <textarea
                id="report-details"
                name="details"
                rows={4}
                className="input"
                placeholder="Tell us what is wrong so we can investigate…"
                required
                minLength={10}
              />
            </div>
            {!isLoggedIn && (
              <>
                <div>
                  <label htmlFor="report-name" className="label">
                    Your name <span className="text-ink-400">(optional)</span>
                  </label>
                  <input
                    id="report-name"
                    name="reporterName"
                    className="input"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label htmlFor="report-email" className="label">
                    Your email <span className="text-ink-400">(optional)</span>
                  </label>
                  <input
                    id="report-email"
                    name="reporterEmail"
                    type="email"
                    className="input"
                    placeholder="Optional — lets us follow up with you"
                  />
                </div>
              </>
            )}
            {state.error && <p className="field-error">{state.error}</p>}
            <SubmitButton className="btn-primary btn-md w-full">
              Submit report
            </SubmitButton>
            <p className="text-center text-xs text-ink-500">
              Reports are confidential and reviewed by our moderation team.
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}
