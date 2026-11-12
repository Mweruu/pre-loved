/**
 * Seeds Sokoni Nyumbani with demo data: admin + 3 sellers (Supabase Auth
 * users with confirmed emails), categories/subcategories, subscription
 * plans, demo listings with placeholder artwork, subscriptions with
 * SIMULATION-flagged confirmed payments, plus a sample report and enquiry.
 *
 * Run with: npm run seed   (after db:push + setup:supabase)
 *
 * Auth users are inserted directly into Supabase's auth schema (bcrypt via
 * pgcrypto) because the public sign-up API is rate-limited and rejects demo
 * domains — this also means no confirmation emails are sent. All seed data
 * uses SIMULATION payments, clearly flagged as simulated.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Client } from "pg";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function bareDbUrl(): string {
  const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!raw) throw new Error("DIRECT_URL / DATABASE_URL is not set in .env");
  return raw.split("?")[0];
}

/** Placeholder artwork path (served by /api/placeholder once the app runs). */
function img(emoji: string, title: string, variant = 1): string {
  return `/api/placeholder?e=${encodeURIComponent(emoji)}&t=${encodeURIComponent(
    title
  )}&v=${variant}`;
}

const DAY = 86_400_000;

/* ------------------------------- Demo users -------------------------------- */

const USERS = [
  {
    email: "admin@sokoninyumbani.co.ke",
    password: "Admin!Sokoni2026",
    name: "Sokoni Admin",
    phone: "254700000001",
    role: "ADMIN" as const,
    county: "Nairobi",
    town: "Kilimani",
  },
  {
    email: "wanjiku@example.com",
    password: "Wanjiku!Demo2026",
    name: "Wanjiku Mwangi",
    phone: "254711000002",
    role: "USER" as const,
    county: "Nairobi",
    town: "Kilimani",
  },
  {
    email: "otieno@example.com",
    password: "Otieno!Demo2026",
    name: "Otieno Odhiambo",
    phone: "254722000003",
    role: "USER" as const,
    county: "Kisumu",
    town: "Kisumu CBD",
  },
  {
    email: "amina@example.com",
    password: "Amina!Demo2026",
    name: "Amina Hassan",
    phone: "254733000004",
    role: "USER" as const,
    county: "Mombasa",
    town: "Nyali",
  },
];

/* ------------------------------- Categories -------------------------------- */

const CATEGORIES: {
  name: string;
  slug: string;
  icon: string;
  order: number;
  description: string;
  subs: string[];
}[] = [
  {
    name: "Furniture",
    slug: "furniture",
    icon: "sofa",
    order: 0,
    description: "Sofas, beds, tables, wardrobes and everything you sit, sleep or store on.",
    subs: ["Sofas & Armchairs", "Beds & Mattresses", "Tables & Chairs", "Wardrobes & Drawers", "Shelves & Racks"],
  },
  {
    name: "Appliances",
    slug: "appliances",
    icon: "refrigerator",
    order: 1,
    description: "Fridges, cookers, washers and the workhorses of a Kenyan home.",
    subs: ["Refrigerators", "Washing Machines", "Cookers & Ovens", "Microwaves", "Blenders & Mixers", "Water Dispensers"],
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "tv",
    order: 2,
    description: "TVs, sound systems, gaming gear and accessories.",
    subs: ["TVs & Projectors", "Audio & Sound", "Gaming", "Accessories"],
  },
  {
    name: "Kitchen & Dining",
    slug: "kitchen-dining",
    icon: "utensils",
    order: 3,
    description: "Cookware, crockery, cutlery and everything for the kitchen.",
    subs: ["Cookware", "Cutlery & Crockery", "Small Appliances", "Storage & Jars"],
  },
  {
    name: "Home Decor",
    slug: "home-decor",
    icon: "lamp",
    order: 4,
    description: "Lighting, rugs, curtains, art and the touches that make a home.",
    subs: ["Lighting", "Rugs & Carpets", "Curtains & Blinds", "Wall Art & Frames", "Mirrors", "Plants & Vases"],
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    icon: "baby",
    order: 5,
    description: "Cots, strollers, toys and gear for little ones.",
    subs: ["Cribs & Cots", "Strollers & Carriers", "Toys", "Kids Furniture", "Feeding & Bath"],
  },
  {
    name: "Garden & Outdoor",
    slug: "garden-outdoor",
    icon: "trees",
    order: 6,
    description: "Outdoor furniture, plants, BBQs and balcony life.",
    subs: ["Outdoor Furniture", "Plants & Pots", "Tools & Equipment", "BBQ & Grills"],
  },
  {
    name: "Tools & DIY",
    slug: "tools-diy",
    icon: "hammer",
    order: 7,
    description: "Power tools, hand tools and supplies for home projects.",
    subs: ["Power Tools", "Hand Tools", "Paint & Supplies", "Ladders"],
  },
  {
    name: "Other Household Items",
    slug: "other-household",
    icon: "package",
    order: 8,
    description: "Fans, heaters, irons, organisers and everything else.",
    subs: ["Cleaning & Laundry", "Fans & Heaters", "Storage & Organisers", "Miscellaneous"],
  },
];

