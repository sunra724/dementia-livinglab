import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import SwrProvider from '@/components/providers/SwrProvider';

export const metadata: Metadata = {
  title: '치매돌봄 리빙랩 통합 성과관리 대시보드',
  description: '치매돌봄 리빙랩 6단계 전 과정을 관리하는 통합 대시보드',
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
