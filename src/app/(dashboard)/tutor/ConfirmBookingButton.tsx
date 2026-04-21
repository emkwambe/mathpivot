"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmBooking } from "@/app/actions/booking";

interface ConfirmBookingButtonProps {
  bookingId: string;
}

export function ConfirmBookingButton({ bookingId }: ConfirmBookingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const result = await confirmBooking(bookingId);
    if (!result.success) {
      setError(result.error || "Failed to confirm");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Confirming..." : "Confirm"}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
