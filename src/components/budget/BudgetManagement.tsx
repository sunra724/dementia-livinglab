'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, CreditCard, Receipt, Settings2, Wallet } from 'lucide-react';
import ProgressBar from '@/components/dashboard/ProgressBar';
import StatusBadge from '@/components/dashboard/StatusBadge';
import DialogShell from '@/components/forms/DialogShell';
import DataTable, { type DataTableColumn } from '@/components/forms/DataTable';
import {
  BUDGET_CATEGORY_LABELS,
  BUDGET_CATEGORY_OPTIONS,
  PHASE_SELECT_OPTIONS,
  formatCurrency,
  formatDisplayDate,
  formatPercent,
  getBudgetExecutionRate,
} from '@/lib/management';
import type { BudgetItem } from '@/lib/types';

interface BudgetManagementProps {
  editable: boolean;
}

interface BudgetFormState {
  category: BudgetItem['category'];
  item_name: string;
  planned_amount: string;
  actual_amount: string;
  payment_date: string;
  payee: string;
  receipt_attached: boolean;
  phase: string;
  active: boolean;
  notes: string;
}

const fetcher = async (url: string): Promise<BudgetItem[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('budget_fetch_failed');
  }

  return (await response.json()) as BudgetItem[];
};

function createInitialFormState(): BudgetFormState {
  return {
    category: 'workshop',
    item_name: '',
    planned_amount: '0',
    actual_amount: '0',
    payment_date: '',
    payee: '',
    receipt_attached: false,
    phase: '',
    active: true,
    notes: '',
  };
}

