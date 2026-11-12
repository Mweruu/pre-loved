"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  normalizeKenyanPhone,
  firstZodError,
} from "@/lib/validation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/form";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeKenyanPhone(v) !== null, {
      message: "Enter a valid Kenyan mobile number, e.g. 0712 345 678",
    }),
  whatsappPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  county: z.string().trim().max(40).optional().or(z.literal("")),
  town: z.string().trim().max(60).optional().or(z.literal("")),
});

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { profile } = await requireUser("/dashboard/account");

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    whatsappPhone: formData.get("whatsappPhone") || "",
    county: formData.get("county") || "",
    town: formData.get("town") || "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const phone = normalizeKenyanPhone(parsed.data.phone)!;
  const whatsapp = parsed.data.whatsappPhone
    ? normalizeKenyanPhone(parsed.data.whatsappPhone)
    : phone;

  // Changing the phone invalidates previous phone verification.
  const phoneChanged = phone !== profile.phone;

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      name: parsed.data.name,
      phone,
      whatsappPhone: whatsapp ?? phone,
      county: parsed.data.county || null,
      town: parsed.data.town || null,
      ...(phoneChanged
        ? { phoneVerifiedAt: null, phoneOtp: null, phoneOtpExpiresAt: null }
        : {}),
    },
  });

  revalidatePath("/dashboard/account");
  return {
    success: phoneChanged
      ? "Profile updated. Since your phone number changed, verify it again to display the verified badge."
      : "Profile updated.",
  };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirm: z.string(),
});

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { authUser } = await requireUser("/dashboard/account");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  if (parsed.data.newPassword !== parsed.data.confirm) {
    return { error: "The new passwords do not match." };
  }

  // Verify the current password via Supabase sign-in.
  const { createSupabaseServerClient } = await import(
    "@/lib/supabase/server"
  );
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: authUser.email!,
    password: parsed.data.currentPassword,
  });
  if (error) {
    return { error: "Your current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (updateError) {
    return { error: `Could not change password: ${updateError.message}` };
  }

  return { success: "Password changed successfully." };
}
