'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendInvoice, markInvoicePaid, voidInvoice } from '@/app/actions/invoices';

interface InvoiceActionsProps {
  invoices: any[];
  statusColors: Record<string, string>;
}

export function InvoiceActions({ invoices, statusColors }: InvoiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(invoiceId: string) {
    setLoading(true);
    setError(null);
    const result = await sendInvoice(invoiceId);
    if (!result.success) setError(result.error || 'Failed to send');
    setLoading(false);
    router.refresh();
  }

  async function handleMarkPaid(invoiceId: string) {
    setLoading(true);
    setError(null);
    const result = await markInvoicePaid(invoiceId);
    if (!result.success) setError(result.error || 'Failed');
    setLoading(false);
    router.refresh();
  }

  async function handleVoid(invoiceId: string) {
    setLoading(true);
    setError(null);
    const result = await voidInvoice(invoiceId);
    if (!result.success) setError(result.error || 'Failed');
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Family</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Due Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No invoices yet. Generate invoices from completed sessions.
                </td>
              </tr>
            )}
            {invoices.map((inv: unknown) => (
              <tr key={inv.id}>
                <td className="px-4 py-3 font-mono text-slate-900 text-xs">{inv.invoice_number}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{inv.family?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{inv.parent?.full_name}</p>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  ${(inv.total_cents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {inv.due_date
                    ? new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-slate-100'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {inv.status === 'draft' && (
                      <button
                        onClick={() => handleSend(inv.id)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Send
                      </button>
                    )}
                    {(inv.status === 'sent' || inv.status === 'overdue') && (
                      <button
                        onClick={() => handleMarkPaid(inv.id)}
                        disabled={loading}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        Mark Paid
                      </button>
                    )}
                    {inv.status !== 'void' && inv.status !== 'paid' && (
                      <button
                        onClick={() => handleVoid(inv.id)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Void
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

