"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ListingStatus, PaymentStatus, ReportStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  categorySchema,
  subcategorySchema,
  planSchema,
  firstZodError,
} from "@/lib/validation";
import { confirmPaymentAndActivate } from "@/lib/payments";
import { getSettings, setSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { slugify } from "@/lib/utils";

function revalidateAll() {
  revalidatePath("/", "layout");
}

/* ------------------------------ Listing moderation ------------------------- */

export async function adminSetListingStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ListingStatus;
  const note = String(formData.get("note") ?? "").trim();

  const allowed: ListingStatus[] = [
    "PENDING_APPROVAL",
    "ACTIVE",
    "RESERVED",
    "SOLD",
    "EXPIRED",
    "REJECTED",
    "REMOVED",
  ];
  if (!allowed.includes(status)) redirect("/admin/listings?error=bad-status");

  await prisma.listing.update({
    where: { id },
    data: {
      status,
      moderationNote: ["REJECTED", "REMOVED"].includes(status)
        ? note || "No reason provided."
        : null,
    },
  });
  revalidateAll();
  redirect("/admin/listings?done=status");
}

export async function adminToggleFeaturedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) redirect("/admin/listings?error=not-found");
  await prisma.listing.update({
    where: { id },
    data: { featured: !listing.featured },
  });
  revalidateAll();
  redirect("/admin/listings?done=featured");
}

export async function adminDeleteListingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.listing.delete({ where: { id } }).catch(() => null);
  revalidateAll();
  redirect("/admin/listings?done=deleted");
}

/* --------------------------------- Users ----------------------------------- */

export async function adminSetUserSuspensionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  await prisma.profile.update({
    where: { id },
    data: {
      suspended: suspend,
      suspensionReason: suspend ? reason || "Suspended by administrator." : null,
    },
  });
  revalidatePath("/admin/users");
  redirect(`/admin/users?done=${suspend ? "suspended" : "reactivated"}`);
}

/* ------------------------------- Categories -------------------------------- */

export async function adminUpsertCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    icon: formData.get("icon"),
    orderIndex: formData.get("orderIndex") ?? 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    redirect(`/admin/categories?error=${encodeURIComponent(firstZodError(parsed.error))}`);
  }
  const data = parsed.data;
  const slug = slugify(data.name);

  if (id) {
    await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        icon: data.icon,
        orderIndex: data.orderIndex,
        active: data.active,
        slug: slug || undefined,
      },
    });
  } else {
    const exists = await prisma.category.findUnique({ where: { slug } });
    await prisma.category.create({
      data: {
        name: data.name,
        slug: exists ? `${slug}-${Date.now().toString(36)}` : slug,
        description: data.description || null,
        icon: data.icon,
        orderIndex: data.orderIndex,
        active: data.active,
      },
    });
  }
  revalidateAll();
  redirect("/admin/categories?done=saved");
}

export async function adminUpsertSubcategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = subcategorySchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) {
    redirect(`/admin/categories?error=${encodeURIComponent(firstZodError(parsed.error))}`);
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category) redirect("/admin/categories?error=bad-category");

  const slug = slugify(parsed.data.name);
  if (id) {
    await prisma.subcategory.update({
      where: { id },
      data: { name: parsed.data.name, slug },
    });
  } else {
    const exists = await prisma.subcategory.findFirst({
      where: { categoryId: category.id, slug },
    });
    await prisma.subcategory.create({
      data: {
        categoryId: category.id,
        name: parsed.data.name,
        slug: exists ? `${slug}-${Date.now().toString(36)}` : slug,
      },
    });
  }
  revalidateAll();
  redirect("/admin/categories?done=saved");
}

export async function adminDeleteSubcategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  // Listings keep their subcategory as null (onDelete: SetNull).
  await prisma.subcategory.delete({ where: { id } }).catch(() => null);
  revalidateAll();
  redirect("/admin/categories?done=deleted-sub");
}

/* ---------------------------------- Plans ----------------------------------- */

export async function adminUpsertPlanAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    priceKes: formData.get("priceKes"),
    durationDays: formData.get("durationDays"),
    maxActiveListings: formData.get("maxActiveListings"),
    features: formData.get("features") || "",
    badge: formData.get("badge") || "",
    promoText: formData.get("promoText") || "",
    active: formData.get("active") === "on",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  if (!parsed.success) {
    redirect(`/admin/plans?error=${encodeURIComponent(firstZodError(parsed.error))}`);
  }
  const data = parsed.data;
  const slug = slugify(data.name);

  if (id) {
    await prisma.subscriptionPlan.update({
      where: { id },
      data: { ...data, badge: data.badge || null, promoText: data.promoText || null, slug: slug || undefined },
    });
  } else {
    const exists = await prisma.subscriptionPlan.findUnique({ where: { slug } });
    await prisma.subscriptionPlan.create({
      data: {
        ...data,
        badge: data.badge || null,
        promoText: data.promoText || null,
        slug: exists ? `${slug}-${Date.now().toString(36)}` : slug,
      },
    });
  }
  revalidateAll();
  redirect("/admin/plans?done=saved");
}

export async function adminTogglePlanAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) redirect("/admin/plans?error=not-found");
  await prisma.subscriptionPlan.update({
    where: { id },
    data: { active: !plan.active },
  });
  revalidateAll();
  redirect("/admin/plans?done=toggled");
}

/* --------------------------------- Payments ---------------------------------- */

export async function adminConfirmPaymentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const result = await confirmPaymentAndActivate(id, {
    receipt: "MANUAL-ADMIN",
  });
  revalidateAll();
  if (!result.ok) redirect(`/admin/payments?error=${encodeURIComponent(result.message)}`);
  redirect("/admin/payments?done=confirmed");
}

export async function adminFailPaymentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.payment.update({
    where: { id },
    data: {
      status: "FAILED" as PaymentStatus,
      failureReason: "Marked as failed by administrator.",
    },
  });
  revalidatePath("/admin/payments");
  redirect("/admin/payments?done=failed");
}

/* ---------------------------------- Reports ---------------------------------- */

export async function adminResolveReportAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const outcome = String(formData.get("outcome") ?? "RESOLVED") as ReportStatus;
  const note = String(formData.get("note") ?? "").trim();

  const allowed: ReportStatus[] = ["REVIEWING", "RESOLVED", "DISMISSED"];
  if (!allowed.includes(outcome)) redirect("/admin/reports?error=bad-outcome");

  await prisma.report.update({
    where: { id },
    data: {
      status: outcome,
      resolutionNote: note || null,
      resolvedAt: outcome === "REVIEWING" ? null : new Date(),
    },
  });
  revalidatePath("/admin/reports");
  redirect("/admin/reports?done=updated");
}

/* --------------------------------- Settings ---------------------------------- */

export async function adminSaveSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const keys = Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[];
  const updates: Record<string, string> = {};

  for (const key of keys) {
    if (formData.has(key)) {
      updates[key] = String(formData.get(key) ?? "").trim();
    }
  }

  await setSettings(updates);
  revalidateAll();
  redirect("/admin/settings?done=saved");
}

/* ------------------------------ Enquiries ------------------------------------ */

export async function adminMarkEnquiryHandledAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.contactMessage.update({
    where: { id },
    data: { handled: true },
  }).catch(() => null);
  revalidatePath("/admin/reports");
  redirect("/admin/reports?done=enquiry");
}
