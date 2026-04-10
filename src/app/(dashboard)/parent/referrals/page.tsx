import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getMyReferralCode,
  getMyReferrals,
  getRewardPolicy,
} from "@/app/actions/referrals";
import { ReferralForm } from "./ReferralForm";
import type { ReferralRow } from "@/types/views";

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  trial_completed: "bg-blue-100 text-blue-700",
  converted: "bg-green-100 text-green-700",
  rewarded: "bg-emerald-100 text-emerald-700",
  expired: "bg-red-100 text-red-400",
};

export default async function ParentReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ code, stats }, { referrals }, policy] = await Promise.all([
    getMyReferralCode(),
    getMyReferrals(),
    getRewardPolicy(),
  ]);

  const totalEarned = referrals
    .filter((r: ReferralRow) => r.status === "rewarded")
    .reduce((s: number, r: ReferralRow) => s + r.referrer_reward_cents, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Refer a Friend</h1>
        <p className="text-sm text-slate-500">
          Earn credits when families you refer join MathPivot
        </p>
      </div>

      {/* Reward Info */}
      {policy && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white mb-6">
          <h2 className="text-lg font-bold mb-1">{policy.name}</h2>
          <p className="text-blue-100 text-sm mb-4">{policy.description}</p>
          <div className="flex gap-6">
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wide">
                You earn
              </p>
              <p className="text-2xl font-bold">
                ${(policy.referrer_reward_cents / 100).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wide">
                They get
              </p>
              <p className="text-2xl font-bold">
                ${(policy.referred_reward_cents / 100).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wide">
                You&apos;ve earned
              </p>
              <p className="text-2xl font-bold">
                ${(totalEarned / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Referral Code */}
      {code && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-500 mb-1">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <code className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
              {code.code}
            </code>
            <div className="text-sm text-slate-600">
              <p>
                {stats?.total_referrals || 0} referred &middot;{" "}
                {stats?.total_conversions || 0} converted
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refer Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-slate-900 mb-3">Refer Someone</h3>
        <ReferralForm />
      </div>

      {/* Referral History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Your Referrals</h3>
        </div>
        {referrals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No referrals yet. Share your code or use the form above!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Reward
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referrals.map((ref: ReferralRow) => (
                <tr key={ref.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {ref.referred_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ref.referred_email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ref.status] || "bg-slate-100"}`}
                    >
                      {ref.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {ref.referrer_reward_cents > 0
                      ? `$${(ref.referrer_reward_cents / 100).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(ref.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
