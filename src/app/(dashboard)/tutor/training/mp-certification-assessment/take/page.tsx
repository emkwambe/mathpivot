import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCoachProgress } from "@/app/actions/training";
import CertifiedAssessmentQuiz from "@/components/coach/CertifiedAssessmentQuiz";

export default async function TakeCertifiedAssessmentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/");

  const { status } = await getCoachProgress();
  // Server-side gate: block quiz entry until Modules 1-9 are done, matching
  // the lock rule in the training UI and startModule action.
  const prereqDone =
    (status?.certifiedModulesDone ?? 0) >=
    Math.max(0, (status?.certifiedModulesTotal ?? 0) - 1);

  if (!prereqDone) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Link
          href="/tutor/training"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Coach Training
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-bold text-amber-900">
            Complete Modules 1–9 first
          </h1>
          <p className="text-sm text-amber-800 mt-2">
            The Certified Coach Assessment unlocks once you have completed all
            nine required Certified modules.
          </p>
          <Link
            href="/tutor/training"
            className="mt-4 inline-flex items-center gap-1 text-blue-700 hover:underline text-sm font-medium"
          >
            Return to training
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <Link
        href="/tutor/training/mp-certification-assessment"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to module
      </Link>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          Certified Coach · 10
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mt-1">
          Certified Coach Assessment
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          15 multiple-choice questions covering the MathPivot Method, mastery,
          diagnostics, parent communication, small-group coaching, and
          professional conduct. Answer every question, then submit to see your
          score.
        </p>
      </div>

      <CertifiedAssessmentQuiz />
    </div>
  );
}
