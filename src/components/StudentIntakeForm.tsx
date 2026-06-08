"use client";

import { useState, useTransition } from "react";
import { saveStudentIntake } from "@/app/actions/student-intake";
import {
  CheckCircle2,
  ChevronRight,
  User,
  BookOpen,
  Target,
  Heart,
} from "lucide-react";

interface StudentIntakeFormProps {
  studentId: string;
  studentName: string;
  existingProfile?: Record<string, unknown>;
}

const STEPS = [
  {
    key: "school",
    title: "School Info",
    icon: BookOpen,
    description: "Tell us about your child's school",
  },
  {
    key: "academics",
    title: "Math Details",
    icon: Target,
    description: "Current math situation",
  },
  {
    key: "goals",
    title: "Goals & Needs",
    icon: Heart,
    description: "What matters most to you",
  },
];

export default function StudentIntakeForm({
  studentId,
  studentName,
  existingProfile,
}: StudentIntakeFormProps) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    grade_level: (existingProfile?.grade_level as string) || "",
    school_type: (existingProfile?.school_type as string) || "",
    school_name: (existingProfile?.school_name as string) || "",
    current_math_course: (existingProfile?.current_math_course as string) || "",
    current_math_grade: (existingProfile?.current_math_grade as string) || "",
    teacher_name: (existingProfile?.teacher_name as string) || "",
    textbook_curriculum: (existingProfile?.textbook_curriculum as string) || "",
    learning_goal_parent:
      (existingProfile?.learning_goal_parent as string) || "",
    accommodations: (existingProfile?.accommodations as string) || "",
    best_session_times: (existingProfile?.best_session_times as string) || "",
    communication_preference:
      (existingProfile?.communication_preference as string) || "email",
    extracurriculars: (existingProfile?.extracurriculars as string) || "",
  });

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    const fd = new FormData();
    fd.set("studentId", studentId);
    Object.entries(formData).forEach(([key, value]) => {
      if (value) fd.set(key, value);
    });

    startTransition(async () => {
      const result = await saveStudentIntake(fd);
      if (result.success) setSubmitted(true);
    });
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 focus:bg-white transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Profile Updated!</h3>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto">
          {studentName}&apos;s math coach will use this information to
          personalize their coaching experience.
        </p>
      </div>
    );
  }

  const filledCount = Object.values(formData).filter(
    (v) => v && v.trim(),
  ).length;
  const completeness = Math.round(
    (filledCount / Object.keys(formData).length) * 100,
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800">
            {studentName}&apos;s Profile
          </h3>
          <span className="text-xs text-slate-400">
            {completeness}% complete
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-blue-700 h-2 rounded-full transition-all"
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                step === i
                  ? "border-blue-700 bg-blue-50"
                  : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <Icon
                className={`w-5 h-5 mx-auto mb-1 ${step === i ? "text-blue-700" : "text-slate-400"}`}
              />
              <p
                className={`text-xs font-medium ${step === i ? "text-blue-700" : "text-slate-500"}`}
              >
                {s.title}
              </p>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {step === 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Grade Level *</label>
                <select
                  value={formData.grade_level}
                  onChange={(e) => updateField("grade_level", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {[5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={String(g)}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>School Type</label>
                <select
                  value={formData.school_type}
                  onChange={(e) => updateField("school_type", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="charter">Charter</option>
                  <option value="homeschool">Homeschool</option>
                  <option value="virtual">Virtual/Online</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>School Name</label>
              <input
                value={formData.school_name}
                onChange={(e) => updateField("school_name", e.target.value)}
                placeholder="e.g., Lincoln Middle School"
                className={inputClass}
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Current Math Course</label>
                <input
                  value={formData.current_math_course}
                  onChange={(e) =>
                    updateField("current_math_course", e.target.value)
                  }
                  placeholder="e.g., Pre-Algebra, Math 1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Current Math Grade</label>
                <select
                  value={formData.current_math_grade}
                  onChange={(e) =>
                    updateField("current_math_grade", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {[
                    "A",
                    "A-",
                    "B+",
                    "B",
                    "B-",
                    "C+",
                    "C",
                    "C-",
                    "D",
                    "F",
                    "N/A",
                  ].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Teacher Name</label>
              <input
                value={formData.teacher_name}
                onChange={(e) => updateField("teacher_name", e.target.value)}
                placeholder="Helps us coordinate with the school"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Textbook or Curriculum</label>
              <input
                value={formData.textbook_curriculum}
                onChange={(e) =>
                  updateField("textbook_curriculum", e.target.value)
                }
                placeholder="e.g., Pearson Math, Saxon, Singapore"
                className={inputClass}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className={labelClass}>
                What are your goals for your child in math?
              </label>
              <textarea
                value={formData.learning_goal_parent}
                onChange={(e) =>
                  updateField("learning_goal_parent", e.target.value)
                }
                placeholder="e.g., Build confidence, improve grades, prepare for competitions, stay ahead of school..."
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>
            <div>
              <label className={labelClass}>
                Any accommodations or learning needs? (IEP, 504, etc.)
              </label>
              <textarea
                value={formData.accommodations}
                onChange={(e) => updateField("accommodations", e.target.value)}
                placeholder="Leave blank if none. This is confidential and helps your coach adapt."
                rows={2}
                className={inputClass + " resize-none"}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Best Session Times</label>
                <input
                  value={formData.best_session_times}
                  onChange={(e) =>
                    updateField("best_session_times", e.target.value)
                  }
                  placeholder="e.g., Weekdays after 5 PM"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Communication Preference</label>
                <select
                  value={formData.communication_preference}
                  onChange={(e) =>
                    updateField("communication_preference", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="email">Email</option>
                  <option value="text">Text/SMS</option>
                  <option value="in-app">In-App Messages</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Extracurriculars</label>
              <input
                value={formData.extracurriculars}
                onChange={(e) =>
                  updateField("extracurriculars", e.target.value)
                }
                placeholder="e.g., Soccer, Band, Chess Club"
                className={inputClass}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="inline-flex items-center gap-1 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isPending || !formData.grade_level}
            className="px-6 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-40 transition-colors"
          >
            {isPending ? "Saving..." : "Save Profile"}
          </button>
        )}
      </div>
    </div>
  );
}
