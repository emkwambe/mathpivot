import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getRooms } from '@/app/actions/recurring';
import { RoomManager } from './RoomManager';

export default async function AdminRoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { rooms, error } = await getRooms();

  const activeRooms = rooms.filter((r: any) => r.is_active);
  const totalCapacity = activeRooms.reduce((s: number, r: any) => s + r.capacity, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rooms & Locations</h1>
          <p className="text-sm text-slate-500">Manage physical and virtual spaces</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Active Rooms</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{activeRooms.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Capacity</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalCapacity} students</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Virtual Rooms</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {activeRooms.filter((r: any) => r.is_virtual).length}
          </p>
        </div>
      </div>

      <RoomManager rooms={rooms} />
    </div>
  );
}
