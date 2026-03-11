export const dynamic = 'force-dynamic';

export default function WorksheetTokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Soilab Living Lab</p>
            <h1 className="mt-2 text-lg font-bold text-slate-900">치매돌봄 리빙랩 워크시트</h1>
          </div>
          <p className="text-sm text-slate-500">협동조합 소이랩</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 text-sm text-slate-500">
          <span>협동조합 소이랩</span>
          <span>soilabcoop.kr</span>
        </div>
      </footer>
    </div>
  );
}
