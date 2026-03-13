'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Megaphone, Settings2, Share2, TrendingUp } from 'lucide-react';
import ProgressBar from '@/components/dashboard/ProgressBar';
import StatusBadge from '@/components/dashboard/StatusBadge';
import DialogShell from '@/components/forms/DialogShell';
import DataTable, { type DataTableColumn } from '@/components/forms/DataTable';
import {
  PHASE_SELECT_OPTIONS,
  PROMOTION_CHANNEL_LABELS,
  PROMOTION_CHANNEL_OPTIONS,
  STATUS_OPTIONS,
  formatDisplayDate,
  formatInteger,
  formatPercent,
  getPromotionCompletionRate,
} from '@/lib/management';
import type { ProgressStatus, PromotionChannel, PromotionRecord } from '@/lib/types';

interface PromotionManagementProps {
  editable: boolean;
}

interface PromotionFormState {
  channel: PromotionChannel;
  title: string;
  published_date: string;
  phase: string;
  reach_count: string;
  url: string;
  status: ProgressStatus;
  notes: string;
}

const fetcher = async (url: string): Promise<PromotionRecord[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('promotion_fetch_failed');
  }

  return (await response.json()) as PromotionRecord[];
};

function createInitialFormState(): PromotionFormState {
  return {
    channel: 'sns_instagram',
    title: '',
    published_date: '',
    phase: '',
    reach_count: '0',
    url: '',
    status: 'not_started',
    notes: '',
  };
}

