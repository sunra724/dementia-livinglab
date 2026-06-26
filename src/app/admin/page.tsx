import OverviewDashboard from '@/components/dashboard/OverviewDashboard';
import { getCachedDashboardData } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const initialData = await getCachedDashboardData();

  return <OverviewDashboard mode="admin" initialData={initialData} />;
}
