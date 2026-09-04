import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrInitEntry } from "@/app/actions/school-strategy";
import SchoolStrategyChecklist from "@/components/coach/SchoolStrategyChecklist";
import { currentWeekOf } from "@/lib/school-strategy/schema";

export default async function SchoolStrategyPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { studentId } = await params;
  const { week } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/");

  const weekOf = week || currentWeekOf();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users_profile")
    .select("full_name, email")
    .eq("id", studentId)
    .maybeSingle();

  if (!profile) return notFound();

  const entry = await getOrInitEntry(studentId, weekOf);
  if (!entry) return notFound();

  return (
    <div>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-0">
        <Link
          href="/tutor/students"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to students
        </Link>
      </div>
      <SchoolStrategyChecklist
        studentId={studentId}
        studentName={profile.full_name || profile.email || "Student"}
        weekOf={weekOf}
        initial={{
          data: entry.data,
          status: entry.status,
          nextReviewDate: entry.next_review_date,
          coachNotes: entry.coach_notes,
        }}
      />
    </div>
  );
}
