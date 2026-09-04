import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureOnboardingRow,
  getMyOnboarding,
} from "@/app/actions/coach-onboarding";
import { createClient } from "@/lib/supabase/server";
import BackgroundCheckForm from "@/components/coach/BackgroundCheckForm";
import CodeOfConductAccept from "@/components/coach/CodeOfConductAccept";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";

export default async function CoachOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/");

  await ensureOnboardingRow();
  const onboarding = await getMyOnboarding();

  const supabase = await createClient();
  const [{ data: profile }, { data: certApp }, { data: certStatus }] =
    await Promise.all([
      supabase
        .from("users_profile")
        .select("full_name, avatar_url, timezone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("certification_applications")
        .select("status, submitted_at, certified_at")
        .eq("coach_id", user.id)
        .eq("tier", "certified")
        .maybeSingle(),
      supabase
        .from("coach_certification_status")
        .select(
          "certified_modules_done, certified_modules_total, certified_eligible",
        )
        .eq("coach_id", user.id)
        .maybeSingle(),
    ]);

  const { welcome } = await searchParams;
  const showWelcome = welcome === "1";

  const profileComplete = Boolean(profile?.full_name);
  const trainingDone = certStatus?.certified_eligible ?? false;
  const certified = certApp?.status === "approved";
  const activated = onboarding?.activated ?? false;

  const steps = [
    {
      key: "profile",
      title: "Complete your profile",
      done: profileComplete,
      body: profileComplete ? (
        <p className="text-sm text-slate-600">
          Signed in as <span className="font-medium">{profile?.full_name}</span>
          . You can update your name, photo, and timezone from Settings.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Add your name and photo so families can see who&apos;s coaching them.
        </p>
      ),
      cta: (
        <Link
          href="/settings"
          className="text-sm text-blue-700 hover:underline font-medium"
        >
          Open settings →
        </Link>
      ),
    },
    {
      key: "background",
      title: "Attest to background check",
      done: onboarding?.background_check_attested ?? false,
      body: onboarding?.background_check_attested ? (
        <p className="text-sm text-slate-600">
          You attested to a background check by{" "}
          <span className="font-medium">
            {onboarding.background_check_provider}
          </span>{" "}
          completed on{" "}
          {onboarding.background_check_completed_on
            ? new Date(
                onboarding.background_check_completed_on,
              ).toLocaleDateString()
            : ""}
          .
          {onboarding.admin_verified_background ? (
            <span className="ml-2 text-emerald-700">
              Admin verification: complete.
            </span>
          ) : (
            <span className="ml-2 text-amber-700">
              Awaiting admin verification.
            </span>
          )}
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-600 mb-3">
            Confirm that you have completed a background check with a recognized
            provider (Checkr, Sterling, GoodHire, or state equivalent) within
            the last twelve months. MathPivot admin will verify separately
            before activation.
          </p>
          <BackgroundCheckForm />
        </>
      ),
    },
    {
      key: "coc",
      title: "Accept the MathPivot Coach Code of Conduct",
      done: onboarding?.code_of_conduct_accepted ?? false,
      body: onboarding?.code_of_conduct_accepted ? (
        <p className="text-sm text-slate-600">
          Accepted on{" "}
          {onboarding.code_of_conduct_accepted_at
            ? new Date(
                onboarding.code_of_conduct_accepted_at,
              ).toLocaleDateString()
            : ""}{" "}
          (version{" "}
          <span className="font-mono">
            {onboarding.code_of_conduct_version}
          </span>
          ).
        </p>
      ) : (
        <CodeOfConductAccept />
      ),
    },
    {
      key: "training",
      title: "Complete Certified Coach training",
      done: trainingDone,
      body: (
        <p className="text-sm text-slate-600">
          {certStatus?.certified_modules_done ?? 0} of{" "}
          {certStatus?.certified_modules_total ?? 10} modules completed.
        </p>
      ),
      cta: (
        <Link
          href="/tutor/training"
          className="text-sm text-blue-700 hover:underline font-medium"
        >
          Continue training →
        </Link>
      ),
    },
    {
      key: "certification",
      title: "Earn Certified Coach status",
      done: certified,
      body: certified ? (
        <p className="text-sm text-slate-600">
          Certified on{" "}
          {certApp?.certified_at
            ? new Date(certApp.certified_at).toLocaleDateString()
            : "recently"}
          .
        </p>
      ) : certApp?.status === "pending" ||
        certApp?.status === "under_review" ? (
        <p className="text-sm text-slate-600">
          Application submitted — awaiting admin review.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Once training is complete, apply for certification from the training
          page.
        </p>
      ),
    },
    {
      key: "activated",
      title: "Activated for student assignment",
      done: activated,
      body: activated ? (
        <p className="text-sm text-emerald-700">
          You&apos;re active. MathPivot admin can now assign you to student
          cohorts.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Once every step above is complete, MathPivot admin will activate you
          for student assignment.
        </p>
      ),
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {showWelcome && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">
              Welcome to MathPivot.
            </p>
            <p className="text-sm text-emerald-800 mt-1">
              This checklist walks you through everything required to start
              coaching students. Take your time — most coaches finish in about a
              week.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Coach Onboarding</h1>
        <p className="text-slate-600 text-sm mt-1">
          {completed} of {steps.length} steps complete.
        </p>
        <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
          <div
            className="bg-blue-700 h-2 rounded-full transition-all"
            style={{
              width: `${Math.round((completed / steps.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <section
            key={step.key}
            className={`rounded-2xl border p-5 ${
              step.done
                ? "bg-emerald-50/30 border-emerald-100"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-semibold text-slate-900 text-sm">
                    {step.title}
                  </h2>
                </div>
                <div className="mt-2">{step.body}</div>
                {step.cta && <div className="mt-3">{step.cta}</div>}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-slate-900 text-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
          Next up
        </p>
        <p className="text-sm">
          {!profileComplete
            ? "Add your name and photo in Settings so families can see who's coaching them."
            : !onboarding?.background_check_attested
              ? "Attest to your background check above."
              : !onboarding?.code_of_conduct_accepted
                ? "Read and accept the MathPivot Coach Code of Conduct."
                : !trainingDone
                  ? "Complete the ten Certified Coach training modules."
                  : !certified
                    ? "Apply for certification from the training page and complete the assessment with an admin."
                    : activated
                      ? "You're ready — MathPivot admin will assign you to a student cohort."
                      : "Awaiting admin activation."}
        </p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <Link
            href="/tutor"
            className="inline-flex items-center gap-1 text-slate-200 hover:text-white"
          >
            Go to coach dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
