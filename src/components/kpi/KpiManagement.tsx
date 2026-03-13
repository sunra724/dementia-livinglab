'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, BarChart3, Settings2, Target, TrendingUp } from 'lucide-react';
import ProgressBar from '@/components/dashboard/ProgressBar';
import StatusBadge from '@/components/dashboard/StatusBadge';
import DialogShell from '@/components/forms/DialogShell';
import DataTable, { type DataTableColumn } from '@/components/forms/DataTable';
import {
  KPI_CATEGORY_OPTIONS,
  KPI_TREND_OPTIONS,
  PHASE_LABELS,
  PHASE_SELECT_OPTIONS,
  formatPercent,
  getKpiAchievement,
} from '@/lib/management';
import type { KpiItem } from '@/lib/types';

interface KpiManagementProps {
  editable: boolean;
}

interface KpiFormState {
  category: string;
  indicator: string;
  target: string;
  current: string;
  unit: string;
  trend: KpiItem['trend'];
  phase_related: string;
  notes: string;
}

const fetcher = async (url: string): Promise<KpiItem[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('kpi_fetch_failed');
  }

  return (await response.json()) as KpiItem[];
};

function createInitialFormState(): KpiFormState {
  return {
    category: KPI_CATEGORY_OPTIONS[0]?.value ?? '참여',
    indicator: '',
    target: '0',
    current: '0',
    unit: '건',
    trend: 'stable',
    phase_related: '',
    notes: '',
  };
}

