import { NextResponse } from 'next/server';
import { getCachedDashboardData } from '@/lib/dashboard-data';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET() {
  try {
    const dashboardData = await getCachedDashboardData();

    return NextResponse.json(dashboardData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
