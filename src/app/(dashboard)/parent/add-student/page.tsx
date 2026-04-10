'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addStudentToFamily } from '@/app/actions/family';

const COURSE_TRACKS = [
  { value: 'math_1', label: 'Math 1 (Algebra)' },
  { value: 'math_2', label: 'Math 2 (Geometry)' },
  { value: 'math_3', label: 'Math 3 (Algebra 2/Trig)' },
  { value: 'pre_calc', label: 'Pre-Calculus' },
  { value: 'ap_calc_ab', label: 'AP Calculus AB' },
  { value: 'ap_calc_bc', label: 'AP Calculus BC' },
  { value: 'ap_stats', label: 'AP Statistics' },
];

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await addStudentToFamily(formData);
    if (!result.success) {
      setError(result.error || 'Failed to add student');
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/parent'), 2000);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-800">Student Added!</h2>
          <p className="text-green-600 mt-2">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add a Student</h1>
        <p className="text-sm text-slate-500">Add your child to your family account</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student&apos;s Full Name *</label>
            <input type="text" name="fullName" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Alex Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student&apos;s Email *</label>
            <input type="email" name="email" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="alex@example.com" />
            <p className="text-xs text-slate-400 mt-1">They&apos;ll use this to log in. Default password: Welcome123!</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade *</label>
              <select name="grade" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course Track</label>
              <select name="courseTrack" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {COURSE_TRACKS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Goals (optional)</label>
            <textarea name="goals" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Improve algebra grades, prepare for AP Calc..." />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Adding...' : 'Add Student'}
          </button>
        </form>
      </div>
    </div>
  );
}
