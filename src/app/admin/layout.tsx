'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const viewModePath = pathname.replace('/admin', '') || '/';

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-orange-500 px-4 py-3 text-white">
        <div className="flex items-center">
          <span className="text-lg font-medium">🔧 관리자 모드 — 데이터 수정이 가능합니다</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={viewModePath}
            className="rounded-md bg-white px-3 py-1 text-sm font-medium text-orange-500 transition-colors hover:bg-gray-100"
          >
            ← 열람 모드
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-md border border-white/40 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            로그아웃
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
