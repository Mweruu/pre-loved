"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { createContactMessageAction } from "@/app/actions/report-actions";

/** Support enquiry form on the Contact & Help page. */
export function ContactForm() {
  const [state, formAction] = useActionState(createContactMessageAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="label">
            Your name
          </label>
          <input
            id="contact-name"
            name="name"
            className="input"
            placeholder="e.g. Wanjiku Mwangi"
            required
            minLength={2}
            maxLength={80}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="label">
            Email address
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            required
            maxLength={120}
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="label">
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          className="input"
          placeholder="How can we help?"
          required
          minLength={3}
          maxLength={120}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="label">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          className="input"
          placeholder="Tell us what's happening…"
          required
          minLength={10}
          maxLength={3000}
        />
      </div>
      {state.error && <p className="field-error">{state.error}</p>}
      {state.success && (
        <p className="rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm font-medium text-forest-800">
          {state.success}
        </p>
      )}
      <SubmitButton className="btn-primary btn-md w-full sm:w-auto">
        Send message
      </SubmitButton>
    </form>
  );
}
