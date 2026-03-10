'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Menu, Megaphone, NotebookTabs, Users, Wallet, X } from 'lucide-react';

const menuItems = [
  { href: '/', label: '종합 대시보드', icon: LayoutDashboard },
  { href: '/participants', label: '참가자·기관·대상자', icon: Users },
  { href: '/workshops', label: '워크숍·워크시트', icon: NotebookTabs },
  { href: '/kpi', label: 'KPI 성과관리', icon: LayoutDashboard },
  { href: '/budget', label: '사업비 관리', icon: Wallet },
  { href: '/promotion', label: '홍보 관리', icon: Megaphone },
  { href: '/guidebook', label: '가이드북 체크리스트', icon: NotebookTabs },
  { href: '/admin', label: '관리자', icon: LayoutDashboard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Soilab Living Lab</p>
        <h1 className="mt-2 text-lg font-bold text-gray-900">치매돌봄 리빙랩</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.slice(0, 7).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
          <li className="my-4 border-t border-gray-200"></li>
          <li>
            <Link
              href={menuItems[7].href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(menuItems[7].href)
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              {menuItems[7].label}
            </Link>
          </li>
        </ul>
      </nav>
      <div className="border-t border-gray-200 p-4">
        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-gray-500">
          <p className="font-medium text-slate-700">현재 단계</p>
          <p className="mt-1">2단계 문제정의 진행중</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-md bg-white p-2 shadow-md"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="hidden w-64 md:block">
        {sidebarContent}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 top-0 h-full w-64">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
