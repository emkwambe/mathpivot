import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function SmartCoachDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    { data: enrollments },
    { data: trainingProgress },
    { count: trainingTotal },
    { data: recentSurveys },
    { data: diagnostics },
  ] = await Promise.all([
    supabase
      .from("program_enrollments")
      .select("id, student_id, program_id, status, onboarding_status, coach_id")
      .eq("coach_id", user.id)
      .in("status", ["active", "paused"]),
    supabase
      .from("coach_training_progress")
      .select("id")
      .eq("coach_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("training_modules")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("certification_tier", "certified"),
    supabase
      .from("survey_responses")
      .select("id, completed_at")
      .eq("respondent_id", user.id)
      .gte("completed_at", sevenDaysAgo),
    supabase
      .from("diagnostic_assessments")
      .select("id, student_id")
      .eq("administered_by", user.id)
      .gte("completed_at", thirtyDaysAgo),
  ]);

  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))];
  const activeEnrollments = (enrollments || []).filter(
    (e) => e.status === "active",
  );
  const needsOnboarding = activeEnrollments.filter(
    (e) => e.onboarding_status !== "completed",
  );

  const [{ data: students }, { data: academicProfiles }, { data: mastery }] =
    await Promise.all([
      studentIds.length > 0
        ? supabase
            .from("users_profile")
            .select("id, full_name")
            .in("id", studentIds)
        : { data: [] as { id: string; full_name: string }[] },
      studentIds.length > 0
        ? supabase
            .from("student_academic_profiles")
            .select("student_id, school_current_topic, school_topic_updated_at")
            .in("student_id", studentIds)
        : { data: [] },
      studentIds.length > 0
        ? supabase
            .from("student_concept_mastery")
            .select("student_id, mastery_level")
            .in("student_id", studentIds)
        : { data: [] },
    ]);

  const studentMap = new Map((students || []).map((s) => [s.id, s.full_name]));

  const assessedStudents = new Set(
    (diagnostics || []).map((d) => d.student_id),
  );
  const unassessedStudents = studentIds.filter(
    (id) => !assessedStudents.has(id),
  );

  const staleTopics = (academicProfiles || []).filter((p) => {
    if (!p.school_topic_updated_at) return true;
    const daysSince = Math.floor(
      (now.getTime() - new Date(p.school_topic_updated_at).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return daysSince >= 14;
  });

  const masteryByStudent = new Map<
    string,
    { total: number; proficient: number }
  >();
  for (const m of mastery || []) {
    const c = masteryByStudent.get(m.student_id) || { total: 0, proficient: 0 };
    c.total++;
    if (m.mastery_level === "mastered" || m.mastery_level === "proficient")
      c.proficient++;
    masteryByStudent.set(m.student_id, c);
  }

  const trainingDone = (trainingProgress || []).length;
  const trainingNeeded = trainingTotal || 10;
  const trainingPct =
    trainingNeeded > 0 ? Math.round((trainingDone / trainingNeeded) * 100) : 0;

  const firstName = String(user.user_metadata?.full_name || "Coach").split(
    " ",
  )[0];

  const actionItems: {
    label: string;
    href: string;
    priority: "high" | "medium" | "low";
    count?: number;
  }[] = [];

  if (needsOnboarding.length > 0) {
    actionItems.push({
      label: "Students need onboarding",
      href: "/tutor/portfolio",
      priority: "high",
      count: needsOnboarding.length,
    });
  }
  if (unassessedStudents.length > 0) {
    actionItems.push({
      label: "Students need diagnostic",
      href: "/tutor/diagnostics",
      priority: "high",
      count: unassessedStudents.length,
    });
  }
  if (trainingPct < 100) {
    actionItems.push({
      label: "Continue coach training",
      href: "/tutor/training",
      priority: trainingPct < 50 ? "high" : "medium",
    });
  }
  if (staleTopics.length > 0) {
    actionItems.push({
      label: "School pulse needs update",
      href: "/tutor/surveys",
      priority: "medium",
      count: staleTopics.length,
    });
  }
  if ((recentSurveys || []).length === 0 && studentIds.length > 0) {
    actionItems.push({
      label: "No check-ins this week",
      href: "/tutor/surveys",
      priority: "medium",
    });
  }

  const priorityColors = {
    high: "bg-red-50 border-red-200 text-red-800",
    medium: "bg-amber-50 border-amber-200 text-amber-800",
    low: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {firstName}!</h1>
            <p className="text-blue-200 mt-1">
              {formatDate(now, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/tutor/portfolio"
              className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors text-sm"
            >
              My Portfolio
            </Link>
            <Link
              href="/tutor/sessions"
              className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-medium shadow-sm text-sm"
            >
              Sessions
            </Link>
          </div>
        </div>
      </div>

      {actionItems.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
            Action Items
          </h2>
          <div className="space-y-2">
            {actionItems.map((item) => (
              <Link key={item.label} href={item.href} className="block">
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border ${priorityColors[item.priority]} transition-colors hover:opacity-80`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.priority === "high"
                          ? "bg-red-500"
                          : item.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.count && (
                      <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    )}
                    <svg
                      className="w-4 h-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {activeEnrollments.length}
            </p>
            <p className="text-xs text-slate-500">Active Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {(recentSurveys || []).length}
            </p>
            <p className="text-xs text-slate-500">Check-ins This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {(diagnostics || []).length}
            </p>
            <p className="text-xs text-slate-500">Diagnostics (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{trainingPct}%</p>
            <p className="text-xs text-slate-500">Training Complete</p>
          </CardContent>
        </Card>
      </div>

      {trainingPct < 100 && (
        <Link href="/tutor/training" className="block">
          <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 text-sm">
                Coach Certification Progress
              </h3>
              <span className="text-xs text-slate-400">
                {trainingDone}/{trainingNeeded} modules
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-blue-700 h-2.5 rounded-full transition-all"
                style={{ width: `${trainingPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {trainingPct === 0
                ? "Start your MathPivot Method training to get certified."
                : trainingPct < 50
                  ? "Keep going — you're building your coaching foundation."
                  : trainingPct < 100
                    ? "Almost there — finish to unlock certification."
                    : "Complete! Apply for certification."}
            </p>
          </div>
        </Link>
      )}

      {studentIds.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
            Student Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {studentIds.slice(0, 6).map((sid) => {
              const name = studentMap.get(sid) || "Student";
              const mData = masteryByStudent.get(sid);
              const masteryPct =
                mData && mData.total > 0
                  ? Math.round((mData.proficient / mData.total) * 100)
                  : 0;
              const hasAssessment = assessedStudents.has(sid);
              const enrollment = activeEnrollments.find(
                (e) => e.student_id === sid,
              );
              const needsOnboard =
                enrollment && enrollment.onboarding_status !== "completed";

              return (
                <div
                  key={sid}
                  className="bg-white border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">
                        {name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {needsOnboard && (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                          Onboard
                        </Badge>
                      )}
                      {!hasAssessment && (
                        <Badge className="bg-red-100 text-red-700 text-[10px]">
                          No Dx
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${masteryPct >= 80 ? "bg-emerald-500" : masteryPct >= 50 ? "bg-blue-500" : masteryPct > 0 ? "bg-amber-500" : "bg-slate-200"}`}
                        style={{ width: `${masteryPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">
                      {masteryPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/tutor/diagnostics"
          className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors text-center"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-5 h-5 text-blue-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Diagnostics</h3>
          <p className="text-xs text-slate-500 mt-1">Assess students</p>
        </Link>
        <Link
          href="/tutor/surveys"
          className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors text-center"
        >
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-5 h-5 text-emerald-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Check-ins</h3>
          <p className="text-xs text-slate-500 mt-1">Session surveys</p>
        </Link>
        <Link
          href="/tutor/whiteboards"
          className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors text-center"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-5 h-5 text-purple-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Whiteboard</h3>
          <p className="text-xs text-slate-500 mt-1">Math tools</p>
        </Link>
      </div>
    </div>
  );
}
