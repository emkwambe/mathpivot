"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export type UserResult = { success: boolean; error?: string };

// ============================================================
// UPDATE USER ROLE (admin only)
// ============================================================
const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "tutor", "parent", "student"]),
});

export async function updateUserRole(formData: FormData): Promise<UserResult> {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "super_admin")
  ) {
    return { success: false, error: "Admin access required" };
  }

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { error } = await admin
    .from("users_profile")
    .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

// ============================================================
// UPDATE USER PROFILE (admin only)
// ============================================================
export async function updateUserProfile(
  formData: FormData,
): Promise<UserResult> {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "super_admin")
  ) {
    return { success: false, error: "Admin access required" };
  }

  const userId = formData.get("userId") as string;
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const timezone = formData.get("timezone") as string;

  if (!userId) return { success: false, error: "Missing user ID" };

  const admin = createAdminClient();
  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };
  if (fullName) updates.full_name = fullName;
  if (phone !== null) updates.phone = phone || null;
  if (timezone) updates.timezone = timezone;

  const { error } = await admin
    .from("users_profile")
    .update(updates)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

// ============================================================
// DEACTIVATE USER (admin only — soft delete)
// ============================================================
export async function deactivateUser(userId: string): Promise<UserResult> {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "super_admin")
  ) {
    return { success: false, error: "Admin access required" };
  }

  const admin = createAdminClient();

  // Ban user via Supabase auth
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876000h", // ~100 years
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

// ============================================================
// REACTIVATE USER
// ============================================================
export async function reactivateUser(userId: string): Promise<UserResult> {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "super_admin")
  ) {
    return { success: false, error: "Admin access required" };
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
