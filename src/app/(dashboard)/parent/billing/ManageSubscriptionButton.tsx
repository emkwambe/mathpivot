"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { openBillingPortalAction } from "@/app/actions/billing-portal";

export function ManageSubscriptionButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await openBillingPortalAction();
      if (result.error || !result.url) {
        setError(result.error ?? "Could not open the billing portal.");
        return;
      }
      // Full navigation, not router.push — the portal is a Stripe-hosted
      // origin and the App Router cannot navigate to it.
      window.location.href = result.url;
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} isLoading={isPending} disabled={isPending}>
        {isPending ? "Opening portal…" : "Manage subscription"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
