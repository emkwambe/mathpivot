"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Lightweight auto-refresh for message threads.
 * Polls every 5 seconds to fetch new messages without full Supabase realtime.
 * Minimal overhead — just triggers Next.js router.refresh() which
 * re-runs server components with fresh data.
 */
export function ThreadRefresher() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