export default function PromotionManagement({ editable }: PromotionManagementProps) {
  const { data, error, isLoading, mutate } = useSWR<PromotionRecord[]>('/api/promotion', fetcher);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<PromotionFormState>(createInitialFormState);

  const summary = useMemo(() => {
    const items = data ?? [];
    const totalReach = items.reduce((sum, item) => sum + item.reach_count, 0);

    return {
      totalReach,
      completedCount: items.filter((item) => item.status === 'completed').length,
      activeChannels: new Set(items.map((item) => item.channel)).size,
      completionRate: getPromotionCompletionRate(items),
    };
  }, [data]);

  const channelSummary = useMemo(
    () => {
      const items = data ?? [];

      return PROMOTION_CHANNEL_OPTIONS.map((option) => {
        const channelItems = items.filter((item) => item.channel === option.value);
        return {
          label: option.label,
          count: channelItems.length,
          reach: channelItems.reduce((sum, item) => sum + item.reach_count, 0),
        };
      }).filter((item) => item.count > 0);
    },
    [data]
  );

  const items = data ?? [];

  const columns: DataTableColumn[] = [
    {
      key: 'channel',
      label: '채널',
      type: 'select',
      editable,
      sortable: true,
      options: PROMOTION_CHANNEL_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
      render: (value) => PROMOTION_CHANNEL_LABELS[value as PromotionChannel] ?? '-',
    },
    { key: 'title', label: '제목', editable, sortable: true },
    {
      key: 'published_date',
      label: '게시일',
      type: 'date',
      editable,
      render: (value) => formatDisplayDate(value as string | null),
    },
    {
      key: 'phase',
      label: '단계',
      type: 'select',
      editable,
      sortable: true,
      options: PHASE_SELECT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
      render: (value) =>
        typeof value === 'number' ? <StatusBadge type="phase" value={value} /> : <span className="text-slate-400">공통</span>,
    },
    {
      key: 'reach_count',
      label: '도달 수',
      type: 'number',
      editable,
      sortable: true,
      render: (value) => `${formatInteger(Number(value ?? 0))}명`,
    },
    {
      key: 'status',
      label: '상태',
      type: 'select',
      editable,
      sortable: true,
      options: STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
      render: (value) => <StatusBadge type="status" value={String(value)} />,
    },
    {
      key: 'url',
      label: '링크',
      editable,
      render: (value) =>
        typeof value === 'string' && value ? (
          <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 underline underline-offset-2">
            열기
          </a>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    { key: 'notes', label: '메모', editable },
  ];

  const resetForm = () => {
    setFormState(createInitialFormState());
    setIsCreateOpen(false);
  };

  const updateField = async (id: number, field: string, value: unknown) => {
    const response = await fetch('/api/promotion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, field, value }),
    });

    if (!response.ok) {
      throw new Error('promotion_update_failed');
    }

    await mutate();
  };

  const createItem = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            channel: formState.channel,
            title: formState.title,
            published_date: formState.published_date || null,
            phase: formState.phase ? Number(formState.phase) : null,
            reach_count: Number(formState.reach_count),
            url: formState.url,
            status: formState.status,
            notes: formState.notes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('promotion_create_failed');
      }

      await mutate();
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!window.confirm('이 홍보 기록을 삭제할까요?')) {
      return;
    }

    const response = await fetch('/api/promotion', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('promotion_delete_failed');
    }

    await mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-36 animate-pulse rounded-[32px] bg-pink-100" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          ))}
        </div>
        <div className="h-[420px] animate-pulse rounded-[32px] bg-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 pt-20 md:pt-6">
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-base font-semibold">홍보 데이터를 불러오지 못했습니다.</p>
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

  return (
    <div className="space-y-8 p-6 pt-20 md:pt-6">
      <section className="rounded-[32px] border border-pink-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
              홍보 관리
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              {editable ? '홍보 관리자 화면' : '홍보 진행 현황'}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              SNS, 보도자료, 뉴스레터, 영상 등 홍보 활동의 진행 상태와 도달 수를 한눈에 정리합니다.
            </p>
          </div>
          <Link
            href={editable ? '/promotion' : '/admin/promotion'}
            className={`inline-flex items-center gap-2 self-start rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              editable
                ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-900 text-white hover:bg-slate-700'
            }`}
          >
            {editable ? <ArrowLeft className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
            {editable ? '열람 모드' : '관리자 모드'}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Megaphone className="h-4 w-4 text-pink-500" />
            홍보 기록
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{items.length}</p>
          <p className="mt-2 text-sm text-slate-500">등록된 홍보 활동 수</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Share2 className="h-4 w-4 text-blue-500" />
            총 도달 수
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{formatInteger(summary.totalReach)}</p>
          <p className="mt-2 text-sm text-slate-500">누적 예상 도달 인원</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            완료율
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{formatPercent(summary.completionRate)}</p>
          <p className="mt-2 text-sm text-slate-500">완료 상태로 표시된 홍보 활동 비중</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Megaphone className="h-4 w-4 text-violet-500" />
            사용 채널
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{summary.activeChannels}</p>
          <p className="mt-2 text-sm text-slate-500">활성화된 채널 수</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">채널별 운영 현황</h2>
            <p className="mt-1 text-sm text-slate-500">채널별 등록 건수와 도달 수를 비교합니다.</p>
          </div>
          <div className="space-y-4">
            {channelSummary.length ? (
              channelSummary.map((item, index) => (
                <ProgressBar
                  key={item.label}
                  label={`${item.label} · ${item.count}건`}
                  current={item.reach}
                  target={summary.totalReach || item.reach || 1}
                  color={(['red', 'blue', 'violet', 'emerald', 'amber', 'slate', 'orange'] as const)[index % 7]}
                />
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                등록된 홍보 기록이 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">최근 홍보 기록</h2>
            <p className="mt-1 text-sm text-slate-500">최근 등록된 홍보 활동을 카드로 요약합니다.</p>
          </div>
          <div className="space-y-4">
            {items.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{PROMOTION_CHANNEL_LABELS[item.channel]}</p>
                  </div>
                  <StatusBadge type="status" value={item.status} />
                </div>
                <p className="mt-4 text-sm text-slate-700">도달 수 {formatInteger(item.reach_count)}명</p>
                <p className="mt-2 text-sm text-slate-500">{item.notes || '메모 없음'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">{editable ? '홍보 관리자 테이블' : '홍보 활동 목록'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {editable ? '상태와 도달 수를 바로 수정하고 새 홍보 기록을 추가할 수 있습니다.' : '채널, 상태, 도달 수 기준으로 홍보 현황을 확인합니다.'}
          </p>
        </div>
        <DataTable
          data={items}
          columns={columns}
          editable={editable}
          onSave={editable ? updateField : undefined}
          onAdd={editable ? () => setIsCreateOpen(true) : undefined}
          onDelete={editable ? deleteItem : undefined}
          searchable
          filterOptions={[
            {
              key: 'channel',
              label: '채널 필터',
              options: PROMOTION_CHANNEL_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
            },
            {
              key: 'status',
              label: '상태 필터',
              options: STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
            },
          ]}
          emptyMessage="등록된 홍보 기록이 없습니다."
        />
      </section>

      <DialogShell
        isOpen={isCreateOpen}
        title="홍보 기록 추가"
        description="새 홍보 활동을 등록하면 대시보드와 홍보 페이지에 즉시 반영됩니다."
        submitLabel="홍보 저장"
        submitting={isSaving}
        onClose={resetForm}
        onSubmit={createItem}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            채널
            <select
              value={formState.channel}
              onChange={(event) =>
                setFormState((previous) => ({ ...previous, channel: event.target.value as PromotionChannel }))
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {PROMOTION_CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            제목
            <input
              type="text"
              value={formState.title}
              onChange={(event) => setFormState((previous) => ({ ...previous, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="예: 지역 간담회 보도자료"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            게시일
            <input
              type="date"
              value={formState.published_date}
              onChange={(event) => setFormState((previous) => ({ ...previous, published_date: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            관련 단계
            <select
              value={formState.phase}
              onChange={(event) => setFormState((previous) => ({ ...previous, phase: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {PHASE_SELECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            도달 수
            <input
              type="number"
              value={formState.reach_count}
              onChange={(event) => setFormState((previous) => ({ ...previous, reach_count: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            상태
            <select
              value={formState.status}
              onChange={(event) =>
                setFormState((previous) => ({ ...previous, status: event.target.value as ProgressStatus }))
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            링크
            <input
              type="url"
              value={formState.url}
              onChange={(event) => setFormState((previous) => ({ ...previous, url: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="https://..."
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            메모
            <textarea
              value={formState.notes}
              onChange={(event) => setFormState((previous) => ({ ...previous, notes: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="홍보 성과나 후속 조치 메모를 남겨두세요."
            />
          </label>
        </div>
      </DialogShell>
    </div>
  );
}
