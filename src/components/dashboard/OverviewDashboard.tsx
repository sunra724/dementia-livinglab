'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Download,
  ExternalLink,
  FolderKanban,
  Megaphone,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import ProgressBar from '@/components/dashboard/ProgressBar';
import ActivityCalendar, { type ActivityCalendarEvent } from '@/components/timeline/ActivityCalendar';
import PhaseTimeline from '@/components/timeline/PhaseTimeline';
import type {
  BudgetItem,
  ChecklistItem,
  KpiItem,
  LivingLabPhase,
  ProgressStatus,
  PromotionChannel,
  PromotionRecord,
  Workshop,
  WorksheetEntry,
} from '@/lib/types';

type DashboardMode = 'view' | 'admin';

interface OverviewDashboardProps {
  mode: DashboardMode;
}

interface WorkshopsResponse {
  workshops: Workshop[];
  worksheetEntries: WorksheetEntry[];
}

interface SummaryCard {
  title: string;
  value: string;
  description: string;
  icon: typeof CalendarDays;
  href?: string;
}

const phaseOrder: LivingLabPhase[] = [1, 2, 3, 4, 5, 6];

const phaseDescriptions: Record<LivingLabPhase, string> = {
  1: '리빙랩 준비를 마치고 참여자와 운영 구조를 정비합니다.',
  2: '치매 어르신과 가족 돌봄자의 실제 문제를 현장에서 발견합니다.',
  3: '현장 문제를 바탕으로 해결 아이디어를 발산하고 우선순위를 정합니다.',
  4: '선정된 아이디어를 프로토타입으로 구체화하고 실행안을 설계합니다.',
  5: '현장 테스트를 통해 프로토타입을 검증하고 개선합니다.',
  6: '성과를 정리하고 확산 전략과 후속 운영 방안을 준비합니다.',
};

const phaseTitles: Record<LivingLabPhase, string> = {
  1: '준비',
  2: '문제정의',
  3: '아이디어',
  4: '프로토타입',
  5: '테스트',
  6: '확산',
};

const budgetCategoryLabels = {
  personnel: '인건비',
  activity: '활동비',
  workshop: '워크숍',
  printing: '인쇄비',
} as const;

