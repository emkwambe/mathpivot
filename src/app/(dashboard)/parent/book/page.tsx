import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { BookingForm } from "./BookingForm";
import { getSchedulingSuggestions } from "@/lib/scheduling/intelligent-scheduler";

export default async function BookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's family
  const { data: familyMember } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  if (!familyMember) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          No Family Associated
        </h2>
        <p className="text-slate-600">
          You are not associated with a family. Please contact support.
        </p>
      </div>
    );
  }

  // Get family's students (no !inner join — avoids RLS issues)
  const { data: studentProfiles } = await supabase
    .from("students_profile")
    .select("user_id, grade")
    .eq("family_id", familyMember.family_id);

  // Get credit balance
  const { data: creditEntry } = await supabase
    .from("credit_ledger")
    .select("balance_after")
    .eq("family_id", familyMember.family_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const creditBalance = creditEntry?.balance_after || 0;

  // Get active tutors
  const { data: tutorProfiles } = await supabase
    .from("tutors_profile")
    .select("user_id, bio, hourly_rate")
    .eq("is_active", true);

  // Get names separately (avoids !inner join RLS issues)
  const allUserIds = [
    ...(studentProfiles?.map((s) => s.user_id) || []),
    ...(tutorProfiles?.map((t) => t.user_id) || []),
  ];
  const { data: userNames } =
    allUserIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", allUserIds)
      : { data: [] };
  const nameMap = new Map((userNames || []).map((u) => [u.id, u.full_name]));

  const formattedStudents =
    studentProfiles?.map((s) => ({
      id: s.user_id,
      name: nameMap.get(s.user_id) || "Student",
      gradeLevel: s.grade,
    })) || [];

  const formattedTutors =
    tutorProfiles?.map((t) => ({
      id: t.user_id,
      name: nameMap.get(t.user_id) || "Coach",
      bio: t.bio,
      hourlyRateCents: t.hourly_rate,
    })) || [];

  // Get scheduling suggestions for the first student (if any)
  let suggestions: Array<{
    date: string;
    startTime: string;
    endTime: string;
    tutorId: string;
    tutorName: string;
    reason: string;
    score: number;
  }> = [];

  if (formattedStudents.length > 0) {
    try {
      suggestions = await getSchedulingSuggestions(formattedStudents[0].id);
    } catch (error) {
      console.error("Failed to load scheduling suggestions:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/parent"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Book a Session</h1>
          <p className="text-slate-600">
            Schedule a tutoring session for your student
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Available Credits</p>
          <p className="text-2xl font-bold text-blue-600">{creditBalance}</p>
        </div>
      </div>

      {/* Credit Balance Alert */}
      {creditBalance < 1 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-amber-900">
                    No Credits Available
                  </p>
                  <p className="text-sm text-amber-700">
                    You need credits to book sessions.
                  </p>
                </div>
              </div>
              <Link
                href="/parent/credits"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm"
              >
                Purchase Credits
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          {formattedStudents.length === 0 ? (
            <div className="text-center py-8">
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
              <p className="text-slate-500">No students found in your family</p>
              <p className="text-sm text-slate-400 mt-1">
                Please add a student first
              </p>
            </div>
          ) : formattedTutors.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-7 h-7 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-slate-500">
                No tutors are currently available
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Please check back later
              </p>
            </div>
          ) : (
            <BookingForm
              students={formattedStudents}
              tutors={formattedTutors}
              creditBalance={creditBalance}
              initialStudentId={
                formattedStudents.length === 1
                  ? formattedStudents[0].id
                  : undefined
              }
              suggestions={suggestions}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