/* ---------------------------------- Plans ---------------------------------- */

const PLANS = [
  {
    slug: "starter-monthly",
    name: "Starter Monthly",
    description: "Try selling with a pocket-friendly monthly plan.",
    priceKes: 500,
    durationDays: 30,
    maxActiveListings: 10,
    features: "10 active listings\nM-Pesa payment\nListing moderation included\nRelist expired items free",
    badge: null,
    promoText: null,
    orderIndex: 0,
  },
  {
    slug: "quarterly-seller",
    name: "Quarterly Seller",
    description: "Three months of listing power — our most popular plan.",
    priceKes: 1200,
    durationDays: 90,
    maxActiveListings: 20,
    features: "20 active listings\nEverything in Starter\nFeatured listing eligibility\nPriority moderation queue",
    badge: "Most popular",
    promoText: null,
    orderIndex: 1,
  },
  {
    slug: "annual-seller",
    name: "Annual Seller",
    description: "A full year of selling — best value for serious declutterers.",
    priceKes: 4000,
    durationDays: 365,
    maxActiveListings: 40,
    features: "40 active listings\nEverything in Quarterly\nFeatured listing eligibility\nPriority moderation queue\nAccount support on WhatsApp",
    badge: "Best value",
    promoText: "Save 33% vs monthly",
    orderIndex: 2,
  },
];

/* -------------------------------- Listings --------------------------------- */

interface ListingSpec {
  sellerEmail: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  condition: "BRAND_NEW" | "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "FOR_PARTS";
  reason: string;
  brand?: string;
  model?: string;
  age?: string;
  originalPrice?: number;
  dimensions?: string;
  county: string;
  town: string;
  category: string;
  sub?: string;
  emoji: string;
  status: "PENDING_APPROVAL" | "ACTIVE" | "RESERVED" | "SOLD";
  featured?: boolean;
  views: number;
  delivery?: boolean;
  deliveryNote?: string;
}

