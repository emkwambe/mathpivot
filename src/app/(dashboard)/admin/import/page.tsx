import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getImportHistory } from "@/app/actions/csv-import";
import { ImportManager } from "./ImportManager";

interface ImportJobRow {
  id: string;
  file_name: string;
  entity_type: string;
  success_rows: number;
  error_rows: number;
  total_rows: number;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default async function AdminImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { jobs, error } = await getImportHistory();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Import / Export Data
        </h1>
        <p className="text-sm text-slate-500">
          Bulk import students and tutors via CSV, or export data
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <ImportManager />

      {/* Import History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Import History</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                File
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Type
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Result
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  No imports yet
                </td>
              </tr>
            )}
            {jobs.map((job: ImportJobRow) => (
              <tr key={job.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-900">
                  {job.file_name}
                </td>
                <td className="px-4 py-3 text-slate-700 capitalize">
                  {job.entity_type}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <span className="text-green-600">{job.success_rows}</span>
                  {job.error_rows > 0 && (
                    <span className="text-red-500">
                      {" "}
                      / {job.error_rows} errors
                    </span>
                  )}
                  <span className="text-slate-400"> of {job.total_rows}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status] || "bg-slate-100"}`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(job.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
