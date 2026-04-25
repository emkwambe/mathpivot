// src/app/(dashboard)/admin/packages/page.tsx
// Purpose: Admin page for viewing and managing service packages across all tiers.
// Connects to: actions/packages.ts server actions, service_packages table

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { togglePackageActive } from "@/app/actions/packages";
import Link from "next/link";
import type { PackageRecord } from "@/types/views";

const tierColors: Record<string, { badge: string; border: string }> = {
  TIER_TUTORING: {
    badge: "bg-blue-100 text-blue-800",
    border: "border-blue-200",
  },
  TIER_COACHING: {
    badge: "bg-purple-100 text-purple-800",
    border: "border-purple-200",
  },
  TIER_MENTORSHIP: {
    badge: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
  },
};

const tierNames: Record<string, string> = {
  TIER_TUTORING: "Coaching",
  TIER_COACHING: "Coaching",
  TIER_MENTORSHIP: "Mentorship",
};

const billingLabels: Record<string, string> = {
  one_time: "One-Time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semester: "Semester",
  annual: "Annual",
};

export default async function AdminPackagesPage() {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  const { data: packages } = await supabase
    .from("service_packages")
    .select("*")
    .order("display_order", { ascending: true });

  const grouped = {
    TIER_TUTORING:
      packages?.filter(
        (p: PackageRecord) => p.service_tier === "TIER_TUTORING",
      ) || [],
    TIER_COACHING:
      packages?.filter(
        (p: PackageRecord) => p.service_tier === "TIER_COACHING",
      ) || [],
    TIER_MENTORSHIP:
      packages?.filter(
        (p: PackageRecord) => p.service_tier === "TIER_MENTORSHIP",
      ) || [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Service Packages
          </h1>
          <p className="text-slate-600">
            Manage tutoring, coaching, and mentorship offerings
          </p>
        </div>
        <Link
          href="/admin/packages/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          New Package
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Packages</p>
              <p className="text-3xl font-bold text-slate-900">
                {packages?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        {Object.entries(grouped).map(([tier, pkgs]) => (
          <Card key={tier}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600">{tierNames[tier]}</p>
                <p className="text-3xl font-bold text-slate-900">
                  {pkgs.length}
                </p>
                <p className="text-xs text-slate-500">
                  {pkgs.filter((p: PackageRecord) => p.is_active).length} active
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Package Tables by Tier */}
      {Object.entries(grouped).map(([tier, pkgs]) => (
        <Card
          key={tier}
          className={
            "border-2 " + (tierColors[tier]?.border || "border-slate-200")
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Badge className={tierColors[tier]?.badge}>
                {tierNames[tier]}
              </Badge>
              <span className="text-lg">{tierNames[tier]} Packages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pkgs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">
                        Package
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">
                        Billing
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">
                        Price
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">
                        Credits
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">
                        Per Session
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-slate-600">
                        Status
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-slate-600">
                        Featured
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pkgs.map((pkg: PackageRecord) => {
                      const perSession =
                        pkg.credits_per_period > 0
                          ? "$" +
                            (
                              pkg.price_cents /
                              pkg.credits_per_period /
                              100
                            ).toFixed(0)
                          : "--";

                      return (
                        <tr
                          key={pkg.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {pkg.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {pkg.slug}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">
                              {billingLabels[pkg.billing_type] ||
                                pkg.billing_type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {formatCurrency(pkg.price_cents)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {pkg.credits_per_period}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {perSession}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <form
                              action={async () => {
                                "use server";
                                await togglePackageActive(
                                  pkg.id,
                                  !pkg.is_active,
                                );
                              }}
                            >
                              <button
                                type="submit"
                                className={
                                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors " +
                                  (pkg.is_active
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                                }
                              >
                                {pkg.is_active ? "Active" : "Inactive"}
                              </button>
                            </form>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {pkg.is_featured && (
                              <span className="text-amber-500 text-lg">
                                &#9733;
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={"/admin/packages/" + pkg.id + "/edit"}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-6">
                No {tierNames[tier]?.toLowerCase()} packages yet
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
