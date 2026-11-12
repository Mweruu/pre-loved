import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Reads a single value from a Next.js searchParams entry. */
export function param(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Reads all values (for repeatable params like ?condition=GOOD&condition=FAIR). */
export function paramList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

/** Builds a query string from params, dropping empty values. */
export function buildQuery(
  params: Record<string, string | number | undefined>,
  extra: Record<string, string[]> = {}
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== null) {
      sp.set(key, String(value));
    }
  }
  for (const [key, values] of Object.entries(extra)) {
    for (const v of values) if (v) sp.append(key, v);
  }
  const str = sp.toString();
  return str ? `?${str}` : "";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}
