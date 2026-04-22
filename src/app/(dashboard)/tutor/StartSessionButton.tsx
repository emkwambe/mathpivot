"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startSession } from "@/app/actions/session";

interface StartSessionButtonProps {
  bookingId: string;
}

export function StartSessionButton({ bookingId }: StartSessionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleStart() {
    setLoading(true);
    setError(null);
    const result = await startSession(bookingId);
    if (!result.success) {
      setError(result.error || "Failed to start session");
      setLoading(false);
      return;
    }
    // Navigate to the session detail page
    if (result.sessionId) {
      router.push(`/tutor/sessions/${result.sessionId}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <button
        onClick={handleStart}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Starting..." : "Start Session"}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
