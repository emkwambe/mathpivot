import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, X, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "MathPivot vs Kumon, Mathnasium, AoPS, RSM — Which Math Program?",
  description:
    "Compare MathPivot to Kumon, Mathnasium, AoPS, RSM, and private tutoring on price, coach model, mastery tracking, cohort size, and outcomes.",
};

type Cell = string | { value: string; note?: string };
interface Row {
  label: string;
  mathpivot: Cell;
  kumon: Cell;
  mathnasium: Cell;
  aops: Cell;
  rsm: Cell;
  private_tutor: Cell;
}

const COMPARISON: Row[] = [
  {
    label: "Monthly cost",
    mathpivot: { value: "$349–$799", note: "Program-based" },
    kumon: "$140–$200",
    mathnasium: "$250–$400",
    aops: "$240–$500/course",
    rsm: "$225–$440",
    private_tutor: "$160–$480",
  },
  {
    label: "Named coach (same person)",
    mathpivot: "yes",
    kumon: "no",
    mathnasium: "partial",
    aops: "no",
    rsm: "partial",
    private_tutor: "yes",
  },
  {
    label: "Cohort / class size",
    mathpivot: { value: "5–6 students", note: "Micro-cohort" },
    kumon: "Self-paced individual",
    mathnasium: "6–8",
    aops: "12–15",
    rsm: "12–20",
    private_tutor: "1:1",
  },
  {
    label: "Mastery tracking dashboard",
    mathpivot: "yes",
    kumon: "no",
    mathnasium: "partial",
    aops: "partial",
    rsm: "no",
    private_tutor: "no",
  },
  {
    label: "Diagnostic assessment",
    mathpivot: { value: "Free 15-min", note: "Domain-mapped" },
    kumon: "Placement test",
    mathnasium: "Placement test",
    aops: "no",
    rsm: "Placement test",
    private_tutor: "Varies",
  },
  {
    label: "Career exposure modules",
    mathpivot: "yes",
    kumon: "no",
    mathnasium: "no",
    aops: "no",
    rsm: "no",
    private_tutor: "no",
  },
  {
    label: "Competition prep (AMC / MATHCOUNTS)",
    mathpivot: "yes",
    kumon: "no",
    mathnasium: "no",
    aops: "yes",
    rsm: "yes",
    private_tutor: "Varies",
  },
  {
    label: "Structured program (not hourly)",
    mathpivot: "yes",
    kumon: "yes",
    mathnasium: "no",
    aops: "yes",
    rsm: "yes",
    private_tutor: "no",
  },
  {
    label: "Weekly progress reports",
    mathpivot: "yes",
    kumon: "no",
    mathnasium: "partial",
    aops: "no",
    rsm: "no",
    private_tutor: "no",
  },
  {
    label: "Homeschool compliance exports",
    mathpivot: "yes",
    kumon: "no",
    mathnasium: "no",
    aops: "no",
    rsm: "no",
    private_tutor: "no",
  },
  {
    label: "State standards alignment",
    mathpivot: "yes",
    kumon: "partial",
    mathnasium: "yes",
    aops: "no",
    rsm: "partial",
    private_tutor: "Varies",
  },
  {
    label: "Session length",
    mathpivot: "60 minutes",
    kumon: "20–30 min drill",
    mathnasium: "60 min",
    aops: "Self-paced",
    rsm: "90 min",
    private_tutor: "60 min",
  },
];

const HIGHLIGHT_ROWS = [
  "Named coach (same person)",
  "Cohort / class size",
  "Mastery tracking dashboard",
  "Career exposure modules",
  "Homeschool compliance exports",
];

