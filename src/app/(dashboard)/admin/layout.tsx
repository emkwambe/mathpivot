import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow both admin and super_admin roles
  const user = await requireRole(['admin', 'super_admin']);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
