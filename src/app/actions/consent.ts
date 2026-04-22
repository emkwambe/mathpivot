"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getPendingConsents,
  getRequiredConsents,
  requestConsent,
  grantConsent,
  hasValidConsent,
} from "@/lib/consent";
import { logConsentEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type ConsentActionResult = {
  success: boolean;
  error?: string;
};

export async function getParentPendingConsents() {
  const user = await getCurrentUser();
  if (!user || user.role !== "parent") return { consents: [], error: null };

  const consents = await getPendingConsents(user.id);
  return { consents, error: null };
}

export async function ensureConsentsRequested(studentUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const required = await getRequiredConsents(studentUserId);

  for (const consentType of required) {
    const alreadyValid = await hasValidConsent(studentUserId, consentType);
    if (!alreadyValid) {
      await requestConsent(studentUserId, user.id, consentType);
    }
  }

  return { success: true };
}

export async function approveConsent(
  consentId: string,
): Promise<ConsentActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "parent") {
    return { success: false, error: "Only parents can approve consents" };
  }

  const result = await grantConsent(consentId, user.id);
  if (!result) {
    return { success: false, error: "Failed to grant consent" };
  }

  // Audit log the consent event
  await logConsentEvent(user.id, "", "account_creation", true, consentId);

  revalidatePath("/parent");
  return { success: true };
}
