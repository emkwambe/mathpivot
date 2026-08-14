"use client";

import { useState, useTransition, useCallback } from "react";
import {
  getAssessmentQuestions,
  submitAssessment,
} from "@/app/actions/diagnostics";
import type {
  DiagnosticQuestion,
  PlacementResult,
} from "@/app/actions/diagnostics";
import { CheckCircle2, Clock, ArrowRight, RotateCcw } from "lucide-react";

export default function DiagnosticRunner({
  studentId,
  gradeHint,
  onComplete,
  parentEmail,
  parentName,
  studentName,
}: {
  studentId: string;
  gradeHint?: number;
  onComplete?: (result: PlacementResult) => void;
  parentEmail?: string;
  parentName?: string;
  studentName?: string;
}) {
  const [phase, setPhase] = useState<"intro" | "loading" | "active" | "result">(
    "intro",
  );
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const startAssessment = useCallback(() => {
    setPhase("loading");
    startTransition(async () => {
      const qs = await getAssessmentQuestions(gradeHint);
      setQuestions(qs);
      setStartTime(Date.now());
      setPhase("active");
    });
  }, [gradeHint, startTransition]);

  function selectAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  function finishAssessment() {
    startTransition(async () => {
      const durationMinutes = Math.round((Date.now() - startTime) / 60000);
      const placementResult = await submitAssessment(
        studentId,
        answers,
        durationMinutes,
        parentEmail,
        parentName,
        studentName,
        gradeHint,
      );
      if (placementResult) {
        setResult(placementResult);
        setPhase("result");
        onComplete?.(placementResult);
      }
    });
  }

  const domainLabels: Record<string, string> = {
    number_sense: "Number Sense",
    ratios_proportions: "Ratios & Proportions",
    expressions_equations: "Expressions & Equations",
    functions: "Functions",
    geometry: "Geometry",
    statistics: "Statistics & Probability",
    advanced_algebra: "Advanced Algebra",
    trigonometry: "Trigonometry",
  };

  if (phase === "intro") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-blue-700"
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
        <h2 className="text-2xl font-bold text-slate-800">
          MathPivot Diagnostic
        </h2>
        <p className="mt-3 text-slate-600 max-w-sm mx-auto">
          This assessment takes about 15-20 minutes and helps us understand your
          math strengths and where to focus. No grade — just a clear picture.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm mx-auto">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-800">~18</p>
            <p className="text-xs text-slate-500">Questions</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-800">6</p>
            <p className="text-xs text-slate-500">Math Domains</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-800">15-20</p>
            <p className="text-xs text-slate-500">Minutes</p>
          </div>
        </div>
        <button
          onClick={startAssessment}
          disabled={isPending}
          className="mt-8 inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Loading..." : "Start Assessment"}
          {!isPending && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">
            Assessment Complete
          </h2>
          <p className="text-slate-500 mt-1">Here&apos;s what we found.</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-1">
            Recommended Program
          </p>
          <h3 className="text-xl font-bold text-slate-800">
            {result.recommendedProgram}
          </h3>
          {result.programPriceMonthly && result.programCadence && (
            <p className="text-sm text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">
                ${result.programPriceMonthly}/mo
              </span>{" "}
              · {result.programCadence}
            </p>
          )}
          <p className="text-sm text-slate-600 mt-3">
            {result.programDescription}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">
              {result.overallScore}%
            </p>
            <p className="text-xs text-slate-500">Overall Score</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-emerald-700">
              {domainLabels[result.strongestDomain] || result.strongestDomain}
            </p>
            <p className="text-xs text-emerald-600">Strongest</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-amber-700">
              {domainLabels[result.weakestDomain] || result.weakestDomain}
            </p>
            <p className="text-xs text-amber-600">Focus Area</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">
            Domain Breakdown
          </h4>
          <div className="space-y-3">
            {result.domainScores.map((d) => (
              <div key={d.domain}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">
                    {domainLabels[d.domain] || d.domain}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {d.correct}/{d.total} ({d.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      d.percentage >= 80
                        ? "bg-emerald-500"
                        : d.percentage >= 60
                          ? "bg-blue-500"
                          : d.percentage >= 40
                            ? "bg-amber-500"
                            : "bg-red-400"
                    }`}
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isCurrentAnswered = currentQ && answers[currentQ.id];
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-blue-700">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {domainLabels[currentQ?.domain] || currentQ?.domain}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {answeredCount}/{questions.length} answered
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-blue-700 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {currentQ && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">
            {currentQ.question_text}
          </h3>

          <div className="space-y-3">
            {currentQ.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(currentQ.id, choice)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                  answers[currentQ.id] === choice
                    ? "border-blue-700 bg-blue-50 text-blue-900"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      answers[currentQ.id] === choice
                        ? "border-blue-700 bg-blue-700 text-white"
                        : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-sm">{choice}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-blue-700 scale-125"
                  : answers[q.id]
                    ? "bg-blue-300"
                    : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={finishAssessment}
            disabled={!allAnswered || isPending}
            className="px-6 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isPending ? "Scoring..." : "Finish"}
            {!isPending && <CheckCircle2 className="w-4 h-4" />}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            disabled={!isCurrentAnswered}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
