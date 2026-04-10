'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitReferral } from '@/app/actions/referrals';

export function ReferralForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await submitReferral(formData);

    if (!result.success) {
      setError(result.error || 'Failed to submit referral');
    } else {
      setSuccess(true);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <p className="text-green-700 text-sm">Referral submitted! We&apos;ll reach out to them.</p>
        </div>
      )}
      <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-500 mb-1">Their Name</label>
          <input
            type="text" name="referredName" required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Jane Smith"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-500 mb-1">Their Email</label>
          <input
            type="email" name="referredEmail" required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="jane@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Referral'}
        </button>
      </form>
    </div>
  );
}
