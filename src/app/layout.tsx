import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import SwrProvider from "@/components/providers/SwrProvider";

export const metadata: Metadata = {
  title: "치매돌봄 리빙랩 대시보드",
  description: "리빙랩 6단계 전 과정 관리",
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
          <div className="min-h-screen md:flex">
            <Sidebar />
            <main className="min-h-screen flex-1 overflow-x-hidden">
              {children}
            </main>
          </div>
        </SwrProvider>
      </body>
    </html>
  );
}
