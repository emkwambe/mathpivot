import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

async function createProductAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;

  const supabase = await createClient();

  await supabase
    .from('products')
    .insert({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      type: formData.get('type') as 'package' | 'subscription',
      price_cents: parseInt(formData.get('priceCents') as string, 10),
      credits: parseInt(formData.get('credits') as string, 10),
      billing_period: formData.get('billingPeriod') as string || null,
      stripe_price_id: (formData.get('stripePriceId') as string) || null,
      is_active: true,
    });

  revalidatePath('/admin/products');
}

async function toggleProductAction(productId: string, isActive: boolean) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;

  const supabase = await createClient();

  await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId);

  revalidatePath('/admin/products');
}

export default async function AdminProductsPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  // Get all products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('type')
    .order('price_cents');

  const packages = products?.filter((p) => p.type === 'package') || [];
  const subscriptions = products?.filter((p) => p.type === 'subscription') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Products & Pricing</h1>
        <p className="text-slate-600">Manage credit packages and subscription plans</p>
      </div>

      {/* Add Product Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProductAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Starter Pack"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type *
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="package">Credit Package</option>
                  <option value="subscription">Subscription</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price (cents) *
                </label>
                <input
                  type="number"
                  name="priceCents"
                  required
                  min="0"
                  placeholder="9900"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">Enter price in cents (e.g., 9900 = $99.00)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Credits *
                </label>
                <input
                  type="number"
                  name="credits"
                  required
                  min="0"
                  placeholder="4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Billing Period
                </label>
                <select
                  name="billingPeriod"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">N/A (for packages)</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Stripe Price ID
                </label>
                <input
                  type="text"
                  name="stripePriceId"
                  placeholder="price_..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Product description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            </div>

            <Button type="submit">Add Product</Button>
          </form>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Packages</CardTitle>
        </CardHeader>
        <CardContent>
          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 rounded-lg border ${
                    product.is_active
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900">{product.name}</h3>
                      {!product.is_active && (
                        <Badge variant="warning">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(product.price_cents)}
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-2xl font-bold text-sky-600">
                      {product.credits} credits
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(Math.round(product.price_cents / product.credits))}/credit
                    </p>
                  </div>

                  {product.description && (
                    <p className="text-sm text-slate-600 mb-3">{product.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {product.stripe_price_id && (
                      <span className="text-xs text-slate-400">
                        {product.stripe_price_id}
                      </span>
                    )}
                    <form
                      action={toggleProductAction.bind(null, product.id, !product.is_active)}
                    >
                      <button
                        type="submit"
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          product.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {product.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">
              No credit packages created yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 rounded-lg border ${
                    product.is_active
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900">{product.name}</h3>
                      <Badge variant="secondary">
                        {product.billing_period === 'yearly' ? 'Yearly' : 'Monthly'}
                      </Badge>
                      {!product.is_active && (
                        <Badge variant="warning" className="ml-1">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(product.price_cents)}
                      </p>
                      <p className="text-xs text-slate-500">
                        /{product.billing_period === 'yearly' ? 'year' : 'month'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-2xl font-bold text-sky-600">
                      {product.credits} credits
                    </p>
                    <p className="text-sm text-slate-500">
                      per {product.billing_period === 'yearly' ? 'year' : 'month'}
                    </p>
                  </div>

                  {product.description && (
                    <p className="text-sm text-slate-600 mb-3">{product.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {product.stripe_price_id && (
                      <span className="text-xs text-slate-400">
                        {product.stripe_price_id}
                      </span>
                    )}
                    <form
                      action={toggleProductAction.bind(null, product.id, !product.is_active)}
                    >
                      <button
                        type="submit"
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          product.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {product.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">
              No subscription plans created yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
