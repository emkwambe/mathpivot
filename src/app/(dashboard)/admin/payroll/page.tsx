import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getPayoutPeriods, getPayoutsForPeriod, createPayoutPeriod, generatePayoutsForPeriod, approvePayout, markPayoutPaid } from '@/app/actions/payroll';
import { PayrollActions } from './PayrollActions';

export default async function AdminPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const { periods, error: periodsError } = await getPayoutPeriods();

  const selectedPeriodId = params.period || periods?.[0]?.id;
  const { payouts } = selectedPeriodId
    ? await getPayoutsForPeriod(selectedPeriodId)
    : { payouts: [] };

  const selectedPeriod = periods?.find((p: unknown) => p.id === selectedPeriodId);

  // Summary stats
  const totalPayable = payouts.reduce((s: number, p: unknown) => s + p.total_amount_cents, 0);
  const pendingCount = payouts.filter((p: unknown) => p.status === 'draft' || p.status === 'pending_approval').length;
  const approvedCount = payouts.filter((p: unknown) => p.status === 'approved').length;
  const paidCount = payouts.filter((p: unknown) => p.status === 'paid').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tutor Payroll</h1>
          <p className="text-sm text-slate-500">Manage tutor earnings and payouts</p>
        </div>
      </div>

      {periodsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{periodsError}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Payable</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ${(totalPayable / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Approved</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{paidCount}</p>
        </div>
      </div>

      {/* Actions + Period Selector */}
      <PayrollActions
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        selectedPeriodLocked={selectedPeriod?.is_locked}
        createPayoutPeriod={createPayoutPeriod}
        generatePayoutsForPeriod={generatePayoutsForPeriod}
        approvePayout={approvePayout}
        markPayoutPaid={markPayoutPaid}
        payouts={payouts}
      />
    </div>
  );
}

