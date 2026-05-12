"use client";

import { useState, useTransition } from "react";
import {
  submitSurvey,
  submitSchoolPulse,
  submitCareerInterest,
} from "@/app/actions/surveys";
import type { SurveyTemplate, SurveyQuestion } from "@/app/actions/surveys";

export default function SurveyRunner({
  templates,
  enrollmentId,
  studentId,
}: {
  templates: SurveyTemplate[];
  enrollmentId: string;
  studentId: string;
}) {
  const [activeSurvey, setActiveSurvey] = useState<SurveyTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);

  function handleAnswer(key: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!activeSurvey) return;

    startTransition(async () => {
      let result;

      if (activeSurvey.slug === "school_pulse") {
        result = await submitSchoolPulse(
          studentId,
          enrollmentId,
          (answers.current_topic as string) || "",
        );
      } else if (activeSurvey.slug === "career_interest") {
        result = await submitCareerInterest(
          studentId,
          enrollmentId,
          answers as Record<string, number>,
        );
      } else {
        result = await submitSurvey(
          activeSurvey.id,
          answers,
          enrollmentId,
          studentId,
        );
      }

      if (result.success) {
        setSuccess(activeSurvey.title);
        setActiveSurvey(null);
        setAnswers({});
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  const surveyGroups = {
    session: templates.filter(
      (t) => t.category === "session_checkin" || t.category === "school_pulse",
    ),
    periodic: templates.filter(
      (t) => t.category === "parent_pulse" || t.category === "career_interest",
    ),
  };

  if (activeSurvey) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            {activeSurvey.title}
          </h2>
          <button
            onClick={() => {
              setActiveSurvey(null);
              setAnswers({});
            }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
        {activeSurvey.description && (
          <p className="text-sm text-slate-500 mb-6">
            {activeSurvey.description}
          </p>
        )}

        <div className="space-y-5">
          {activeSurvey.questions.map((q) => (
            <QuestionField
              key={q.key}
              question={q}
              value={answers[q.key]}
              onChange={(v) => handleAnswer(q.key, v)}
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="mt-6 w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Submitting..." : "Submit"}
        </button>
      </div>
    );
  }

  return (
    <div>
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
          {success} submitted successfully.
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Session Surveys
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {surveyGroups.session.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveSurvey(t)}
              className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
            >
              <p className="font-semibold text-slate-900 text-sm">{t.title}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t.questions.length} question
                {t.questions.length !== 1 ? "s" : ""}
                {t.frequency_days
                  ? ` · every ${t.frequency_days} days`
                  : " · per session"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Periodic Surveys
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {surveyGroups.periodic.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveSurvey(t)}
              className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
            >
              <p className="font-semibold text-slate-900 text-sm">{t.title}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t.questions.length} question
                {t.questions.length !== 1 ? "s" : ""}
                {t.frequency_days ? ` · every ${t.frequency_days} days` : ""}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (question.type) {
    case "text":
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {question.label}
          </label>
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );

    case "emoji_scale":
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {question.label}
          </label>
          <div className="flex gap-2">
            {(question.options || []).map((opt) => {
              const emojis: Record<string, string> = {
                low: "😴",
                okay: "😐",
                focused: "🎯",
                fired_up: "🔥",
              };
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={`flex-1 py-3 rounded-lg border text-center transition-colors ${
                    value === opt
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">{emojis[opt] || opt}</span>
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    {opt.replace("_", " ")}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      );

    case "select":
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {question.label}
          </label>
          <div className="flex gap-2">
            {(question.options || []).map((opt) => {
              const icons: Record<string, string> = {
                down: "↓",
                same: "→",
                up: "↑",
                breakthrough: "⚡",
              };
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    value === opt
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {icons[opt] || ""}{" "}
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      );

    case "scale_1_5":
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {question.label}
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-colors ${
                  value === n
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {question.anchors && (
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">
                {question.anchors[0]}
              </span>
              <span className="text-[10px] text-slate-400">
                {question.anchors[1]}
              </span>
            </div>
          )}
        </div>
      );

    case "scale_0_10":
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {question.label}
          </label>
          <div className="flex gap-1">
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`flex-1 py-2 rounded border text-xs font-medium transition-colors ${
                  value === n
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {question.anchors && (
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">
                {question.anchors[0]}
              </span>
              <span className="text-[10px] text-slate-400">
                {question.anchors[1]}
              </span>
            </div>
          )}
        </div>
      );

    case "enjoy_scale":
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Would you enjoy: {question.label}
          </label>
          <div className="flex gap-2">
            {[
              { value: 0, label: "No" },
              { value: 1, label: "Maybe" },
              { value: 2, label: "Yes!" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  value === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {question.label}
          </label>
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      );
  }
}
