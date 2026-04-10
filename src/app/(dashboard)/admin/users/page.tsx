import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserActions } from './UserActions';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: users } = await supabase
    .from('users_profile')
    .select('*')
    .order('created_at', { ascending: false });

  const roleColors: Record<string, string> = {
    'super_admin': 'bg-red-100 text-red-800',
    'admin': 'bg-purple-100 text-purple-800',
    'tutor': 'bg-green-100 text-green-800',
    'parent': 'bg-blue-100 text-blue-800',
    'student': 'bg-orange-100 text-orange-800',
  };

  const stats = {
    total: users?.length || 0,
    admins: users?.filter(u => u.role === 'admin' || u.role === 'super_admin').length || 0,
    tutors: users?.filter(u => u.role === 'tutor').length || 0,
    parents: users?.filter(u => u.role === 'parent').length || 0,
    students: users?.filter(u => u.role === 'student').length || 0,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage all platform users</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
          <p className="text-xs text-slate-500">Admins</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-green-600">{stats.tutors}</p>
          <p className="text-xs text-slate-500">Tutors</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-blue-600">{stats.parents}</p>
          <p className="text-xs text-slate-500">Parents</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-orange-600">{stats.students}</p>
          <p className="text-xs text-slate-500">Students</p>
        </div>
      </div>

      <UserActions users={users || []} roleColors={roleColors} />
    </div>
  );
}
