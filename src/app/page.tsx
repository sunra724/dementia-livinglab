import OverviewDashboard from '@/components/dashboard/OverviewDashboard';
import { getCachedDashboardData } from '@/lib/dashboard-data';

export const revalidate = 60;

export default async function HomePage() {
  const initialData = await getCachedDashboardData();

  return <OverviewDashboard mode="view" initialData={initialData} />;
}
