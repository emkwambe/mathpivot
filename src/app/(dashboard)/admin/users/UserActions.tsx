"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateUserRole,
  updateUserProfile,
  deactivateUser,
  reactivateUser,
} from "@/app/actions/users";
import type { UserRecord } from "@/types/views";

interface UserActionsProps {
  users: UserRecord[];
  roleColors: Record<string, string>;
}

export function UserActions({ users, roleColors }: UserActionsProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: string) {
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("role", newRole);
    const result = await updateUserRole(fd);
    if (!result.success) setError(result.error || "Failed");
    setLoading(false);
    router.refresh();
  }

  async function handleSaveProfile(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updateUserProfile(formData);
    if (!result.success) setError(result.error || "Failed");
    else setEditingId(null);
    setLoading(false);
    router.refresh();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleToggleActive(userId: string, isBanned: boolean) {
    setLoading(true);
    setError(null);
    const result = isBanned
      ? await reactivateUser(userId)
      : await deactivateUser(userId);
    if (!result.success) setError(result.error || "Failed");
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u: UserRecord) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {u.full_name}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={loading || u.role === "super_admin"}
                    className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${roleColors[u.role] || "bg-slate-100"}`}
                  >
                    {u.role === "super_admin" && (
                      <option value="super_admin">super_admin</option>
                    )}
                    <option value="admin">admin</option>
                    <option value="tutor">coach</option>
                    <option value="parent">parent</option>
                    <option value="student">student</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {new Date(u.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        setEditingId(editingId === u.id ? null : u.id)
                      }
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      {editingId === u.id ? "Cancel" : "Edit"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-slate-400">No users found.</div>
        )}
      </div>

      {/* Edit Panel */}
      {editingId &&
        (() => {
          const u = users.find((usr: UserRecord) => usr.id === editingId);
          if (!u) return null;
          return (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
              <h3 className="font-medium text-slate-900 mb-3">
                Edit: {u.full_name}
              </h3>
              <form
                action={handleSaveProfile}
                className="grid grid-cols-2 gap-3"
              >
                <input type="hidden" name="userId" value={u.id} />
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    defaultValue={u.full_name}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={u.phone || ""}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    name="timezone"
                    defaultValue={u.timezone || "America/New_York"}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          );
        })()}
    </div>
  );
}
