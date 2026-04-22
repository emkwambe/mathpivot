import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";

export default async function AssessmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assessments } = await supabase
    .from("certification_assessments")
    .select(
      "id, code, title, assessment_type, time_limit_minutes, passing_score, max_score, question_count, is_active, program_id",
    )
    .order("title");

  // Get program names
  const programIds = [...new Set(assessments?.map((a) => a.program_id) || [])];
  const { data: programs } =
    programIds.length > 0
      ? await supabase
          .from("certification_programs")
          .select("id, name")
          .in("id", programIds)
      : { data: [] };
  const programMap = new Map((programs || []).map((p) => [p.id, p.name]));

  // Get attempt counts
  const assessmentIds = assessments?.map((a) => a.id) || [];
  const { data: attemptCounts } =
    assessmentIds.length > 0
      ? await supabase
          .from("assessment_attempts")
          .select("assessment_id")
          .in("assessment_id", assessmentIds)
      : { data: [] };

  const countMap = new Map<string, number>();
  (attemptCounts || []).forEach((a) => {
    countMap.set(a.assessment_id, (countMap.get(a.assessment_id) || 0) + 1);
  });

  const typeColors: Record<string, string> = {
    quiz: "bg-blue-100 text-blue-800",
    timed_challenge: "bg-amber-100 text-amber-800",
    project: "bg-purple-100 text-purple-800",
    demonstration: "bg-green-100 text-green-800",
    portfolio: "bg-indigo-100 text-indigo-800",
    oral_exam: "bg-pink-100 text-pink-800",
    practical: "bg-teal-100 text-teal-800",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/certifications"
          className="text-slate-400 hover:text-slate-600"
        >
          <svg
            className="w-5 h-5"
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
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
          <p className="text-sm text-slate-500">
            {assessments?.length || 0} assessments configured
          </p>
        </div>
      </div>

      {!assessments || assessments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">
            No assessments have been created yet.
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Create assessments through the certification program setup.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {assessment.title}
                  </CardTitle>
                  <Badge
                    className={
                      typeColors[assessment.assessment_type] || "bg-slate-100"
                    }
                  >
                    {assessment.assessment_type.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600">
                    Program: {programMap.get(assessment.program_id) || "—"}
                  </p>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span>{assessment.question_count || 0} questions</span>
                    {assessment.time_limit_minutes && (
                      <span>{assessment.time_limit_minutes} min</span>
                    )}
                    <span>
                      Pass: {assessment.passing_score}/{assessment.max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">
                      {countMap.get(assessment.id) || 0} attempts
                    </span>
                    <Badge
                      variant={assessment.is_active ? "success" : "warning"}
                    >
                      {assessment.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
