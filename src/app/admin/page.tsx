import OverviewDashboard from '@/components/dashboard/OverviewDashboard';
import { getCachedPublicDashboardData } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const initialData = await getCachedPublicDashboardData();
  return <OverviewDashboard mode="admin" initialData={initialData} />;
}
