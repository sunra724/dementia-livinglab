'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

function isDetachedPath(pathname: string) {
  return pathname === '/admin/login' || /^\/worksheets\/[^/]+$/.test(pathname);
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (isDetachedPath(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-h-screen flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
