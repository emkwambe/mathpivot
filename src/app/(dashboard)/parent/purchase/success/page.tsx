import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { getCheckoutSession } from '@/lib/stripe';

async function PurchaseSuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  let credits = 0;
  let productName = 'Credit Package';

  if (sessionId) {
    const session = await getCheckoutSession(sessionId);
    if (session?.metadata) {
      const supabase = await createClient();
      const { data: product } = await supabase
        .from('products')
        .select('name, credits')
        .eq('id', session.metadata.product_id)
        .single();

      if (product) {
        credits = product.credits;
        productName = product.name;
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-12">
      <Card>
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
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
          </div>
          <CardTitle className="text-center text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Thank you for your purchase of <strong>{productName}</strong>.
          </p>
          {credits > 0 && (
            <p className="text-lg">
              <strong>{credits} credits</strong> have been added to your account.
            </p>
          )}
          <div className="pt-4 space-x-4">
            <Link href="/parent/book">
              <Button>Book a Session</Button>
            </Link>
            <Link href="/parent">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PurchaseSuccessPage(props: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto mt-12 text-center">
          <p>Loading...</p>
        </div>
      }
    >
      <PurchaseSuccessContent searchParams={props.searchParams} />
    </Suspense>
  );
}
