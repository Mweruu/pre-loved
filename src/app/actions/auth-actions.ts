"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  normalizeKenyanPhone,
  firstZodError,
} from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import type { FormState } from "@/lib/form";

function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Safe internal redirect target (prevents open redirects). */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

/* ------------------------------- Registration ----------------------------- */

export async function registerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const hdrs = await headers();
  if (!rateLimit(clientKey("register", hdrs), 10, 60 * 60 * 1000).allowed) {
    return { error: "Too many sign-up attempts. Please try again later." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { name, email, password } = parsed.data;
  const phone = normalizeKenyanPhone(parsed.data.phone)!;

  // Ensure the profile table is free of stale rows for this email.
  const existingProfile = await prisma.profile.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingProfile) {
    return {
      error: "An account with this email already exists. Try signing in instead.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${appOrigin()}/auth/confirm`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return {
        error:
          "An account with this email already exists. Try signing in instead.",
      };
    }
    return { error: `Could not create your account: ${error.message}` };
  }

  const user = data.user;
  if (!user) {
    return { error: "Could not create your account. Please try again." };
  }

  await prisma.profile.create({
    data: {
      id: user.id,
      name,
      email: email.toLowerCase(),
      phone,
      whatsappPhone: phone,
      role: "USER",
    },
  });

  // If the project has email confirmation disabled, the user is signed in now.
  if (data.session) redirect("/dashboard?welcome=1");
  redirect("/verify-email");
}

/* ---------------------------------- Login ---------------------------------- */

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const hdrs = await headers();
  if (!rateLimit(clientKey("login", hdrs), 15, 10 * 60 * 1000).allowed) {
    return { error: "Too many sign-in attempts. Please wait a few minutes." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    if (error?.message === "Email not confirmed") {
      return {
        error:
          "Please verify your email address first — check your inbox for the verification link.",
      };
    }
    return { error: "Incorrect email or password." };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
  });
  if (!profile) {
    return { error: "Your account is incomplete. Please contact support." };
  }
  if (profile.suspended) {
    await supabase.auth.signOut();
    return {
      error: `Your account has been suspended. ${profile.suspensionReason ?? "Contact support for assistance."}`,
    };
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { loginCount: { increment: 1 }, lastLoginAt: new Date() },
  });

  const next = safeNext(formData.get("next"));
  redirect(profile.role === "ADMIN" ? "/admin" : next);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

/* ----------------------------- Password recovery --------------------------- */

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const hdrs = await headers();
  if (!rateLimit(clientKey("forgot", hdrs), 5, 60 * 60 * 1000).allowed) {
    return { error: "Too many reset requests. Please try again later." };
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${appOrigin()}/auth/confirm?next=/reset-password` }
  );

  if (error) {
    return { error: `Could not send the reset email: ${error.message}` };
  }

  return {
    success:
      "If an account exists for that email, a password reset link is on its way. Check your inbox.",
  };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: "This reset link is no longer valid. Request a new one." };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  if (parsed.data.password !== parsed.data.confirm) {
    return { error: "The two passwords do not match." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { error: `Could not update your password: ${error.message}` };

  redirect("/dashboard?password=updated");
}

/* --------------------------- Email / phone verification -------------------- */

export async function resendEmailVerificationAction(
  _prev: FormState,
  _formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) {
    return { error: "Please sign in first, then try again." };
  }
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: data.user.email,
    options: { emailRedirectTo: `${appOrigin()}/auth/confirm` },
  });
  if (error) {
    return { error: `Could not resend the email: ${error.message}` };
  }
  return { success: "Verification email sent — check your inbox." };
}

/**
 * Sends a phone verification OTP.
 * No SMS gateway is configured in this deployment, so the code is surfaced
 * to the user (demo mode) instead of being texted. Wire an SMS provider in
 * production and stop returning demoCode.
 */
export async function sendPhoneOtpAction(
  _prev: FormState,
  _formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please sign in first." };

  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
  });
  if (!profile?.phone) {
    return { error: "Add a phone number in Account settings first." };
  }
  if (profile.phoneVerifiedAt) {
    return { success: "Your phone number is already verified." };
  }

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0]).padStart(
    6,
    "0"
  );
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      phoneOtp: code,
      phoneOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return {
    success: "A 6-digit code has been generated for your number.",
    demoCode: code,
  };
}

export async function confirmPhoneOtpAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please sign in first." };

  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
  });
  if (!profile) return { error: "Account profile not found." };

  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { error: "Enter the 6-digit code." };
  }
  if (!profile.phoneOtp || !profile.phoneOtpExpiresAt) {
    return { error: "No code was requested. Send a new code first." };
  }
  if (profile.phoneOtpExpiresAt < new Date()) {
    return { error: "That code has expired. Send a new one." };
  }
  if (profile.phoneOtp !== code) {
    return { error: "That code is incorrect." };
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { phoneVerifiedAt: new Date(), phoneOtp: null, phoneOtpExpiresAt: null },
  });
  return { success: "Phone verified — nice! Your listings now show a verified badge." };
}