export default function KpiManagement({ editable }: KpiManagementProps) {
  const { data, error, isLoading, mutate } = useSWR<KpiItem[]>('/api/kpi', fetcher);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<KpiFormState>(createInitialFormState);

  const summary = useMemo(() => {
    const items = data ?? [];
    const averageAchievement =
      items.length > 0 ? items.reduce((sum, item) => sum + getKpiAchievement(item), 0) / items.length : 0;

    return {
      averageAchievement,
      achievedCount: items.filter((item) => item.current >= item.target).length,
      trendUpCount: items.filter((item) => item.trend === 'up').length,
      phaseLinkedCount: items.filter((item) => item.phase_related !== null).length,
    };
  }, [data]);

  const categoryProgress = useMemo(
    () => {
      const items = data ?? [];

      return KPI_CATEGORY_OPTIONS.map((option) => {
        const categoryItems = items.filter((item) => item.category === option.value);
        const achievement =
          categoryItems.length > 0
            ? categoryItems.reduce((sum, item) => sum + getKpiAchievement(item), 0) / categoryItems.length
            : 0;

        return {
          category: option.label,
          current: Number(achievement.toFixed(1)),
          target: 100,
        };
      }).filter((item) => item.current > 0);
    },
    [data]
  );

  const items = data ?? [];

  const columns: DataTableColumn[] = [
    {
      key: 'category',
      label: '카테고리',
      type: 'select',
      editable,
      sortable: true,
      options: KPI_CATEGORY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    },
    { key: 'indicator', label: '지표명', editable, sortable: true },
    { key: 'target', label: '목표', type: 'number', editable, sortable: true },
    { key: 'current', label: '현재', type: 'number', editable, sortable: true },
    {
      key: 'achievement',
      label: '달성률',
      render: (_, item) => {
        const typedItem = item as unknown as KpiItem;
        const achievement = getKpiAchievement(typedItem);

        return (
          <span className={`font-semibold ${achievement >= 80 ? 'text-emerald-600' : achievement >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {formatPercent(achievement)}
          </span>
        );
      },
    },
    { key: 'unit', label: '단위', editable },
    {
      key: 'trend',
      label: '추세',
      type: 'select',
      editable,
      sortable: true,
      options: KPI_TREND_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
      render: (value) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            value === 'up'
              ? 'bg-emerald-100 text-emerald-700'
              : value === 'down'
                ? 'bg-red-100 text-red-700'
                : 'bg-slate-100 text-slate-700'
          }`}
        >
          {KPI_TREND_OPTIONS.find((option) => option.value === value)?.label ?? '-'}
        </span>
      ),
    },
    {
      key: 'phase_related',
      label: '관련 단계',
      type: 'select',
      editable,
      sortable: true,
      options: PHASE_SELECT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
      render: (value) => {
        if (typeof value !== 'number') {
          return <span className="text-slate-400">공통</span>;
        }

        return <StatusBadge type="phase" value={value} />;
      },
    },
    { key: 'notes', label: '메모', editable },
  ];

  const resetForm = () => {
    setFormState(createInitialFormState());
    setIsCreateOpen(false);
  };

  const updateField = async (id: number, field: string, value: unknown) => {
    const response = await fetch('/api/kpi', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, field, value }),
    });

    if (!response.ok) {
      throw new Error('kpi_update_failed');
    }

    await mutate();
  };

  const createItem = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            category: formState.category,
            indicator: formState.indicator,
            target: Number(formState.target),
            current: Number(formState.current),
            unit: formState.unit,
            trend: formState.trend,
            phase_related: formState.phase_related ? Number(formState.phase_related) : null,
            notes: formState.notes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('kpi_create_failed');
      }

      await mutate();
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!window.confirm('이 KPI 항목을 삭제할까요?')) {
      return;
    }

    const response = await fetch('/api/kpi', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('kpi_delete_failed');
    }

    await mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-36 animate-pulse rounded-[32px] bg-indigo-100" />
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
          <p className="text-base font-semibold">KPI 데이터를 불러오지 못했습니다.</p>
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
      <section className="rounded-[32px] border border-indigo-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              KPI 성과관리
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              {editable ? 'KPI 관리 대시보드' : 'KPI 성과 현황'}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              리빙랩 전 단계의 참여, 워크숍, 결과물을 KPI 기준으로 한눈에 확인하고 관리합니다.
            </p>
          </div>
          <Link
            href={editable ? '/kpi' : '/admin/kpi'}
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
            <Target className="h-4 w-4 text-indigo-500" />
            평균 달성률
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{formatPercent(summary.averageAchievement)}</p>
          <p className="mt-2 text-sm text-slate-500">전체 KPI 평균</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            목표 달성
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {summary.achievedCount}
            <span className="ml-1 text-lg font-medium text-slate-500">/ {items.length}</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">목표 이상 달성 항목 수</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            상승 추세
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{summary.trendUpCount}</p>
          <p className="mt-2 text-sm text-slate-500">상승으로 표시된 KPI</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <BarChart3 className="h-4 w-4 text-violet-500" />
            단계 연계
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{summary.phaseLinkedCount}</p>
          <p className="mt-2 text-sm text-slate-500">특정 단계와 연결된 KPI</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">카테고리별 달성률</h2>
            <p className="mt-1 text-sm text-slate-500">카테고리 평균 달성률 기준으로 현재 성과를 점검합니다.</p>
          </div>
          <div className="space-y-4">
            {categoryProgress.length ? (
              categoryProgress.map((item, index) => (
                <ProgressBar
                  key={item.category}
                  label={item.category}
                  current={item.current}
                  target={item.target}
                  color={(['indigo', 'blue', 'amber', 'emerald', 'violet', 'sky'] as const)[index % 6]}
                />
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                표시할 KPI 데이터가 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">주요 KPI</h2>
            <p className="mt-1 text-sm text-slate-500">현재 진척이 중요한 상위 항목을 빠르게 확인합니다.</p>
          </div>
          <div className="space-y-4">
            {items.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.indicator}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.category}
                      {item.phase_related ? ` · ${PHASE_LABELS[item.phase_related]}` : ' · 공통'}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                    {item.current.toLocaleString('ko-KR')}
                    {item.unit} / {item.target.toLocaleString('ko-KR')}
                    {item.unit}
                  </span>
                </div>
                <div className="mt-4">
                  <ProgressBar
                    label="달성률"
                    current={Number(getKpiAchievement(item).toFixed(1))}
                    target={100}
                    color="indigo"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">{editable ? 'KPI 관리자 테이블' : 'KPI 전체 목록'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {editable ? '셀을 클릭해 값을 바로 수정하고 신규 지표를 추가할 수 있습니다.' : '전체 KPI를 표 형태로 확인합니다.'}
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
              key: 'category',
              label: '카테고리 필터',
              options: KPI_CATEGORY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
            },
            {
              key: 'trend',
              label: '추세 필터',
              options: KPI_TREND_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
            },
          ]}
          emptyMessage="등록된 KPI 항목이 없습니다."
        />
      </section>

      <DialogShell
        isOpen={isCreateOpen}
        title="KPI 항목 추가"
        description="새 KPI를 등록하면 열람 페이지와 대시보드에서 즉시 사용할 수 있습니다."
        submitLabel="KPI 저장"
        submitting={isSaving}
        onClose={resetForm}
        onSubmit={createItem}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            카테고리
            <select
              value={formState.category}
              onChange={(event) => setFormState((previous) => ({ ...previous, category: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {KPI_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            지표명
            <input
              type="text"
              value={formState.indicator}
              onChange={(event) => setFormState((previous) => ({ ...previous, indicator: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="예: 워크시트 완성률"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            목표값
            <input
              type="number"
              value={formState.target}
              onChange={(event) => setFormState((previous) => ({ ...previous, target: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            현재값
            <input
              type="number"
              value={formState.current}
              onChange={(event) => setFormState((previous) => ({ ...previous, current: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            단위
            <input
              type="text"
              value={formState.unit}
              onChange={(event) => setFormState((previous) => ({ ...previous, unit: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="예: 건, 명, %"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            추세
            <select
              value={formState.trend}
              onChange={(event) =>
                setFormState((previous) => ({ ...previous, trend: event.target.value as KpiItem['trend'] }))
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {KPI_TREND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            관련 단계
            <select
              value={formState.phase_related}
              onChange={(event) => setFormState((previous) => ({ ...previous, phase_related: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PHASE_SELECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            메모
            <textarea
              value={formState.notes}
              onChange={(event) => setFormState((previous) => ({ ...previous, notes: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="측정 방식이나 보충 설명을 남겨두세요."
            />
          </label>
        </div>
      </DialogShell>
    </div>
  );
}
