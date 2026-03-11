'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { Workshop, WorksheetEntry, WorksheetTemplateKey, WorksheetToken } from '@/lib/types';
import { getWorksheetTemplateLabel } from '@/lib/worksheets';
import WorksheetGallery from '@/components/worksheets/WorksheetGallery';
import WorksheetEntryDialog from '@/components/worksheets/WorksheetEntryDialog';

interface WorkshopsResponse {
  workshops: Workshop[];
}

interface WorksheetsResponse {
  entries: WorksheetEntry[];
  tokens: WorksheetToken[];
  stats: {
    total: number;
    submitted: number;
    reviewed: number;
    by_template: Partial<Record<WorksheetTemplateKey, number>>;
    by_workshop: Record<number, number>;
  };
}

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

function countThisMonth(entries: WorksheetEntry[]) {
  const now = new Date();
  return entries.filter((entry) => {
    if (!entry.submitted_at) {
      return false;
    }

    const submittedAt = new Date(entry.submitted_at);
    return submittedAt.getFullYear() === now.getFullYear() && submittedAt.getMonth() === now.getMonth();
  }).length;
}

export default function WorksheetsPage() {
  const { data: worksheetData, error: worksheetError, isLoading: worksheetLoading, mutate } = useSWR<WorksheetsResponse>(
    '/api/worksheets',
    fetcher
  );
  const { data: workshopData, error: workshopError, isLoading: workshopLoading } = useSWR<WorkshopsResponse>(
    '/api/workshops',
    fetcher
  );
  const [selectedEntry, setSelectedEntry] = useState<WorksheetEntry | null>(null);

  if (worksheetLoading || workshopLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-slate-200" />
        <div className="h-[420px] animate-pulse rounded-[32px] bg-slate-200" />
      </div>
    );
  }

  if (worksheetError || workshopError || !worksheetData || !workshopData) {
    return (
      <div className="p-6 pt-20 md:pt-6">
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-base font-semibold">워크시트 데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void mutate()}
            className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { entries, stats } = worksheetData;
  const workshops = workshopData.workshops;
  const reviewRate = stats.total ? Math.round((stats.reviewed / stats.total) * 100) : 0;
  const monthlySubmitted = countThisMonth(entries);
  const workshopSummaryRows = workshops.map((workshop) => {
    const workshopEntries = entries.filter((entry) => entry.workshop_id === workshop.id);
    const reviewedCount = workshopEntries.filter((entry) => entry.reviewed).length;
    const templates = Array.from(new Set(workshopEntries.map((entry) => entry.template_key)))
      .map((templateKey) => getWorksheetTemplateLabel(templateKey))
      .join(', ');

    return {
      id: workshop.id,
      title: workshop.title,
      phase: workshop.phase,
      templates: templates || '-',
      submitted: workshopEntries.length,
      reviewed: reviewedCount,
      reviewRate: workshopEntries.length ? `${Math.round((reviewedCount / workshopEntries.length) * 100)}%` : '0%',
    };
  });

  return (
    <div className="space-y-8 p-6 pt-20 md:pt-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              공개 워크시트 갤러리
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">워크시트 열람</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              제출된 워크시트를 템플릿과 워크숍 기준으로 살펴보고, 각 팀의 관찰과 아이디어를 비교할 수 있습니다.
            </p>
          </div>
          <Link
            href="/admin/worksheets"
            className="inline-flex items-center gap-2 self-start rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <ShieldCheck className="h-4 w-4" />
            관리자 모드
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: '전체 제출', value: `${stats.total}건`, note: '누적 제출 워크시트' },
          { label: '검토 완료', value: `${stats.reviewed}건 (${reviewRate}%)`, note: '관리자 검토 기준' },
          { label: '이번 달 제출', value: `${monthlySubmitted}건`, note: '이번 달 기준 제출 수' },
        ].map((card) => (
          <div key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">워크시트 갤러리</h2>
          <p className="mt-1 text-sm text-slate-500">카드를 클릭하면 제출 내용을 읽기 전용으로 볼 수 있습니다.</p>
        </div>
        <WorksheetGallery
          entries={entries}
          workshops={workshops}
          onCardClick={(entry) => setSelectedEntry(entry)}
        />
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">워크숍별 제출 현황</h2>
          <p className="mt-1 text-sm text-slate-500">워크숍별 제출 수와 검토 비율을 표로 확인합니다.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3 font-medium">워크숍</th>
                <th className="px-3 py-3 font-medium">단계</th>
                <th className="px-3 py-3 font-medium">템플릿</th>
                <th className="px-3 py-3 font-medium">제출</th>
                <th className="px-3 py-3 font-medium">검토</th>
                <th className="px-3 py-3 font-medium">검토율</th>
              </tr>
            </thead>
            <tbody>
              {workshopSummaryRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 text-slate-700 last:border-b-0">
                  <td className="px-3 py-3">[{row.id}] {row.title}</td>
                  <td className="px-3 py-3">{row.phase}단계</td>
                  <td className="px-3 py-3">{row.templates}</td>
                  <td className="px-3 py-3">{row.submitted}건</td>
                  <td className="px-3 py-3">{row.reviewed}건</td>
                  <td className="px-3 py-3">{row.reviewRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedEntry ? (
        <WorksheetEntryDialog
          entry={selectedEntry}
          workshopTitle={workshops.find((workshop) => workshop.id === selectedEntry.workshop_id)?.title ?? '-'}
          onClose={() => setSelectedEntry(null)}
        />
      ) : null}
    </div>
  );
}