export default function BudgetManagement({ editable }: BudgetManagementProps) {
  const { data, error, isLoading, mutate } = useSWR<BudgetItem[]>('/api/budget', fetcher);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<BudgetFormState>(createInitialFormState);

  const summary = useMemo(() => {
    const items = data ?? [];
    const plannedTotal = items.reduce((sum, item) => sum + item.planned_amount, 0);
    const actualTotal = items.reduce((sum, item) => sum + item.actual_amount, 0);

    return {
      plannedTotal,
      actualTotal,
      activeCount: items.filter((item) => item.active).length,
      receiptCount: items.filter((item) => item.receipt_attached).length,
      executionRate: getBudgetExecutionRate(plannedTotal, actualTotal),
    };
  }, [data]);

  const categoryProgress = useMemo(
    () => {
      const items = data ?? [];

      return BUDGET_CATEGORY_OPTIONS.map((option) => {
        const categoryItems = items.filter((item) => item.category === option.value);
        return {
          label: option.label,
          plannedAmount: categoryItems.reduce((sum, item) => sum + item.planned_amount, 0),
          actualAmount: categoryItems.reduce((sum, item) => sum + item.actual_amount, 0),
        };
      }).filter((item) => item.plannedAmount > 0 || item.actualAmount > 0);
    },
    [data]
  );

  const items = data ?? [];

  const columns: DataTableColumn[] = [
    {
      key: 'category',
      label: '분류',
      type: 'select',
      editable,
      sortable: true,
      options: BUDGET_CATEGORY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
      render: (value) => BUDGET_CATEGORY_LABELS[value as BudgetItem['category']] ?? '-',
    },
    { key: 'item_name', label: '항목명', editable, sortable: true },
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
      key: 'planned_amount',
      label: '계획 금액',
      type: 'number',
      editable,
      sortable: true,
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      key: 'actual_amount',
      label: '집행 금액',
      type: 'number',
      editable,
      sortable: true,
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      key: 'execution_rate',
      label: '집행률',
      render: (_, item) => {
        const typedItem = item as unknown as BudgetItem;
        const rate = getBudgetExecutionRate(typedItem.planned_amount, typedItem.actual_amount);
        return (
          <span className={`font-semibold ${rate >= 80 ? 'text-emerald-600' : rate >= 40 ? 'text-amber-600' : 'text-slate-600'}`}>
            {formatPercent(rate)}
          </span>
        );
      },
    },
    {
      key: 'payment_date',
      label: '집행일',
      type: 'date',
      editable,
      render: (value) => formatDisplayDate(value as string | null),
    },
    { key: 'payee', label: '지급처', editable },
    { key: 'receipt_attached', label: '증빙', type: 'boolean', editable },
    { key: 'active', label: '활성', type: 'boolean', editable },
    { key: 'notes', label: '메모', editable },
  ];

  const resetForm = () => {
    setFormState(createInitialFormState());
    setIsCreateOpen(false);
  };

  const updateField = async (id: number, field: string, value: unknown) => {
    const response = await fetch('/api/budget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, field, value }),
    });

    if (!response.ok) {
      throw new Error('budget_update_failed');
    }

    await mutate();
  };

  const createItem = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            category: formState.category,
            item_name: formState.item_name,
            planned_amount: Number(formState.planned_amount),
            actual_amount: Number(formState.actual_amount),
            payment_date: formState.payment_date || null,
            payee: formState.payee,
            receipt_attached: formState.receipt_attached,
            phase: formState.phase ? Number(formState.phase) : null,
            active: formState.active,
            notes: formState.notes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('budget_create_failed');
      }

      await mutate();
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!window.confirm('이 사업비 항목을 삭제할까요?')) {
      return;
    }

    const response = await fetch('/api/budget', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('budget_delete_failed');
    }

    await mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-36 animate-pulse rounded-[32px] bg-emerald-100" />
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
          <p className="text-base font-semibold">사업비 데이터를 불러오지 못했습니다.</p>
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
      <section className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              사업비 관리
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              {editable ? '사업비 관리자 화면' : '사업비 집행 현황'}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              계획 예산과 실제 집행 금액, 증빙 첨부 여부를 단계별로 확인하고 관리합니다.
            </p>
          </div>
          <Link
            href={editable ? '/budget' : '/admin/budget'}
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
            <Wallet className="h-4 w-4 text-emerald-500" />
            계획 총액
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{formatCurrency(summary.plannedTotal)}</p>
          <p className="mt-2 text-sm text-slate-500">전체 계획 예산 합계</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <CreditCard className="h-4 w-4 text-blue-500" />
            집행 총액
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{formatCurrency(summary.actualTotal)}</p>
          <p className="mt-2 text-sm text-slate-500">현재까지 실제 집행 금액</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Wallet className="h-4 w-4 text-amber-500" />
            집행률
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{formatPercent(summary.executionRate)}</p>
          <p className="mt-2 text-sm text-slate-500">계획 총액 대비 집행 비율</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Receipt className="h-4 w-4 text-violet-500" />
            증빙 첨부
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {summary.receiptCount}
            <span className="ml-1 text-lg font-medium text-slate-500">/ {items.length}</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">영수증 또는 증빙 첨부 완료</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">카테고리별 집행 현황</h2>
            <p className="mt-1 text-sm text-slate-500">카테고리별 예산 사용량을 비교합니다.</p>
          </div>
          <div className="space-y-4">
            {categoryProgress.map((item, index) => (
              <ProgressBar
                key={item.label}
                label={`${item.label} (${formatCurrency(item.actualAmount)})`}
                current={item.actualAmount}
                target={item.plannedAmount || item.actualAmount || 1}
                color={(['emerald', 'blue', 'amber', 'violet', 'sky', 'orange', 'slate', 'indigo'] as const)[index % 8]}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">예산 운영 메모</h2>
            <p className="mt-1 text-sm text-slate-500">즉시 확인이 필요한 항목을 카드로 요약합니다.</p>
          </div>
          <div className="space-y-4">
            {items.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.item_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{BUDGET_CATEGORY_LABELS[item.category]}</p>
                  </div>
                  {item.phase ? <StatusBadge type="phase" value={item.phase} /> : null}
                </div>
                <p className="mt-4 text-sm font-medium text-slate-700">
                  {formatCurrency(item.actual_amount)} / {formatCurrency(item.planned_amount)}
                </p>
                <p className="mt-2 text-sm text-slate-500">{item.notes || '메모 없음'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">{editable ? '사업비 관리자 테이블' : '사업비 상세 목록'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {editable ? '셀 클릭으로 바로 수정하고 신규 예산 항목을 추가할 수 있습니다.' : '계획·집행 금액과 증빙 여부를 표로 확인합니다.'}
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
              label: '분류 필터',
              options: BUDGET_CATEGORY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
            },
            {
              key: 'active',
              label: '활성 여부',
              options: [
                { value: 'true', label: '활성' },
                { value: 'false', label: '비활성' },
              ],
            },
          ]}
          emptyMessage="등록된 사업비 항목이 없습니다."
        />
      </section>

      <DialogShell
        isOpen={isCreateOpen}
        title="사업비 항목 추가"
        description="새 예산 항목을 등록하면 열람 화면과 대시보드 예산 요약에 반영됩니다."
        submitLabel="사업비 저장"
        submitting={isSaving}
        onClose={resetForm}
        onSubmit={createItem}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            분류
            <select
              value={formState.category}
              onChange={(event) =>
                setFormState((previous) => ({ ...previous, category: event.target.value as BudgetItem['category'] }))
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {BUDGET_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            항목명
            <input
              type="text"
              value={formState.item_name}
              onChange={(event) => setFormState((previous) => ({ ...previous, item_name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="예: 워크숍 운영비"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            계획 금액
            <input
              type="number"
              value={formState.planned_amount}
              onChange={(event) => setFormState((previous) => ({ ...previous, planned_amount: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            집행 금액
            <input
              type="number"
              value={formState.actual_amount}
              onChange={(event) => setFormState((previous) => ({ ...previous, actual_amount: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            집행일
            <input
              type="date"
              value={formState.payment_date}
              onChange={(event) => setFormState((previous) => ({ ...previous, payment_date: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            지급처
            <input
              type="text"
              value={formState.payee}
              onChange={(event) => setFormState((previous) => ({ ...previous, payee: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="예: 협동조합 소이랩"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            관련 단계
            <select
              value={formState.phase}
              onChange={(event) => setFormState((previous) => ({ ...previous, phase: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PHASE_SELECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formState.receipt_attached}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, receipt_attached: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              영수증 또는 증빙 첨부
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formState.active}
                onChange={(event) => setFormState((previous) => ({ ...previous, active: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              활성 항목으로 표시
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            메모
            <textarea
              value={formState.notes}
              onChange={(event) => setFormState((previous) => ({ ...previous, notes: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="예산 운용 관련 메모를 남겨두세요."
            />
          </label>
        </div>
      </DialogShell>
    </div>
  );
}