function renderCell(value: Cell, isMathPivot = false) {
  const raw = typeof value === "string" ? value : value.value;
  const note = typeof value === "string" ? undefined : value.note;
  const isYes = raw === "yes",
    isNo = raw === "no",
    isPartial = raw === "partial",
    isVaries = raw.toLowerCase() === "varies";

  if (isYes)
    return (
      <div className="flex items-center justify-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center ${isMathPivot ? "bg-blue-700" : "bg-emerald-100"}`}
        >
          <Check
            className={`w-4 h-4 ${isMathPivot ? "text-white" : "text-emerald-700"}`}
            strokeWidth={3}
          />
        </div>
      </div>
    );
  if (isNo)
    return (
      <div className="flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
          <X className="w-4 h-4 text-slate-400" strokeWidth={2.5} />
        </div>
      </div>
    );
  if (isPartial)
    return (
      <div className="flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
          <Minus className="w-4 h-4 text-amber-700" strokeWidth={3} />
        </div>
      </div>
    );
  if (isVaries)
    return <span className="text-sm text-slate-400 italic">Varies</span>;
  return (
    <div className="text-center">
      <p
        className={`text-sm font-semibold ${isMathPivot ? "text-blue-700" : "text-slate-800"}`}
      >
        {raw}
      </p>
      {note && <p className="text-xs text-slate-500 mt-0.5">{note}</p>}
    </div>
  );
}

