'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ClipboardCheck,
  LayoutDashboard,
  Megaphone,
  Menu,
  NotebookTabs,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  admin?: boolean;
}

const menuItems: MenuItem[] = [
  { href: '/', label: '종합 대시보드', icon: LayoutDashboard },
  { href: '/participants', label: '참가자·기관·대상자', icon: Users },
  { href: '/workshops', label: '워크숍', icon: NotebookTabs },
  { href: '/worksheets', label: '워크시트', icon: ClipboardCheck },
  { href: '/kpi', label: 'KPI 성과관리', icon: LayoutDashboard },
  { href: '/budget', label: '사업비 관리', icon: Wallet },
  { href: '/promotion', label: '홍보 관리', icon: Megaphone },
  { href: '/safety', label: '안전·윤리', icon: ShieldCheck },
  { href: '/guidebook', label: '가이드북 체크리스트', icon: NotebookTabs },
  { href: '/impact-report', label: '임팩트 보고서', icon: Sparkles },
  { href: '/admin', label: '관리자', icon: Shield, admin: true },
  { href: '/admin/impact-report', label: '임팩트 보고서', icon: Sparkles, admin: true },
];

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const publicItems = menuItems.filter((item) => !item.admin);
  const adminItems = menuItems.filter((item) => item.admin);

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Soilab Living Lab
        </p>
        <h1 className="mt-3 text-lg font-bold text-slate-900">치매돌봄 리빙랩</h1>
      </div>

      <nav className="flex-1 px-4 py-5">
        <ul className="space-y-1.5">
          {publicItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {adminItems.length ? (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="space-y-1.5">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive(pathname, item.href)
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">현재 단계</p>
          <p className="mt-1">2단계 문제정의 진행 중</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm"
          aria-label="사이드바 열기"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside className="hidden w-72 shrink-0 md:block">{sidebarContent}</aside>

      {isOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setIsOpen(false)}
            aria-label="사이드바 닫기"
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">{sidebarContent}</div>
        </div>
      ) : null}
    </>
  );
}
