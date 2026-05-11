import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge, Card, CardContent } from "@/components/ui";
import { getSessionPrepBrief } from "@/app/actions/session-prep";

export default async function SessionPrepPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("sessions")
    .select(
      "id, booking_id, status, booking:bookings!inner(tutor_user_id, student_user_id)",
    )
    .eq("id", sessionId)
    .single();

  if (!session) redirect("/tutor/sessions");

  const booking = session.booking as unknown as {
    tutor_user_id: string;
    student_user_id: string;
  };
  if (booking.tutor_user_id !== user.id) redirect("/tutor/sessions");

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id")
    .eq("student_id", booking.student_user_id)
    .eq("coach_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  const brief = enrollment ? await getSessionPrepBrief(enrollment.id) : null;

  if (!brief) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <Link
          href={`/tutor/sessions/${sessionId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <svg
            className="w-4 h-4"
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
          Back to Session
        </Link>
        <p className="text-slate-500">
          No prep brief available. Enroll the student in a coaching program
          first.
        </p>
      </div>
    );
  }

  const trackColors: Record<string, string> = {
    foundation: "bg-blue-100 text-blue-800",
    acceleration: "bg-amber-100 text-amber-800",
    elite: "bg-purple-100 text-purple-800",
  };

  const masteryLevelColors: Record<string, string> = {
    introduced: "text-yellow-600",
    developing: "text-orange-600",
    proficient: "text-blue-600",
    mastered: "text-green-600",
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Link
        href={`/tutor/sessions/${sessionId}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <svg
          className="w-4 h-4"
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
        Back to Session
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Session Prep Brief
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-slate-600">{brief.studentName}</span>
          <Badge className={trackColors[brief.trackLevel] || "bg-slate-100"}>
            {brief.programName}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {brief.overallMastery}%
            </p>
            <p className="text-xs text-slate-500">Overall Mastery</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {brief.masteredCount}/{brief.totalConcepts}
            </p>
            <p className="text-xs text-slate-500">Concepts Mastered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {brief.practiceStreak}
            </p>
            <p className="text-xs text-slate-500">Practice Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {brief.practiceDaysThisWeek}
            </p>
            <p className="text-xs text-slate-500">Practice This Week</p>
          </CardContent>
        </Card>
      </div>

      {brief.focusAreas.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Focus Areas (Stalled Concepts)
          </h2>
          <div className="space-y-2">
            {brief.focusAreas.map((area) => (
              <div
                key={area.title}
                className="bg-amber-50 border border-amber-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">
                      {area.title}
                    </p>
                    {area.lessonNumber && (
                      <p className="text-xs text-slate-500">
                        Lesson {area.lessonNumber}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${masteryLevelColors[area.currentLevel] || "text-slate-500"}`}
                  >
                    {area.currentLevel}
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1">{area.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {brief.reviewQueue.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Spaced Review Queue
          </h2>
          <div className="space-y-2">
            {brief.reviewQueue.map((item) => (
              <div
                key={item.title}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">
                      {item.title}
                    </p>
                    {item.lessonNumber && (
                      <p className="text-xs text-slate-500">
                        Lesson {item.lessonNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-medium ${masteryLevelColors[item.masteryLevel] || "text-slate-500"}`}
                    >
                      {item.masteryLevel}
                    </span>
                    <p className="text-xs text-slate-400">
                      {item.daysSinceReview}d ago
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {brief.coachNotes && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Last Session Notes
          </h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {brief.coachNotes}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Session Template (60 min)
        </h2>
        <div className="space-y-3">
          {[
            {
              time: "0-5 min",
              phase: "Warm-up",
              desc: "Check in, review homework/practice, set agenda",
            },
            {
              time: "5-15 min",
              phase: "Review",
              desc: "Revisit stalled concepts from focus areas above",
            },
            {
              time: "15-45 min",
              phase: "Core Instruction",
              desc: "Teach new concepts or deepen understanding of developing ones",
            },
            {
              time: "45-55 min",
              phase: "Practice",
              desc: "Guided practice with immediate feedback",
            },
            {
              time: "55-60 min",
              phase: "Wrap-up",
              desc: "Update mastery, assign practice, preview next session",
            },
          ].map((block) => (
            <div key={block.phase} className="flex items-start gap-3">
              <span className="text-xs text-slate-400 font-mono w-20 flex-shrink-0 pt-0.5">
                {block.time}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {block.phase}
                </p>
                <p className="text-xs text-slate-500">{block.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
