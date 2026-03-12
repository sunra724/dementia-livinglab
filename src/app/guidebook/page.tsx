'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import { ArrowRight, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import ChecklistPanel from '@/components/guidebook/ChecklistPanel';
import PhaseTimeline from '@/components/timeline/PhaseTimeline';
import { PHASES } from '@/lib/safety';
import type {
  ChecklistItem,
  LivingLabPhase,
  PhaseGateResult,
  ProgressStatus,
  Workshop,
  WorksheetEntry,
} from '@/lib/types';

interface WorkshopsResponse {
  workshops: Workshop[];
  worksheetEntries: WorksheetEntry[];
}

interface SafetyResponse {
  gate_status: PhaseGateResult[];
}

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

const phaseLabels: Record<LivingLabPhase, string> = {
  1: '준비',
  2: '문제정의',
  3: '아이디어',
  4: '프로토타입',
  5: '테스트',
  6: '확산',
};

function isLivingLabPhase(value: number): value is LivingLabPhase {
  return value >= 1 && value <= 6;
}

function buildPhaseStatuses(
  workshops: Workshop[],
  checklistItems: ChecklistItem[]
): Partial<Record<LivingLabPhase, ProgressStatus>> {
  return PHASES.reduce<Partial<Record<LivingLabPhase, ProgressStatus>>>((result, phase) => {
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
}

function resolveCurrentPhase(
  phaseStatuses: Partial<Record<LivingLabPhase, ProgressStatus>>
): LivingLabPhase {
  return (
    PHASES.find((phase) => {
      const status = phaseStatuses[phase];
      return status === 'in_progress' || status === 'delayed';
    }) ??
    PHASES.find((phase) => phaseStatuses[phase] === 'not_started') ??
    6
  );
}

export default function GuidebookPage() {
  const searchParams = useSearchParams();
  const {
    data: checklistItems,
    error: checklistError,
    isLoading: checklistLoading,
    mutate: mutateChecklist,
  } = useSWR<ChecklistItem[]>('/api/guidebook', fetcher);
  const {
    data: workshopData,
    error: workshopError,
    isLoading: workshopLoading,
    mutate: mutateWorkshops,
  } = useSWR<WorkshopsResponse>('/api/workshops', fetcher);
  const {
    data: safetyData,
    error: safetyError,
    isLoading: safetyLoading,
    mutate: mutateSafety,
  } = useSWR<SafetyResponse>('/api/safety', fetcher);
  const [expandedPhase, setExpandedPhase] = useState<LivingLabPhase | null>(null);

  if (checklistLoading || workshopLoading || safetyLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-slate-200" />
        <div className="h-[520px] animate-pulse rounded-[32px] bg-slate-200" />
      </div>
    );
  }

  if (checklistError || workshopError || safetyError || !checklistItems || !workshopData || !safetyData) {
    return (
      <div className="p-6 pt-20 md:pt-6">
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-base font-semibold">가이드북 데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => {
              void Promise.all([mutateChecklist(), mutateWorkshops(), mutateSafety()]);
            }}
            className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const phaseStatuses = buildPhaseStatuses(workshopData.workshops, checklistItems);
  const currentPhase = resolveCurrentPhase(phaseStatuses);
  const requestedPhaseValue = Number(searchParams.get('phase'));
  const requestedPhase = isLivingLabPhase(requestedPhaseValue) ? requestedPhaseValue : null;
  const activePhase = expandedPhase ?? requestedPhase ?? currentPhase;

  return (
    <div className="space-y-8 p-6 pt-20 md:pt-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              단계별 운영 체크리스트
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">가이드북 체크리스트</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              단계별 운영 항목과 안전 게이팅 상태를 함께 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/safety"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ShieldCheck className="h-4 w-4" />
              안전·윤리 보기
            </Link>
            <Link
              href="/admin/kpi"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              관리자 모드
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">리빙랩 단계 진행과 게이팅</h2>
        <p className="mt-1 text-sm text-slate-500">
          잠긴 단계는 이전 단계의 필수 안전 항목이 아직 완료되지 않은 상태입니다.
        </p>
        <div className="mt-6">
          <PhaseTimeline currentPhase={currentPhase} phaseStatuses={phaseStatuses} gateResults={safetyData.gate_status} />
        </div>
      </section>

      <section className="space-y-4">
        {PHASES.map((phase) => {
          const phaseItems = checklistItems.filter((item) => item.phase === phase);
          const completionCount = phaseItems.filter((item) => item.completed).length;
          const gateResult = safetyData.gate_status.find((item) => item.phase === phase) ?? null;
          const isExpanded = activePhase === phase;
          const nextPhase = phase < 6 ? ((phase + 1) as LivingLabPhase) : null;
          const requiredSafetyCount = phaseItems.filter((item) => item.category === 'safety' && item.required).length;
          const completedSafetyCount = phaseItems.filter(
            (item) => item.category === 'safety' && item.required && item.completed
          ).length;

          return (
            <div key={phase} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedPhase((previous) => (previous === phase ? null : phase))}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-slate-500">{phase}단계</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{phaseLabels[phase]}</h2>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>
                    {completionCount}/{phaseItems.length} 완료
                  </span>
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {isExpanded ? (
                <div className="space-y-5 border-t border-slate-200 px-6 py-6">
                  {gateResult && nextPhase ? (
                    <div
                      className={`rounded-[24px] border px-5 py-4 ${
                        gateResult.can_proceed
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-red-500 bg-red-50 text-red-800'
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        {gateResult.can_proceed
                          ? `${nextPhase}단계 진행 가능`
                          : `${nextPhase}단계 진행 불가`}
                      </p>
                      <p className="mt-1 text-sm">
                        {gateResult.can_proceed
                          ? `필수 안전 항목 ${completedSafetyCount}/${requiredSafetyCount} 완료`
                          : `미완료 필수 항목 ${gateResult.blocking_items.length}개`}
                      </p>
                      {!gateResult.can_proceed ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {gateResult.blocking_items.map((item) => (
                            <li key={item.id}>• {item.title}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : phase === 6 ? (
                    <div className="rounded-[24px] border border-green-500 bg-green-50 px-5 py-4 text-green-800">
                      <p className="text-sm font-semibold">최종 단계 운영 체크리스트</p>
                      <p className="mt-1 text-sm">
                        확산 단계는 비식별 처리와 공유 자료 점검까지 마무리합니다.
                      </p>
                    </div>
                  ) : null}

                  <ChecklistPanel
                    phase={phase}
                    title={`${phase}단계 종합 체크리스트`}
                    items={phaseItems}
                    completionCount={completionCount}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
