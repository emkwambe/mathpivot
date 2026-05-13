import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const application = {
      full_name: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || null,
      education: formData.get("education") as string,
      experience: formData.get("experience") as string,
      tracks: formData.getAll("tracks") as string[],
      availability: formData.get("availability") as string,
      motivation: (formData.get("motivation") as string) || null,
    };

    if (
      !application.full_name ||
      !application.email ||
      !application.experience
    ) {
      return NextResponse.redirect(
        new URL("/careers?error=missing_fields", request.url),
      );
    }

    const supabase = await createClient();

    await supabase.from("leads").insert({
      parent_name: application.full_name,
      parent_email: application.email,
      parent_phone: application.phone,
      source: "coach_application",
      notes: JSON.stringify({
        education: application.education,
        experience: application.experience,
        tracks: application.tracks,
        availability: application.availability,
        motivation: application.motivation,
      }),
      status: "new",
    });

    return NextResponse.redirect(
      new URL("/careers?submitted=true", request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/careers?error=server_error", request.url),
    );
  }
}