const HOW_WE_COMPARE = [
  {
    competitor: "vs Kumon",
    theirModel: "Worksheet drill, rotating staff, self-paced repetition",
    ourEdge:
      "Structured coaching with a named coach. Kumon builds procedural speed; MathPivot builds mathematical thinking and confidence.",
  },
  {
    competitor: "vs Mathnasium",
    theirModel: "Center-based drop-in, semi-consistent staff, 6–8 students",
    ourEdge:
      "Same coach throughout, smaller cohorts (5–6), mastery dashboard, and career exposure. Not homework help — actual coaching.",
  },
  {
    competitor: "vs AoPS",
    theirModel:
      "Structured courses, no assigned coach, self-directed problem sets",
    ourEdge:
      "AoPS is powerful for self-motivated students. MathPivot adds a named coach who provides accountability, adjustment, and relationship.",
  },
  {
    competitor: "vs RSM",
    theirModel: "Russian-tradition math school, 12–20 student classes",
    ourEdge:
      "MathPivot's 5–6 student cohorts deliver more personalization than RSM's 20-student classes at comparable pricing.",
  },
  {
    competitor: "vs Private tutoring",
    theirModel: "$40–$120/hr, one-on-one, no shared curriculum or system",
    ourEdge:
      "A private tutor is one person; MathPivot is a system. Same coach relationship, but with atomic curriculum, mastery tracking, and progress reporting.",
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-800 text-lg">MathPivot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-slate-600 hover:text-slate-900 hidden sm:block"
            >
              Programs
            </Link>
            <Link
              href="/diagnostic"
              className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Free Diagnostic
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 pt-16 pb-12 bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-3">
            Compare
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
            How MathPivot compares to{" "}
            <span className="text-blue-700">every other option.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Kumon, Mathnasium, AoPS, RSM, and private tutors all serve different
            needs. Here&apos;s how MathPivot stacks up on the features that
            matter for long-term math development.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-4 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Feature
                  </th>
                  <th className="py-4 px-3 bg-blue-700 text-white rounded-t-xl relative">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-sm font-bold">MathPivot</p>
                    <p className="text-xs opacity-90">Coaching Academy</p>
                  </th>
                  <th className="py-4 px-3 text-center">
                    <p className="text-sm font-bold text-slate-700">Kumon</p>
                    <p className="text-xs text-slate-500">Worksheet-based</p>
                  </th>
                  <th className="py-4 px-3 text-center">
                    <p className="text-sm font-bold text-slate-700">
                      Mathnasium
                    </p>
                    <p className="text-xs text-slate-500">Center-based</p>
                  </th>
                  <th className="py-4 px-3 text-center">
                    <p className="text-sm font-bold text-slate-700">AoPS</p>
                    <p className="text-xs text-slate-500">Online courses</p>
                  </th>
                  <th className="py-4 px-3 text-center">
                    <p className="text-sm font-bold text-slate-700">RSM</p>
                    <p className="text-xs text-slate-500">Russian School</p>
                  </th>
                  <th className="py-4 px-3 text-center">
                    <p className="text-sm font-bold text-slate-700">
                      Private Tutor
                    </p>
                    <p className="text-xs text-slate-500">1:1 hourly</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => {
                  const isHighlighted = HIGHLIGHT_ROWS.includes(row.label);
                  return (
                    <tr
                      key={row.label}
                      className={`border-b border-slate-100 ${isHighlighted ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="py-4 px-3">
                        <p className="text-sm font-medium text-slate-700">
                          {row.label}
                        </p>
                      </td>
                      <td className="py-4 px-3 bg-blue-50">
                        {renderCell(row.mathpivot, true)}
                      </td>
                      <td className="py-4 px-3">{renderCell(row.kumon)}</td>
                      <td className="py-4 px-3">
                        {renderCell(row.mathnasium)}
                      </td>
                      <td className="py-4 px-3">{renderCell(row.aops)}</td>
                      <td className="py-4 px-3">{renderCell(row.rsm)}</td>
                      <td className="py-4 px-3">
                        {renderCell(row.private_tutor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check
                  className="w-2.5 h-2.5 text-emerald-700"
                  strokeWidth={3}
                />
              </div>
              <span className="text-slate-600">Fully offered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                <Minus className="w-2.5 h-2.5 text-amber-700" strokeWidth={3} />
              </div>
              <span className="text-slate-600">Partial / inconsistent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-slate-400" strokeWidth={2.5} />
              </div>
              <span className="text-slate-600">Not offered</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Head-to-Head
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              What makes MathPivot different?
            </h2>
          </div>
          <div className="space-y-4">
            {HOW_WE_COMPARE.map((row) => (
              <div
                key={row.competitor}
                className="bg-white rounded-2xl p-6 border border-slate-200"
              >
                <div className="grid md:grid-cols-[1fr_1.5fr_2fr] gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Compared to
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {row.competitor.replace("vs ", "")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Their model
                    </p>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                      {row.theirModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                      MathPivot&apos;s edge
                    </p>
                    <p className="text-sm text-slate-800 font-medium mt-1 leading-relaxed">
                      {row.ourEdge}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-3">
              Honest disclosure
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              When MathPivot isn&apos;t the right fit
            </h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <span className="text-amber-700 font-bold flex-shrink-0">
                  •
                </span>
                <span>
                  <strong>You want the cheapest option.</strong> Kumon at
                  $140–$200/mo is genuinely lower cost. MathPivot Foundation
                  starts at $349/mo because we&apos;re a coaching system, not
                  worksheet drill.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-700 font-bold flex-shrink-0">
                  •
                </span>
                <span>
                  <strong>You only need homework help tonight.</strong> Private
                  tutors are better for immediate homework crises. MathPivot is
                  for long-term development, not quick fixes.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-700 font-bold flex-shrink-0">
                  •
                </span>
                <span>
                  <strong>
                    Your child needs high-school competition depth.
                  </strong>{" "}
                  AoPS remains the gold standard for advanced AMC 12 / AIME /
                  USAMO prep for self-motivated students.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Not sure if MathPivot fits your child?
          </h2>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto">
            Take our free 15-minute diagnostic. You&apos;ll get a
            domain-by-domain report and a clear recommendation — whether
            that&apos;s MathPivot or another program.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/diagnostic"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg"
            >
              Take the Free Diagnostic <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-semibold px-8 py-4 rounded-xl hover:bg-slate-50 text-base"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-sm text-slate-500">MathPivot</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm justify-center">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Programs
            </Link>
            <Link href="/for" className="hover:text-white">
              Find Your Path
            </Link>
            <Link href="/diagnostic" className="hover:text-white">
              Diagnostic
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
