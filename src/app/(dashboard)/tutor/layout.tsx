import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('tutor');

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
