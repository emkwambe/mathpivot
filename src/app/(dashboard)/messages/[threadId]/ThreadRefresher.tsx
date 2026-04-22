"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Lightweight auto-refresh for message threads.
 * Uses visibility-aware polling — only refreshes when tab is visible.
 * Reduces server load when user switches tabs.
 */
export function ThreadRefresher() {
  const router = useRouter();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    function startPolling() {
      interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          router.refresh();
        }
      }, 8000); // Poll every 8s (reduced from 5s, only when visible)
    }

    startPolling();

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
