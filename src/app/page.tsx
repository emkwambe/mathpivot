import { createClient } from "@/lib/supabase/server";
import LandingPageClient from "./landing-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MathPivot – Sports builds character. MathPivot builds careers.",
  description:
    "The academic performance system that applies athletic-level coaching, structured programs, and mastery tracking to prepare students for high-impact careers. Named coaches. Measurable outcomes. Mathathlon competitions.",
  openGraph: {
    images: ["/og-image.png"],
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return <LandingPageClient />;
}
