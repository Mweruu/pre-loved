"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Trash2, X } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { saveListingAction } from "@/app/actions/listing-actions";
import {
  CONDITIONS,
  COUNTIES,
  PREFERRED_CONTACTS,
  townsForCounty,
} from "@/lib/constants";

export interface ListingDefaults {
  title?: string;
  description?: string;
  price?: number;
  negotiable?: boolean;
  condition?: string;
  reasonForSelling?: string;
  brand?: string;
  model?: string;
  ageDescription?: string;
  originalPrice?: number | null;
  dimensions?: string;
  county?: string;
  town?: string;
  deliveryAvailable?: boolean;
  deliveryNote?: string;
  buyerCollects?: boolean;
  preferredContact?: string;
  categoryId?: string;
  subcategoryId?: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

/**
 * Create/edit listing form with multi-image upload.
 * In edit mode, existing photos can be removed via deletedImageIds.
 */
export function ListingForm({
  categories,
  listingId,
  defaults = {},
  existingImages = [],
  maxImages = 8,
}: {
  categories: CategoryOption[];
  listingId?: string;
  defaults?: ListingDefaults;
  existingImages?: { id: string; src: string }[];
  maxImages?: number;
}) {
  const [state, formAction] = useActionState(saveListingAction, {});
  const [categoryId, setCategoryId] = useState(defaults.categoryId ?? "");
  const [county, setCounty] = useState(defaults.county ?? "Nairobi");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const towns = townsForCounty(county);

  const keptCount = existingImages.length - deletedIds.length;
  const totalAfterUpload = keptCount + previews.length;
  const atLimit = totalAfterUpload >= maxImages;

  const onFilesChosen = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const room = maxImages - keptCount - previews.length;
    const accepted = incoming.slice(0, Math.max(0, room));
    if (accepted.length < incoming.length) {
      window.alert(`You can only add ${room} more photo${room === 1 ? "" : "s"} (max ${maxImages} total).`);
    }
    setPreviews((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    ]);
    if (fileInput.current) fileInput.current.value = "";
  };

  const removePreview = (url: string) => {
    setPreviews((prev) => {
      const found = prev.find((p) => p.url === url);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((p) => p.url !== url);
    });
  };

  const subcategoryOptions = useMemo(
    () => selectedCategory?.subcategories ?? [],
    [selectedCategory]
  );

