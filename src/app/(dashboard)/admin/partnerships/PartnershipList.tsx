"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePartnershipStage } from "@/app/actions/partnerships";

interface Partnership {
  id: string;
  organization_name: string;
  organization_type: string;
  contact_name: string;
  contact_title: string | null;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  student_count: number | null;
  grade_range: string | null;
  location_city: string | null;
  location_state: string | null;
  interest_area: string | null;
  timeline: string | null;
  message: string | null;
  stage: string;
  notes: string | null;
  created_at: string;
}

const STAGES = [
  { key: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  {
    key: "contacted",
    label: "Contacted",
    color: "bg-slate-100 text-slate-700",
  },
  {
    key: "discovery",
    label: "Discovery",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    key: "proposal",
    label: "Proposal",
    color: "bg-purple-100 text-purple-700",
  },
  { key: "pilot", label: "Pilot", color: "bg-amber-100 text-amber-700" },
  { key: "active", label: "Active", color: "bg-emerald-100 text-emerald-700" },
  { key: "paused", label: "Paused", color: "bg-slate-100 text-slate-500" },
  { key: "declined", label: "Declined", color: "bg-red-100 text-red-600" },
];

const TYPE_LABELS: Record<string, string> = {
  school: "School",
  district: "District",
  learning_center: "Learning Center",
  homeschool_coop: "Homeschool Co-op",
  professional_org: "Professional Org",
  sports_league: "Sports League",
  community_org: "Community Org",
  other: "Other",
};

export function PartnershipList({
  partnerships,
}: {
  partnerships: Partnership[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  async function handleStageChange(id: string, newStage: string) {
    setSaving(id);
    await updatePartnershipStage(id, newStage);
    setSaving(null);
    router.refresh();
  }

  if (partnerships.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <p className="text-slate-500">
          No partnership inquiries yet. Share the{" "}
          <a
            href="/partnerships"
            target="_blank"
            className="text-indigo-700 font-medium underline"
          >
            public partnership page
          </a>{" "}
          with schools and organizations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {partnerships.map((p) => {
          const stageInfo = STAGES.find((s) => s.key === p.stage) || STAGES[0];
          const isExpanded = expanded === p.id;
          return (
            <div key={p.id} className="p-5 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-slate-900">
                      {p.organization_name}
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[p.organization_type] || p.organization_type}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stageInfo.color}`}
                    >
                      {stageInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {p.contact_name}
                    {p.contact_title && `, ${p.contact_title}`} ·{" "}
                    <a
                      href={`mailto:${p.contact_email}`}
                      className="text-indigo-700 hover:underline"
                    >
                      {p.contact_email}
                    </a>
                    {p.contact_phone && <> · {p.contact_phone}</>}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                    {p.student_count && (
                      <span>{p.student_count.toLocaleString()} students</span>
                    )}
                    {p.grade_range && <span>Grades {p.grade_range}</span>}
                    {(p.location_city || p.location_state) && (
                      <span>
                        {[p.location_city, p.location_state]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                    {p.timeline && <span>Timeline: {p.timeline}</span>}
                    <span>
                      {new Date(p.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={p.stage}
                    disabled={saving === p.id}
                    onChange={(e) => handleStageChange(p.id, e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 disabled:opacity-50"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : p.id)}
                    className="text-xs text-indigo-700 hover:text-indigo-800 font-medium"
                  >
                    {isExpanded ? "Hide" : "Details"}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="mt-4 pl-4 border-l-2 border-slate-100 space-y-2 text-sm">
                  {p.interest_area && (
                    <p className="text-slate-700">
                      <strong>Interest:</strong> {p.interest_area}
                    </p>
                  )}
                  {p.website_url && (
                    <p className="text-slate-700">
                      <strong>Website:</strong>{" "}
                      <a
                        href={p.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-700 hover:underline"
                      >
                        {p.website_url}
                      </a>
                    </p>
                  )}
                  {p.message && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Their message
                      </p>
                      <p className="text-slate-700">{p.message}</p>
                    </div>
                  )}
                  {p.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1">
                        Internal notes
                      </p>
                      <p className="text-slate-700">{p.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
