// Shared constants for buyers, sellers and admins.
// Kept free of server-only imports so client components can use them too.

export const APP_NAME = "Sokoni Nyumbani";
export const APP_TAGLINE = "Give Your Home Items a Second Life.";

/* ----------------------------- Item condition ---------------------------- */

export const CONDITIONS = [
  { value: "BRAND_NEW", label: "Brand New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "FOR_PARTS", label: "For Parts / Repair" },
] as const;

export type ConditionValue = (typeof CONDITIONS)[number]["value"];

export function conditionLabel(value: string): string {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

export const CONDITION_BADGE_CLASSES: Record<string, string> = {
  BRAND_NEW: "bg-forest-100 text-forest-800",
  LIKE_NEW: "bg-emerald-100 text-emerald-800",
  EXCELLENT: "bg-teal-100 text-teal-800",
  GOOD: "bg-sand-200 text-sand-800",
  FAIR: "bg-amber-100 text-amber-800",
  FOR_PARTS: "bg-red-100 text-red-800",
};

/* ----------------------------- Listing status ---------------------------- */

export const LISTING_STATUSES = [
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "ACTIVE", label: "Active" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REMOVED", label: "Removed" },
] as const;

export function listingStatusLabel(value: string): string {
  return LISTING_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-forest-100 text-forest-800",
  RESERVED: "bg-blue-100 text-blue-800",
  SOLD: "bg-ink-200 text-ink-800",
  EXPIRED: "bg-orange-100 text-orange-800",
  REJECTED: "bg-red-100 text-red-800",
  REMOVED: "bg-red-100 text-red-800",
};

/* ------------------------------ Payment status ---------------------------- */

export const PAYMENT_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "VERIFYING", label: "Verifying" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "FAILED", label: "Failed" },
] as const;

export function paymentStatusLabel(value: string): string {
  return PAYMENT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export const PAYMENT_BADGE_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  VERIFYING: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-forest-100 text-forest-800",
  FAILED: "bg-red-100 text-red-800",
};

/* ------------------------------ Contact prefs ----------------------------- */

export const PREFERRED_CONTACTS = [
  { value: "ANY", label: "WhatsApp or phone call" },
  { value: "WHATSAPP", label: "WhatsApp only" },
  { value: "PHONE", label: "Phone call only" },
] as const;

export function preferredContactLabel(value: string): string {
  return PREFERRED_CONTACTS.find((c) => c.value === value)?.label ?? value;
}

/* ------------------------------ Report reasons ---------------------------- */

export const REPORT_REASONS = [
  { value: "SUSPICIOUS", label: "Suspicious listing or activity" },
  { value: "SCAM", label: "Suspected scam or fraud" },
  { value: "FAKE_ITEM", label: "Item is fake or not as described" },
  { value: "DUPLICATE_SPAM", label: "Duplicate or spam listing" },
  { value: "PROHIBITED", label: "Prohibited item" },
  { value: "WRONG_CATEGORY", label: "Wrong category" },
  { value: "PRICE_ISSUE", label: "Misleading price" },
  { value: "OTHER", label: "Other" },
] as const;

export function reportReasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}

/* --------------------------- Kenyan counties/towns ------------------------ */

export const COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita Taveta",
  "Tana River",
  "Tharaka Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
] as const;

export type County = (typeof COUNTIES)[number];

