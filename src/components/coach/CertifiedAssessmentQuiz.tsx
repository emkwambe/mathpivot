"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  CERTIFIED_ASSESSMENT_QUESTIONS,
  PASS_THRESHOLD_PERCENT,
  type AssessmentQuestion,
} from "@/lib/training/certified-assessment";
import { submitCertifiedAssessment } from "@/app/actions/training-assessment";
import { submitCertificationApplication } from "@/app/actions/training";
import type { AssessmentResult } from "@/app/actions/training-assessment";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";

// Non-cryptographic shuffle — enough for question order variety on retakes.
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function CertifiedAssessmentQuiz() {
  // Order shuffled once per mount so retakes vary but a coach doesn't
  // lose their place if a question renders again.
  const questions = useMemo(() => shuffle(CERTIFIED_ASSESSMENT_QUESTIONS), []);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  function pick(qid: string, index: number) {
    setAnswers((prev) => ({ ...prev, [qid]: index }));
  }

  function handleSubmit() {
    setSubmitError(null);
    startTransition(async () => {
      const res = await submitCertifiedAssessment(answers);
      if (!res.success) {
        setSubmitError(res.error ?? "Could not submit.");
        return;
      }
      setResult(res);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    });
  }

  function resetForRetake() {
    setAnswers({});
    setResult(null);
  }

  if (result) {
    return <ResultView result={result} onRetake={resetForRetake} />;
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-slate-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="text-sm">
            <span className="font-semibold text-slate-900">
              {answeredCount}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {questions.length}
            </span>{" "}
            answered
          </div>
          <div className="text-xs text-slate-500">
            Pass ≥ {PASS_THRESHOLD_PERCENT}%
          </div>
        </div>
      </div>

      <ol className="space-y-4">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx + 1}
            selectedIndex={answers[q.id]}
            onPick={(i) => pick(q.id, i)}
          />
        ))}
      </ol>

      {submitError && (
        <p className="text-sm text-red-600 text-center">{submitError}</p>
      )}

      <div className="pt-2 pb-8">
        <button
          type="button"
          disabled={!allAnswered || pending}
          onClick={handleSubmit}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-blue-800 disabled:opacity-50"
        >
          {pending
            ? "Scoring…"
            : allAnswered
              ? "Submit assessment"
              : `Answer all ${questions.length} questions to submit`}
        </button>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  selectedIndex,
  onPick,
}: {
  question: AssessmentQuestion;
  index: number;
  selectedIndex: number | undefined;
  onPick: (i: number) => void;
}) {
  return (
    <li className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono text-slate-400">
          Q{String(index).padStart(2, "0")}
        </span>
        <span className="text-[10px] uppercase tracking-wide font-bold text-blue-700">
          {question.topic}
        </span>
      </div>
      <p className="text-sm sm:text-base text-slate-900 font-medium leading-relaxed">
        {question.prompt}
      </p>
      <div className="mt-4 space-y-2">
        {question.choices.map((choice, i) => {
          const chosen = selectedIndex === i;
          return (
            <label
              key={i}
              className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                chosen
                  ? "border-blue-700 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                checked={chosen}
                onChange={() => onPick(i)}
                className="mt-1 h-4 w-4 border-slate-300 text-blue-700 focus:ring-blue-700"
              />
              <span
                className={`text-sm ${chosen ? "text-slate-900" : "text-slate-700"}`}
              >
                {choice}
              </span>
            </label>
          );
        })}
      </div>
    </li>
  );
}

function ResultView({
  result,
  onRetake,
}: {
  result: AssessmentResult;
  onRetake: () => void;
}) {
  const passed = result.passed ?? false;
  const score = result.score ?? 0;
  const correct = result.correctCount ?? 0;
  const total = result.totalCount ?? 0;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border p-6 sm:p-8 text-center ${
          passed
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        {passed ? (
          <Sparkles className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
        ) : (
          <RotateCcw className="w-10 h-10 text-amber-600 mx-auto mb-3" />
        )}
        <h2 className="text-2xl font-bold text-slate-900">
          {passed
            ? "You passed the Certified Coach Assessment."
            : "Not quite yet — you can retake."}
        </h2>
        <p className="text-sm text-slate-700 mt-2">
          You answered <span className="font-semibold">{correct}</span> of{" "}
          <span className="font-semibold">{total}</span> correctly ({score}%).
          Pass threshold is {PASS_THRESHOLD_PERCENT}%.
        </p>
        {passed && <PassNextSteps />}
        {!passed && (
          <button
            type="button"
            onClick={onRetake}
            className="mt-5 inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800"
          >
            Retake the assessment
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Review your answers
        </h3>
        <ol className="divide-y divide-slate-100">
          {result.perQuestion?.map((q, i) => (
            <li key={q.id} className="py-3">
              <div className="flex items-start gap-2">
                {q.correct ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-slate-800 font-medium">
                    Q{i + 1}. {q.prompt}
                  </p>
                  {!q.correct && (
                    <p className="text-xs text-slate-600 mt-1 italic">
                      {q.rationale}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function PassNextSteps() {
  const [pending, startTransition] = useTransition();
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyForCert() {
    setError(null);
    startTransition(async () => {
      const res = await submitCertificationApplication("certified");
      if ((res as { success?: boolean }).success) setApplied(true);
      else setError((res as { error?: string }).error ?? "Could not apply.");
    });
  }

  if (applied) {
    return (
      <div className="mt-5 space-y-3">
        <p className="text-sm text-emerald-800">
          Certification application submitted. Admin will review and grant your
          Certified Coach status.
        </p>
        <Link
          href="/tutor/onboarding"
          className="inline-flex items-center gap-1 text-blue-700 hover:underline text-sm font-medium"
        >
          Back to onboarding
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <button
        type="button"
        onClick={applyForCert}
        disabled={pending}
        className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit certification application"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
