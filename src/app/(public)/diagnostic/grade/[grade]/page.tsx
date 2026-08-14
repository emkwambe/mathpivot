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
    scope: "Grade 6 · Ratios, integers, and expressions",
    headline: "Grade 6 Math Diagnostic",
    subheadline:
      "A ~15-minute grade-6 assessment covering ratios, proportions, integers, one-variable equations, and basic geometry. Free — we email the full report and match your student with the right coaching pathway.",
    scopeTitle: "What grade 6 covers",
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
    scope: "Grade 7 · Proportions, expressions, and geometry",
    headline: "Grade 7 Math Diagnostic",
    subheadline:
      "A ~15-minute grade-7 assessment covering proportional relationships, rational numbers, expressions and equations, and probability. Free — we email the full report and match your student with the right coaching pathway.",
    scopeTitle: "What grade 7 covers",
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
    scope: "Grade 8 · Functions, exponents, and pre-algebra",
    headline: "Grade 8 Math Diagnostic",
    subheadline:
      "A ~15-minute grade-8 assessment covering linear functions, systems, exponents, transformations, and the Pythagorean theorem — the bridge to Algebra 1. Free — we email the full report and match your student with the right coaching pathway.",
    scopeTitle: "What grade 8 covers",
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
    scope: "Grade 9 · Algebra 1 foundations",
    headline: "Grade 9 Math Diagnostic",
    subheadline:
      "A ~15-minute Algebra 1 diagnostic covering linear and quadratic functions, systems, and inequalities. Free — we email the full report and match your student with the right coaching pathway.",
    scopeTitle: "What grade 9 covers",
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
    scope: "Grade 10 · Geometry and algebra applications",
    headline: "Grade 10 Math Diagnostic",
    subheadline:
      "A ~15-minute assessment covering geometry, coordinate proofs, right triangles, and continued algebra fluency. Free — we email the full report and match your student with the right coaching pathway.",
    scopeTitle: "What grade 10 covers",
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
    scope: "Grade 11 · Algebra 2 and pre-calculus",
    headline: "Grade 11 Math Diagnostic",
    subheadline:
      "A ~15-minute Algebra 2 / Pre-Calc diagnostic covering polynomials, rational and exponential functions, trigonometry, and function composition. Free — we email the full report and match your student with the right coaching pathway.",
    scopeTitle: "What grade 11 covers",
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
