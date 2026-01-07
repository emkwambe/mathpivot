import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function CreditsPage() {
  const user = await requireRole(['parent', 'student']);
  const supabase = await createClient();

  // Get user's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  const familyId = familyMember?.family_id;

  // Get family info with credit balance
  const { data: family } = await supabase
    .from('families')
    .select('credit_balance')
    .eq('id', familyId || '')
    .single();

  // Get credit history
  const { data: creditHistory } = await supabase
    .from('credit_ledger')
    .select(`
      id,
      delta,
      reason,
      balance_after,
      created_at,
      booking_id
    `)
    .eq('family_id', familyId || '')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get available credit packages (products)
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('product_type', 'credit_package')
    .order('price_cents', { ascending: true });

  const creditBalance = family?.credit_balance || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Credits & Packages</h1>
        <p className="text-slate-600">Manage your tutoring credits</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Available Credits</p>
              <p className="text-5xl font-bold mt-1">{creditBalance}</p>
              <p className="text-blue-100 text-sm mt-2">
                {creditBalance === 1 ? '1 session remaining' : `${creditBalance} sessions remaining`}
              </p>
            </div>
            <div className="w-20 h-20 bg-blue-500/30 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Purchase Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((product) => {
                const savings = product.credits > 1
                  ? Math.round((1 - (product.price_cents / product.credits) / (products[0]?.price_cents || product.price_cents)) * 100)
                  : 0;
                const isPopular = product.credits === 5;

                return (
                  <div
                    key={product.id}
                    className={`relative p-5 border-2 rounded-xl transition-all hover:shadow-md ${
                      isPopular ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
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
                      <p className="text-4xl font-bold text-slate-900">{product.credits}</p>
                      <p className="text-slate-600 mt-1">
                        {product.credits === 1 ? 'Credit' : 'Credits'}
                      </p>

                      <div className="mt-4">
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(product.price_cents)}
                        </p>
                        {savings > 0 && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            Save {savings}%
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/parent/purchase?product=${product.id}`}
                        className={`mt-4 w-full inline-block py-2.5 px-4 rounded-lg font-medium transition-colors ${
                          isPopular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-500">No credit packages available at the moment.</p>
              <p className="text-sm text-slate-400 mt-1">Please check back later or contact support.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creditHistory && creditHistory.length > 0 ? (
            <div className="space-y-3">
              {creditHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      entry.delta > 0 ? 'bg-green-100' : 'bg-slate-100'
                    }`}>
                      {entry.delta > 0 ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{entry.reason}</p>
                      <p className="text-sm text-slate-500">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${entry.delta > 0 ? 'text-green-600' : 'text-slate-600'}`}>
                      {entry.delta > 0 ? '+' : ''}{entry.delta}
                    </p>
                    <p className="text-sm text-slate-500">Balance: {entry.balance_after}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500">No transaction history yet</p>
              <p className="text-sm text-slate-400 mt-1">Your credit transactions will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
