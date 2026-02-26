'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';

interface Product {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price_cents: number;
  product_type: string;
  stripe_price_id: string | null;
}

export default function PurchasePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch products and family info
        const [productsRes, familyRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/family'),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products || []);
        }

        if (familyRes.ok) {
          const data = await familyRes.json();
          setFamilyId(data.familyId);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handlePurchase(productId: string) {
    if (!familyId) {
      setError('Family not found');
      return;
    }

    setPurchasing(productId);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, familyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <p className="text-center text-gray-500">Loading products...</p>
      </div>
    );
  }

  const packages = products.filter((p) => p.product_type === 'package');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Purchase Credits</h1>
        <p className="text-gray-600 mt-2">
          Choose a credit package to book tutoring sessions for your students.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((product) => {
          const pricePerCredit = product.price_cents / product.credits / 100;
          const isPopular = product.credits >= 8 && product.credits <= 12;

          return (
            <Card
              key={product.id}
              className={isPopular ? 'border-blue-500 border-2 relative' : ''}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="info">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                {product.description && (
                  <p className="text-sm text-gray-500">{product.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold">
                    ${(product.price_cents / 100).toFixed(0)}
                  </div>
                  <div className="text-gray-500">
                    {product.credits} credits
                  </div>
                  <div className="text-sm text-gray-400">
                    ${pricePerCredit.toFixed(2)} per session
                  </div>
                </div>

                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {product.credits} one-hour sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Never expires
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Use for any student
                  </li>
                </ul>

                <Button
                  onClick={() => handlePurchase(product.id)}
                  disabled={purchasing !== null || !product.stripe_price_id}
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                >
                  {purchasing === product.id
                    ? 'Processing...'
                    : !product.stripe_price_id
                      ? 'Coming Soon'
                      : 'Buy Now'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {packages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No credit packages available at this time.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
