"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const PARTNERSHIP_TYPES = [
  "school",
  "district",
  "learning_center",
  "homeschool_coop",
  "professional_org",
  "sports_league",
  "community_org",
  "other",
] as const;

const submitSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  organizationType: z.enum(PARTNERSHIP_TYPES),
  contactName: z.string().min(2, "Contact name is required"),
  contactTitle: z.string().optional(),
  contactEmail: z.string().email("Valid email required"),
  contactPhone: z.string().optional(),
  websiteUrl: z.string().optional(),
  studentCount: z.coerce.number().int().optional(),
  gradeRange: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  interestArea: z.string().optional(),
  timeline: z.string().optional(),
  message: z.string().optional(),
});

export async function submitPartnershipInquiry(
  _prevState: unknown,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const parsed = submitSchema.safeParse({
    organizationName: formData.get("organizationName"),
    organizationType: formData.get("organizationType"),
    contactName: formData.get("contactName"),
    contactTitle: formData.get("contactTitle") || undefined,
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone") || undefined,
    websiteUrl: formData.get("websiteUrl") || undefined,
    studentCount: formData.get("studentCount") || undefined,
    gradeRange: formData.get("gradeRange") || undefined,
    locationCity: formData.get("locationCity") || undefined,
    locationState: formData.get("locationState") || undefined,
    interestArea: formData.get("interestArea") || undefined,
    timeline: formData.get("timeline") || undefined,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { error } = await admin.from("partnerships").insert({
    organization_name: parsed.data.organizationName,
    organization_type: parsed.data.organizationType,
    contact_name: parsed.data.contactName,
    contact_title: parsed.data.contactTitle || null,
    contact_email: parsed.data.contactEmail,
    contact_phone: parsed.data.contactPhone || null,
    website_url: parsed.data.websiteUrl || null,
    student_count: parsed.data.studentCount || null,
    grade_range: parsed.data.gradeRange || null,
    location_city: parsed.data.locationCity || null,
    location_state: parsed.data.locationState
      ? parsed.data.locationState.toUpperCase().slice(0, 2)
      : null,
    interest_area: parsed.data.interestArea || null,
    timeline: parsed.data.timeline || null,
    message: parsed.data.message || null,
  });

  if (error) {
    console.error("[partnerships]", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  await sendEmail({
    to: "mathpivot@mpingo.ai",
    subject: `New Partnership Inquiry: ${parsed.data.organizationName}`,
    html: `<div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#1D4ED8;">New Partnership Inquiry</h2>
      <p><strong>Organization:</strong> ${parsed.data.organizationName} (${parsed.data.organizationType})</p>
      <p><strong>Contact:</strong> ${parsed.data.contactName}${parsed.data.contactTitle ? `, ${parsed.data.contactTitle}` : ""}</p>
      <p><strong>Email:</strong> ${parsed.data.contactEmail}</p>
      ${parsed.data.contactPhone ? `<p><strong>Phone:</strong> ${parsed.data.contactPhone}</p>` : ""}
      ${parsed.data.studentCount ? `<p><strong>Students:</strong> ${parsed.data.studentCount}</p>` : ""}
      ${parsed.data.gradeRange ? `<p><strong>Grades:</strong> ${parsed.data.gradeRange}</p>` : ""}
      ${parsed.data.message ? `<p><strong>Message:</strong><br>${parsed.data.message}</p>` : ""}
      <hr><p><a href="https://mathpivot.com/admin/partnerships">View in admin →</a></p>
    </div>`,
  }).catch((err) => console.error("[partnerships email]", err));

  revalidatePath("/admin/partnerships");
  return { success: true };
}

export async function getPartnerships() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { partnerships: [], error: "Admin access required" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partnerships")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { partnerships: [], error: error.message };
  return { partnerships: data || [], error: null };
}

export async function updatePartnershipStage(id: string, stage: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin access required" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("partnerships")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/partnerships");
  return { success: true };
}
