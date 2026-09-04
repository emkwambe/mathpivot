"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitCoachApplication } from "@/app/actions/coach-applications";

const SPECIALTY_OPTIONS = [
  "Elementary math",
  "Middle school math",
  "Algebra 1",
  "Geometry",
  "Algebra 2",
  "Pre-Calculus",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Statistics",
  "Competition math (AMC / MATHCOUNTS)",
  "Multivariable / Linear Algebra",
];

export default function CoachApplyPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);

  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const years = data.get("yearsTeaching")?.toString();

    startTransition(async () => {
      const res = await submitCoachApplication({
        fullName: (data.get("fullName") as string) ?? "",
        email: (data.get("email") as string) ?? "",
        phone: (data.get("phone") as string) ?? "",
        location: (data.get("location") as string) ?? "",
        currentRole: (data.get("currentRole") as string) ?? "",
        yearsTeaching: years ? Number(years) : undefined,
        specialties,
        resumeUrl: (data.get("resumeUrl") as string) ?? "",
        linkedinUrl: (data.get("linkedinUrl") as string) ?? "",
        whyMathpivot: (data.get("whyMathpivot") as string) ?? "",
        availability: (data.get("availability") as string) ?? "",
      });
      if (res.success) router.push("/coach-apply/thanks");
      else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-800 text-lg">MathPivot</span>
          </Link>
          <Link
            href="/careers"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            About coaching at MathPivot
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
            Coach application
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">
            Coach mathematics with MathPivot.
          </h1>
          <p className="text-slate-600 mt-3 max-w-lg mx-auto">
            MathPivot Math Coaches lead small-group sessions of typically five
            students, track individual mastery, and connect school mathematics
            to longer-term academic and career development. This is coaching,
            not tutoring by the hour.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8 space-y-5"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm p-3">
              {error}
            </div>
          )}

          <Field label="Full name" name="fullName" required />
          <Field label="Email" name="email" type="email" required />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Phone" name="phone" type="tel" />
            <Field
              label="City, State"
              name="location"
              placeholder="e.g. Raleigh, NC"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Current role"
              name="currentRole"
              placeholder="e.g. High school math teacher"
            />
            <Field
              label="Years teaching math"
              name="yearsTeaching"
              type="number"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Areas of specialty
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map((s) => {
                const active = specialties.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSpecialty(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Resume URL"
              name="resumeUrl"
              type="url"
              placeholder="Link to Google Drive, Dropbox, etc."
            />
            <Field label="LinkedIn URL" name="linkedinUrl" type="url" />
          </div>

          <TextareaField
            label="Why MathPivot?"
            name="whyMathpivot"
            rows={4}
            placeholder="Tell us briefly why coaching at MathPivot interests you."
          />

          <TextareaField
            label="Weekly availability"
            name="availability"
            rows={3}
            placeholder="e.g. Mon–Thu evenings 5:30–7:45 PM ET; Saturdays 10 AM–12:15 PM ET"
          />

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-700 text-white font-semibold px-4 py-3 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {pending ? "Submitting…" : "Submit application"}
          </button>

          <p className="text-xs text-slate-500 text-center">
            We review applications personally. Expect a response within a week.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        min={min}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-700 focus:border-transparent"
      />
    </div>
  );
}

function TextareaField({
  label,
  name,
  rows,
  placeholder,
}: {
  label: string;
  name: string;
  rows: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-700 focus:border-transparent"
      />
    </div>
  );
}
