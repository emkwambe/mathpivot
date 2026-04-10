"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// ============================================================
// SCHEMAS
// ============================================================
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name is required"),
  role: z.enum(["parent", "tutor", "student"]).default("parent"),
});

// ============================================================
// GENERIC ERROR MESSAGES — never leak "wrong password" vs "no account"
// ============================================================
const GENERIC_AUTH_ERROR =
  "Invalid credentials. Please check your email and password.";
const RATE_LIMIT_ERROR = "Too many attempts. Please try again later.";

// ============================================================
// HELPERS
// ============================================================
async function getClientIdentifier(): Promise<string> {
  try {
    const hdrs = await headers();
    return (
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts = 5,
  windowMinutes = 15
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_action: action,
      p_max_attempts: maxAttempts,
      p_window_minutes: windowMinutes,
    });
    if (error) {
      console.error("[rate-limit]", error.message);
      return { allowed: false }; // fail closed — deny on error
    }
    return { allowed: data.allowed, retryAfterSeconds: data.retry_after_seconds };
  } catch (err) {
    console.error("[rate-limit] unexpected:", err);
    return { allowed: true };
  }
}

// ============================================================
// SIGN OUT — keeps backward compat with DashboardLayout
// ============================================================
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// Alias for new pages
export { signOut as logoutAction };

// ============================================================
// LOGIN
// ============================================================
export async function loginAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string; retryAfterSeconds?: number }> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) return { error: GENERIC_AUTH_ERROR };

  const ip = await getClientIdentifier();
  const rateCheck = await checkRateLimit(
    `${ip}:${parsed.data.email.toLowerCase()}`,
    "login",
    5,
    15
  );
  if (!rateCheck.allowed)
    return { error: RATE_LIMIT_ERROR, retryAfterSeconds: rateCheck.retryAfterSeconds };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.error("[login]", error.message);
    return { error: GENERIC_AUTH_ERROR };
  }

  revalidatePath("/", "layout");
  return { redirectTo: "/" };
}

// ============================================================
// SIGNUP
// ============================================================
export async function signupAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string; success?: string; retryAfterSeconds?: number }> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    full_name: formData.get("full_name") as string,
    role: (formData.get("role") as string) || "parent",
  };

  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success)
    return { error: parsed.error.issues[0].message };

  const ip = await getClientIdentifier();
  const rateCheck = await checkRateLimit(ip, "signup", 3, 60);
  if (!rateCheck.allowed)
    return { error: RATE_LIMIT_ERROR, retryAfterSeconds: rateCheck.retryAfterSeconds };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, role: parsed.data.role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("[signup]", error.message);
    return { error: "Unable to create account. Please try again." };
  }

  // DB trigger handle_new_parent_family auto-creates family for parent role
  return { success: "Check your email to confirm your account." };
}

// ============================================================
// PASSWORD RESET REQUEST
// ============================================================
export async function requestPasswordResetAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean }> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  if (!email || !z.string().email().safeParse(email).success)
    return { success: true }; // prevent enumeration

  const ip = await getClientIdentifier();
  const rateCheck = await checkRateLimit(ip, "password_reset", 3, 60);
  if (!rateCheck.allowed) return { success: true }; // prevent enumeration

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
  });

  return { success: true };
}

// ============================================================
// UPDATE PASSWORD (after reset link click)
// ============================================================
export async function updatePasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get("password") as string;
  if (!password || password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[update-password]", error.message);
    return { error: "Failed to update password. The link may have expired." };
  }

  revalidatePath("/", "layout");
  redirect("/login?message=password-updated");
}

