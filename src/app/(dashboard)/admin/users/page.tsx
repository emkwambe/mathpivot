import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check admin role
  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  // Get all users with their profiles
  const { data: users } = await supabase
    .from('users_profile')
    .select('*')
    .order('created_at', { ascending: false });

  const roleColors: Record<string, string> = {
    'admin': 'bg-purple-100 text-purple-800',
    'tutor': 'bg-green-100 text-green-800',
    'parent': 'bg-blue-100 text-blue-800',
    'student': 'bg-orange-100 text-orange-800',
  };

  const stats = {
    total: users?.length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
    tutors: users?.filter(u => u.role === 'tutor').length || 0,
    parents: users?.filter(u => u.role === 'parent').length || 0,
    students: users?.filter(u => u.role === 'student').length || 0,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600">Manage all platform users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-sm text-slate-500">Total Users</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-purple-600">{stats.admins}</p>
          <p className="text-sm text-slate-500">Admins</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-green-600">{stats.tutors}</p>
          <p className="text-sm text-slate-500">Tutors</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-blue-600">{stats.parents}</p>
          <p className="text-sm text-slate-500">Parents</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-orange-600">{stats.students}</p>
          <p className="text-sm text-slate-500">Students</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Timezone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{u.full_name}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[u.role] || 'bg-slate-100 text-slate-800'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {u.timezone || 'Not set'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {new Date(u.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!users || users.length === 0) && (
          <div className="p-8 text-center text-slate-500">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
