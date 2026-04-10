import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getInvoices } from "@/app/actions/invoices";
import { InvoiceActions } from "./InvoiceActions";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  status: string;
  total_cents: number;
  due_date: string | null;
  family?: { name: string };
  parent?: { full_name: string };
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  void: "bg-slate-100 text-slate-400 line-through",
  refunded: "bg-amber-100 text-amber-700",
};

export default async function AdminInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { invoices, error } = await getInvoices();

  const totalOutstanding = invoices
    .filter((i: InvoiceRow) => i.status === "sent" || i.status === "overdue")
    .reduce((s: number, i: InvoiceRow) => s + i.total_cents, 0);
  const totalPaid = invoices
    .filter((i: InvoiceRow) => i.status === "paid")
    .reduce((s: number, i: InvoiceRow) => s + i.total_cents, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">
            Manage family invoices and billing
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Outstanding
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            ${(totalOutstanding / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Collected
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${(totalPaid / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Total Invoices
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {invoices.length}
          </p>
        </div>
      </div>

      <InvoiceActions invoices={invoices} statusColors={statusColors} />
    </div>
  );
}
