'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import { ArrowRight, CalendarDays, ChevronDown, ChevronUp, ClipboardCheck, ShieldCheck } from 'lucide-react';
import DataTable, { type DataTableColumn } from '@/components/forms/DataTable';
import PhotoGallery from '@/components/photos/PhotoGallery';
import RoleBoard from '@/components/roles/RoleBoard';
import {
  WORKSHOP_TEMPLATE_MAP,
  type FacilitatorRoleAssignment,
  type FieldPhoto,
  type LivingLabPhase,
  type Participant,
  type ProgressStatus,
  type Workshop,
  type WorksheetEntry,
} from '@/lib/types';
import { getWorksheetTemplateLabel } from '@/lib/worksheets';

interface WorkshopsResponse {
  workshops: Workshop[];
  worksheetEntries: WorksheetEntry[];
}

interface RolesResponse {
  assignments: FacilitatorRoleAssignment[];
  available_participants: Participant[];
}

interface PhotosResponse {
  photos: FieldPhoto[];
}

interface WorkshopTableRow {
  id: number;
  title: string;
  phase: LivingLabPhase;
  scheduled_date: string;
  actual_date: string | null;
  location: string;
  participants_count: number;
  status: ProgressStatus;
  templates: string;
  worksheet_summary: string;
  outcome_summary: string;
}

interface PublicWorkshopDetailProps {
  workshop: Workshop;
  worksheetEntries: WorksheetEntry[];
}

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

const phaseBadgeClasses: Record<LivingLabPhase, string> = {
  1: 'bg-indigo-100 text-indigo-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-emerald-100 text-emerald-700',
  5: 'bg-red-100 text-red-700',
  6: 'bg-violet-100 text-violet-700',
};

const phaseLabels: Record<LivingLabPhase, string> = {
  1: '준비',
  2: '문제정의',
  3: '아이디어',
  4: '프로토타입',
  5: '테스트',
  6: '확산',
};

const phaseOptions: LivingLabPhase[] = [1, 2, 3, 4, 5, 6];

const statusBadgeClasses: Record<ProgressStatus, string> = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  delayed: 'bg-red-100 text-red-700',
};

const statusLabels: Record<ProgressStatus, string> = {
  not_started: '예정',
  in_progress: '진행 중',
  completed: '완료',
  delayed: '지연',
};

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return format(parseISO(value), 'yyyy.MM.dd');
}

function buildTemplates(workshopId: number) {
  const templateKeys = WORKSHOP_TEMPLATE_MAP[workshopId] ?? [];
  return templateKeys.length
    ? templateKeys.map((templateKey) => getWorksheetTemplateLabel(templateKey)).join(', ')
    : '-';
}

