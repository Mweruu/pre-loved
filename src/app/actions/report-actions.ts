"use server";

import { headers } from "next/headers";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { reportSchema, contactMessageSchema, firstZodError } from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import type { ReportReason } from "@prisma/client";
import type { FormState } from "@/lib/form";

/**
 * Files a report about a listing and/or a seller.
 * Guests may report too; signed-in reporters are linked to their account.
 */
export async function createReportAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const hdrs = await headers();
  if (!rateLimit(clientKey("report", hdrs), 10, 60 * 60 * 1000).allowed) {
    return { error: "Too many reports from this device. Please try again later." };
  }

  const parsed = reportSchema.safeParse({
    reason: formData.get("reason"),
    details: formData.get("details"),
    reporterName: formData.get("reporterName") || "",
    reporterEmail: formData.get("reporterEmail") || "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const listingId = String(formData.get("listingId") ?? "").trim();
  const reportedUserId = String(formData.get("reportedUserId") ?? "").trim();

  if (!listingId && !reportedUserId) {
    return { error: "This report has no target. Please contact support instead." };
  }

  const { authUser, profile } = await getSession();

  let sellerId: string | null = null;
  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    });
    if (!listing) return { error: "That listing no longer exists." };
    sellerId = listing.sellerId;
  }

  await prisma.report.create({
    data: {
      reporterId: profile?.id ?? null,
      reporterName: parsed.data.reporterName || null,
      reporterEmail: parsed.data.reporterEmail || null,
      listingId: listingId || null,
      reportedUserId: reportedUserId || sellerId,
      reason: parsed.data.reason as ReportReason,
      details: parsed.data.details,
    },
  });

  return {
    success:
      "Thank you — your report has been submitted to our moderation team.",
  };
}

/** Contact/enquiry form on the Contact & Help page. */
export async function createContactMessageAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const hdrs = await headers();
  if (!rateLimit(clientKey("contact", hdrs), 6, 60 * 60 * 1000).allowed) {
    return { error: "Too many messages. Please try again later." };
  }

  const parsed = contactMessageSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  await prisma.contactMessage.create({ data: parsed.data });
  return {
    success:
      "Message sent! Our support team will get back to you as soon as possible.",
  };
}
