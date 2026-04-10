'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkOutStudent, createDropInSlot } from '@/app/actions/dropin';

interface DropInManagerProps {
  attendance: any[];
}

export function DropInManager({ attendance }: DropInManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckOut(attendanceId: string) {
    setLoading(true);
    await checkOutStudent(attendanceId);
    setLoading(false);
    router.refresh();
  }

  async function handleCreateSlot(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createDropInSlot(formData);
    if (!result.success) setError(result.error || 'Failed');
    else setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
          {showForm ? 'Cancel' : 'Create Slot'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-slate-900 mb-3">New Drop-In Slot</h3>
          <form action={handleCreateSlot} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Title *</label>
              <input type="text" name="title" required placeholder="Algebra Help Desk" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tutor ID *</label>
              <input type="text" name="tutorUserId" required placeholder="UUID" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Day of Week</label>
              <select name="dayOfWeek" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Time</label>
              <input type="time" name="startTime" required defaultValue="15:00" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Time</label>
              <input type="time" name="endTime" required defaultValue="17:00" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Max Concurrent</label>
              <input type="number" name="maxConcurrent" min="1" defaultValue="5" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Subject</label>
              <input type="text" name="subject" placeholder="Algebra" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Today's Attendance */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Today&apos;s Attendance</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Student</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Session</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Check In</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Check Out</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attendance.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No check-ins today</td></tr>
            )}
            {attendance.map((a: any) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{a.student?.full_name || 'Unknown'}</td>
                <td className="px-4 py-3 text-slate-700">{a.slot?.title || '-'}</td>
                <td className="px-4 py-3 text-slate-700">
                  {new Date(a.check_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {a.check_out_at
                    ? new Date(a.check_out_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : <span className="text-green-600 font-medium">Active</span>}
                </td>
                <td className="px-4 py-3">
                  {!a.check_out_at && (
                    <button onClick={() => handleCheckOut(a.id)} disabled={loading} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      Check Out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
