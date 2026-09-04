"use client";

import { useState, useTransition } from "react";
import {
  FAMILY_UPDATE_LABELS,
  STATUS_LABELS,
  type FamilyUpdateSignal,
  type SchoolStrategyPayload,
  type StrategyStatus,
} from "@/lib/school-strategy/schema";
import { saveEntry } from "@/app/actions/school-strategy";
import { CheckCircle2, Save } from "lucide-react";

type SectionKey = Exclude<keyof SchoolStrategyPayload, "section8">;

interface CheckItem<K extends SectionKey> {
  key: keyof SchoolStrategyPayload[K];
  label: string;
}

// Each section's checkbox rows, in display order.
const SECTIONS: Array<{
  key: SectionKey;
  number: number;
  title: string;
  items: CheckItem<SectionKey>[];
  coachNote?: string;
  strategyOutcome?: string;
}> = [
  {
    key: "section1",
    number: 1,
    title: "School and Course Profile",
    items: [
      { key: "school_confirmed", label: "Confirm the student's school" },
      { key: "grade_recorded", label: "Record the current grade level" },
      {
        key: "course_confirmed",
        label: "Confirm the exact mathematics course",
      },
      {
        key: "teacher_recorded",
        label: "Record the teacher's name when provided",
      },
      {
        key: "curriculum_identified",
        label: "Identify the curriculum or textbook, if known",
      },
      { key: "unit_recorded", label: "Record the current unit or chapter" },
      {
        key: "grading_periods_identified",
        label: "Identify the school's grading periods",
      },
      {
        key: "exam_recorded",
        label: "Record any applicable state or end-of-course examination",
      },
    ] as CheckItem<SectionKey>[],
    coachNote:
      "Use information provided by the student, family, or participating school. Do not assume that two schools teach the same course in the same order.",
  },
  {
    key: "section2",
    number: 2,
    title: "Current Classroom Position",
    items: [
      {
        key: "current_concepts_identified",
        label: "Identify the concepts currently being taught",
      },
      {
        key: "recent_topic_recorded",
        label: "Record the most recently completed topic",
      },
      {
        key: "next_topic_identified",
        label: "Identify the next expected topic",
      },
      {
        key: "recent_work_reviewed",
        label: "Review recent assignments, quizzes, or tests when available",
      },
      { key: "upcoming_dates_noted", label: "Note upcoming assessment dates" },
      {
        key: "missing_work_identified",
        label: "Identify missing or incomplete work affecting current progress",
      },
      {
        key: "grade_recorded",
        label:
          "Record the student's current course grade when voluntarily shared",
      },
      {
        key: "student_perception_captured",
        label:
          "Ask the student to describe what currently feels easy or difficult",
      },
    ] as CheckItem<SectionKey>[],
    strategyOutcome:
      "The coach should understand where the student is now, what is coming next, and which obstacles require immediate attention.",
  },
  {
    key: "section3",
    number: 3,
    title: "Essential Gap Check",
    items: [
      {
        key: "prereq_gaps_identified",
        label: "Identify prerequisite gaps affecting the current unit",
      },
      {
        key: "foundational_vs_temporary",
        label: "Separate foundational gaps from temporary mistakes",
      },
      {
        key: "gaps_prioritized",
        label: "Prioritize gaps that block current learning",
      },
      {
        key: "two_priorities_selected",
        label: "Select no more than two immediate gap-repair priorities",
      },
      {
        key: "inside_session_feasibility",
        label:
          "Determine whether each gap can be addressed inside regular sessions",
      },
      {
        key: "escalated_if_needed",
        label: "Escalate significant gaps for a revised learning plan",
      },
      {
        key: "evidence_recorded",
        label: "Record the evidence used to identify each gap",
      },
    ] as CheckItem<SectionKey>[],
    coachNote:
      "Gap repair should be targeted. Do not allow old gaps to consume every session while the student continues falling behind in the current course.",
  },
  {
    key: "section4",
    number: 4,
    title: "Stay-Ahead Plan",
    items: [
      {
        key: "next_concept_identified",
        label: "Identify the next concept in the school sequence",
      },
      {
        key: "prerequisites_secure",
        label: "Confirm that required prerequisites are sufficiently secure",
      },
      {
        key: "preview_activity_selected",
        label: "Select an appropriate preview activity",
      },
      {
        key: "vocabulary_introduced",
        label: "Introduce essential vocabulary and representations",
      },
      {
        key: "example_provided",
        label: "Provide one accessible preview example",
      },
      {
        key: "initial_understanding_recorded",
        label: "Record the student's initial understanding",
      },
      {
        key: "deeper_practice_scheduled",
        label: "Schedule deeper instruction or practice where appropriate",
      },
    ] as CheckItem<SectionKey>[],
    strategyOutcome:
      "Help the student enter upcoming classroom lessons with familiarity and confidence. Previewing is preparation, not an attempt to replace the classroom teacher.",
  },
  {
    key: "section5",
    number: 5,
    title: "Assessment Readiness",
    items: [
      {
        key: "date_material_confirmed",
        label: "Confirm the assessment date and covered material",
      },
      {
        key: "study_guide_reviewed",
        label: "Review the teacher's study guide when available",
      },
      {
        key: "additional_practice_identified",
        label: "Identify concepts likely to require additional practice",
      },
      {
        key: "procedural_and_reasoning",
        label: "Include both procedural and reasoning questions",
      },
      {
        key: "realistic_conditions",
        label: "Practice under realistic time or format conditions when useful",
      },
      { key: "errors_reviewed", label: "Review errors and misconceptions" },
      {
        key: "independent_readiness_confirmed",
        label: "Confirm the student's independent readiness",
      },
      {
        key: "post_reflection_recorded",
        label: "Record any post-assessment reflection",
      },
    ] as CheckItem<SectionKey>[],
    coachNote:
      "MathPivot prepares students by strengthening understanding. Coaches must not obtain, reproduce, or use unauthorized assessment materials.",
  },
  {
    key: "section6",
    number: 6,
    title: "Classroom Habits and Independence",
    items: [
      {
        key: "understands_assignments",
        label: "Confirm that the student understands current assignments",
      },
      {
        key: "organization_checked",
        label: "Check organization and assignment-tracking habits",
      },
      {
        key: "late_work_pattern_identified",
        label: "Identify patterns of incomplete or late work",
      },
      {
        key: "help_seeking_discussed",
        label: "Discuss how the student asks for help at school",
      },
      {
        key: "reasoning_practice",
        label: "Practice explaining mathematical reasoning",
      },
      {
        key: "weekly_action_set",
        label: "Establish one student-owned action for the coming week",
      },
      {
        key: "previous_action_reviewed",
        label: "Review the previous action before setting another",
      },
      {
        key: "independence_recognized",
        label: "Recognize improvement in independence, not only grades",
      },
    ] as CheckItem<SectionKey>[],
    strategyOutcome:
      "Each cycle should reduce unnecessary dependence on the coach.",
  },
  {
    key: "section7",
    number: 7,
    title: "School Alignment Boundaries",
    items: [
      {
        key: "authorized_info_only",
        label: "Use only authorized school information",
      },
      {
        key: "source_and_date_recorded",
        label: "Record the source and date of pacing information",
      },
      {
        key: "provisional_marked",
        label: "Mark unconfirmed information as provisional",
      },
      {
        key: "no_official_estimates",
        label: "Avoid presenting estimates as official school plans",
      },
      {
        key: "no_unauthorized_contact",
        label: "Do not contact school staff without proper authorization",
      },
      {
        key: "no_graded_work_completion",
        label: "Do not complete graded work for the student",
      },
      {
        key: "information_protected",
        label: "Protect student, teacher, and school information",
      },
      {
        key: "integrity_escalated",
        label: "Escalate safeguarding or academic-integrity concerns",
      },
    ] as CheckItem<SectionKey>[],
    coachNote:
      "MathPivot complements the school's work. It does not speak on behalf of the school, evaluate teachers, or guarantee a particular grade or test result.",
  },
];

