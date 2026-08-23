import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PROGRAMS } from "@/lib/stripe/programs";
import { ManageSubscriptionButton } from "./ManageSubscriptionButton";

type PurchaseStatus = "pending" | "completed" | "failed" | "refunded";

const STATUS_COLORS: Record<
  PurchaseStatus,
  "warning" | "success" | "danger" | "secondary"
> = {
  pending: "warning",
  completed: "success",
  failed: "danger",
  refunded: "secondary",
};

const SUBSCRIPTION_STATUS_COLORS: Record<
  string,
  "warning" | "success" | "danger" | "secondary" | "info"
> = {
  trialing: "info",
  active: "success",
  past_due: "warning",
  unpaid: "danger",
  paused: "secondary",
  canceled: "secondary",
  incomplete: "warning",
  incomplete_expired: "secondary",
};

export default async function ParentBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get family info
  const { data: familyMember } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  const familyId = familyMember?.family_id;

  // Coaching subscription. Scoped to this user explicitly rather than relying
  // on RLS alone: migration 00049 also grants admins FOR ALL on this table, so
  // a policy-only query would show an admin some other family's subscription
  // when they open their own billing page.
  const ownedBy = familyId
    ? `parent_user_id.eq.${user.id},family_id.eq.${familyId}`
    : `parent_user_id.eq.${user.id}`;

  const { data: subscription } = await supabase
    .from("program_subscriptions")
    .select(
      "program_tier, status, price_monthly_cents, current_period_end, cancel_at_period_end, canceled_at",
    )
    .or(ownedBy)
    .neq("status", "incomplete_expired")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get purchase history
  const { data: purchases } = await supabase
    .from("purchases")
    .select(
      `
      *,
      product:products(name, product_type, description)
    `,
    )
    .eq("family_id", familyId || "")
    .order("created_at", { ascending: false })
    .limit(50);

  // Get credit ledger
  const { data: creditLedger } = await supabase
    .from("credit_ledger")
    .select("*")
    .eq("family_id", familyId || "")
    .order("created_at", { ascending: false })
    .limit(20);

  // Get current balance
  const currentBalance = creditLedger?.[0]?.balance_after || 0;

  // Calculate stats
  const totalSpent =
    purchases
      ?.filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;
  const totalCreditsUsed =
    creditLedger
      ?.filter((l) => l.change_amount < 0)
      .reduce((sum, l) => sum + Math.abs(l.change_amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Billing & Credits
          </h1>
          <p className="text-slate-600">
            View your purchase history and credit transactions
          </p>
        </div>
        <Link
          href="/parent/purchase"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Purchase Credits
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Current Balance</p>
              <p className="text-3xl font-bold text-emerald-600">
                {currentBalance}
              </p>
              <p className="text-xs text-slate-500">credits</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Spent</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Credits Used</p>
              <p className="text-3xl font-bold text-blue-600">
                {totalCreditsUsed}
              </p>
              <p className="text-xs text-slate-500">all time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coaching Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Coaching Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-slate-900">
                    {PROGRAMS[
                      subscription.program_tier as keyof typeof PROGRAMS
                    ]?.displayName ?? "Coaching Program"}
                  </h4>
                  <Badge
                    variant={
                      SUBSCRIPTION_STATUS_COLORS[subscription.status] ??
                      "secondary"
                    }
                  >
                    {subscription.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-slate-900">
                  {formatCurrency(subscription.price_monthly_cents)}
                  <span className="text-slate-500"> / month</span>
                </p>
                {subscription.current_period_end && (
                  <p className="mt-1 text-sm text-slate-500">
                    {subscription.cancel_at_period_end ||
                    subscription.canceled_at
                      ? `Ends ${formatDate(subscription.current_period_end)}`
                      : `Renews ${formatDate(subscription.current_period_end)}`}
                  </p>
                )}
              </div>
              <ManageSubscriptionButton />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases && purchases.length > 0 ? (
            <div className="space-y-3">
              {purchases.map((purchase) => {
                const product = purchase.product as {
                  name: string;
                  product_type: string;
                  description: string;
                } | null;

                return (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {product?.name || "Credit Purchase"}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {formatDate(purchase.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(purchase.amount_cents)}
                        </p>
                        {purchase.credits_amount && (
                          <p className="text-xs text-slate-500">
                            +{purchase.credits_amount} credits
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          STATUS_COLORS[purchase.status as PurchaseStatus]
                        }
                      >
                        {purchase.status}
                      </Badge>
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No Purchases Yet
              </h3>
              <p className="text-slate-500 mb-4">
                Purchase credits to book coaching sessions.
              </p>
              <Link
                href="/parent/purchase"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Purchase Credits
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Ledger */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {creditLedger && creditLedger.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium text-right">Change</th>
                    <th className="pb-3 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {creditLedger.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="py-3 text-slate-900">
                        {entry.reason || "Credit transaction"}
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${entry.change_amount >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {entry.change_amount >= 0 ? "+" : ""}
                        {entry.change_amount}
                      </td>
                      <td className="py-3 text-right text-slate-900">
                        {entry.balance_after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-4">
              No credit transactions yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
