import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMyInvoices } from '@/app/actions/invoices';

const statusColors: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export default async function ParentInvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { invoices, error } = await getMyInvoices();

  const outstanding = invoices.filter((i: any) => i.status === 'sent' || i.status === 'overdue');
  const totalOwed = outstanding.reduce((s: number, i: any) => s + i.total_cents, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Invoices</h1>
        <p className="text-sm text-slate-500">View your billing statements</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Outstanding Balance */}
      {totalOwed > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Outstanding Balance</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">${(totalOwed / 100).toFixed(2)}</p>
            </div>
            <p className="text-sm text-amber-700">{outstanding.length} unpaid invoice{outstanding.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Invoice List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-700">No invoices yet</h2>
            <p className="text-slate-500 mt-1">Your billing statements will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Due</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-mono text-slate-900 text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {inv.issued_at
                      ? new Date(inv.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    ${(inv.total_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {inv.due_date
                      ? new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-slate-100 text-slate-700'}`}>
                      {inv.status}
                    </span>
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
