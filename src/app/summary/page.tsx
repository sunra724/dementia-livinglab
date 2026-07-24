import type { Metadata } from 'next';
import OverviewDashboard from '@/components/dashboard/OverviewDashboard';
import { getCachedPublicDashboardData } from '@/lib/dashboard-data';

export const metadata: Metadata = {
  title: '치매돌봄 리빙랩 핵심 성과 요약',
  description: '발주기관과 협력기관을 위한 치매돌봄 리빙랩 읽기 전용 성과 요약',
};

export const revalidate = 60;

export default async function SummaryPage() {
  const initialData = await getCachedPublicDashboardData();
  return <OverviewDashboard mode="summary" initialData={initialData} />;
}
