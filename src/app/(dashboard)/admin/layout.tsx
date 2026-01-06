import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('admin');

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
