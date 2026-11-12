"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ItemCondition } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { listingSchema, firstZodError } from "@/lib/validation";
import {
  canSellerPublish,
  findDuplicateListing,
} from "@/lib/listing-utils";
import {
  validateImageFile,
  uploadListingImages,
  deleteListingImages,
} from "@/lib/storage";
import { getSettings, settingsBool, settingsNumber } from "@/lib/settings";
import type { FormState } from "@/lib/form";

const ALLOWED_STATUSES = [
  "PENDING_APPROVAL",
  "ACTIVE",
  "RESERVED",
  "SOLD",
  "EXPIRED",
  "REJECTED",
] as const;

/* ------------------------------ Save listing ------------------------------ */

export async function saveListingAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { profile } = await requireUser("/dashboard/listings");

  const listingId = String(formData.get("listingId") ?? "").trim();

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    negotiable: formData.get("negotiable") === "on",
    condition: formData.get("condition"),
    reasonForSelling: formData.get("reasonForSelling"),
    brand: formData.get("brand") || "",
    model: formData.get("model") || "",
    ageDescription: formData.get("ageDescription") || "",
    originalPrice: formData.get("originalPrice") || "",
    dimensions: formData.get("dimensions") || "",
    county: formData.get("county"),
    town: formData.get("town"),
    deliveryAvailable: formData.get("deliveryAvailable") === "on",
    deliveryNote: formData.get("deliveryNote") || "",
    buyerCollects: formData.get("buyerCollects") === "on",
    preferredContact: formData.get("preferredContact") ?? "ANY",
    categoryId: formData.get("categoryId"),
    subcategoryId: formData.get("subcategoryId") || "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  const input = parsed.data;

  // Validate the category / subcategory pair.
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    include: { subcategories: true },
  });
  if (!category || !category.active) {
    return { error: "Please choose a valid category." };
  }
  let subcategoryId: string | null = null;
  if (input.subcategoryId) {
    const sub = category.subcategories.find(
      (s) => s.id === input.subcategoryId
    );
    if (!sub) return { error: "That subcategory does not match the category." };
    subcategoryId = sub.id;
  }

  // Images: keep existing, remove deleted, add new uploads.
  let existingImages: { id: string; storagePath: string }[] = [];
  let deletedIds: string[] = [];
  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { images: true },
    });
    if (!listing || listing.sellerId !== profile.id) {
      return { error: "Listing not found." };
    }
    existingImages = listing.images.map((i) => ({
      id: i.id,
      storagePath: i.storagePath,
    }));
    try {
      deletedIds = JSON.parse(
        String(formData.get("deletedImageIds") ?? "[]")
      ) as string[];
      if (!Array.isArray(deletedIds)) deletedIds = [];
    } catch {
      deletedIds = [];
    }
  } else {
    existingImages = [];
  }

  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    const problem = validateImageFile(file);
    if (problem) return { error: problem };
  }

  const keptCount = existingImages.length - deletedIds.length;
  if (keptCount + files.length < 1) {
    return { error: "Please add at least one photo of the item." };
  }
  if (keptCount + files.length > 8) {
    return { error: "A listing can have at most 8 photos." };
  }

  /* ---------------------------------- Create -------------------------------- */

  if (!listingId) {
    const publishCheck = await canSellerPublish(profile.id);
    if (!publishCheck.allowed) {
      if (publishCheck.reason === "no-subscription") {
        return {
          error:
            "You need an active seller subscription to publish listings. Choose a plan from the Subscription page.",
        };
      }
      return {
        error: `Your plan allows ${publishCheck.maxListings} active listings and you currently have ${publishCheck.activeCount}. Mark some items as sold or upgrade your plan.`,
      };
    }

    if (await findDuplicateListing(profile.id, input.title)) {
      return {
        error:
          "You already have an active listing with this title. Duplicate listings are not allowed.",
      };
    }

    const settings = await getSettings();
    const expiresAt = new Date(
      Date.now() + settingsNumber(settings, "listingExpiryDays", 60) * 86_400_000
    );
    const requiresApproval = settingsBool(settings, "requireListingApproval");

    let storagePaths: string[] = [];
    try {
      storagePaths = await uploadListingImages(
        files.map((f) => ({
          file: f,
          ext: f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg",
        }))
      );
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Image upload failed.",
      };
    }

    await prisma.listing.create({
      data: {
        sellerId: profile.id,
        categoryId: input.categoryId,
        subcategoryId,
        title: input.title,
        description: input.description,
        price: input.price,
        negotiable: input.negotiable,
        condition: input.condition as ItemCondition,
        reasonForSelling: input.reasonForSelling,
        brand: input.brand || null,
        model: input.model || null,
        ageDescription: input.ageDescription || null,
        originalPrice: input.originalPrice === "" ? null : Number(input.originalPrice),
        dimensions: input.dimensions || null,
        county: input.county,
        town: input.town,
        deliveryAvailable: input.deliveryAvailable,
        deliveryNote: input.deliveryNote || null,
        buyerCollects: input.buyerCollects,
        preferredContact: input.preferredContact,
        status: requiresApproval ? "PENDING_APPROVAL" : "ACTIVE",
        expiresAt,
        images: {
          create: storagePaths.map((path, index) => ({
            storagePath: path,
            orderIndex: index,
          })),
        },
      },
    });

    revalidatePath("/dashboard/listings");
    revalidatePath("/marketplace");
    redirect("/dashboard/listings?created=1");
  }

  /* ---------------------------------- Update -------------------------------- */

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!listing || listing.sellerId !== profile.id) {
    return { error: "Listing not found." };
  }
  if (listing.status === "SOLD") {
    return { error: "Sold listings cannot be edited." };
  }

  // Duplicate check against other listings (excluding this one).
  const others = await prisma.listing.findMany({
    where: {
      sellerId: profile.id,
      status: { in: ["ACTIVE", "RESERVED", "PENDING_APPROVAL"] },
      id: { not: listing.id },
    },
    select: { title: true },
  });
  const normalized = input.title.trim().toLowerCase();
  if (others.some((l) => l.title.trim().toLowerCase() === normalized)) {
    return {
      error:
        "You already have another active listing with this title. Duplicate listings are not allowed.",
    };
  }

  // Upload new photos first.
  let newPaths: string[] = [];
  if (files.length > 0) {
    try {
      newPaths = await uploadListingImages(
        files.map((f) => ({
          file: f,
          ext: f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg",
        }))
      );
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Image upload failed.",
      };
    }
  }

  // Remove deleted images from storage + database.
  const toDelete = existingImages.filter((img) => deletedIds.includes(img.id));
  if (toDelete.length > 0) {
    const removable = toDelete
      .map((img) => img.storagePath)
      .filter((p) => !p.startsWith("http") && !p.startsWith("/"));
    await deleteListingImages(removable);
    await prisma.listingImage.deleteMany({
      where: { id: { in: toDelete.map((img) => img.id) } },
    });
  }

  const settings = await getSettings();
  const resubmit =
    listing.status === "REJECTED" && settingsBool(settings, "requireListingApproval");

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      categoryId: input.categoryId,
      subcategoryId,
      title: input.title,
      description: input.description,
      price: input.price,
      negotiable: input.negotiable,
      condition: input.condition as ItemCondition,
      reasonForSelling: input.reasonForSelling,
      brand: input.brand || null,
      model: input.model || null,
      ageDescription: input.ageDescription || null,
      originalPrice: input.originalPrice === "" ? null : Number(input.originalPrice),
      dimensions: input.dimensions || null,
      county: input.county,
      town: input.town,
      deliveryAvailable: input.deliveryAvailable,
      deliveryNote: input.deliveryNote || null,
      buyerCollects: input.buyerCollects,
      preferredContact: input.preferredContact,
      ...(resubmit ? { status: "PENDING_APPROVAL" as const, moderationNote: null } : {}),
      images: newPaths.length
        ? {
            create: newPaths.map((path, index) => ({
              storagePath: path,
              orderIndex: existingImages.length - toDelete.length + index,
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/dashboard/listings");
  revalidatePath(`/product/${listing.id}`);
  revalidatePath("/marketplace");
  redirect("/dashboard/listings?updated=1");
}

/* --------------------------- Listing status changes ------------------------ */

export async function setListingStatusAction(formData: FormData): Promise<void> {
  const { profile } = await requireUser("/dashboard/listings");

  const id = String(formData.get("id") ?? "");
  const target = String(formData.get("target") ?? "");

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.sellerId !== profile.id) {
    redirect("/dashboard/listings?error=not-found");
  }

  const settings = await getSettings();
  const requiresApproval = settingsBool(settings, "requireListingApproval");
  const expiryDays = settingsNumber(settings, "listingExpiryDays", 60);

  let newStatus: (typeof ALLOWED_STATUSES)[number] | null = null;

  switch (target) {
    case "reserve":
      if (listing.status === "ACTIVE") newStatus = "RESERVED";
      break;
    case "sell":
      if (listing.status === "ACTIVE" || listing.status === "RESERVED") {
        newStatus = "SOLD";
      }
      break;
    case "relist":
      if (listing.status === "RESERVED") {
        newStatus = "ACTIVE";
      } else if (listing.status === "EXPIRED") {
        const check = await canSellerPublish(profile.id);
        if (!check.allowed) {
          redirect(
            check.reason === "no-subscription"
              ? "/dashboard/subscription?error=renew-subscription-first"
              : "/dashboard/listings?error=limit-reached"
          );
        }
        newStatus = requiresApproval ? "PENDING_APPROVAL" : "ACTIVE";
      }
      break;
    case "delete":
      const images = await prisma.listingImage.findMany({
        where: { listingId: id },
      });
      await deleteListingImages(
        images
          .map((i) => i.storagePath)
          .filter((p) => !p.startsWith("http") && !p.startsWith("/"))
      );
      await prisma.listing.delete({ where: { id } });
      revalidatePath("/dashboard/listings");
      revalidatePath("/marketplace");
      redirect("/dashboard/listings?deleted=1");
    default:
      newStatus = null;
  }

  if (newStatus) {
    await prisma.listing.update({
      where: { id },
      data: {
        status: newStatus,
        ...(newStatus === "ACTIVE" && listing.status === "EXPIRED"
          ? { expiresAt: new Date(Date.now() + expiryDays * 86_400_000) }
          : {}),
      },
    });
    revalidatePath("/dashboard/listings");
    revalidatePath(`/product/${id}`);
    revalidatePath("/marketplace");
  }

  redirect("/dashboard/listings?updated=1");
}
