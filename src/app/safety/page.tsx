'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import ChecklistPanel from '@/components/guidebook/ChecklistPanel';
import { PHASES, SAFETY_LOG_TYPE_LABELS, SAFETY_SEVERITY_LABELS, SAFETY_SEVERITY_STYLES } from '@/lib/safety';
import type {
  ChecklistItem,
  FieldPhoto,
  Institution,
  Participant,
  PhaseGateResult,
  SafetyLog,
  Subject,
  Workshop,
  WorksheetEntry,
} from '@/lib/types';

interface SafetyResponse {
  logs: SafetyLog[];
  checklist_safety: ChecklistItem[];
  gate_status: PhaseGateResult[];
  photos: FieldPhoto[];
}

interface ParticipantsResponse {
  activists: Participant[];
  institution_staffs: Participant[];
  institutions: Institution[];
  subjects: Subject[];
}

interface WorkshopsResponse {
  workshops: Workshop[];
  worksheetEntries: WorksheetEntry[];
}

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

function resolveCurrentPhase(workshops: Workshop[]) {
  const current = PHASES.find((phase) =>
    workshops.some((workshop) => workshop.phase === phase && (workshop.status === 'in_progress' || workshop.status === 'delayed'))
  );

  return current ?? PHASES.find((phase) => workshops.some((workshop) => workshop.phase === phase && workshop.status === 'not_started')) ?? 6;
}

function phaseLabel(phase: number) {
  return `${phase}단계`;
}

export default function SafetyPage() {
  const { data: safetyData, error: safetyError, isLoading: safetyLoading, mutate: mutateSafety } = useSWR<SafetyResponse>(
    '/api/safety',
    fetcher
  );
  const {
    data: participantData,
    error: participantError,
    isLoading: participantLoading,
    mutate: mutateParticipants,
  } = useSWR<ParticipantsResponse>('/api/participants', fetcher);
  const {
    data: workshopData,
    error: workshopError,
    isLoading: workshopLoading,
    mutate: mutateWorkshops,
  } = useSWR<WorkshopsResponse>('/api/workshops', fetcher);

  if (safetyLoading || participantLoading || workshopLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-32 animate-pulse rounded-[32px] bg-slate-200" />
        <div className="h-[520px] animate-pulse rounded-[32px] bg-slate-200" />
      </div>
    );
  }

  if (safetyError || participantError || workshopError || !safetyData || !participantData || !workshopData) {
    return (
      <div className="p-6 pt-20 md:pt-6">
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-base font-semibold">안전·윤리 데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => {
              void Promise.all([mutateSafety(), mutateParticipants(), mutateWorkshops()]);
            }}
            className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const currentPhase = resolveCurrentPhase(workshopData.workshops);
  const currentGate = safetyData.gate_status.find((item) => item.phase === currentPhase) ?? null;
  const nextPhase = currentPhase < 6 ? currentPhase + 1 : null;
  const totalSubjects = participantData.subjects.length;
  const consentCount = participantData.subjects.filter((subject) => subject.consent_signed).length;
  const anonymizedCount = participantData.subjects.filter((subject) => subject.code.trim().length > 0).length;
  const consentVerifiedPhotos = safetyData.photos.filter((photo) => photo.consent_verified).length;
  const anonymizationClear = !safetyData.gate_status.some((gate) =>
    gate.blocking_items.some((item) => item.title.includes('비식별'))
  );

  return (
    <div className="space-y-8 p-6 pt-20 md:pt-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              안전·윤리 관리
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">안전·윤리</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              동의, 익명화, 안전 징후, 사진 동의 상태를 한 화면에서 확인합니다.
            </p>
          </div>
          <Link
            href="/admin/safety"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <ShieldCheck className="h-4 w-4" />
            관리자 모드
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section
        className={`sticky top-4 z-20 rounded-[28px] border px-6 py-5 shadow-sm ${
          currentGate?.can_proceed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
        }`}
      >
        <p className="text-sm font-medium text-slate-600">현재 단계: {phaseLabel(currentPhase)}</p>
        <h2 className={`mt-2 text-2xl font-bold ${currentGate?.can_proceed ? 'text-green-800' : 'text-red-800'}`}>
          {nextPhase
            ? currentGate?.can_proceed
              ? `${phaseLabel(nextPhase)} 진행 가능`
              : `${phaseLabel(nextPhase)} 진행 불가`
            : '최종 단계 진행 중'}
        </h2>
        {currentGate ? (
          <div className={`mt-2 text-sm ${currentGate.can_proceed ? 'text-green-700' : 'text-red-700'}`}>
            {currentGate.can_proceed ? (
              <p>필수 안전 항목이 모두 완료되었습니다.</p>
            ) : (
              <ul className="space-y-1">
                <li>미완료 필수 항목: {currentGate.blocking_items.length}개</li>
                {currentGate.blocking_items.map((item) => (
                  <li key={item.id}>• {item.title}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">안전 체크리스트</h2>
          <p className="mt-1 text-sm text-slate-500">단계별 필수 안전 항목과 권장 항목입니다.</p>
        </div>
        {PHASES.map((phase) => {
          const items = safetyData.checklist_safety.filter((item) => item.phase === phase);
          return (
            <ChecklistPanel
              key={phase}
              phase={phase}
              title={`${phaseLabel(phase)} 안전·윤리 체크리스트`}
              items={items}
              completionCount={items.filter((item) => item.completed).length}
            />
          );
        })}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">안전 로그 타임라인</h2>
          <p className="mt-1 text-sm text-slate-500">현장 기록과 해결 여부를 시간순으로 확인합니다.</p>
        </div>
        <div className="space-y-4">
          {safetyData.logs.map((log) => (
            <div
              key={log.id}
              className={`rounded-[24px] border px-5 py-4 ${SAFETY_SEVERITY_STYLES[log.severity]} ${
                log.resolved ? 'opacity-80' : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <span>{SAFETY_SEVERITY_LABELS[log.severity]}</span>
                <span>{log.created_at.slice(0, 16).replace('T', ' ')}</span>
                <span>[{phaseLabel(log.phase)}]</span>
                <span>{SAFETY_LOG_TYPE_LABELS[log.log_type]}</span>
              </div>
              <p className="mt-2 text-sm font-medium">{log.description}</p>
              <p className="mt-1 text-xs">기록자 {log.recorder}</p>
              {log.resolved ? (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  해결: {log.resolved_note || '완료'}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">개인정보·익명화 현황</h2>
          <p className="mt-1 text-sm text-slate-500">대상자 동의와 익명화 상태를 요약합니다.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: '동의서 수령', value: `${consentCount}/${totalSubjects}명`, ok: consentCount === totalSubjects },
            { label: '익명 코드 적용', value: `${anonymizedCount}/${totalSubjects}명`, ok: anonymizedCount === totalSubjects },
            {
              label: '사진 동의 확인',
              value: safetyData.photos.length
                ? `${consentVerifiedPhotos}/${safetyData.photos.length}건`
                : '업로드 사진 없음',
              ok: safetyData.photos.length ? consentVerifiedPhotos === safetyData.photos.length : true,
            },
            { label: '비식별 처리 확인', value: `${anonymizedCount}/${totalSubjects}명`, ok: anonymizationClear },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
              <p className={`mt-2 text-sm ${item.ok ? 'text-green-600' : 'text-amber-600'}`}>
                {item.ok ? '확인됨' : '추가 확인 필요'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
