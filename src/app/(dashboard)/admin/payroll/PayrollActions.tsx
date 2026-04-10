'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PayrollActionsProps {
  periods: any[];
  selectedPeriodId: string | undefined;
  selectedPeriodLocked: boolean | undefined;
  createPayoutPeriod: (formData: FormData) => Promise<any>;
  generatePayoutsForPeriod: (periodId: string) => Promise<any>;
  approvePayout: (payoutId: string) => Promise<any>;
  markPayoutPaid: (payoutId: string) => Promise<any>;
  payouts: any[];
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export function PayrollActions({
  periods,
  selectedPeriodId,
  selectedPeriodLocked,
  createPayoutPeriod,
  generatePayoutsForPeriod,
  approvePayout,
  markPayoutPaid,
  payouts,
}: PayrollActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!selectedPeriodId) return;
    setLoading(true);
    setError(null);
    const result = await generatePayoutsForPeriod(selectedPeriodId);
    if (!result.success) setError(result.error || 'Failed');
    setLoading(false);
    router.refresh();
  }

  async function handleApprove(payoutId: string) {
    setLoading(true);
    await approvePayout(payoutId);
    setLoading(false);
    router.refresh();
  }

  async function handleMarkPaid(payoutId: string) {
    setLoading(true);
    await markPayoutPaid(payoutId);
    setLoading(false);
    router.refresh();
  }

  async function handleCreatePeriod(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createPayoutPeriod(formData);
    if (!result.success) setError(result.error || 'Failed');
    else setShowNewPeriod(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Period Selector + Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={selectedPeriodId || ''}
          onChange={(e) => router.push(`/admin/payroll?period=${e.target.value}`)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          {periods.length === 0 && <option value="">No periods</option>}
          {periods.map((p: any) => (
            <option key={p.id} value={p.id}>
              {new Date(p.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' - '}
              {new Date(p.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {p.is_locked ? ' (locked)' : ''}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedPeriodId || selectedPeriodLocked}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Generate Payouts'}
        </button>

        <button
          onClick={() => setShowNewPeriod(true)}
          className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          New Period
        </button>
      </div>

      {/* New Period Form */}
      {showNewPeriod && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-slate-900 mb-3">Create Payout Period</h3>
          <form action={handleCreatePeriod} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select name="periodType" className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="biweekly">Biweekly</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start</label>
              <input type="date" name="periodStart" required className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End</label>
              <input type="date" name="periodEnd" required className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              Create
            </button>
            <button type="button" onClick={() => setShowNewPeriod(false)} className="text-slate-500 text-sm hover:text-slate-700">
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Payouts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Tutor</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Sessions</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Hours</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payouts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  {selectedPeriodId ? 'No payouts for this period. Click "Generate Payouts" to calculate.' : 'Select or create a payout period.'}
                </td>
              </tr>
            )}
            {payouts.map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{p.tutor?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{p.tutor?.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{p.sessions_count}</td>
                <td className="px-4 py-3 text-slate-700">{Number(p.total_hours).toFixed(1)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  ${(p.total_amount_cents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || 'bg-slate-100'}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {(p.status === 'draft' || p.status === 'pending_approval') && (
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Approve
                      </button>
                    )}
                    {p.status === 'approved' && (
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        disabled={loading}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
