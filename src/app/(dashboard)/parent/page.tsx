import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatDateTime, formatDate } from "@/lib/utils";

export default async function ParentDashboardPage() {
  // Layout already calls requireRole — just get user + client
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  // Get family info (required for everything else)
  const { data: familyMember } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", authUser.id)
    .single();

  const familyId = familyMember?.family_id;

  // PARALLEL: All family-dependent queries at once
  const [studentsResult, creditResult, bookingsResult, sessionsResult] =
    await Promise.all([
      supabase
        .from("students_profile")
        .select(
          "user_id, grade, course_track, users_profile!inner (full_name, avatar_url)",
        )
        .eq("family_id", familyId || ""),
      supabase
        .from("credit_ledger")
        .select("balance_after")
        .eq("family_id", familyId || "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("bookings")
        .select(
          "id, start_at, end_at, modality, status, student_user_id, tutors_profile!inner (users_profile!inner (full_name))",
        )
        .eq("family_id", familyId || "")
        .in("status", ["pending", "confirmed"])
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(5),
      supabase
        .from("sessions")
        .select("id, parent_summary, completed_at, booking_id")
        .eq("status", "completed")
        .not("parent_summary", "is", null)
        .order("completed_at", { ascending: false })
        .limit(3),
    ]);

  const students = studentsResult.data;
  const creditBalance = creditResult.data?.balance_after || 0;
  const upcomingBookings = bookingsResult.data;
  const recentSessions = sessionsResult.data;

  // Single query for booking student names
  const studentIds = upcomingBookings?.map((b) => b.student_user_id) || [];
  const { data: studentNames } =
    studentIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] };

  const studentNameMap = new Map(
    studentNames?.map((s) => [s.id, s.full_name]) || [],
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back,{" "}
              {
                String(authUser.user_metadata?.full_name || "Parent").split(
                  " ",
                )[0]
              }
              !
            </h1>
            <p className="text-blue-100 mt-1">
              Here&apos;s what&apos;s happening with your family&apos;s
              tutoring.
            </p>
          </div>
          <Link
            href="/parent/book"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium shadow-sm"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Book a Session
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Available Credits</p>
                <p className="text-3xl font-bold text-slate-900">
                  {creditBalance}
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <Link
              href="/parent/credits"
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              Purchase more credits
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Upcoming Sessions</p>
                <p className="text-3xl font-bold text-slate-900">
                  {upcomingBookings?.length || 0}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <Link
              href="/parent/book"
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              Schedule a session
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Students</p>
                <p className="text-3xl font-bold text-slate-900">
                  {students?.length || 0}
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Students</CardTitle>
          </CardHeader>
          <CardContent>
            {students && students.length > 0 ? (
              <div className="space-y-4">
                {students.map((student) => {
                  const profile = student.users_profile as unknown as {
                    full_name: string;
                    avatar_url: string | null;
                  };
                  return (
                    <Link
                      key={student.user_id}
                      href={`/parent/students/${student.user_id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {profile.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {profile.full_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            Grade {student.grade} •{" "}
                            {student.course_track
                              .replace("_", " ")
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-slate-400"
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <p className="text-slate-500">No students in your family yet</p>
                <a
                  href="/parent/add-student"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                >
                  + Add your first student
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings && upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => {
                  const tutorProfile = booking.tutors_profile as unknown as {
                    users_profile: { full_name: string };
                  };
                  const studentName =
                    studentNameMap.get(booking.student_user_id) || "Student";
                  return (
                    <div
                      key={booking.id}
                      className="p-3 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-2">
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
                        with {tutorProfile.users_profile.full_name}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDateTime(booking.start_at)} •{" "}
                        {booking.modality === "online" ? "Online" : "In Person"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-7 h-7 text-green-400"
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
                <p className="text-slate-500">No upcoming sessions scheduled</p>
                <Link
                  href="/parent/book"
                  className="text-sm text-blue-600 hover:underline font-medium mt-2 inline-block"
                >
                  Book your first session
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Session Summaries */}
      {recentSessions && recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Session Summaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-900">
                      Session Summary
                    </p>
                    <p className="text-sm text-slate-500">
                      {session.completed_at
                        ? formatDate(session.completed_at)
                        : ""}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {session.parent_summary}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
