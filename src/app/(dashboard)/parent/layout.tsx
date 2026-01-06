import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(['parent', 'student']);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
