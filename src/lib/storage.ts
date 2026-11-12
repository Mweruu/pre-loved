import { createSupabaseServerClient } from "@/lib/supabase/server";

export const LISTING_IMAGES_BUCKET = "listing-images";

const MAX_IMAGES_PER_LISTING = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB each
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface ValidatedImage {
  file: File;
  ext: string;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `"${file.name}" is not a JPEG, PNG or WebP image.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is larger than 5 MB.`;
  }
  return null;
}

function extensionFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/** Public URL for a Supabase Storage object in the listing images bucket. */
export function storagePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/${path}`;
}

/**
 * Resolves a ListingImage.storagePath into a browser-usable <img src>.
 * Uploaded photos are storage paths ("listings/uuid.jpg"); demo/seed data
 * stores absolute URLs or local routes.
 */
export function listingImageSrc(storagePath: string): string {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  if (storagePath.startsWith("/")) return storagePath;
  return storagePublicUrl(storagePath);
}

export function maxImages(): number {
  return MAX_IMAGES_PER_LISTING;
}

/**
 * Uploads validated image files to Supabase Storage using the signed-in
 * seller's session (allowed by the bucket's INSERT policy for authenticated
 * users). Returns the storage paths of the uploaded objects.
 */
export async function uploadListingImages(
  files: ValidatedImage[]
): Promise<string[]> {
  if (files.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const paths: string[] = [];

  for (const { file, ext } of files) {
    const path = `listings/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
    paths.push(path);
  }
  return paths;
}

/** Best-effort removal of storage objects (policies may restrict deletes). */
export async function deleteListingImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(LISTING_IMAGES_BUCKET)
    .remove(paths);
  if (error) {
    console.warn("Could not delete some listing images:", error.message);
  }
}