const promotionChannelLabels: Record<PromotionChannel, string> = {
  sns_instagram: '인스타그램',
  sns_facebook: '페이스북',
  press_release: '보도자료',
  newsletter: '뉴스레터',
  event: '행사',
  video: '영상',
  other: '기타',
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

function isSameYearMonth(date: string | null, year: number, month: number) {
  if (!date) {
    return false;
  }

  const parsed = parseISO(date);
  return parsed.getFullYear() === year && parsed.getMonth() + 1 === month;
}

function formatCurrency(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

function formatCompactDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return format(parseISO(value), 'yyyy.MM.dd');
}

function calculateProjectMonth(now: Date) {
  const startYear = 2026;
  const startMonth = 3;
  const endMonthCount = 9;
  const monthDiff = (now.getFullYear() - startYear) * 12 + (now.getMonth() + 1 - startMonth) + 1;

  return Math.min(Math.max(monthDiff, 1), endMonthCount);
}

function DashboardLoading() {
  return (
    <div className="space-y-6 p-6 pt-20 md:pt-6">
      <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
      <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-3xl bg-slate-200" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />
      </div>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-6 pt-20 md:pt-6">
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="text-base font-semibold">대시보드 데이터를 불러오는 중 오류가 발생했습니다.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

export default function OverviewDashboard({ mode }: OverviewDashboardProps) {
  const router = useRouter();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data: kpiItems, error: kpiError, isLoading: kpiLoading, mutate: mutateKpi } = useSWR<KpiItem[]>(
    '/api/kpi',
    fetcher
  );
  const {
    data: workshopPayload,
    error: workshopError,
    isLoading: workshopLoading,
    mutate: mutateWorkshops,
  } = useSWR<WorkshopsResponse>('/api/workshops', fetcher);
  const {
    data: checklistItems,
    error: guidebookError,
    isLoading: guidebookLoading,
    mutate: mutateGuidebook,
  } = useSWR<ChecklistItem[]>('/api/guidebook', fetcher);
  const {
    data: promotionItems,
    error: promotionError,
    isLoading: promotionLoading,
    mutate: mutatePromotion,
  } = useSWR<PromotionRecord[]>('/api/promotion', fetcher);
  const {
    data: budgetItems,
    error: budgetError,
    isLoading: budgetLoading,
    mutate: mutateBudget,
  } = useSWR<BudgetItem[]>('/api/budget', fetcher);

  const isLoading = kpiLoading || workshopLoading || guidebookLoading || promotionLoading || budgetLoading;
  const hasError = Boolean(kpiError || workshopError || guidebookError || promotionError || budgetError);

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (
    hasError ||
    !kpiItems ||
    !workshopPayload ||
    !checklistItems ||
    !promotionItems ||
    !budgetItems
  ) {
    return (
      <DashboardError
        onRetry={() => {
          void Promise.all([
            mutateKpi(),
            mutateWorkshops(),
            mutateGuidebook(),
            mutatePromotion(),
            mutateBudget(),
          ]);
        }}
      />
    );
  }

  const workshops = workshopPayload.workshops;
  const projectMonth = calculateProjectMonth(now);
  const currentMonthWorkshops = workshops.filter((workshop) =>
    isSameYearMonth(workshop.scheduled_date, currentYear, currentMonth)
  );
  const currentMonthChecklistCount = checklistItems.filter((item) =>
    isSameYearMonth(item.completed_date, currentYear, currentMonth)
  ).length;
  const currentMonthSpend = budgetItems
    .filter((item) => isSameYearMonth(item.payment_date, currentYear, currentMonth))
    .reduce((sum, item) => sum + item.actual_amount, 0);

  const phaseStatuses = phaseOrder.reduce<Partial<Record<LivingLabPhase, ProgressStatus>>>((result, phase) => {
    const items = checklistItems.filter((item) => item.phase === phase);
    const phaseWorkshops = workshops.filter((workshop) => workshop.phase === phase);

    if (phaseWorkshops.some((workshop) => workshop.status === 'delayed')) {
      result[phase] = 'delayed';
      return result;
    }

    if (items.length > 0 && items.every((item) => item.completed)) {
      result[phase] = 'completed';
      return result;
    }

    if (items.some((item) => item.completed) || phaseWorkshops.some((workshop) => workshop.status !== 'not_started')) {
      result[phase] = 'in_progress';
      return result;
    }

    result[phase] = 'not_started';
    return result;
  }, {});

  const currentPhase =
    phaseOrder.find((phase) => {
      const status = phaseStatuses[phase];
      return status === 'in_progress' || status === 'delayed';
    }) ??
    phaseOrder.find((phase) => phaseStatuses[phase] === 'not_started') ??
    6;

  const calendarEvents: ActivityCalendarEvent[] = workshops.map((workshop) => ({
    date: workshop.scheduled_date,
    title: workshop.title,
    type: workshop.type,
    phase: workshop.phase,
    status: workshop.status,
  }));

  const plannedBudget = budgetItems.reduce((sum, item) => sum + item.planned_amount, 0);
  const actualBudget = budgetItems.reduce((sum, item) => sum + item.actual_amount, 0);
  const remainingBudget = Math.max(plannedBudget - actualBudget, 0);

  const budgetSummaries = Object.entries(budgetCategoryLabels).map(([category, label]) => {
    const items = budgetItems.filter((item) => item.category === category);
    const planned = items.reduce((sum, item) => sum + item.planned_amount, 0);
    const actual = items.reduce((sum, item) => sum + item.actual_amount, 0);

    return {
      label,
      planned,
      actual,
    };
  });

  const latestPromotions = [...promotionItems]
    .sort((left, right) => {
      const leftValue = left.published_date ? parseISO(left.published_date).getTime() : 0;
      const rightValue = right.published_date ? parseISO(right.published_date).getTime() : 0;
      return rightValue - leftValue;
    })
    .slice(0, 3);

  const summaryCards: SummaryCard[] = [
    {
      title: '이번 달 워크숍',
      value: `${currentMonthWorkshops.length}건`,
      description: `${currentYear}년 ${currentMonth}월 예정 일정 기준`,
      icon: CalendarDays,
      href: mode === 'admin' ? '/admin/workshops' : undefined,
    },
    {
      title: '완료된 체크리스트',
      value: `${currentMonthChecklistCount}건`,
      description: '가이드북 완료 처리 건수',
      icon: ClipboardCheck,
      href: mode === 'admin' ? '/admin/kpi' : undefined,
    },
    {
      title: '이번 달 집행액',
      value: formatCurrency(currentMonthSpend),
      description: '지급일 기준 월간 집행 합계',
      icon: Wallet,
      href: mode === 'admin' ? '/admin/budget' : undefined,
    },
  ];

  const quickLinks = [
    { href: '/admin/participants', label: '참가자 관리', icon: ShieldCheck },
    { href: '/admin/workshops', label: '워크숍 관리', icon: CalendarDays },
    { href: '/admin/kpi', label: 'KPI·체크리스트', icon: ClipboardCheck },
    { href: '/admin/budget', label: '사업비 관리', icon: Wallet },
    { href: '/admin/promotion', label: '홍보 관리', icon: Megaphone },
    { href: '/guidebook', label: '가이드북 보기', icon: FolderKanban },
  ];

  const handlePhaseClick = (phase: LivingLabPhase) => {
    if (mode === 'admin') {
      router.push('/admin/kpi');
      return;
    }

    router.push(`/guidebook?phase=${phase}`);
  };

  const updateKpi = async (indicator: string, current: number) => {
    const response = await fetch('/api/kpi', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indicator, current }),
    });

    if (!response.ok) {
      throw new Error('kpi_update_failed');
    }

    await mutateKpi();
  };

  return (
    <div className="space-y-6 p-6 pt-20 md:pt-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            통합 성과관리 대시보드
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              치매돌봄 리빙랩 통합 성과관리 대시보드
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              지역사회와 대학, 치매 당사자와 가족, 참여기관이 함께 만드는 리빙랩의 전 과정을 한 화면에서 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            <span>사업기간: 2026.03 ~ 2026.11</span>
            <span>현재: {projectMonth}개월차</span>
            <span>기준일: {format(now, 'yyyy.MM.dd')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {mode === 'view' ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              관리자 모드
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <a
                href="/api/export?type=kpi"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                KPI CSV
              </a>
              <a
                href="/api/export?type=budget"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                사업비 CSV
              </a>
              <a
                href="/api/export?type=participants"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                참가자 CSV
              </a>
            </>
          )}
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">사업 개요</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">치매돌봄 리빙랩 6단계 통합 운영</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            협동조합 소이랩이 준비부터 확산까지의 전 단계를 운영하며, 참여기관과 함께 현장 기반 문제 발굴, 아이디어 도출,
            프로토타입 설계, 테스트, 확산 전략 수립까지 연결합니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">현재 단계</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {currentPhase}단계 {phaseTitles[currentPhase]}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">누적 워크숍</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{workshops.length}건</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">체크리스트 완료</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {checklistItems.filter((item) => item.completed).length}건
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">리빙랩 단계 진행</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                현재: {currentPhase}단계 {phaseTitles[currentPhase]}
              </h2>
            </div>
            {mode === 'view' && (
              <Link
                href={`/guidebook?phase=${currentPhase}`}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                단계 상세 보기
              </Link>
            )}
          </div>

          <div className="mt-6">
            <PhaseTimeline currentPhase={currentPhase} phaseStatuses={phaseStatuses} onPhaseClick={handlePhaseClick} />
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">현재 단계 설명</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{phaseDescriptions[currentPhase]}</p>
          </div>
        </div>
      </section>

      {mode === 'admin' && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-500">빠른 이동</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">관리 메뉴 바로가기</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-500">핵심 KPI</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">통합 성과 지표 9개</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kpiItems.map((item) => (
            <KpiCard
              key={item.id}
              title={item.indicator}
              current={item.current}
              target={item.target}
              unit={item.unit}
              trend={item.trend}
              editable={mode === 'admin'}
              onEdit={mode === 'admin' ? (value) => void updateKpi(item.indicator, value) : undefined}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-500">이번 달 활동 요약</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{currentYear}년 {currentMonth}월 요약 카드</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {summaryCards.map(({ title, value, description, icon: Icon, href }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">{title}</span>
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-slate-950">{value}</p>
                  <p className="mt-2 text-sm text-slate-600">{description}</p>
                  {mode === 'admin' && href && (
                    <Link
                      href={href}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-500"
                    >
                      관리 바로가기
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-500">월별 활동 캘린더</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">이번 달 일정 한눈에 보기</h2>
            </div>
            <ActivityCalendar year={currentYear} month={currentMonth} events={calendarEvents} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-500">예산 집행 현황</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">사업비 요약</h2>
            </div>
            <ProgressBar label="사업비 집행" current={actualBudget} target={plannedBudget} color="emerald" />
            <p className="mt-3 text-sm text-slate-600">잔여 예산: {formatCurrency(remainingBudget)}</p>

            <div className="mt-6 space-y-4">
              {budgetSummaries.map((summary) => (
                <div key={summary.label} className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{summary.label}</span>
                    <span className="text-slate-500">
                      {formatCurrency(summary.actual)} / {formatCurrency(summary.planned)}
                    </span>
                  </div>
                  <ProgressBar
                    label={summary.label}
                    current={summary.actual}
                    target={summary.planned}
                    color="blue"
                    showPercent={false}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-500">최신 홍보 활동</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">최근 3건</h2>
            </div>
            <div className="space-y-4">
              {latestPromotions.map((promotion) => (
                <div key={promotion.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span>{promotionChannelLabels[promotion.channel]}</span>
                        <span>{formatCompactDate(promotion.published_date)}</span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-slate-900">{promotion.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">도달 수: {promotion.reach_count.toLocaleString('ko-KR')}명</p>
                    </div>
                    {promotion.url ? (
                      <a
                        href={promotion.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                      >
                        링크 보기
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
                      >
                        링크 없음
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
