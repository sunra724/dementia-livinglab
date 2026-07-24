import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import SwrProvider from '@/components/providers/SwrProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://dementia-livinglab.soilabcoop.kr'),
  title: {
    default: '치매돌봄 리빙랩 통합 성과관리 대시보드',
    template: '%s | 치매돌봄 리빙랩',
  },
  description: '치매돌봄 리빙랩 6단계 전 과정을 관리하는 통합 대시보드',
  applicationName: '치매돌봄 리빙랩',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '치매돌봄 리빙랩 통합 성과관리 대시보드',
    description: '치매돌봄 리빙랩 6단계 전 과정과 핵심 성과를 확인하세요.',
    url: 'https://dementia-livinglab.soilabcoop.kr',
    siteName: '치매돌봄 리빙랩',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 antialiased">
        <SwrProvider>
          <AppShell>{children}</AppShell>
        </SwrProvider>
      </body>
    </html>
  );
}