const SECTION9_ITEMS: CheckItem<"section9">[] = [
  {
    key: "addresses_school_needs",
    label: "The plan addresses the student's current school needs",
  },
  {
    key: "meaningful_learning",
    label: "The plan includes meaningful mathematical learning",
  },
  {
    key: "realistic_workload",
    label: "The workload is realistic for the available session time",
  },
  {
    key: "matches_mastery",
    label: "Activities match the student's current mastery evidence",
  },
  {
    key: "student_has_role",
    label: "The student has an active role in the plan",
  },
  {
    key: "not_homework_completion",
    label: "The session does not become homework completion",
  },
  {
    key: "next_review_scheduled",
    label: "The next review date has been scheduled",
  },
];

interface Props {
  studentId: string;
  studentName: string;
  weekOf: string;
  initial: {
    data: SchoolStrategyPayload;
    status: StrategyStatus;
    nextReviewDate: string | null;
    coachNotes: string | null;
  };
}

export default function SchoolStrategyChecklist({
  studentId,
  studentName,
  weekOf,
  initial,
}: Props) {
  const [data, setData] = useState<SchoolStrategyPayload>(initial.data);
  const [status, setStatus] = useState<StrategyStatus>(initial.status);
  const [nextReviewDate, setNextReviewDate] = useState<string>(
    initial.nextReviewDate ?? "",
  );
  const [coachNotes, setCoachNotes] = useState<string>(
    initial.coachNotes ?? "",
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle<K extends SectionKey>(
    sectionKey: K,
    fieldKey: keyof SchoolStrategyPayload[K],
  ) {
    setData((prev) => {
      const section = { ...(prev[sectionKey] as Record<string, boolean>) };
      section[fieldKey as string] = !section[fieldKey as string];
      return { ...prev, [sectionKey]: section };
    });
  }

  function toggle9(fieldKey: keyof SchoolStrategyPayload["section9"]) {
    setData((prev) => {
      const section = { ...(prev.section9 as Record<string, boolean>) };
      section[fieldKey as string] = !section[fieldKey as string];
      return { ...prev, section9: section };
    });
  }

  function updateSection8<K extends keyof SchoolStrategyPayload["section8"]>(
    field: K,
    value: SchoolStrategyPayload["section8"][K],
  ) {
    setData((prev) => ({
      ...prev,
      section8: { ...prev.section8, [field]: value },
    }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveEntry({
        studentId,
        weekOf,
        data,
        status,
        nextReviewDate: nextReviewDate || null,
        coachNotes: coachNotes || null,
      });
      if (res.success) setSavedAt(new Date());
      else setError(res.error ?? "Save failed");
    });
  }

  const completionUnlocked =
    !!data.section8.school_focus &&
    !!data.section8.gap_to_repair &&
    !!data.section8.concept_to_preview &&
    !!data.section8.evidence_to_collect;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          School Strategy Checklist
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          {studentName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Week of{" "}
          {new Date(weekOf).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="text-sm text-slate-600 mt-4 leading-relaxed">
          Use this checklist to connect coaching with the student&apos;s current
          school experience while preserving MathPivot&apos;s broader mastery,
          acceleration, and long-term development goals. Complete during
          onboarding, review regularly, and update whenever the student&apos;s
          course, school expectations, or learning needs change.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section
          key={section.key}
          className="rounded-2xl bg-white border border-slate-200 p-5"
        >
          <h2 className="text-sm font-bold text-slate-900 mb-3">
            {section.number}. {section.title}
          </h2>
          <ul className="space-y-2">
            {section.items.map((item) => {
              const checked = Boolean(
                (data[section.key] as Record<string, boolean>)[
                  item.key as string
                ],
              );
              return (
                <li key={item.key as string}>
                  <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(section.key, item.key)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                    />
                    <span>{item.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {section.coachNote && (
            <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 italic leading-relaxed">
              <span className="font-semibold text-slate-600 not-italic">
                Coach note:
              </span>{" "}
              {section.coachNote}
            </p>
          )}
          {section.strategyOutcome && (
            <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 italic leading-relaxed">
              <span className="font-semibold text-slate-600 not-italic">
                Strategy outcome:
              </span>{" "}
              {section.strategyOutcome}
            </p>
          )}
        </section>
      ))}

      {/* Section 8 — free text */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          8. Weekly Coaching Strategy
        </h2>
        <div className="space-y-4">
          <TextField
            label="This week's school focus"
            value={data.section8.school_focus ?? ""}
            onChange={(v) => updateSection8("school_focus", v)}
          />
          <TextField
            label="Essential gap to repair"
            value={data.section8.gap_to_repair ?? ""}
            onChange={(v) => updateSection8("gap_to_repair", v)}
          />
          <TextField
            label="Concept to preview or extend"
            value={data.section8.concept_to_preview ?? ""}
            onChange={(v) => updateSection8("concept_to_preview", v)}
          />
          <TextField
            label="Evidence of learning to collect"
            value={data.section8.evidence_to_collect ?? ""}
            onChange={(v) => updateSection8("evidence_to_collect", v)}
          />
          <TextField
            label="Student-owned next action"
            value={data.section8.student_owned_action ?? ""}
            onChange={(v) => updateSection8("student_owned_action", v)}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Family update needed
            </label>
            <div className="space-y-1">
              {(Object.keys(FAMILY_UPDATE_LABELS) as FamilyUpdateSignal[]).map(
                (opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="family_update"
                      checked={(data.section8.family_update ?? "none") === opt}
                      onChange={() => updateSection8("family_update", opt)}
                      className="h-4 w-4 border-slate-300 text-blue-700 focus:ring-blue-700"
                    />
                    <span>{FAMILY_UPDATE_LABELS[opt]}</span>
                  </label>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          9. Coach Review
        </h2>
        <ul className="space-y-2">
          {SECTION9_ITEMS.map((item) => {
            const checked = Boolean(
              (data.section9 as Record<string, boolean>)[item.key as string],
            );
            return (
              <li key={item.key as string}>
                <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle9(item.key)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                  />
                  <span>{item.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Strategy status
        </h2>
        <div className="space-y-1">
          {(Object.keys(STATUS_LABELS) as StrategyStatus[]).map((s) => (
            <label
              key={s}
              className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
            >
              <input
                type="radio"
                name="status"
                checked={status === s}
                onChange={() => setStatus(s)}
                className="h-4 w-4 border-slate-300 text-blue-700 focus:ring-blue-700"
              />
              <span>{STATUS_LABELS[s]}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Next review date
          </label>
          <input
            type="date"
            value={nextReviewDate}
            onChange={(e) => setNextReviewDate(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-700 focus:border-transparent"
          />
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Coach notes
          </label>
          <textarea
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-700 focus:border-transparent"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-2">
          Completion standard
        </p>
        <p className="text-sm text-slate-700">
          The checklist is complete when the coach can answer: What is the
          student learning at school now? Which essential gap is interfering
          with that learning? What should MathPivot reinforce, repair, preview,
          or extend? What evidence will show that the strategy is working?
        </p>
        <p className="text-xs text-slate-500 mt-2">
          {completionUnlocked
            ? "All four core answers have been provided this week."
            : "Fill in Section 8 to answer all four."}
        </p>
      </section>

      <div className="sticky bottom-4 z-10">
        <div className="rounded-2xl bg-slate-900 text-white p-4 flex items-center justify-between gap-4 shadow-lg">
          <div className="text-sm">
            {savedAt && (
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                Saved at {savedAt.toLocaleTimeString()}
              </span>
            )}
            {error && <span className="text-red-300">{error}</span>}
            {!savedAt && !error && (
              <span className="text-slate-300">
                Changes are not saved until you click Save.
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={pending}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {pending ? "Saving…" : "Save checklist"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-700 focus:border-transparent"
      />
    </div>
  );
}
