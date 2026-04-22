import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function IssuedCertificatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: certs } = await supabase
    .from("user_certifications")
    .select("id, credential_number, earned_at, status, score, valid_until")
    .order("earned_at", { ascending: false })
    .limit(100);

  // Get program and user names separately
  const certIds = certs?.map((c) => c.id) || [];
  const { data: certDetails } =
    certIds.length > 0
      ? await supabase
          .from("user_certifications")
          .select("id, user_id, program_id")
          .in("id", certIds)
      : { data: [] };

  const userIds = [...new Set(certDetails?.map((c) => c.user_id) || [])];
  const programIds = [...new Set(certDetails?.map((c) => c.program_id) || [])];

  const { data: users } =
    userIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", userIds)
      : { data: [] };
  const { data: programs } =
    programIds.length > 0
      ? await supabase
          .from("certification_programs")
          .select("id, name, level")
          .in("id", programIds)
      : { data: [] };

  const userMap = new Map((users || []).map((u) => [u.id, u.full_name]));
  const programMap = new Map((programs || []).map((p) => [p.id, p]));
  const detailMap = new Map((certDetails || []).map((d) => [d.id, d]));

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    expired: "bg-amber-100 text-amber-800",
    revoked: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/certifications"
          className="text-slate-400 hover:text-slate-600"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Issued Certificates
          </h1>
          <p className="text-sm text-slate-500">
            {certs?.length || 0} certificates issued
          </p>
        </div>
      </div>

      {!certs || certs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">
            No certificates have been issued yet.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Credential
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Student
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Program
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Earned
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certs.map((cert) => {
                const detail = detailMap.get(cert.id);
                const program = detail
                  ? programMap.get(detail.program_id)
                  : null;
                return (
                  <tr key={cert.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {cert.credential_number || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {detail ? userMap.get(detail.user_id) || "Unknown" : "—"}
                    </td>
                    <td className="px-4 py-3">{program?.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {cert.earned_at ? formatDate(cert.earned_at) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={statusColors[cert.status] || "bg-slate-100"}
                      >
                        {cert.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
