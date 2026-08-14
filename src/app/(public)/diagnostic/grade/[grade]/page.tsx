import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DiagnosticFlow from "@/components/DiagnosticFlow";

const VALID_GRADES = [6, 7, 8, 9, 10, 11] as const;
type ValidGrade = (typeof VALID_GRADES)[number];

interface GradeCopy {
  scope: string;
  headline: string;
  subheadline: string;
  scopeTitle: string;
  scopeItems: string[];
}

const GRADE_COPY: Record<ValidGrade, GradeCopy> = {
  6: {
    scope: "Grade 6 content · For students entering grade 7",
    headline: "Entering Grade 7 Diagnostic",
    subheadline:
      "A ~15-minute assessment of the grade 6 content your student should have mastered — ratios, integers, one-variable equations, and basic geometry. Free — we email the full report and a coaching program recommendation. Also a valid mid-year check for current grade 6 students.",
    scopeTitle: "Grade 6 content covered",
    scopeItems: [
      "Ratios & unit rates",
      "Integer operations",
      "One-variable equations",
      "Coordinate plane",
      "Area, surface area, volume",
      "Statistical variability",
    ],
  },
  7: {
    scope: "Grade 7 content · For students entering grade 8",
    headline: "Entering Grade 8 Diagnostic",
    subheadline:
      "A ~15-minute assessment of the grade 7 content your student should have mastered — proportional relationships, rational numbers, multi-step equations, and probability. Free — we email the full report and a coaching program recommendation. Also a valid mid-year check for current grade 7 students.",
    scopeTitle: "Grade 7 content covered",
    scopeItems: [
      "Proportional relationships",
      "Rational number operations",
      "Multi-step equations",
      "Scale drawings & angles",
      "Circle area & circumference",
      "Probability of events",
    ],
  },
  8: {
    scope: "Grade 8 content · For students entering grade 9",
    headline: "Entering Grade 9 Diagnostic",
    subheadline:
      "A ~15-minute assessment of the grade 8 content your student should have mastered — the bridge to Algebra 1. Covers linear functions, systems, exponents, transformations, and the Pythagorean theorem. Free — we email the full report and a coaching program recommendation. Also a valid mid-year check for current grade 8 students.",
    scopeTitle: "Grade 8 content covered",
    scopeItems: [
      "Linear equations & functions",
      "Systems of equations",
      "Integer exponents & roots",
      "Transformations",
      "Pythagorean theorem",
      "Bivariate data & scatter plots",
    ],
  },
  9: {
    scope: "Grade 9 · Algebra 1 · For students entering grade 10",
    headline: "Entering Grade 10 Diagnostic",
    subheadline:
      "A ~15-minute Algebra 1 diagnostic covering linear and quadratic functions, systems, and factoring. Free — we email the full report and a coaching program recommendation. Also a valid mid-year check for current Algebra 1 students.",
    scopeTitle: "Grade 9 (Algebra 1) content covered",
    scopeItems: [
      "Linear & quadratic functions",
      "Systems & inequalities",
      "Exponents & polynomials",
      "Factoring",
      "Function transformations",
      "Descriptive statistics",
    ],
  },
  10: {
    scope: "Grade 10 · Geometry · For students entering grade 11",
    headline: "Entering Grade 11 Diagnostic",
    subheadline:
      "A ~15-minute Geometry diagnostic covering proofs, right triangle trig, circles, and coordinate geometry. Free — we email the full report and a coaching program recommendation. Also a valid mid-year check for current Geometry students.",
    scopeTitle: "Grade 10 (Geometry) content covered",
    scopeItems: [
      "Congruence & similarity",
      "Right triangle trigonometry",
      "Coordinate geometry proofs",
      "Circle theorems",
      "Volume & surface area",
      "Probability rules",
    ],
  },
  11: {
    scope: "Grade 11 · Algebra 2 / Pre-Calc · For students entering grade 12",
    headline: "Entering Grade 12 Diagnostic",
    subheadline:
      "A ~15-minute Algebra 2 / Pre-Calc diagnostic covering polynomials, exponential and logarithmic functions, trigonometry, and function composition. Free — we email the full report and a coaching program recommendation. Also a valid mid-year check for current Algebra 2 / Pre-Calc students.",
    scopeTitle: "Grade 11 (Algebra 2 / Pre-Calc) content covered",
    scopeItems: [
      "Polynomial & rational functions",
      "Exponential & logarithmic functions",
      "Trigonometric functions",
      "Sequences & series",
      "Complex numbers",
      "Statistical inference",
    ],
  },
};

export function generateStaticParams() {
  return VALID_GRADES.map((g) => ({ grade: String(g) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string }>;
}): Promise<Metadata> {
  const { grade } = await params;
  const n = Number(grade);
  if (!VALID_GRADES.includes(n as ValidGrade)) {
    return { title: "Math Diagnostic — MathPivot" };
  }
  const copy = GRADE_COPY[n as ValidGrade];
  return {
    title: `${copy.headline} — Free 15-min assessment | MathPivot`,
    description: copy.subheadline,
  };
}

export default async function GradeDiagnosticPage({
  params,
}: {
  params: Promise<{ grade: string }>;
}) {
  const { grade } = await params;
  const n = Number(grade);
  if (!VALID_GRADES.includes(n as ValidGrade)) return notFound();
  const copy = GRADE_COPY[n as ValidGrade];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-800 text-lg">MathPivot</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/diagnostic"
              className="text-slate-600 hover:text-slate-900"
            >
              All grades
            </Link>
            <Link
              href="/pricing"
              className="text-slate-600 hover:text-slate-900"
            >
              Programs
            </Link>
          </div>
        </div>
      </header>

      <DiagnosticFlow
        fixedGrade={n}
        gradeLabel={copy.scope}
        headline={copy.headline}
        subheadline={copy.subheadline}
      />

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            {copy.scopeTitle}
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
            {copy.scopeItems.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          Wrong grade?{" "}
          <Link href="/diagnostic" className="text-blue-700 hover:underline">
            Pick a different grade
          </Link>
        </div>
      </div>
    </div>
  );
}
