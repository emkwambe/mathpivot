'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom, toggleRoom } from '@/app/actions/recurring';

const typeLabels: Record<string, string> = {
  classroom: 'Classroom',
  lab: 'Computer Lab',
  office: 'Office',
  virtual: 'Virtual',
};

const typeColors: Record<string, string> = {
  classroom: 'bg-blue-100 text-blue-700',
  lab: 'bg-purple-100 text-purple-700',
  office: 'bg-slate-100 text-slate-700',
  virtual: 'bg-green-100 text-green-700',
};

interface RoomManagerProps {
  rooms: any[];
}

export function RoomManager({ rooms }: RoomManagerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createRoom(formData);
    if (!result.success) setError(result.error || 'Failed');
    else setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleToggle(roomId: string, active: boolean) {
    setLoading(true);
    await toggleRoom(roomId, active);
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

      <button
        onClick={() => setShowForm(true)}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 mb-4"
      >
        Add Room
      </button>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-slate-900 mb-3">New Room</h3>
          <form action={handleCreate} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name *</label>
              <input type="text" name="name" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Room 101" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select name="roomType" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="classroom">Classroom</option>
                <option value="lab">Computer Lab</option>
                <option value="office">Office</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Capacity</label>
              <input type="number" name="capacity" min="1" defaultValue="6" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Location</label>
              <input type="text" name="location" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Building A" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Floor</label>
              <input type="text" name="floor" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="2nd Floor" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Virtual Link</label>
              <input type="url" name="virtualLink" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="https://zoom.us/..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <input type="text" name="notes" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Whiteboard, projector available" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                Create
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 text-sm hover:text-slate-700">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Room List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Room</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Capacity</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Location</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No rooms yet. Add your first room above.
                </td>
              </tr>
            )}
            {rooms.map((room: any) => (
              <tr key={room.id} className={!room.is_active ? 'opacity-50' : ''}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{room.name}</p>
                  {room.virtual_link && (
                    <p className="text-xs text-blue-500 truncate max-w-[200px]">{room.virtual_link}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[room.room_type] || 'bg-slate-100'}`}>
                    {typeLabels[room.room_type] || room.room_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{room.capacity}</td>
                <td className="px-4 py-3 text-slate-700">
                  {[room.location, room.floor].filter(Boolean).join(', ') || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {room.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(room.id, !room.is_active)}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {room.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
