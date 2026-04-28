"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui";

const MASTERY_LEVELS = [
  {
    value: "not_started",
    label: "Not Started",
    color: "bg-slate-100 text-slate-600",
  },
  {
    value: "introduced",
    label: "Introduced",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "developing",
    label: "Developing",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "proficient",
    label: "Proficient",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "mastered",
    label: "Mastered",
    color: "bg-emerald-100 text-emerald-800",
  },
] as const;

type MasteryLevel = (typeof MASTERY_LEVELS)[number]["value"];

interface Concept {
  id: string;
  lesson_number: string;
  title: string;
  key_skills: string[];
  standard_code: string | null;
  current_mastery: MasteryLevel;
}

interface Unit {
  id: string;
  title: string;
  concepts: Concept[];
}

export default function MasteryTracker({
  units,
  enrollmentId,
  studentName,
  updateAction,
}: {
  units: Unit[];
  enrollmentId: string;
  studentName: string;
  updateAction: (
    conceptId: string,
    level: string,
    enrollmentId: string,
  ) => Promise<void>;
}) {
  const [expandedUnit, setExpandedUnit] = useState<string | null>(
    units[0]?.id || null,
  );
  const [pending, startTransition] = useTransition();
  const [localMastery, setLocalMastery] = useState<
    Record<string, MasteryLevel>
  >(() => {
    const map: Record<string, MasteryLevel> = {};
    units.forEach((u) =>
      u.concepts.forEach((c) => {
        map[c.id] = c.current_mastery;
      }),
    );
    return map;
  });

  const totalConcepts = units.reduce((sum, u) => sum + u.concepts.length, 0);
  const masteredCount = Object.values(localMastery).filter(
    (l) => l === "mastered" || l === "proficient",
  ).length;
  const overallPct =
    totalConcepts > 0 ? Math.round((masteredCount / totalConcepts) * 100) : 0;

  function handleMasteryChange(conceptId: string, level: MasteryLevel) {
    setLocalMastery((prev) => ({ ...prev, [conceptId]: level }));
    startTransition(async () => {
      await updateAction(conceptId, level, enrollmentId);
    });
  }

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Overall Mastery</p>
            <p className="text-2xl font-bold text-slate-900">{overallPct}%</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>
              {masteredCount}/{totalConcepts} concepts
            </p>
            <p>proficient or mastered</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {units.map((unit) => {
          const unitMastered = unit.concepts.filter(
            (c) =>
              localMastery[c.id] === "mastered" ||
              localMastery[c.id] === "proficient",
          ).length;
          const unitPct =
            unit.concepts.length > 0
              ? Math.round((unitMastered / unit.concepts.length) * 100)
              : 0;
          const isExpanded = expandedUnit === unit.id;

          return (
            <div
              key={unit.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
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
                  <h3 className="font-semibold text-slate-900 text-left">
                    {unit.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    {unitMastered}/{unit.concepts.length}
                  </span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${unitPct}%` }}
                    />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {unit.concepts.map((concept) => {
                    const currentLevel =
                      localMastery[concept.id] || "not_started";
                    const currentInfo = MASTERY_LEVELS.find(
                      (l) => l.value === currentLevel,
                    )!;

                    return (
                      <div key={concept.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-slate-400">
                                {concept.lesson_number}
                              </span>
                              {concept.standard_code && (
                                <span className="text-xs text-slate-300">
                                  {concept.standard_code}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-slate-900">
                              {concept.title}
                            </p>
                            {concept.key_skills.length > 0 && (
                              <ul className="mt-1 space-y-0.5">
                                {concept.key_skills.map((skill, i) => (
                                  <li
                                    key={i}
                                    className="text-xs text-slate-500"
                                  >
                                    {skill}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="flex-shrink-0">
                            <select
                              value={currentLevel}
                              onChange={(e) =>
                                handleMasteryChange(
                                  concept.id,
                                  e.target.value as MasteryLevel,
                                )
                              }
                              className={`text-xs font-medium rounded-lg px-2 py-1.5 border-0 cursor-pointer ${currentInfo.color}`}
                            >
                              {MASTERY_LEVELS.map((level) => (
                                <option key={level.value} value={level.value}>
                                  {level.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
