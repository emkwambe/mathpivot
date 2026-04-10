import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDropInSlots, getTodayDropInAttendance } from "@/app/actions/dropin";
import { DropInManager } from "./DropInManager";
import type { DropInAttendanceRow, DropInSlotRow } from "@/types/views";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function AdminDropInPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { slots } = await getDropInSlots();
  const { attendance } = await getTodayDropInAttendance();

  const checkedIn = attendance.filter(
    (a: DropInAttendanceRow) => !a.check_out_at,
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Drop-In Sessions
          </h1>
          <p className="text-sm text-slate-500">
            Manage open lab / walk-in tutoring slots
          </p>
        </div>
      </div>

      {/* Today's Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Active Slots
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {slots.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Currently Checked In
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {checkedIn.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Total Today
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {attendance.length}
          </p>
        </div>
      </div>

      {/* Slots */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Weekly Slots</h2>
        </div>
        {slots.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No drop-in slots configured.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Day
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Time
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Tutor
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Room
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Capacity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.map((slot: DropInSlotRow) => (
                <tr key={slot.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {slot.title}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {DAYS[slot.day_of_week]}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {slot.start_time} - {slot.end_time}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {slot.tutor?.full_name || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {slot.room?.name || slot.modality}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {slot.max_concurrent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Today's Attendance + Create Slot Form */}
      <DropInManager attendance={attendance} />
    </div>
  );
}