export const TOWNS: Record<string, string[]> = {
  Nairobi: [
    "Nairobi CBD",
    "Westlands",
    "Kilimani",
    "Lavington",
    "Kileleshwa",
    "Karen",
    "Runda",
    "Kasarani",
    "Embakasi",
    "Donholm",
    "South B",
    "South C",
    "Ngara",
    "Ruaka",
    "Mwiki",
    "Roysambu",
  ],
  Mombasa: ["Mombasa CBD", "Nyali", "Bamburi", "Shanzu", "Likoni", "Miritini"],
  Kiambu: ["Thika", "Ruiru", "Juja", "Kiambu Town", "Kikuyu", "Limuru", "Karuri", "Githunguri"],
  Nakuru: ["Nakuru Town", "Milimani", "London", "Free Area", "Naivasha", "Njoro"],
  Kajiado: ["Kitengela", "Ngong", "Ongata Rongai", "Kajiado Town", "Isinya"],
  Machakos: ["Machakos Town", "Athi River", "Mlolongo", "Kangundo", "Mwala"],
  Kisumu: ["Kisumu CBD", "Milimani", "Nyalenda", "Kondele", "Mamboleo"],
  "Uasin Gishu": ["Eldoret CBD", "Kapseret", "Langas", "Annex", "Pioneer"],
  Kakamega: ["Kakamega Town", "Mumias", "Lurambo"],
  Nyeri: ["Nyeri Town", "Karatina", "Othaya", "Mweiga"],
  Meru: ["Meru Town", "Makutano", "Nkubu"],
  Kisii: ["Kisii Town", "Nyatieko", "Suneka"],
  Kilifi: ["Kilifi Town", "Malindi", "Watamu"],
  Laikipia: ["Nanyuki", "Laikipia Town"],
  "Murang'a": ["Murang'a Town", "Maragua", "Kangema"],
  Kirinyaga: ["Kerugoya", "Sagana", "Wang'uru"],
  Bungoma: ["Bungoma Town", "Webuye", "Kimilili"],
  Busia: ["Busia Town", "Malaba"],
  "Homa Bay": ["Homa Bay Town", "Oyugis", "Mbita"],
  Migori: ["Migori Town", "Awendo", "Kehancha"],
  Siaya: ["Siaya Town", "Bondo", "Ugunja"],
  Vihiga: ["Vihiga Town", "Mbale", "Luanda"],
  Bomet: ["Bomet Town", "Silibwet", "Mulot"],
  Narok: ["Narok Town", "Kilgoris"],
  Kericho: ["Kericho Town", "Londiani"],
  "Trans Nzoia": ["Kitale", "Endebess"],
  Makueni: ["Wote", "Machakos Junction", "Kibwezi"],
  Embu: ["Embu Town", "Runyenjes"],
  Kitui: ["Kitui Town", "Mwingi"],
  Isiolo: ["Isiolo Town"],
  Marsabit: ["Marsabit Town", "Moyale"],
  Lamu: ["Lamu Island", "Mokowe"],
  "Tana River": ["Hola", "Garsen"],
  "Taita Taveta": ["Voi", "Taveta", "Wundanyi"],
  Garissa: ["Garissa Town"],
  Wajir: ["Wajir Town"],
  Mandera: ["Mandera Town"],
  Kwale: ["Ukunda", "Msambweni", "Kwale Town"],
  "West Pokot": ["Kapenguria", "Chepareria"],
  Samburu: ["Maralal", "Baragoi"],
  "Elgeyo Marakwet": ["Iten", "Kapsowar"],
  Nandi: ["Kapsabet", "Nandi Hills"],
  Baringo: ["Kabarnet", "Eldama Ravine"],
  "Tharaka Nithi": ["Chuka", "Chogoria"],
  Nyamira: ["Nyamira Town", "Nyansiongo"],
  Nyandarua: ["Ol Kalou", "Engineer", "Ndaragwa"],
  Turkana: ["Lodwar", "Kakuma"],
};

export function townsForCounty(county: string): string[] {
  return TOWNS[county] ?? [];
}

/* --------------------------------- M-Pesa --------------------------------- */

export const SAFETY_ACKNOWLEDGEMENT =
  "I understand that transactions are conducted between buyers and sellers, and I agree to exercise caution when purchasing items.";

export const BUYER_SAFETY_NOTICE = `IMPORTANT: BUYER SAFETY NOTICE

Please exercise caution when buying or selling through this platform. While we provide a space for buyers and sellers to connect, we do not guarantee the authenticity, quality, ownership or condition of listed products.

There is a risk of fraud, scams and misleading advertisements. Always remain vigilant.

- Never send money before verifying the item and seller.
- Whenever possible, inspect items physically before making payment.
- Meet sellers in safe, public or mutually agreed locations.
- Avoid sharing sensitive personal or financial information.
- Be cautious of unusually cheap deals and sellers pressuring you to pay quickly.
- Verify payment confirmations independently.
- Do not rely on screenshots as proof of payment.
- Report suspicious accounts and listings immediately.

Buyers and sellers transact at their own discretion and are responsible for verifying the other party and agreeing on payment, delivery and collection arrangements.`;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: lowest first" },
  { value: "price-desc", label: "Price: highest first" },
] as const;
