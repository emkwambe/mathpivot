import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

// Tier display info
const tierInfo: Record<
  string,
  { name: string; color: string; bgColor: string }
> = {
  TIER_1_EXPLORER: {
    name: "Explorer",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  TIER_2_DEVELOPER: {
    name: "Developer",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
  },
  TIER_3_ACCELERATOR: {
    name: "Accelerator",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
};

const guideLevelLabels: Record<string, string> = {
  GUIDE_I: "Guide I (80% Coach)",
  GUIDE_II: "Guide II (Balanced)",
  GUIDE_III: "Guide III (80% Mentor)",
  GUIDE_SPECIALIST: "Specialist",
};

export default async function CreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's family
  const { data: familyMember } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  const familyId = familyMember?.family_id;

  // Get credit balance from ledger
  const { data: creditEntry } = await supabase
    .from("credit_ledger")
    .select("balance_after")
    .eq("family_id", familyId || "")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const creditBalance = creditEntry?.balance_after || 0;

  // Get credit history
  const { data: creditHistory } = await supabase
    .from("credit_ledger")
    .select(
      `
      id,
      transaction_type,
      amount,
      balance_after,
      description,
      created_at
    `,
    )
    .eq("family_id", familyId || "")
    .order("created_at", { ascending: false })
    .limit(20);

  // Get students in family with their eligibility tiers
  const { data: studentsRaw } = await supabase
    .from("students_profile")
    .select(
      `
      user_id,
      student_eligibility_profiles(total_score)
    `,
    )
    .eq("family_id", familyId || "");

  // Fetch student names separately (avoids RLS join issues)
  const studentIds = (studentsRaw || []).map((s) => s.user_id);
  const { data: studentProfiles } =
    studentIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", studentIds)
      : { data: [] };

  const studentNameMap = new Map(
    (studentProfiles || []).map((s) => [s.id, s.full_name]),
  );
  const students = (studentsRaw || []).map((s) => ({
    ...s,
    users_profile: { full_name: studentNameMap.get(s.user_id) || "Student" },
  }));

  // Determine highest tier among all students
  let highestTier: string | null = null;
  students?.forEach((student) => {
    const eligibility = Array.isArray(student.student_eligibility_profiles)
      ? student.student_eligibility_profiles[0]
      : student.student_eligibility_profiles;
    const score = eligibility?.total_score || 0;
    let tier = null;
    if (score >= 23) tier = "TIER_3_ACCELERATOR";
    else if (score >= 20) tier = "TIER_2_DEVELOPER";
    else if (score >= 16) tier = "TIER_1_EXPLORER";

    if (tier === "TIER_3_ACCELERATOR") highestTier = tier;
    else if (
      tier === "TIER_2_DEVELOPER" &&
      highestTier !== "TIER_3_ACCELERATOR"
    )
      highestTier = tier;
    else if (tier === "TIER_1_EXPLORER" && !highestTier) highestTier = tier;
  });

  // Get available products - both base packages and tier-specific
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .in("product_type", ["package", "subscription"])
    .order("price_cents", { ascending: true });

  // Separate base products from tiered products
  const baseProducts =
    products?.filter((p) => !p.eligibility_tier_required) || [];
  const tieredProducts =
    products?.filter((p) => p.eligibility_tier_required) || [];

  // Filter tiered products based on student eligibility
  const eligibleTieredProducts = tieredProducts.filter((p) => {
    if (!highestTier) return false;
    if (highestTier === "TIER_3_ACCELERATOR") return true;
    if (highestTier === "TIER_2_DEVELOPER") {
      return p.eligibility_tier_required !== "TIER_3_ACCELERATOR";
    }
    if (highestTier === "TIER_1_EXPLORER") {
      return p.eligibility_tier_required === "TIER_1_EXPLORER";
    }
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Credits & Packages
        </h1>
        <p className="text-slate-600">
          Manage your tutoring credits and explore programs
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Available Credits</p>
              <p className="text-5xl font-bold mt-1">{creditBalance}</p>
              <p className="text-blue-100 text-sm mt-2">
                {creditBalance === 1
                  ? "1 session remaining"
                  : `${creditBalance} sessions remaining`}
              </p>
            </div>
            <div className="w-20 h-20 bg-blue-500/30 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base Credit Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-500"
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
            Standard Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {baseProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {baseProducts.map((product) => {
                const metadata = product.metadata as {
                  popular?: boolean;
                  savings_percent?: number;
                } | null;
                const isPopular = metadata?.popular;

                return (
                  <div
                    key={product.id}
                    className={`relative p-5 border-2 rounded-xl transition-all hover:shadow-md ${
                      isPopular
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-4xl font-bold text-slate-900">
                        {product.credits}
                      </p>
                      <p className="text-slate-600 mt-1">
                        {product.credits === 1 ? "Credit" : "Credits"}
                      </p>

                      <div className="mt-4">
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(product.price_cents)}
                        </p>
                        {metadata?.savings_percent && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            Save {metadata.savings_percent}%
                          </p>
                        )}
                      </div>

                      <p className="text-sm text-slate-500 mt-2 min-h-[40px]">
                        {product.description}
                      </p>

                      <Link
                        href={`/parent/purchase?product=${product.id}`}
                        className={`mt-4 w-full inline-block py-2.5 px-4 rounded-lg font-medium transition-colors ${
                          isPopular
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Purchase
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-6">
              No standard packages available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tiered Packages (Guide Model) */}
      {eligibleTieredProducts.length > 0 && (
        <Card className="border-2 border-amber-200">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              Tiered Programs
              {highestTier && (
                <Badge className={`ml-2 ${tierInfo[highestTier]?.bgColor}`}>
                  {tierInfo[highestTier]?.name} Tier Eligible
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Premium programs with specialized guides based on your
              student&apos;s eligibility tier
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eligibleTieredProducts.map((product) => {
                const tier = product.eligibility_tier_required;
                const tierDisplay = tier ? tierInfo[tier] : null;

                return (
                  <div
                    key={product.id}
                    className={`relative p-5 border-2 rounded-xl transition-all hover:shadow-md ${tierDisplay?.bgColor || "border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      {tierDisplay && (
                        <Badge className={tierDisplay.bgColor}>
                          {tierDisplay.name}
                        </Badge>
                      )}
                      {product.guide_level_required && (
                        <span className="text-xs text-slate-500">
                          {guideLevelLabels[product.guide_level_required] ||
                            product.guide_level_required}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-900 text-lg">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 min-h-[48px]">
                      {product.description}
                    </p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        {formatCurrency(product.price_cents)}
                      </span>
                      <span className="text-slate-500">
                        / {product.credits} sessions
                      </span>
                    </div>

                    <Link
                      href={`/parent/purchase?product=${product.id}`}
                      className={`mt-4 w-full inline-block py-2.5 px-4 rounded-lg font-medium transition-colors text-center ${
                        tier === "TIER_3_ACCELERATOR"
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : tier === "TIER_2_DEVELOPER"
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      Enroll
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not Eligible Notice */}
      {!highestTier && tieredProducts.length > 0 && (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 text-lg">
              Tiered Programs Available
            </h3>
            <p className="text-slate-600 mt-2 max-w-md mx-auto">
              Premium programs with specialized guides are available based on
              eligibility assessments. Ask your tutor to complete an eligibility
              assessment to unlock these programs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Credit History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creditHistory && creditHistory.length > 0 ? (
            <div className="space-y-3">
              {creditHistory.map((entry) => {
                const isPositive = entry.amount > 0;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isPositive ? "bg-green-100" : "bg-slate-100"
                        }`}
                      >
                        {isPositive ? (
                          <svg
                            className="w-5 h-5 text-green-600"
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
                        ) : (
                          <svg
                            className="w-5 h-5 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 12H4"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {entry.description || entry.transaction_type}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${isPositive ? "text-green-600" : "text-slate-600"}`}
                      >
                        {isPositive ? "+" : ""}
                        {entry.amount}
                      </p>
                      <p className="text-sm text-slate-500">
                        Balance: {entry.balance_after}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-slate-500">No transaction history yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Your credit transactions will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
