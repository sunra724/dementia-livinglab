'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import type { Workshop, WorksheetEntry, WorksheetTemplateKey, WorksheetToken } from '@/lib/types';
import { WORKSHOP_TEMPLATE_MAP } from '@/lib/types';
import WorksheetGallery from '@/components/worksheets/WorksheetGallery';
import WorksheetEntryDialog from '@/components/worksheets/WorksheetEntryDialog';
import TokenManager from '@/components/worksheets/TokenManager';

interface WorkshopsResponse {
  workshops: Workshop[];
}

interface WorksheetsResponse {
  entries: WorksheetEntry[];
  tokens: WorksheetToken[];
}

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

export default function AdminWorksheetsPage() {
  const { data: worksheetData, error: worksheetError, isLoading: worksheetLoading, mutate } = useSWR<WorksheetsResponse>(
    '/api/worksheets',
    fetcher
  );
  const { data: workshopData, error: workshopError, isLoading: workshopLoading } = useSWR<WorkshopsResponse>(
    '/api/workshops',
    fetcher
  );
  const [selectedEntry, setSelectedEntry] = useState<WorksheetEntry | null>(null);
  const [reviewedBy, setReviewedBy] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  if (worksheetLoading || workshopLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-orange-100" />
        <div className="h-[420px] animate-pulse rounded-[32px] bg-orange-100" />
      </div>
    );
  }

  if (worksheetError || workshopError || !worksheetData || !workshopData) {
    return (
      <div className="p-6 pt-20 md:pt-6">
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-base font-semibold">관리자 워크시트 데이터를 불러오지 못했습니다.</p>
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

  const entries = worksheetData.entries;
  const tokens = worksheetData.tokens;
  const workshops = workshopData.workshops;
  const pendingEntries = entries.filter((entry) => !entry.reviewed);

  const openReviewDialog = (entry: WorksheetEntry) => {
    setSelectedEntry(entry);
    setReviewedBy('');
    setReviewNote('');
  };

  const createToken = async (workshopId: number, templateKey: WorksheetTemplateKey) => {
    const response = await fetch('/api/worksheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_token', workshop_id: workshopId, template_key: templateKey }),
    });

    if (!response.ok) {
      throw new Error('create_token_failed');
    }

    const result = (await response.json()) as { token: string; url: string };
    await mutate();
    return result;
  };

  const deactivateToken = async (tokenId: number) => {
    const response = await fetch('/api/worksheets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deactivate_token', id: tokenId }),
    });

    if (!response.ok) {
      throw new Error('deactivate_token_failed');
    }

    await mutate();
  };

  const reviewSelectedEntry = async () => {
    if (!selectedEntry || !reviewedBy.trim()) {
      return;
    }

    setReviewSaving(true);

    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          id: selectedEntry.id,
          reviewed_by: reviewedBy.trim(),
          review_note: reviewNote.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('review_failed');
      }

      await mutate();
      setSelectedEntry(null);
      setReviewedBy('');
      setReviewNote('');
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-6 pt-20 md:pt-6">
      <section className="rounded-[32px] border border-orange-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              관리자 워크시트 관리
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">워크시트 검토 및 링크 관리</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              제출된 워크시트를 검토하고, 워크숍별 공개 제출 링크를 발급하거나 비활성화할 수 있습니다.
            </p>
          </div>
          <Link
            href="/worksheets"
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            열람 모드
          </Link>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-orange-500" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">검토 대기 목록</h2>
            <p className="mt-1 text-sm text-slate-500">{pendingEntries.length}건이 검토를 기다리고 있습니다.</p>
          </div>
        </div>

        {pendingEntries.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => openReviewDialog(entry)}
                className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-slate-900">
                  [{entry.workshop_id}] {workshops.find((workshop) => workshop.id === entry.workshop_id)?.title ?? '-'}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {entry.filled_by_name} {entry.group_name ? `(${entry.group_name})` : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">{entry.submitted_at ?? '-'}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            검토 대기 중인 워크시트가 없습니다.
          </div>
        )}
      </section>

      <section className="space-y-5">
        {workshops.map((workshop) => (
          <TokenManager
            key={workshop.id}
            workshopId={workshop.id}
            workshopTitle={`[${workshop.id}] ${workshop.title}`}
            availableTemplates={WORKSHOP_TEMPLATE_MAP[workshop.id] ?? []}
            tokens={tokens.filter((token) => token.workshop_id === workshop.id)}
            onCreateToken={(templateKey) => createToken(workshop.id, templateKey)}
            onDeactivate={deactivateToken}
          />
        ))}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">전체 제출 갤러리</h2>
          <p className="mt-1 text-sm text-slate-500">카드를 클릭하면 상세 보기와 검토 메모 확인이 가능합니다.</p>
        </div>
        <WorksheetGallery
          entries={entries}
          workshops={workshops}
          onCardClick={(entry) => setSelectedEntry(entry)}
        />
      </section>

      {selectedEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white shadow-2xl">
            <WorksheetEntryDialog
              entry={selectedEntry}
              workshopTitle={workshops.find((workshop) => workshop.id === selectedEntry.workshop_id)?.title ?? '-'}
              onClose={() => setSelectedEntry(null)}
            />
            {!selectedEntry.reviewed ? (
              <div className="border-t border-slate-200 px-6 py-6">
                <h3 className="text-lg font-semibold text-slate-900">검토 처리</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-800">검토자</span>
                    <input
                      type="text"
                      value={reviewedBy}
                      onChange={(event) => setReviewedBy(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-800">검토 메모</span>
                    <textarea
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEntry(null)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    onClick={() => void reviewSelectedEntry()}
                    disabled={!reviewedBy.trim() || reviewSaving}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {reviewSaving ? '저장 중...' : '검토 완료 처리'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