const LISTINGS: ListingSpec[] = [
  {
    sellerEmail: "wanjiku@example.com",
    title: "3-Seater Fabric Sofa — Charcoal Grey",
    description:
      "Comfortable 3-seater in a neutral charcoal grey that fits any living room. Cushions still firm, no tears or stains — always covered and in a smoke-free home. Selling because we're moving to a smaller apartment.",
    price: 45000,
    negotiable: true,
    condition: "GOOD",
    reason: "Relocating to a smaller apartment",
    brand: "Tuskey",
    age: "3 years, lightly used",
    originalPrice: 85000,
    dimensions: "210cm × 90cm × 85cm",
    county: "Nairobi",
    town: "Kilimani",
    category: "furniture",
    sub: "Sofas & Armchairs",
    emoji: "🛋️",
    status: "ACTIVE",
    featured: true,
    views: 214,
    delivery: true,
    deliveryNote: "Within Nairobi at a small fee, or pick up in Kilimani.",
  },
  {
    sellerEmail: "wanjiku@example.com",
    title: "LG 7kg Front-Load Washing Machine",
    description:
      " LG inverter direct-drive washer, 7kg capacity. Runs quietly, washes beautifully, no leaks. Recently serviced (new door seal). Full working order — bring a bucket and test it before you pay.",
    price: 28000,
    negotiable: false,
    condition: "EXCELLENT",
    reason: "Upgrading to a washer-dryer combo",
    brand: "LG",
    model: "F2J3HYL5W",
    age: "2 years",
    originalPrice: 74000,
    county: "Nairobi",
    town: "Kilimani",
    category: "appliances",
    sub: "Washing Machines",
    emoji: "🌀",
    status: "ACTIVE",
    views: 189,
    delivery: true,
    deliveryNote: "Delivery possible within Nairobi.",
  },
  {
    sellerEmail: "wanjiku@example.com",
    title: "King Size Memory Foam Mattress",
    description:
      "Ehealth king-size memory foam mattress, 8 inches. Barely used — it was in the guest room. Always used with a mattress protector. No sagging, no stains. Comes clean and ready to sleep on.",
    price: 22000,
    negotiable: true,
    condition: "LIKE_NEW",
    reason: "Guest room is being converted to a study",
    brand: "Ehealth",
    age: "1 year, guest-room use only",
    originalPrice: 35000,
    dimensions: "King size (6ft × 6ft 8in)",
    county: "Nairobi",
    town: "Westlands",
    category: "furniture",
    sub: "Beds & Mattresses",
    emoji: "🛏️",
    status: "ACTIVE",
    views: 97,
  },
  {
    sellerEmail: "wanjiku@example.com",
    title: 'Samsung 43" Smart TV with Remote',
    description:
      "Full HD smart TV with Netflix, YouTube and screen mirroring. No dead pixels, no scratches, original remote included. Selling because we were gifted a bigger one for our anniversary.",
    price: 32000,
    negotiable: false,
    condition: "EXCELLENT",
    reason: "Received a bigger TV as a gift",
    brand: "Samsung",
    model: "UA43T5300",
    age: "18 months",
    originalPrice: 52000,
    dimensions: '43 inch (108cm wide)',
    county: "Nairobi",
    town: "Kilimani",
    category: "electronics",
    sub: "TVs & Projectors",
    emoji: "📺",
    status: "ACTIVE",
    featured: true,
    views: 302,
  },
  {
    sellerEmail: "wanjiku@example.com",
    title: "Baby Cot with Storage Drawer",
    description:
      "Sturdy wooden cot with an adjustable mattress base and a handy drawer underneath. Our daughter has outgrown it. Mattress included (always used with a protector). A few teething marks on the rails — see photos.",
    price: 12000,
    negotiable: true,
    condition: "GOOD",
    reason: "Daughter has outgrown it",
    age: "used for one child",
    originalPrice: 24000,
    dimensions: "125cm × 65cm × 90cm",
    county: "Nairobi",
    town: "Kilimani",
    category: "baby-kids",
    sub: "Cribs & Cots",
    emoji: "🍼",
    status: "RESERVED",
    views: 143,
  },
  {
    sellerEmail: "wanjiku@example.com",
    title: "Solid Wood Dining Table with 4 Chairs",
    description:
      "Mhasibu solid mahogany dining set — table plus four matching chairs. Some surface scratches on the top that polish out beautifully. Chairs are rock solid. A handsome set for a family home.",
    price: 35000,
    negotiable: true,
    condition: "GOOD",
    reason: "Moving into a furnished apartment",
    age: "5 years",
    originalPrice: 78000,
    dimensions: "150cm × 90cm table; chairs standard height",
    county: "Nairobi",
    town: "Kilimani",
    category: "furniture",
    sub: "Tables & Chairs",
    emoji: "🪑",
    status: "ACTIVE",
    views: 88,
  },
  {
    sellerEmail: "otieno@example.com",
    title: "Hisense 300L Double-Door Fridge",
    description:
      "Hisense 300-litre double-door refrigerator with freezer. Cools perfectly, freezer makes ice fast. Small dent on one side (purely cosmetic) — shown in photos. Only selling because we bought a bigger one for the family business.",
    price: 38000,
    negotiable: true,
    condition: "EXCELLENT",
    reason: "Bought a larger fridge for our business",
    brand: "Hisense",
    model: "RT292D4AU1",
    age: "2 years",
    originalPrice: 62000,
    county: "Kisumu",
    town: "Kisumu CBD",
    category: "appliances",
    sub: "Refrigerators",
    emoji: "🧊",
    status: "ACTIVE",
    featured: true,
    views: 176,
  },
  {
    sellerEmail: "otieno@example.com",
    title: "Bosch 5-Burner Gas Cooker with Oven",
    description:
      "Five-burner gas cooker with a full oven and grill — all burners and the oven work perfectly. Stainless steel top wipes clean easily. Includes the gas regulator and pipe. Viewing welcome in Milimani.",
    price: 26000,
    negotiable: false,
    condition: "GOOD",
    reason: "Renovating the kitchen with built-in units",
    brand: "Bosch",
    age: "4 years, well maintained",
    originalPrice: 55000,
    dimensions: "90cm × 60cm",
    county: "Kisumu",
    town: "Milimani",
    category: "appliances",
    sub: "Cookers & Ovens",
    emoji: "🔥",
    status: "ACTIVE",
    views: 121,
  },
  {
    sellerEmail: "otieno@example.com",
    title: "Hand-Woven Persian Rug — 5ft × 8ft",
    description:
      "Genuine hand-woven Persian rug bought from a Kakamega collector. Rich reds and blues, intricate pattern, no moth damage. Professionally cleaned last month. A statement piece that ties a room together.",
    price: 18000,
    negotiable: true,
    condition: "EXCELLENT",
    reason: "Redecorating with a lighter palette",
    age: "approximately 15 years, well cared for",
    originalPrice: 45000,
    dimensions: "5ft × 8ft",
    county: "Kisumu",
    town: "Kisumu CBD",
    category: "home-decor",
    sub: "Rugs & Carpets",
    emoji: "🧶",
    status: "ACTIVE",
    views: 95,
  },
  {
    sellerEmail: "otieno@example.com",
    title: "JBL PartyBox Bluetooth Speaker",
    description:
      "JBL PartyBox with booming bass, lights, karaoke mic input and Bluetooth. Battery still holds a full charge for hours. Perfect for weekend mbuzi choma sessions. Selling to raise school fees.",
    price: 15000,
    negotiable: true,
    condition: "GOOD",
    reason: "Raising school fees",
    brand: "JBL",
    age: "1 year",
    originalPrice: 27000,
    county: "Kisumu",
    town: "Kondele",
    category: "electronics",
    sub: "Audio & Sound",
    emoji: "🔊",
    status: "ACTIVE",
    views: 167,
  },
  {
    sellerEmail: "otieno@example.com",
    title: "Weber Charcoal BBQ Grill",
    description:
      "Classic Weber kettle grill with the original lid. Cooks evenly and the vents still seal properly. A little rusty on the outside legs but the grill grate is clean and solid. Buyer collects.",
    price: 9000,
    negotiable: true,
    condition: "FAIR",
    reason: "Rarely use it since moving to an apartment",
    brand: "Weber",
    age: "6 years",
    dimensions: "57cm cooking diameter",
    county: "Kisumu",
    town: "Nyalenda",
    category: "garden-outdoor",
    sub: "BBQ & Grills",
    emoji: "🍖",
    status: "SOLD",
    views: 231,
  },
  {
    sellerEmail: "otieno@example.com",
    title: "Blackout Curtains — Set of 4 Panels",
    description:
      "Four ready-made blackout curtain panels in a warm beige, each with an eyelet header. Kept out the Kisumu sun beautifully. Washed and pressed, ready to hang. Fit windows up to about 2m wide each pair.",
    price: 6500,
    negotiable: false,
    condition: "LIKE_NEW",
    reason: "Changed our window fittings",
    county: "Kisumu",
    town: "Kisumu CBD",
    category: "home-decor",
    sub: "Curtains & Blinds",
    emoji: "🪟",
    status: "ACTIVE",
    views: 54,
  },
  {
    sellerEmail: "amina@example.com",
    title: "Samsung 28L Microwave Oven",
    description:
      "Samsung 28-litre microwave with grill function. Heats evenly, turntable rotates smoothly, door latch perfect. We're leaving the country and can't take it along. First come, first served.",
    price: 8500,
    negotiable: true,
    condition: "GOOD",
    reason: "Relocating abroad",
    brand: "Samsung",
    model: "ME73B",
    age: "2 years",
    originalPrice: 16000,
    county: "Mombasa",
    town: "Nyali",
    category: "appliances",
    sub: "Microwaves",
    emoji: "🍲",
    status: "ACTIVE",
    views: 78,
  },
  {
    sellerEmail: "amina@example.com",
    title: "Solid Wood Study Desk with Hutch",
    description:
      "Compact mahogany study desk with a hutch shelf for books and a single drawer. Perfect for a student's room or home office. A few ink marks on the surface, otherwise sturdy and handsome.",
    price: 11000,
    negotiable: true,
    condition: "GOOD",
    reason: "Downsizing the home office",
    age: "4 years",
    dimensions: "120cm × 60cm × 145cm (with hutch)",
    county: "Mombasa",
    town: "Nyali",
    category: "furniture",
    sub: "Tables & Chairs",
    emoji: "📚",
    status: "ACTIVE",
    views: 61,
  },
  {
    sellerEmail: "amina@example.com",
    title: "Cordless Drill + 68-Piece Tool Kit",
    description:
      "Bosch cordless drill (two batteries, charger) plus a 68-piece bit and socket set in a carry case. Light home-use only — everything works. Selling the whole kit together.",
    price: 7500,
    negotiable: false,
    condition: "GOOD",
    reason: "Bought a full workshop set",
    brand: "Bosch",
    age: "2 years",
    originalPrice: 14500,
    county: "Mombasa",
    town: "Bamburi",
    category: "tools-diy",
    sub: "Power Tools",
    emoji: "🔧",
    status: "ACTIVE",
    views: 112,
  },
  {
    sellerEmail: "amina@example.com",
    title: "Rattan Outdoor Sofa Set — 4 Seater",
    description:
      "Weather-resistant rattan garden set: two-seater sofa, two armchairs and a glass-top coffee table. Cushions included and freshly washed. Lived on a covered patio so no sun damage. Buyer collects from Nyali.",
    price: 30000,
    negotiable: true,
    condition: "LIKE_NEW",
    reason: "Moving to an apartment without a patio",
    age: "1 year",
    originalPrice: 65000,
    county: "Mombasa",
    town: "Nyali",
    category: "garden-outdoor",
    sub: "Outdoor Furniture",
    emoji: "🌴",
    status: "ACTIVE",
    featured: true,
    views: 198,
  },
  {
    sellerEmail: "amina@example.com",
    title: "Nokia Feature Phone — Sealed in Box",
    description:
      "Brand new Nokia 105, still sealed in its original box. Won it in a raffle and already have a smartphone. Comes with the full warranty card.",
    price: 2500,
    negotiable: false,
    condition: "BRAND_NEW",
    reason: "Won it in a raffle, already have a phone",
    brand: "Nokia",
    model: "105",
    originalPrice: 3200,
    county: "Mombasa",
    town: "Nyali",
    category: "electronics",
    sub: "Accessories",
    emoji: "📱",
    status: "PENDING_APPROVAL",
    views: 12,
  },
  {
    sellerEmail: "amina@example.com",
    title: "3-Speed Tower Fan with Remote",
    description:
      "Slim tower fan with three speeds, oscillation and a remote control. Perfect working condition — Mombasa heat approved. Light scuff on the base, invisible in use.",
    price: 4500,
    negotiable: true,
    condition: "GOOD",
    reason: "Got an inverter AC unit",
    brand: "Armco",
    age: "1 year",
    originalPrice: 9000,
    county: "Mombasa",
    town: "Bamburi",
    category: "other-household",
    sub: "Fans & Heaters",
    emoji: "🌬️",
    status: "ACTIVE",
    views: 44,
  },
];

