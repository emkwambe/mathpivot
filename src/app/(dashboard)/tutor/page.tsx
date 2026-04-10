import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatDate, formatTime } from "@/lib/utils";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

// Guide level display helpers
const guideLevelInfo: Record<
  string,
  { name: string; coachPercent: number; mentorPercent: number; color: string }
> = {
  GUIDE_I: {
    name: "Guide I",
    coachPercent: 80,
    mentorPercent: 20,
    color: "bg-blue-100 text-blue-800",
  },
  GUIDE_II: {
    name: "Guide II",
    coachPercent: 50,
    mentorPercent: 50,
    color: "bg-purple-100 text-purple-800",
  },
  GUIDE_III: {
    name: "Guide III",
    coachPercent: 20,
    mentorPercent: 80,
    color: "bg-amber-100 text-amber-800",
  },
  GUIDE_SPECIALIST: {
    name: "Specialist",
    coachPercent: 30,
    mentorPercent: 70,
    color: "bg-emerald-100 text-emerald-800",
  },
};

export default async function TutorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const now = new Date();
  const THIRTY_DAYS_AGO = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

  // PARALLEL BATCH: All independent queries at once
  const [
    profileResult,
    studentCountResult,
    todayResult,
    weekResult,
    completedResult,
  ] = await Promise.all([
    supabase
      .from("tutors_profile")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("student_user_id", { count: "exact", head: true })
      .eq("tutor_user_id", authUser.id)
      .gte("start_at", THIRTY_DAYS_AGO)
      .in("status", ["confirmed", "completed"]),
    supabase
      .from("bookings")
      .select(
        "id, start_at, end_at, modality, status, student_user_id, sessions (id, status)",
      )
      .eq("tutor_user_id", authUser.id)
      .gte("start_at", todayStart)
      .lte("start_at", todayEnd)
      .in("status", ["confirmed", "in_progress"])
      .order("start_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, start_at, end_at, modality, status, student_user_id")
      .eq("tutor_user_id", authUser.id)
      .gte("start_at", now.toISOString())
      .lte("start_at", weekEnd)
      .in("status", ["pending", "confirmed"])
      .order("start_at", { ascending: true })
      .limit(10),
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", weekStart)
      .lte("completed_at", weekEnd),
  ]);

  const tutorProfile = profileResult.data;
  const activeStudentCount = studentCountResult.count;
  const todaySessions = todayResult.data;
  const weekSessions = weekResult.data;
  const completedThisWeek = completedResult.count;

  // Single name lookup for all student IDs
  const allStudentIds = new Set([
    ...(todaySessions?.map((b) => b.student_user_id) || []),
    ...(weekSessions?.map((b) => b.student_user_id) || []),
  ]);
  const { data: allStudentNames } =
    allStudentIds.size > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", [...allStudentIds])
      : { data: [] };

  const studentNameMap = new Map(
    allStudentNames?.map((s) => [s.id, s.full_name]) || [],
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome,{" "}
              {
                String(authUser.user_metadata?.full_name || "Tutor").split(
                  " ",
                )[0]
              }
              !
            </h1>
            <p className="text-emerald-100 mt-1">
              {formatDate(now, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/tutor/sessions"
              className="inline-flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              All Sessions
            </Link>
            <Link
              href="/tutor/availability"
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium shadow-sm"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Availability
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Today&apos;s Sessions</p>
                <p className="text-3xl font-bold text-slate-900">
                  {todaySessions?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed This Week</p>
                <p className="text-3xl font-bold text-slate-900">
                  {completedThisWeek || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Upcoming This Week</p>
                <p className="text-3xl font-bold text-slate-900">
                  {weekSessions?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guide Profile Card */}
      {tutorProfile?.guide_level_code && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              Guide Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Guide Level */}
              <div>
                <p className="text-sm text-slate-600 mb-2">Your Guide Level</p>
                <Badge
                  className={`text-base px-3 py-1 ${guideLevelInfo[tutorProfile.guide_level_code]?.color || "bg-slate-100"}`}
                >
                  {guideLevelInfo[tutorProfile.guide_level_code]?.name ||
                    tutorProfile.guide_level}
                </Badge>
                {tutorProfile.guide_certified_at && (
                  <p className="text-xs text-slate-500 mt-2">
                    Certified{" "}
                    {formatDate(tutorProfile.guide_certified_at, "MMM d, yyyy")}
                  </p>
                )}
              </div>

              {/* Coach/Mentor Balance */}
              <div>
                <p className="text-sm text-slate-600 mb-2">Focus Balance</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${guideLevelInfo[tutorProfile.guide_level_code]?.coachPercent || 50}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-600">
                      Coach{" "}
                      {guideLevelInfo[tutorProfile.guide_level_code]
                        ?.coachPercent || 50}
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{
                          width: `${guideLevelInfo[tutorProfile.guide_level_code]?.mentorPercent || 50}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-600">
                      Mentor{" "}
                      {guideLevelInfo[tutorProfile.guide_level_code]
                        ?.mentorPercent || 50}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Capacity */}
              <div>
                <p className="text-sm text-slate-600 mb-2">Student Capacity</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {activeStudentCount || 0}
                  </span>
                  <span className="text-slate-500">
                    / {tutorProfile.max_concurrent_students || 12}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  active students (30 days)
                </p>
              </div>
            </div>

            {/* Eligible Grades */}
            {tutorProfile.eligible_grades &&
              tutorProfile.eligible_grades.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <p className="text-sm text-slate-600 mb-2">Eligible Grades</p>
                  <div className="flex flex-wrap gap-2">
                    {tutorProfile.eligible_grades.map((grade: number) => (
                      <span
                        key={grade}
                        className="px-2 py-1 bg-white rounded text-sm text-slate-700 border border-slate-200"
                      >
                        Grade {grade}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySessions && todaySessions.length > 0 ? (
              <div className="space-y-4">
                {todaySessions.map((booking) => {
                  const session = Array.isArray(booking.sessions)
                    ? booking.sessions[0]
                    : null;
                  const studentName =
                    studentNameMap.get(booking.student_user_id) || "Student";
                  return (
                    <Link
                      key={booking.id}
                      href={session ? `/tutor/sessions/${session.id}` : "#"}
                      className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-900">
                          {studentName}
                        </p>
                        <Badge
                          variant={
                            booking.status === "in_progress"
                              ? "info"
                              : "success"
                          }
                        >
                          {booking.status === "in_progress"
                            ? "In Progress"
                            : "Confirmed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {formatTime(booking.start_at)} -{" "}
                        {formatTime(booking.end_at)}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {booking.modality === "online" ? "Online" : "In Person"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-7 h-7 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-slate-500">
                  No sessions scheduled for today
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Enjoy your free time!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming This Week */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {weekSessions && weekSessions.length > 0 ? (
              <div className="space-y-3">
                {weekSessions.map((booking) => {
                  const studentName =
                    studentNameMap.get(booking.student_user_id) || "Student";
                  return (
                    <div
                      key={booking.id}
                      className="p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-slate-900">
                          {studentName}
                        </p>
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "success"
                              : "warning"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {formatDate(booking.start_at, "EEE, MMM d")} at{" "}
                        {formatTime(booking.start_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-7 h-7 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-slate-500">No upcoming sessions this week</p>
                <Link
                  href="/tutor/availability"
                  className="text-sm text-blue-600 hover:underline font-medium mt-2 inline-block"
                >
                  Update your availability
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
