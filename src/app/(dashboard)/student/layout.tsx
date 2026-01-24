import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(['student']);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
