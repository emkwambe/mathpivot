import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCodeProblems } from "@/app/actions/code-problems";
import { CodeProblemManager } from "./CodeProblemManager";

interface CodeProblemRow {
  id: string;
  title: string;
  difficulty: string;
  language: string;
  topic: string | null;
  test_cases: unknown[];
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export default async function AdminCodeProblemsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { problems, error } = await getCodeProblems();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Code Problems</h1>
        <p className="text-sm text-slate-500">
          Manage coding challenges for students
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <CodeProblemManager />

      {/* Problem List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Title
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Difficulty
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Language
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Topic
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Tests
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {problems.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  No problems yet. Create your first one above.
                </td>
              </tr>
            )}
            {(problems as CodeProblemRow[]).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {p.title}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[p.difficulty] || "bg-slate-100"}`}
                  >
                    {p.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 capitalize">
                  {p.language}
                </td>
                <td className="px-4 py-3 text-slate-700">{p.topic || "-"}</td>
                <td className="px-4 py-3 text-slate-700">
                  {p.test_cases?.length || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
