import OverviewDashboard from '@/components/dashboard/OverviewDashboard';
import { getCachedPublicDashboardData } from '@/lib/dashboard-data';

export const revalidate = 60;

export default async function HomePage() {
  const initialData = await getCachedPublicDashboardData();
  return <OverviewDashboard mode="view" initialData={initialData} />;
}
