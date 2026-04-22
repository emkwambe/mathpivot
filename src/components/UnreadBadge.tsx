"use client";

import { useEffect, useState } from "react";

/**
 * Displays an unread message count badge.
 * Fetches from /api/auth/check-style endpoint — lightweight polling.
 */
export function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const res = await fetch("/api/messages/unread", { method: "GET" });
        if (res.ok && mounted) {
          const data = await res.json();
          setCount(data.count || 0);
        }
      } catch {
        // Silent fail — badge is optional
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll every 30s (reduced from 15s)

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-auto flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
      <span className="text-white text-[10px] font-bold">
        {count > 9 ? "9+" : count}
      </span>
    </span>
  );
}
