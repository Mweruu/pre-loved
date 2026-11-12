/**
 * Creates the Supabase storage bucket and access policies required by
 * Sokoni Nyumbani's listing photos.
 *
 * Run with: npm run setup:supabase   (after `npm run db:push`)
 *
 * Why raw SQL? The service_role key is not available in this environment,
 * so we provision storage through the Postgres connection instead.
 */
import "dotenv/config";
import { Client } from "pg";

function bareDbUrl(): string {
  const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!raw) throw new Error("DIRECT_URL / DATABASE_URL is not set in .env");
  // Strip pgbouncer/prisma query params — not valid for node-postgres.
  return raw.split("?")[0];
}

const POLICIES: { name: string; sql: string; note: string }[] = [
  {
    name: "listing_images_public_read",
    sql: `create policy "listing_images_public_read" on storage.objects
      for select using (bucket_id = 'listing-images');`,
    note: "Anyone can view listing photos (the marketplace is public).",
  },
  {
    name: "listing_images_authenticated_insert",
    sql: `create policy "listing_images_authenticated_insert" on storage.objects
      for insert to authenticated with check (bucket_id = 'listing-images');`,
    note: "Signed-in sellers can upload photos for their listings.",
  },
  {
    name: "listing_images_owner_update",
    sql: `create policy "listing_images_owner_update" on storage.objects
      for update to authenticated
      using (bucket_id = 'listing-images' and owner_id = auth.uid()::text);`,
    note: "Sellers can only update objects they uploaded.",
  },
  {
    name: "listing_images_owner_delete",
    sql: `create policy "listing_images_owner_delete" on storage.objects
      for delete to authenticated
      using (bucket_id = 'listing-images' and owner_id = auth.uid()::text);`,
    note: "Sellers can only delete objects they uploaded.",
  },
];

async function main(): Promise<void> {
  const client = new Client({ connectionString: bareDbUrl() });
  await client.connect();
  console.log("→ Connected to Supabase Postgres.");

  try {
    // 1. The listing-images bucket: public reads, 5 MB cap, image MIME types.
    await client.query(`
      insert into storage.buckets
        (id, name, public, file_size_limit, allowed_mime_types)
      values
        ('listing-images', 'listing-images', true, 5242880,
         array['image/jpeg','image/png','image/webp'])
      on conflict (id) do update
        set public = true,
            file_size_limit = excluded.file_size_limit,
            allowed_mime_types = excluded.allowed_mime_types;
    `);
    console.log("✓ Bucket 'listing-images' ready (public, 5 MB, JPEG/PNG/WebP).");

    // 2. Storage policies (idempotent).
    for (const { name, sql, note } of POLICIES) {
      await client.query(`drop policy if exists "${name}" on storage.objects;`);
      await client.query(sql);
      console.log(`✓ Policy '${name}' installed — ${note}`);
    }
  } finally {
    await client.end();
  }

  console.log("\nSupabase storage setup complete.");
}

main().catch((error) => {
  console.error("Supabase setup failed:", error);
  process.exit(1);
});
