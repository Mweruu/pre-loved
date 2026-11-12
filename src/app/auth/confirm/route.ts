import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Handles email confirmation and password-recovery links from Supabase Auth
 * emails. The link carries a token_hash + type; exchanging it establishes
 * the session, then we forward the user on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const allowedTypes = ["signup", "recovery", "magiclink"] as const;
  if (!tokenHash || !type || !allowedTypes.includes(type as (typeof allowedTypes)[number])) {
    return NextResponse.redirect(`${origin}/login?error=invalid-link`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as (typeof allowedTypes)[number],
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=invalid-link`);
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const target =
    type === "recovery"
      ? "/reset-password"
      : `${safeNext}${safeNext.includes("?") ? "&" : "?"}verified=1`;
  return NextResponse.redirect(`${origin}${target}`);
}