  return (
    <form action={formAction} className="space-y-6">
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      <input
        type="hidden"
        name="deletedImageIds"
        value={JSON.stringify(deletedIds)}
      />

      {/* ------------------------------ Photos ------------------------------ */}
      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Photos
          <span className="ml-2 text-sm font-normal text-red-600">*</span>
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Up to {maxImages} clear photos — JPEG, PNG or WebP, max 5 MB each.
          Good photos sell items faster.
        </p>

        {existingImages.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {existingImages.map((img) => {
              const removed = deletedIds.includes(img.id);
              return (
                <div
                  key={img.id}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                    removed ? "border-red-300 opacity-40" : "border-sand-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt="Listing photo"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDeletedIds((ids) =>
                        removed ? ids.filter((i) => i !== img.id) : [...ids, img.id]
                      )
                    }
                    className="absolute inset-0 flex items-center justify-center bg-ink-950/50 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={removed ? "Keep this photo" : "Remove this photo"}
                  >
                    {removed ? (
                      <span className="text-xs font-semibold">Undo</span>
                    ) : (
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {previews.map((preview) => (
              <div
                key={preview.url}
                className="relative aspect-square overflow-hidden rounded-xl border-2 border-forest-400"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePreview(preview.url)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-ink-950/70 p-1 text-white hover:bg-ink-950"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="images"
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
              atLimit
                ? "border-sand-200 bg-sand-50 text-ink-400"
                : "border-forest-300 bg-forest-50/50 text-forest-700 hover:border-forest-400 hover:bg-forest-50"
            }`}
          >
            <ImagePlus className="h-7 w-7" aria-hidden="true" />
            <span className="text-sm font-medium">
              {atLimit
                ? `Photo limit reached (${maxImages})`
                : "Click to add photos"}
            </span>
            <span className="text-xs text-ink-500">
              {totalAfterUpload} of {maxImages} selected
            </span>
            <input
              ref={fileInput}
              id="images"
              name="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => onFilesChosen(e.target.files)}
            />
          </label>
        </div>
      </section>

      {/* ------------------------------ Basics ------------------------------- */}
      <section className="card space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Item details
        </h2>

        <div>
          <label htmlFor="title" className="label">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            id="title"
            name="title"
            className="input"
            defaultValue={defaults.title ?? ""}
            placeholder="e.g. 3-Seater Fabric Sofa — Dark Grey"
            required
            minLength={5}
            maxLength={120}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="categoryId" className="label">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="input"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
              }}
              required
            >
              <option value="">Choose a category…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subcategoryId" className="label">
              Subcategory <span className="text-ink-400">(optional)</span>
            </label>
            <select
              id="subcategoryId"
              name="subcategoryId"
              className="input"
              defaultValue={defaults.subcategoryId ?? ""}
              disabled={subcategoryOptions.length === 0}
            >
              <option value="">
                {subcategoryOptions.length === 0
                  ? "No subcategories"
                  : "Choose… (optional)"}
              </option>
              {subcategoryOptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="label">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            className="input"
            defaultValue={defaults.description ?? ""}
            placeholder="Describe the item honestly — its condition, what's included, any faults or scratches, why it's a good buy…"
            required
            minLength={20}
            maxLength={5000}
          />
          <p className="field-help">
            Honest, detailed descriptions build buyer trust (and sell faster).
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="label">
              Price (KSh) <span className="text-red-600">*</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={100}
              step={1}
              className="input"
              defaultValue={defaults.price ?? ""}
              placeholder="e.g. 45000"
              required
            />
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-800">
              <input
                type="checkbox"
                name="negotiable"
                defaultChecked={defaults.negotiable ?? false}
                className="h-4 w-4 rounded accent-forest-700"
              />
              Price is negotiable
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="condition" className="label">
            Condition <span className="text-red-600">*</span>
          </label>
          <select
            id="condition"
            name="condition"
            className="input"
            defaultValue={defaults.condition ?? "GOOD"}
            required
          >
            {CONDITIONS.map((condition) => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reasonForSelling" className="label">
            Reason for selling <span className="text-red-600">*</span>
          </label>
          <input
            id="reasonForSelling"
            name="reasonForSelling"
            className="input"
            defaultValue={defaults.reasonForSelling ?? ""}
            placeholder="e.g. Relocating abroad next month"
            required
            minLength={5}
            maxLength={500}
          />
          <p className="field-help">
            Buyers trust listings with an honest reason.
          </p>
        </div>
      </section>

      {/* ------------------------------ Extras ------------------------------- */}
      <section className="card space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Extras <span className="text-sm font-normal text-ink-400">(all optional)</span>
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="brand" className="label">
              Brand
            </label>
            <input
              id="brand"
              name="brand"
              className="input"
              defaultValue={defaults.brand ?? ""}
              placeholder="e.g. Samsung, Tuskey, Armco"
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="model" className="label">
              Model
            </label>
            <input
              id="model"
              name="model"
              className="input"
              defaultValue={defaults.model ?? ""}
              placeholder="e.g. RT42K5533SL"
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="ageDescription" className="label">
              Age / usage
            </label>
            <input
              id="ageDescription"
              name="ageDescription"
              className="input"
              defaultValue={defaults.ageDescription ?? ""}
              placeholder="e.g. 2 years, lightly used"
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="originalPrice" className="label">
              Original price (KSh)
            </label>
            <input
              id="originalPrice"
              name="originalPrice"
              type="number"
              min={0}
              step={1}
              className="input"
              defaultValue={defaults.originalPrice ?? ""}
              placeholder="e.g. 65000"
            />
          </div>
          <div>
            <label htmlFor="dimensions" className="label">
              Dimensions / size
            </label>
            <input
              id="dimensions"
              name="dimensions"
              className="input"
              defaultValue={defaults.dimensions ?? ""}
              placeholder='e.g. 210cm × 90cm × 85cm or "king size"'
              maxLength={120}
            />
          </div>
        </div>
      </section>

      {/* ---------------------------- Location ------------------------------- */}
      <section className="card space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Location &amp; handover
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="county" className="label">
              County <span className="text-red-600">*</span>
            </label>
            <select
              id="county"
              name="county"
              className="input"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              required
            >
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="town" className="label">
              Town / area <span className="text-red-600">*</span>
            </label>
            <input
              id="town"
              name="town"
              className="input"
              list="town-options"
              defaultValue={defaults.town ?? ""}
              placeholder="e.g. Kilimani, Westlands…"
              required
              minLength={2}
              maxLength={60}
            />
            <datalist id="town-options">
              {towns.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="label">Handover options</legend>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-800">
            <input
              type="checkbox"
              name="buyerCollects"
              defaultChecked={defaults.buyerCollects ?? true}
              className="h-4 w-4 rounded accent-forest-700"
            />
            Buyer collects in person
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-800">
            <input
              type="checkbox"
              name="deliveryAvailable"
              defaultChecked={defaults.deliveryAvailable ?? false}
              className="h-4 w-4 rounded accent-forest-700"
            />
            Delivery available (arrange cost with buyer)
          </label>
          {defaults.deliveryAvailable && (
            <div>
              <label htmlFor="deliveryNote" className="label">
                Delivery note
              </label>
              <input
                id="deliveryNote"
                name="deliveryNote"
                className="input"
                defaultValue={defaults.deliveryNote ?? ""}
                placeholder="e.g. Within Nairobi at a small fee"
                maxLength={300}
              />
            </div>
          )}
        </fieldset>
      </section>

      {/* ----------------------------- Contact ------------------------------- */}
      <section className="card space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          How should buyers reach you?
        </h2>
        <div>
          <label htmlFor="preferredContact" className="label">
            Preferred contact method <span className="text-red-600">*</span>
          </label>
          <select
            id="preferredContact"
            name="preferredContact"
            className="input"
            defaultValue={defaults.preferredContact ?? "ANY"}
            required
          >
            {PREFERRED_CONTACTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="field-help">
            Your number is only revealed to buyers after they acknowledge the
            safety notice.
          </p>
        </div>
      </section>

      {/* ------------------------------ Footer ------------------------------- */}
      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton className="btn-primary btn-lg sm:w-auto" pendingLabel="Saving…">
          {listingId ? "Save changes" : "Publish listing"}
        </SubmitButton>
        <Link href="/dashboard/listings" className="btn-secondary btn-lg">
          Cancel
        </Link>
      </div>
      <p className="text-xs leading-relaxed text-ink-500">
        Listings are reviewed by our moderation team before going live. By
        publishing you confirm the item is yours to sell, the photos and
        description are honest, and you accept our{" "}
        <Link href="/safety" className="font-medium text-forest-700 underline underline-offset-2">
          safety guidelines
        </Link>
        .
      </p>
    </form>
  );
}