/* --------------------------------- Script ---------------------------------- */

async function main(): Promise<void> {
  const pg = new Client({ connectionString: bareDbUrl() });
  await pg.connect();
  console.log("→ Connected to Supabase Postgres.");

  /* ------------------------------ 1. Users -------------------------------- */

  const userIds = new Map<string, string>();
  for (const user of USERS) {
    const existing = await pg.query<{ id: string }>(
      "select id from auth.users where lower(email) = lower($1)",
      [user.email]
    );
    let id: string | undefined = existing.rows[0]?.id;

    if (!id) {
      // Create the auth user directly in Postgres. Supabase's public sign-up
      // API is rate-limited (and rejects demo domains), so seeding through it
      // is unreliable. Passwords are bcrypt-hashed by pgcrypto, exactly as
      // GoTrue expects, and the email is pre-confirmed for the demo.
      const created = await pg.query<{ id: string }>(
        `insert into auth.users (
           instance_id, id, aud, role, email, encrypted_password,
           email_confirmed_at, created_at, updated_at,
           raw_app_meta_data, raw_user_meta_data,
           confirmation_token, recovery_token, email_change_token_new,
           email_change, email_change_token_current
         ) values (
           '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
           'authenticated', 'authenticated', $1,
           extensions.crypt($2::text, extensions.gen_salt('bf')),
           now(), now(), now(),
           '{"provider":"email","providers":["email"]}'::jsonb,
           jsonb_build_object('name', $3::text),
           '', '', '', '', ''
         ) returning id`,
        [user.email, user.password, user.name]
      );
      id = created.rows[0].id;
      console.log(`  + Created auth user ${user.email}`);
    } else {
      // Keep demo credentials in sync on re-runs.
      await pg.query(
        `update auth.users
         set encrypted_password = extensions.crypt($2::text, extensions.gen_salt('bf')),
             email_confirmed_at = coalesce(email_confirmed_at, now()),
             updated_at = now()
         where id = $1`,
        [id, user.password]
      );
    }

    if (!id) {
      throw new Error(`Could not resolve auth user id for ${user.email}`);
    }

    // Email identity row — required by GoTrue's password sign-in flow.
    await pg.query(
      `insert into auth.identities
         (id, user_id, identity_data, provider, provider_id,
          last_sign_in_at, created_at, updated_at)
       values
         (gen_random_uuid(), $1::uuid,
          jsonb_build_object(
            'sub', $1::text,
            'email', $2::text,
            'email_verified', true,
            'phone_verified', false
          ),
          'email', $1::text, now(), now(), now())
       on conflict do nothing`,
      [id, user.email]
    );
    userIds.set(user.email, id);

    await prisma.profile.upsert({
      where: { id },
      create: {
        id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsappPhone: user.phone,
        role: user.role,
        county: user.county,
        town: user.town,
        phoneVerifiedAt: new Date(),
      },
      update: {
        name: user.name,
        phone: user.phone,
        whatsappPhone: user.phone,
        role: user.role,
        county: user.county,
        town: user.town,
      },
    });
  }
  console.log("✓ Users ready (emails confirmed, phones verified).");

  /* ---------------------------- 2. Categories ----------------------------- */

  const catIdBySlug = new Map<string, string>();
  const subIdByPath = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        orderIndex: cat.order,
        active: true,
      },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        orderIndex: cat.order,
        active: true,
      },
    });
    catIdBySlug.set(cat.slug, category.id);

    for (const subName of cat.subs) {
      const subSlug = slugify(subName);
      const sub = await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: subSlug } },
        create: { categoryId: category.id, name: subName, slug: subSlug },
        update: { name: subName },
      });
      subIdByPath.set(`${cat.slug}/${subSlug}`, sub.id);
    }
  }
  console.log(`✓ ${CATEGORIES.length} categories + ${subIdByPath.size} subcategories ready.`);

  /* ------------------------------ 3. Plans -------------------------------- */

  const planIdBySlug = new Map<string, string>();
  for (const plan of PLANS) {
    const saved = await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: {
        name: plan.name,
        description: plan.description,
        priceKes: plan.priceKes,
        durationDays: plan.durationDays,
        maxActiveListings: plan.maxActiveListings,
        features: plan.features,
        badge: plan.badge,
        promoText: plan.promoText,
        orderIndex: plan.orderIndex,
        active: true,
      },
    });
    planIdBySlug.set(plan.slug, saved.id);
  }
  console.log(`✓ ${PLANS.length} subscription plans ready.`);

  /* ---------------------------- 4. Listings ------------------------------- */

  let createdListings = 0;
  for (const spec of LISTINGS) {
    const sellerId = userIds.get(spec.sellerEmail)!;
    const existing = await prisma.listing.findFirst({
      where: { title: spec.title, sellerId },
      select: { id: true },
    });
    if (existing) continue;

    const categoryId = catIdBySlug.get(spec.category)!;
    const subcategoryId = spec.sub ? subIdByPath.get(`${spec.category}/${slugify(spec.sub)}`) ?? null : null;

    const listing = await prisma.listing.create({
      data: {
        sellerId,
        categoryId,
        subcategoryId,
        title: spec.title,
        description: spec.description,
        price: spec.price,
        negotiable: spec.negotiable,
        condition: spec.condition,
        reasonForSelling: spec.reason,
        brand: spec.brand ?? null,
        model: spec.model ?? null,
        ageDescription: spec.age ?? null,
        originalPrice: spec.originalPrice ?? null,
        dimensions: spec.dimensions ?? null,
        county: spec.county,
        town: spec.town,
        deliveryAvailable: Boolean(spec.delivery),
        deliveryNote: spec.deliveryNote ?? null,
        buyerCollects: true,
        preferredContact: "ANY",
        status: spec.status,
        featured: Boolean(spec.featured),
        viewsCount: spec.views,
        expiresAt: new Date(Date.now() + 60 * DAY),
        images: {
          create: [
            { storagePath: img(spec.emoji, spec.title, 1), orderIndex: 0 },
            { storagePath: img(spec.emoji, spec.title, 2), orderIndex: 1 },
            { storagePath: img(spec.emoji, spec.title, 3), orderIndex: 2 },
          ],
        },
      },
    });
    createdListings++;
    if (!listing) throw new Error(`Failed to create listing: ${spec.title}`);
  }
  console.log(`✓ Demo listings ready (${createdListings} newly created).`);

  /* -------------------- 5. Subscriptions + payments ----------------------- */

  const sellerPlans: Record<string, string> = {
    "wanjiku@example.com": "quarterly-seller",
    "otieno@example.com": "starter-monthly",
    "amina@example.com": "annual-seller",
  };

  for (const [email, planSlug] of Object.entries(sellerPlans)) {
    const userId = userIds.get(email)!;
    const planId = planIdBySlug.get(planSlug)!;
    const plan = PLANS.find((p) => p.slug === planSlug)!;
    const user = USERS.find((u) => u.email === email)!;

    const existingSub = await prisma.subscription.findFirst({
      where: { userId, planId, status: "ACTIVE" },
    });
    if (existingSub) continue;

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        startsAt: new Date(Date.now() - 7 * DAY),
        endsAt: new Date(Date.now() + (plan.durationDays - 7) * DAY),
        maxActiveListings: plan.maxActiveListings,
        status: "ACTIVE",
      },
    });

    await prisma.payment.create({
      data: {
        userId,
        planId,
        subscriptionId: subscription.id,
        amount: plan.priceKes,
        phone: user.phone,
        method: "SIMULATION",
        status: "CONFIRMED",
        mpesaReceipt: `SIM-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        verifiedAt: new Date(Date.now() - 7 * DAY),
        simulated: true,
      },
    });
  }
  console.log("✓ Seller subscriptions + SIMULATION-flagged confirmed payments ready.");

  /* ---------------------- 6. Sample report + enquiry ---------------------- */

  const reportCount = await prisma.report.count();
  if (reportCount === 0) {
    const suspicious = await prisma.listing.findFirst({
      where: { status: "PENDING_APPROVAL" },
      select: { id: true },
    });
    await prisma.report.create({
      data: {
        reason: "SUSPICIOUS",
        details:
          "This listing says 'sealed in box' but the price looks too good to be true. Please double-check before approving.",
        reporterName: "Careful Buyer",
        reporterEmail: "careful.buyer@example.com",
        ...(suspicious ? { listingId: suspicious.id } : {}),
      },
    });
    console.log("✓ Sample moderation report created.");
  }

  const enquiryCount = await prisma.contactMessage.count();
  if (enquiryCount === 0) {
    await prisma.contactMessage.create({
      data: {
        name: "Peter Kimani",
        email: "peter.kimani@example.com",
        subject: "Upgrading from Starter to Quarterly",
        message:
          "Hi, I bought the Starter Monthly plan last week and I'm already out of listing slots. If I pay for the Quarterly plan, will my remaining days from this month be added on top?",
      },
    });
    console.log("✓ Sample support enquiry created.");
  }

  await pg.end();

  /* ------------------------------ Credentials ----------------------------- */

  console.log(`
──────────────────────────────────────────────────────────
 Seed complete! Demo accounts (emails confirmed, phones verified):
`);
  for (const user of USERS) {
    const role = user.role === "ADMIN" ? "ADMIN " : "seller";
    console.log(`  ${role}  ${user.email}   password: ${user.password}`);
  }
  console.log(`
 M-Pesa is in SIMULATION mode (no Daraja credentials configured).
 Log in as any seller to try the subscription + listing flow end-to-end.
──────────────────────────────────────────────────────────`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
