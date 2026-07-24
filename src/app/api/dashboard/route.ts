import { NextResponse } from 'next/server';
import { getCachedPublicDashboardData } from '@/lib/dashboard-data';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET() {
  try {
    return NextResponse.json(await getCachedPublicDashboardData(), {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