function PublicWorkshopDetail({ workshop, worksheetEntries }: PublicWorkshopDetailProps) {
  const { data: roleData } = useSWR<RolesResponse>(`/api/roles?workshop_id=${workshop.id}`, fetcher);
  const { data: photoData } = useSWR<PhotosResponse>(`/api/photos?workshop_id=${workshop.id}`, fetcher);

  return (
    <div className="space-y-5 border-t border-slate-200 px-6 py-6">
      <RoleBoard
        workshopId={workshop.id}
        workshopTitle={workshop.title}
        assignments={roleData?.assignments ?? []}
        availableParticipants={roleData?.available_participants ?? []}
      />

      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">워크시트 제출 목록</h3>
        <p className="mt-1 text-sm text-slate-500">템플릿별 제출 현황입니다.</p>
        <div className="mt-4 space-y-3">
          {worksheetEntries.length ? (
            worksheetEntries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{getWorksheetTemplateLabel(entry.template_key)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.filled_by_name} {entry.group_name ? `(${entry.group_name})` : ''} · {formatDate(entry.submitted_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      entry.reviewed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {entry.reviewed ? '검토 완료' : '검토 대기'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              아직 제출된 워크시트가 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">결과 요약</h3>
        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
          {workshop.outcome_summary || '아직 등록된 결과 요약이 없습니다.'}
        </p>
      </div>

      <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">현장 사진</h3>
          <p className="mt-1 text-sm text-slate-500">워크숍 현장 기록 사진입니다.</p>
        </div>
        <PhotoGallery photos={photoData?.photos ?? []} />
      </div>
    </div>
  );
}

export default function WorkshopsPage() {
  const { data, error, isLoading, mutate } = useSWR<WorkshopsResponse>('/api/workshops', fetcher);
  const [expandedWorkshopId, setExpandedWorkshopId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-slate-200" />
        <div className="h-[480px] animate-pulse rounded-[32px] bg-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 pt-20 md:pt-6">
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-base font-semibold">워크숍 데이터를 불러오지 못했습니다.</p>
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

  const { workshops, worksheetEntries } = data;
  const today = new Date();
  const completedWorkshops = workshops.filter((workshop) => workshop.status === 'completed').length;
  const upcomingWorkshops = workshops.filter((workshop) => new Date(workshop.scheduled_date) >= today).length;
  const reviewedEntries = worksheetEntries.filter((entry) => entry.reviewed).length;

  const rows: WorkshopTableRow[] = workshops.map((workshop) => {
    const entries = worksheetEntries.filter((entry) => entry.workshop_id === workshop.id);
    const reviewedCount = entries.filter((entry) => entry.reviewed).length;

    return {
      id: workshop.id,
      title: workshop.title,
      phase: workshop.phase,
      scheduled_date: workshop.scheduled_date,
      actual_date: workshop.actual_date,
      location: workshop.location,
      participants_count: workshop.participants_count,
      status: workshop.status,
      templates: buildTemplates(workshop.id),
      worksheet_summary: `${entries.length}건 / 검토 ${reviewedCount}건`,
      outcome_summary: workshop.outcome_summary || '-',
    };
  });

  const columns: DataTableColumn[] = [
    {
      key: 'title',
      label: '워크숍',
      sortable: true,
      render: (value, item) => <span className="font-medium text-slate-900">[{item.id}] {String(value)}</span>,
    },
    {
      key: 'phase',
      label: '단계',
      sortable: true,
      render: (value) => {
        const phase = Number(value) as LivingLabPhase;
        return (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${phaseBadgeClasses[phase]}`}>
            {phase}단계 {phaseLabels[phase]}
          </span>
        );
      },
    },
    {
      key: 'scheduled_date',
      label: '예정일',
      type: 'date',
      sortable: true,
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'status',
      label: '상태',
      sortable: true,
      render: (value) => {
        const status = String(value) as ProgressStatus;
        return (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[status]}`}>
            {statusLabels[status]}
          </span>
        );
      },
    },
    { key: 'location', label: '장소' },
    { key: 'participants_count', label: '참여 인원', sortable: true },
    { key: 'templates', label: '사용 템플릿' },
    { key: 'worksheet_summary', label: '워크시트 제출' },
    { key: 'outcome_summary', label: '결과 요약' },
  ];

  return (
    <div className="space-y-8 p-6 pt-20 md:pt-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              워크숍 일정 및 결과
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">워크숍</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              리빙랩 각 단계의 워크숍 일정, 진행 상태, 결과 요약과 워크시트 제출 현황을 함께 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/worksheets"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ClipboardCheck className="h-4 w-4" />
              워크시트 보기
            </Link>
            <Link
              href="/admin/workshops"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <ShieldCheck className="h-4 w-4" />
              관리자 모드
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: '전체 워크숍', value: `${workshops.length}회`, note: '준비부터 확산까지 전체 일정' },
          { label: '완료된 워크숍', value: `${completedWorkshops}회`, note: '상태가 완료인 일정' },
          {
            label: '워크시트 제출',
            value: `${worksheetEntries.length}건`,
            note: `검토 완료 ${reviewedEntries}건 / 예정 일정 ${upcomingWorkshops}회`,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">워크숍 일정표</h2>
            <p className="mt-1 text-sm text-slate-500">검색과 필터로 단계별 일정을 살펴볼 수 있습니다.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4" />
            공개 열람 모드
          </div>
        </div>
        <DataTable
          data={rows}
          columns={columns}
          editable={false}
          searchable
          filterOptions={[
            {
              key: 'phase',
              label: '모든 단계',
              options: phaseOptions.map((phase) => ({
                value: String(phase),
                label: `${phase}단계 ${phaseLabels[phase]}`,
              })),
            },
            {
              key: 'status',
              label: '모든 상태',
              options: (Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((status) => ({
                value: status,
                label: statusLabels[status],
              })),
            },
          ]}
          emptyMessage="등록된 워크숍이 없습니다."
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">워크숍 운영 상세</h2>
          <p className="mt-1 text-sm text-slate-500">워크숍별 역할, 제출 현황, 사진 기록을 한 번에 확인할 수 있습니다.</p>
        </div>
        {workshops.map((workshop) => {
          const isExpanded = expandedWorkshopId === workshop.id;
          const entries = worksheetEntries.filter((entry) => entry.workshop_id === workshop.id);

          return (
            <div key={workshop.id} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedWorkshopId((previous) => (previous === workshop.id ? null : workshop.id))}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    [{workshop.id}] {formatDate(workshop.scheduled_date)} · {workshop.location}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{workshop.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[workshop.status]}`}>
                    {statusLabels[workshop.status]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                </div>
              </button>
              {isExpanded ? <PublicWorkshopDetail workshop={workshop} worksheetEntries={entries} /> : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
